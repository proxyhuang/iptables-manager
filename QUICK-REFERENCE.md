# 快速参考卡片

## 🚀 最常用命令

```bash
# 查看所有命令
make help

# 启动服务
make up

# 停止服务
make down

# 查看日志
make logs

# 构建镜像
make build

# 推送镜像
make push
```

## 📦 完整工作流

### 本地开发

```bash
make setup              # 初始设置（只需一次）
make build-and-up       # 构建并启动
make logs               # 查看日志
make down               # 停止
```

### 发布到Registry

```bash
# 1. 配置（只需一次）
cp Makefile.config.example Makefile.config
vim Makefile.config     # 设置REGISTRY和NAMESPACE

# 2. 登录
make login

# 3. 发布
make release VERSION=1.0.0
```

### 从Registry部署

```bash
make pull VERSION=1.0.0
make up
make health
```

## 🔧 调试命令

```bash
make ps                 # 查看容器状态
make stats              # 查看资源使用
make health             # 健康检查
make exec-backend       # 进入后端容器
make exec-frontend      # 进入前端容器
```

## 🗑️ 清理命令

```bash
make clean              # 删除容器和网络
make clean-all          # 完全清理
make prune              # 清理未使用资源
```

## 💾 数据库管理

```bash
make backup-db          # 备份数据库
make restore-db FILE=backups/xxx.db  # 恢复
```

## 📊 监控命令

```bash
make logs               # 所有日志
make logs-backend       # 后端日志
make logs-frontend      # 前端日志
make stats              # 资源统计
```

## 🏷️ 版本管理

```bash
# 构建不同版本
make build VERSION=dev
make build VERSION=1.0.0

# 推送不同版本
make push VERSION=1.0.0

# 创建release
make release VERSION=1.0.0
```

## 🌐 访问地址

- **Web界面**: http://localhost
- **后端API**: http://localhost:8080/api/v1
- **健康检查**: `make health`

## ⚙️ 配置变量

在`Makefile.config`中设置：

```makefile
REGISTRY = docker.io          # Registry地址
NAMESPACE = your-username     # 用户名/命名空间
VERSION = latest              # 默认版本
```

或命令行指定：

```bash
make build REGISTRY=ghcr.io NAMESPACE=myname VERSION=1.0.0
```

## 🔐 Registry选项

```bash
# Docker Hub
REGISTRY=docker.io NAMESPACE=username

# GitHub Container Registry
REGISTRY=ghcr.io NAMESPACE=username

# 阿里云
REGISTRY=registry.cn-hangzhou.aliyuncs.com NAMESPACE=namespace

# 私有Registry
REGISTRY=registry.mycompany.com NAMESPACE=team
```

## 💡 小贴士

- 使用`make help`查看完整命令列表
- 使用`make dev`前台运行并查看日志
- 定期运行`make backup-db`备份数据
- 使用`make health`验证部署
- 查看[MAKEFILE-GUIDE.md](MAKEFILE-GUIDE.md)获取详细文档

## 🆘 问题排查

```bash
# 服务无法启动
make down
make clean
make build-and-up

# 查看详细错误
make logs

# 检查配置
make validate

# 完全重置
make clean-all
make build-and-up
```

## 📚 更多文档

- [Makefile完整指南](MAKEFILE-GUIDE.md)
- [Docker部署文档](DOCKER-README.md)
- [项目完整文档](README.md)
- [快速开始](START.md)
