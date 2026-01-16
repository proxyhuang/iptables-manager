# Makefile 使用指南

## 快速开始

### 1. 初始设置

```bash
# 创建必要的目录和权限
make setup
```

### 2. 配置Registry（可选）

如果需要推送到Docker Registry，先配置：

```bash
# 复制配置模板
cp Makefile.config.example Makefile.config

# 编辑配置文件
vim Makefile.config
```

修改以下内容：
```makefile
REGISTRY = docker.io           # 你的registry地址
NAMESPACE = your-username      # 你的用户名/命名空间
VERSION = latest               # 版本标签
```

### 3. 查看所有命令

```bash
make help
```

## 常用命令

### 🔨 构建镜像

```bash
# 构建所有镜像
make build

# 构建指定版本
make build VERSION=1.0.0

# 无缓存构建
make build-no-cache

# 只构建后端
make build-backend

# 只构建前端
make build-frontend
```

### 🚀 运行服务

```bash
# 启动服务（后台）
make up

# 开发模式启动（前台，显示日志）
make dev

# 构建并启动
make build-and-up

# 拉取镜像并启动
make pull-and-up
```

### 🛑 停止服务

```bash
# 停止服务
make down

# 重启服务
make restart
```

### 📊 查看状态

```bash
# 查看运行中的容器
make ps

# 查看资源使用
make stats

# 查看服务健康状态
make health
```

### 📝 查看日志

```bash
# 查看所有日志（实时）
make logs

# 只看后端日志
make logs-backend

# 只看前端日志
make logs-frontend
```

### 🔐 推送镜像

```bash
# 登录Docker Registry
make login

# 推送镜像
make push

# 推送指定版本
make push VERSION=1.0.0

# 只推送后端
make push-backend

# 只推送前端
make push-frontend
```

### 📦 拉取镜像

```bash
# 从Registry拉取镜像
make pull

# 拉取指定版本
make pull VERSION=1.0.0
```

### 🏷️ 版本发布

```bash
# 创建release（构建、标记、推送）
make release VERSION=1.0.0

# 这相当于：
# 1. make build VERSION=1.0.0
# 2. make push VERSION=1.0.0
```

### 💻 进入容器

```bash
# 进入后端容器
make exec-backend

# 进入前端容器
make exec-frontend
```

### 🗑️ 清理

```bash
# 停止并删除容器和网络
make clean

# 删除镜像
make clean-images

# 完全清理（容器、网络、卷、镜像）
make clean-all

# 清理未使用的Docker资源
make prune
```

### 💾 数据库管理

```bash
# 备份数据库
make backup-db

# 恢复数据库
make restore-db FILE=backups/iptables-20240101-120000.db
```

### ✅ 测试

```bash
# 验证配置文件
make validate

# 运行基础测试
make test

# 检查服务健康
make health
```

### ℹ️ 信息查看

```bash
# 查看版本信息
make version

# 查看帮助
make help
```

## 完整工作流程示例

### 场景1: 本地开发

```bash
# 1. 初始设置
make setup

# 2. 构建并启动
make build-and-up

# 3. 查看日志
make logs

# 4. 测试
make health

# 5. 停止
make down
```

### 场景2: 发布到Registry

```bash
# 1. 配置Registry信息
cp Makefile.config.example Makefile.config
vim Makefile.config

# 2. 登录Registry
make login

# 3. 构建镜像
make build VERSION=1.0.0

# 4. 推送镜像
make push VERSION=1.0.0

# 或者一步完成
make release VERSION=1.0.0
```

### 场景3: 从Registry部署

```bash
# 1. 拉取镜像
make pull VERSION=1.0.0

# 2. 启动服务
make up

# 3. 检查状态
make ps
make health
```

### 场景4: 更新应用

```bash
# 1. 停止现有服务
make down

# 2. 备份数据库
make backup-db

# 3. 拉取最新镜像
make pull

# 4. 启动服务
make up

# 5. 查看日志确认
make logs
```

### 场景5: 调试

```bash
# 1. 开发模式启动（前台显示日志）
make dev

# 2. 在另一个终端中，进入容器调试
make exec-backend

# 3. 查看资源使用
make stats
```

## 高级用法

### 使用不同的Registry

```bash
# Docker Hub
make build push REGISTRY=docker.io NAMESPACE=myusername

# GitHub Container Registry
make build push REGISTRY=ghcr.io NAMESPACE=myusername

# 阿里云
make build push REGISTRY=registry.cn-hangzhou.aliyuncs.com NAMESPACE=mynamespace

# 私有Registry
make build push REGISTRY=registry.mycompany.com NAMESPACE=team
```

### 多版本管理

```bash
# 构建开发版本
make build VERSION=dev

# 构建测试版本
make build VERSION=test

# 构建生产版本
make build VERSION=1.0.0

# 推送所有版本
make push VERSION=dev
make push VERSION=test
make push VERSION=1.0.0
```

### 自动化脚本集成

```bash
#!/bin/bash
# deploy.sh

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./deploy.sh <version>"
  exit 1
fi

# 构建
make build VERSION=$VERSION

# 测试
make test

# 推送
make push VERSION=$VERSION

# 部署
make pull-and-up VERSION=$VERSION

echo "Deployment completed!"
```

## 常见问题

### 1. 权限错误

```bash
# 确保脚本有执行权限
make setup
```

### 2. 端口冲突

编辑 `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "8000:80"  # 改为其他端口
```

### 3. 构建失败

```bash
# 无缓存重新构建
make build-no-cache
```

### 4. 镜像体积过大

```bash
# 查看镜像大小
docker images | grep iptables-web-manager

# 清理未使用的层
make prune
```

### 5. 数据丢失

```bash
# 定期备份
make backup-db

# 恢复备份
make restore-db FILE=backups/iptables-xxx.db
```

## 环境变量

Makefile支持以下环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VERSION` | `latest` | 镜像版本标签 |
| `REGISTRY` | `docker.io` | Docker Registry地址 |
| `NAMESPACE` | `your-username` | 命名空间/用户名 |

使用方式：
```bash
# 命令行指定
make build VERSION=1.0.0

# 或在Makefile.config中配置
```

## 配置文件优先级

1. 命令行参数（最高优先级）
2. Makefile.config（如果存在）
3. Makefile中的默认值

## CI/CD集成示例

### GitHub Actions

```yaml
name: Build and Push

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_ENV

      - name: Login to Registry
        run: make login
        env:
          DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
          DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push
        run: make release VERSION=${{ env.VERSION }}
```

### GitLab CI

```yaml
build:
  stage: build
  script:
    - make build VERSION=$CI_COMMIT_TAG
    - make push VERSION=$CI_COMMIT_TAG
  only:
    - tags
```

## 最佳实践

1. **版本管理**: 使用语义化版本号（v1.0.0）
2. **定期备份**: 使用cron定时备份数据库
3. **监控日志**: 使用`make logs`监控应用状态
4. **健康检查**: 部署后运行`make health`
5. **清理资源**: 定期运行`make prune`清理未使用资源

## 更多帮助

- 查看所有命令: `make help`
- Docker文档: [DOCKER-README.md](DOCKER-README.md)
- 项目文档: [README.md](README.md)
