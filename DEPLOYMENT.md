# 部署指南

本文档介绍如何使用Makefile将应用部署到不同环境。

## 目录

- [本地开发部署](#本地开发部署)
- [推送到Docker Hub](#推送到docker-hub)
- [推送到GitHub Container Registry](#推送到github-container-registry)
- [推送到阿里云容器镜像服务](#推送到阿里云容器镜像服务)
- [私有Registry部署](#私有registry部署)
- [生产环境部署](#生产环境部署)
- [CI/CD集成](#cicd集成)

---

## 本地开发部署

### 快速开始

```bash
# 1. 初始设置
make setup

# 2. 构建并启动
make build-and-up

# 3. 访问应用
# http://localhost

# 4. 查看日志
make logs

# 5. 停止
make down
```

### 开发模式

```bash
# 前台运行，显示实时日志
make dev

# 在另一个终端查看状态
make ps
make stats
```

---

## 推送到Docker Hub

### 1. 配置

创建配置文件：
```bash
cp Makefile.config.example Makefile.config
```

编辑 `Makefile.config`:
```makefile
REGISTRY = docker.io
NAMESPACE = your-dockerhub-username
VERSION = latest
```

### 2. 登录Docker Hub

```bash
make login
# 输入Docker Hub用户名和密码
```

### 3. 构建并推送

```bash
# 构建镜像
make build VERSION=1.0.0

# 推送镜像
make push VERSION=1.0.0

# 或一步完成
make release VERSION=1.0.0
```

### 4. 验证

```bash
# 在Docker Hub上查看
# https://hub.docker.com/r/your-username/iptables-web-manager-backend
# https://hub.docker.com/r/your-username/iptables-web-manager-frontend
```

### 5. 从Docker Hub部署

在其他机器上：
```bash
# 拉取镜像
make pull VERSION=1.0.0 REGISTRY=docker.io NAMESPACE=your-username

# 启动服务
make up

# 检查健康
make health
```

---

## 推送到GitHub Container Registry

### 1. 配置

编辑 `Makefile.config`:
```makefile
REGISTRY = ghcr.io
NAMESPACE = your-github-username
VERSION = latest
```

### 2. 创建Personal Access Token

1. 访问 GitHub Settings → Developer settings → Personal access tokens
2. 生成新token，权限选择：`write:packages`, `read:packages`, `delete:packages`
3. 保存token

### 3. 登录GHCR

```bash
# 使用token登录
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 或使用Makefile
make login REGISTRY=ghcr.io
```

### 4. 构建并推送

```bash
make release VERSION=1.0.0 REGISTRY=ghcr.io NAMESPACE=your-username
```

### 5. 使用GitHub Actions自动化

项目已包含 `.github/workflows/build-and-push.yml`，推送到GitHub后自动构建。

配置仓库secrets：
- 无需额外配置，使用 `GITHUB_TOKEN` 自动认证

推送tag触发构建：
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 推送到阿里云容器镜像服务

### 1. 创建命名空间

1. 登录阿里云容器镜像服务
2. 创建命名空间（如：`mycompany`）
3. 创建镜像仓库

### 2. 配置

编辑 `Makefile.config`:
```makefile
REGISTRY = registry.cn-hangzhou.aliyuncs.com
NAMESPACE = mycompany
VERSION = latest
```

### 3. 登录

```bash
# 使用阿里云账号登录
make login REGISTRY=registry.cn-hangzhou.aliyuncs.com
```

### 4. 构建并推送

```bash
make release VERSION=1.0.0 \
  REGISTRY=registry.cn-hangzhou.aliyuncs.com \
  NAMESPACE=mycompany
```

### 5. 加速拉取

在目标机器配置Docker镜像加速：

```bash
# /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://xxxxxx.mirror.aliyuncs.com"
  ]
}

sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## 私有Registry部署

### 1. 搭建私有Registry

```bash
# 启动私有registry
docker run -d -p 5000:5000 --name registry registry:2

# 或使用Harbor等企业级方案
```

### 2. 配置

```makefile
REGISTRY = registry.mycompany.com:5000
NAMESPACE = team
VERSION = latest
```

### 3. 配置Docker信任

如果使用HTTP：

```bash
# /etc/docker/daemon.json
{
  "insecure-registries": ["registry.mycompany.com:5000"]
}

sudo systemctl restart docker
```

### 4. 推送和拉取

```bash
# 推送
make release VERSION=1.0.0 \
  REGISTRY=registry.mycompany.com:5000 \
  NAMESPACE=team

# 拉取
make pull-and-up VERSION=1.0.0 \
  REGISTRY=registry.mycompany.com:5000 \
  NAMESPACE=team
```

---

## 生产环境部署

### 1. 准备工作

```bash
# 在生产服务器上
cd /opt/iptables-web-manager

# 创建配置
cat > Makefile.config <<EOF
REGISTRY = ghcr.io
NAMESPACE = mycompany
VERSION = 1.0.0
EOF
```

### 2. 拉取镜像

```bash
make pull VERSION=1.0.0
```

### 3. 配置环境变量

创建 `.env` 文件：
```bash
DB_PATH=/app/data/iptables.db
```

### 4. 启动服务

```bash
make up
```

### 5. 健康检查

```bash
make health
make test
```

### 6. 设置自动启动

```bash
# 创建systemd服务
sudo tee /etc/systemd/system/iptables-web-manager.service > /dev/null <<EOF
[Unit]
Description=IPTables Web Manager
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/iptables-web-manager
ExecStart=/usr/bin/make up
ExecStop=/usr/bin/make down

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable iptables-web-manager
sudo systemctl start iptables-web-manager
```

### 7. 日志监控

```bash
# 实时查看日志
make logs

# 保存日志
make logs > /var/log/iptables-web-manager.log
```

### 8. 备份策略

```bash
# 每日备份cron任务
cat > /etc/cron.daily/iptables-backup <<EOF
#!/bin/bash
cd /opt/iptables-web-manager
make backup-db
# 保留最近30天的备份
find backups/ -name "*.db" -mtime +30 -delete
EOF

chmod +x /etc/cron.daily/iptables-backup
```

---

## CI/CD集成

### GitHub Actions

项目包含 `.github/workflows/build-and-push.yml`

**工作流程：**
1. 推送代码到main分支 → 构建latest镜像
2. 创建tag (v1.0.0) → 构建版本镜像
3. 自动推送到GHCR

**使用：**
```bash
git tag v1.0.0
git push origin v1.0.0
# GitHub Actions自动构建和推送
```

### GitLab CI

项目包含 `.gitlab-ci.yml`

**配置Variables：**
- `CI_REGISTRY_USER`: GitLab用户名
- `CI_REGISTRY_PASSWORD`: GitLab密码或token

**工作流程：**
1. 推送到main → 构建测试
2. 推送tag → 构建发布

### Jenkins

```groovy
pipeline {
    agent any

    environment {
        VERSION = "${env.GIT_TAG_NAME ?: 'latest'}"
        REGISTRY = 'docker.io'
        NAMESPACE = 'mycompany'
    }

    stages {
        stage('Build') {
            steps {
                sh "make build VERSION=${VERSION} REGISTRY=${REGISTRY} NAMESPACE=${NAMESPACE}"
            }
        }

        stage('Test') {
            steps {
                sh "make up"
                sh "sleep 10"
                sh "make health"
                sh "make down"
            }
        }

        stage('Push') {
            when {
                buildingTag()
            }
            steps {
                sh "make push VERSION=${VERSION} REGISTRY=${REGISTRY} NAMESPACE=${NAMESPACE}"
            }
        }
    }
}
```

---

## 多环境部署

### 使用不同配置文件

```bash
# 开发环境
make build-and-up -f Makefile MAKEFILE_CONFIG=Makefile.dev

# 测试环境
make pull-and-up REGISTRY=test-registry VERSION=test

# 生产环境
make pull-and-up REGISTRY=prod-registry VERSION=1.0.0
```

### Docker Compose Override

创建 `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
```

使用：
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 故障排查

### 镜像推送失败

```bash
# 检查登录状态
docker info | grep Username

# 重新登录
make login

# 检查网络
ping registry.docker.io
```

### 服务启动失败

```bash
# 查看详细日志
make logs

# 检查镜像
docker images | grep iptables

# 重新构建
make clean-all
make build-and-up
```

### 权限错误

```bash
# 检查数据目录权限
ls -la data/

# 修复权限
sudo chown -R 1000:1000 data/
```

---

## 最佳实践

1. **版本管理**
   - 使用语义化版本（v1.0.0）
   - 生产环境使用固定版本，不用latest
   - 为每个版本打tag

2. **安全**
   - 定期更新基础镜像
   - 扫描镜像漏洞（使用Trivy等工具）
   - 不在镜像中包含敏感信息

3. **监控**
   - 配置健康检查
   - 监控容器资源使用
   - 设置告警

4. **备份**
   - 定期备份数据库
   - 保留多个版本的备份
   - 测试恢复流程

5. **文档**
   - 记录部署步骤
   - 维护变更日志
   - 更新运维文档

---

## 相关文档

- [Makefile完整指南](MAKEFILE-GUIDE.md)
- [快速参考](QUICK-REFERENCE.md)
- [Docker文档](DOCKER-README.md)
- [项目主页](README.md)
