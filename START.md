# 🚀 一键启动

## Docker 方式（推荐）

```bash
cd /root/test
./docker-start.sh
```

**访问**: http://localhost

**停止**:
```bash
./docker-stop.sh
```

---

## 手动启动方式

### 终端1 - 后端
```bash
cd /root/test/backend
sudo go run cmd/server/main.go
```

### 终端2 - 前端
```bash
cd /root/test/frontend
npm start
```

**访问**: http://localhost:3000

---

## 常用命令

### Docker
```bash
# 启动
./docker-start.sh

# 停止
./docker-stop.sh

# 查看日志
docker-compose logs -f

# 重启
docker-compose restart
```

### 开发模式
```bash
# 使用脚本启动
./scripts/run-dev.sh

# 或手动启动（见上面）
```

---

## 验证运行

✅ 访问 http://localhost (Docker) 或 http://localhost:3000 (开发)
✅ 看到IPTables Web Manager界面
✅ 顶部显示实时统计（数字每2秒更新）
✅ 可以查看规则列表
✅ 可以添加/删除规则

---

更多详细信息：
- Docker部署: [DOCKER-README.md](DOCKER-README.md)
- 完整文档: [README.md](README.md)
- 快速上手: [QUICKSTART.md](QUICKSTART.md)
