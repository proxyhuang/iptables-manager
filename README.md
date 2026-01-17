# IPTables Web Manager

A modern web-based interface for managing and monitoring iptables rules with real-time statistics and visualization.

![UI](./UI.png)

## 🚀 Quick Start with Docker (Recommended)

### Option 1: Using Makefile (Best)

```bash
cd /root/test
make setup              # Initial setup (only once)
make build-and-up       # Build and start
```

Then visit: **http://localhost**

**Useful commands:**
```bash
make logs               # View logs
make down               # Stop services
make help               # See all commands
```

See [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for a quick command cheat sheet.

### Option 2: Using Script

```bash
cd /root/test
./docker-start.sh
```

Then visit: **http://localhost**

For more Docker options, see [DOCKER-README.md](DOCKER-README.md) and [MAKEFILE-GUIDE.md](MAKEFILE-GUIDE.md)

---

## Features

- **Real-time Monitoring**: Live updates of iptables rules and traffic statistics via WebSocket
- **Rule Management**: Add, delete, and search iptables rules through an intuitive web interface
- **Dynamic Visualization**:
  - Real-time traffic charts showing packets and bytes
  - Animated UI components with smooth transitions
  - Live statistics cards with automatic updates
- **History Tracking**: Complete audit trail of all rule changes with timestamps and user information
- **Advanced Filtering**: Search and filter rules across all tables and chains
- **Responsive Design**: Built with Ant Design for a modern, professional look

## Technology Stack

### Backend (Go)
- **Web Framework**: Gorilla Mux
- **WebSocket**: Gorilla WebSocket
- **Database**: SQLite3
- **iptables Integration**: exec.Command with security validation

### Frontend (React + TypeScript)
- **State Management**: Redux Toolkit
- **UI Framework**: Ant Design
- **Animations**: Framer Motion
- **Charts**: Recharts
- **HTTP Client**: Axios

## Prerequisites

- **Operating System**: Linux with iptables installed
- **Go**: Version 1.18 or higher (with CGO support)
- **Node.js**: Version 16 or higher
- **npm**: Latest version
- **Root Access**: Required for iptables operations

## Installation

### 1. Clone or download this project

```bash
cd /root/test
```

### 2. Run setup script

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will install all dependencies for both backend and frontend.

## Running the Application

### Development Mode

#### Option 1: Using the run script (Recommended)

```bash
chmod +x scripts/run-dev.sh
./scripts/run-dev.sh
```

#### Option 2: Manual startup

**Terminal 1 - Backend:**
```bash
cd backend
sudo go run cmd/server/main.go
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **WebSocket**: ws://localhost:8080/ws/{stats|rules}

## API Endpoints

### Rules
- `GET /api/v1/rules` - Get all rules
- `GET /api/v1/rules/{table}` - Get rules by table
- `POST /api/v1/rules` - Add new rule
- `DELETE /api/v1/rules` - Delete rule
- `GET /api/v1/rules/search?q={query}` - Search rules

### Statistics
- `GET /api/v1/stats/traffic` - Get traffic statistics
- `GET /api/v1/stats/rules` - Get rule statistics

### History
- `GET /api/v1/history?limit=50&offset=0` - Get history with pagination
- `GET /api/v1/history/{id}` - Get specific history record

### WebSocket
- `WS /ws/stats` - Real-time traffic statistics (updates every 2 seconds)
- `WS /ws/rules` - Real-time rule changes (checks every 5 seconds)

## Project Structure

```
iptables-web-manager/
├── backend/                    # Go backend
│   ├── cmd/server/            # Main application
│   ├── internal/
│   │   ├── api/              # HTTP handlers and routing
│   │   ├── service/          # Business logic
│   │   ├── repository/       # Data access layer
│   │   ├── executor/         # iptables command execution
│   │   └── models/           # Data models
│   └── go.mod
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── store/           # Redux state management
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript definitions
│   └── package.json
├── scripts/                   # Helper scripts
└── README.md
```

## Security Features

### Backend Security
- **Input Validation**: Strict whitelist validation for tables, chains, and targets
- **Command Injection Prevention**: Blocks dangerous characters (; | & ` $ etc.)
- **Root Permission Check**: Validates EUID at startup
- **Audit Logging**: All operations logged to SQLite database

### API Security
- **CORS Configuration**: Configurable allowed origins
- **Request Logging**: All HTTP requests logged
- **Error Handling**: Secure error messages without exposing internals

## Usage Examples

### Adding a Rule via UI
1. Navigate to "Add Rule" tab
2. Select table (e.g., filter)
3. Select chain (e.g., INPUT)
4. Choose protocol (e.g., TCP)
5. Enter destination port (e.g., 22)
6. Select target (e.g., ACCEPT)
7. Click "Add Rule"

### Searching Rules
1. In the "Rules List" tab
2. Use the search bar to filter by:
   - Table name
   - Chain name
   - Target
   - Source/Destination IP
   - Protocol

### Viewing Real-time Statistics
- Statistics cards update automatically every 2 seconds
- Charts show traffic trends over time
- Packet and byte counts displayed with animations

## Performance Considerations

- **Frontend**: Limited to 50 historical data points for charts
- **Backend**: WebSocket push intervals:
  - Stats: Every 2 seconds
  - Rules: Every 5 seconds (only on changes)
- **Database**: Indexed on created_at and action columns

## Troubleshooting

### Backend won't start
- Ensure you're running with sudo/root privileges
- Check if port 8080 is available
- Verify iptables is installed: `iptables --version`

### Frontend can't connect to backend
- Verify backend is running on port 8080
- Check CORS settings in `backend/internal/api/middleware/cors.go`
- Ensure API_BASE_URL in `frontend/src/services/api.ts` is correct

### WebSocket connection failed
- Check browser console for errors
- Verify WebSocket endpoints are accessible
- Check firewall rules

## Development

### Adding New Features
1. Backend: Add handler in `internal/api/handlers/`
2. Frontend: Create component in `src/components/`
3. Update types in `src/types/` for TypeScript
4. Add API endpoints in router

### Testing
```bash
# Backend
cd backend
go test ./...

# Frontend
cd frontend
npm test
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## Support

For issues and questions, please open an issue on the project repository.

---

**Note**: This application requires root privileges to manage iptables. Always review rules before applying them to production systems.
