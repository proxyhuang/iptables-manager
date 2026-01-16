# 快速启动指南

## 1. 启动后端服务器

```bash
cd /root/test/backend
sudo go run cmd/server/main.go
```

**期待输出:**
```
Database initialized successfully
Server starting on :8080
API endpoints: http://localhost:8080/api/v1
WebSocket endpoints: ws://localhost:8080/ws/{stats|rules}
```

## 2. 启动前端应用（新终端）

```bash
cd /root/test/frontend
npm start
```

**期待输出:**
```
Compiled successfully!
You can now view frontend in the browser.
  Local:            http://localhost:3000
```

## 3. 访问应用

打开浏览器访问: **http://localhost:3000**

## 主要功能

### 📊 实时统计
- 自动更新的流量统计（每2秒）
- 数据包和字节数实时显示
- 平滑的动画效果

### 📋 规则列表
- 查看所有iptables规则
- 按表、链、协议等过滤
- 实时搜索功能
- 删除规则功能

### ➕ 添加规则
1. 切换到"Add Rule"标签
2. 填写规则信息：
   - Table: filter/nat/mangle/raw
   - Chain: INPUT/OUTPUT/FORWARD等
   - Protocol: tcp/udp/icmp
   - Source/Destination IP
   - Port
   - Target: ACCEPT/DROP/REJECT
3. 点击"Add Rule"

### 🔍 搜索规则
在规则列表页面输入搜索关键词，即时过滤结果。

## 测试示例

### 添加一条测试规则
```
Table: filter
Chain: INPUT
Protocol: tcp
Destination Port: 8888
Target: ACCEPT
Comment: Test rule
```

### 查看规则
规则会立即显示在列表中，包含实时的packets和bytes计数。

### 删除规则
点击规则行右侧的"Delete"按钮。

## 故障排除

### 后端无法启动
- 确保使用sudo运行
- 检查8080端口是否被占用: `lsof -i :8080`

### 前端无法连接后端
- 确认后端正在运行
- 检查http://localhost:8080/api/v1/rules是否可访问

### WebSocket连接失败
- 检查浏览器控制台错误
- 确认后端WebSocket端点可用

## 停止应用

- 前端: 在终端按 `Ctrl+C`
- 后端: 在终端按 `Ctrl+C`

## 下一步

查看 README.md 了解：
- 完整的API文档
- 高级配置选项
- 安全最佳实践
- 生产部署指南
