# Docker 部署指南

## 🚀 一键启动（推荐）

```bash
cd /root/test
./docker-start.sh
```

然后访问: **http://localhost**

## 📦 手动启动

### 1. 构建并启动所有服务

```bash
docker-compose up --build -d
```

### 2. 查看服务状态

```bash
docker-compose ps
```

期待输出:
```
NAME                  IMAGE                      STATUS         PORTS
iptables-backend      iptables-web-manager-backend   Up (healthy)
iptables-frontend     iptables-web-manager-frontend  Up (healthy)   0.0.0.0:80->80/tcp
```

### 3. 查看日志

```bash
# 所有服务
docker-compose logs -f

# 只看后端
docker-compose logs -f backend

# 只看前端
docker-compose logs -f frontend
```

## 🔧 服务架构

### Backend 容器
- **镜像**: Alpine Linux + Go
- **网络模式**: host (需要访问宿主机iptables)
- **权限**: privileged (需要执行iptables命令)
- **端口**: 8080
- **数据持久化**: ./data 目录挂载到容器 /app/data

### Frontend 容器
- **镜像**: Alpine Linux + Nginx
- **端口**: 80
- **功能**:
  - 静态文件服务
  - API反向代理到后端
  - WebSocket代理到后端

## 📂 目录结构

```
/root/test/
├── docker/
│   ├── Dockerfile.backend    # 后端镜像
│   ├── Dockerfile.frontend   # 前端镜像
│   └── nginx.conf            # Nginx配置
├── docker-compose.yml        # Docker Compose配置
├── data/                     # 数据库持久化目录（自动创建）
│   └── iptables.db          # SQLite数据库
├── docker-start.sh          # 启动脚本
└── docker-stop.sh           # 停止脚本
```

## 🌐 访问地址

- **Web界面**: http://localhost
- **后端API**: http://localhost:8080/api/v1
- **WebSocket**: ws://localhost/ws/{stats|rules}

## 🛠️ 常用命令

### 启动服务
```bash
docker-compose up -d
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 查看日志
```bash
docker-compose logs -f
```

### 重新构建镜像
```bash
docker-compose build --no-cache
docker-compose up -d
```

### 进入容器
```bash
# 后端
docker exec -it iptables-backend sh

# 前端
docker exec -it iptables-frontend sh
```

### 清理所有数据
```bash
docker-compose down -v
rm -rf data/
```

## 🔍 健康检查

Docker Compose 配置了健康检查：

- **Backend**: 每30秒检查 /api/v1/rules 端点
- **Frontend**: 每30秒检查 nginx 服务

查看健康状态:
```bash
docker-compose ps
```

## 🐛 故障排除

### 1. 端口被占用
```bash
# 检查80端口
lsof -i :80

# 修改docker-compose.yml中的端口映射
# 例如改为 8000:80
```

### 2. 后端无法访问iptables
确保容器有privileged权限和host网络模式：
```yaml
backend:
  privileged: true
  network_mode: host
```

### 3. 前端无法连接后端
检查nginx代理配置:
```bash
docker exec -it iptables-frontend cat /etc/nginx/conf.d/default.conf
```

### 4. 数据库权限问题
```bash
sudo chown -R 1000:1000 data/
```

### 5. 查看详细错误日志
```bash
# 后端日志
docker-compose logs backend | tail -100

# 前端日志
docker-compose logs frontend | tail -100
```

## 🔒 安全注意事项

1. **Privileged容器**: 后端容器需要privileged权限来操作iptables，请确保在受信任的环境中运行

2. **网络模式**: 后端使用host网络模式以访问宿主机iptables

3. **生产部署**:
   - 修改nginx.conf中的CORS设置
   - 添加认证中间件
   - 使用HTTPS
   - 限制访问IP

## 📊 监控和维护

### 查看资源使用
```bash
docker stats
```

### 数据库备份
```bash
cp data/iptables.db data/iptables.db.backup.$(date +%Y%m%d)
```

### 更新镜像
```bash
git pull  # 如果使用git
docker-compose build
docker-compose up -d
```

## 🎯 性能优化

### 多阶段构建
Dockerfile使用多阶段构建，大大减小了镜像体积：
- Backend: ~30MB (Alpine + Go binary)
- Frontend: ~25MB (Alpine + Nginx + static files)

### 资源限制
可以在docker-compose.yml中添加资源限制：
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
```

## 📝 环境变量

可以创建 `.env` 文件自定义配置：

```bash
# .env
DB_PATH=/app/data/iptables.db
BACKEND_PORT=8080
FRONTEND_PORT=80
```

## 🔄 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up --build -d

# 查看日志确认
docker-compose logs -f
```

## ✅ 验证部署

1. 访问 http://localhost - 应该看到Web界面
2. 点击"Refresh"按钮 - 应该加载iptables规则
3. 观察实时统计 - 数字应该每2秒更新
4. 添加测试规则 - 应该成功并显示在列表中

## 📞 支持

如遇问题，请查看日志:
```bash
docker-compose logs -f
```

或提交issue到项目仓库。
