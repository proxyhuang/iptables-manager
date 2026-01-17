# IPTables Web Manager - Makefile
#
# Usage:
#   make build          - Build Docker images
#   make push           - Push images to registry
#   make up             - Start services
#   make down           - Stop services
#   make restart        - Restart services
#   make logs           - View logs
#   make clean          - Clean up everything

# Include user configuration if exists
-include Makefile.config

# Configuration
PROJECT_NAME := iptables-manager
VERSION ?= latest
REGISTRY ?= docker.io
NAMESPACE ?= proxyhuang

# Image names
BACKEND_IMAGE := $(REGISTRY)/$(NAMESPACE)/$(PROJECT_NAME)-backend
FRONTEND_IMAGE := $(REGISTRY)/$(NAMESPACE)/$(PROJECT_NAME)-frontend

# Colors for output
COLOR_RESET := \033[0m
COLOR_BOLD := \033[1m
COLOR_GREEN := \033[32m
COLOR_YELLOW := \033[33m
COLOR_BLUE := \033[34m

.PHONY: help
help: ## Show this help message
	@echo "$(COLOR_BOLD)$(PROJECT_NAME) - Makefile Commands$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_GREEN)Available commands:$(COLOR_RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(COLOR_BLUE)%-15s$(COLOR_RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(COLOR_YELLOW)Configuration:$(COLOR_RESET)"
	@echo "  VERSION=$(VERSION)"
	@echo "  REGISTRY=$(REGISTRY)"
	@echo "  NAMESPACE=$(NAMESPACE)"
	@echo ""
	@echo "$(COLOR_YELLOW)Images:$(COLOR_RESET)"
	@echo "  Backend:  $(BACKEND_IMAGE):$(VERSION)"
	@echo "  Frontend: $(FRONTEND_IMAGE):$(VERSION)"

.PHONY: build
build: ## Build Docker images (with BuildKit cache)
	@echo "$(COLOR_GREEN)Building Docker images with BuildKit...$(COLOR_RESET)"
	@DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose build --parallel
	@echo "$(COLOR_GREEN)✓ Build completed$(COLOR_RESET)"

.PHONY: build-backend
build-backend: ## Build backend image only
	@echo "$(COLOR_GREEN)Building backend image...$(COLOR_RESET)"
	@DOCKER_BUILDKIT=1 docker build -f docker/Dockerfile.backend -t $(BACKEND_IMAGE):$(VERSION) .
	@echo "$(COLOR_GREEN)✓ Backend build completed$(COLOR_RESET)"

.PHONY: build-frontend
build-frontend: ## Build frontend image only
	@echo "$(COLOR_GREEN)Building frontend image...$(COLOR_RESET)"
	@DOCKER_BUILDKIT=1 docker build -f docker/Dockerfile.frontend -t $(FRONTEND_IMAGE):$(VERSION) .
	@echo "$(COLOR_GREEN)✓ Frontend build completed$(COLOR_RESET)"

.PHONY: build-no-cache
build-no-cache: ## Build images without cache (still uses BuildKit)
	@echo "$(COLOR_GREEN)Building Docker images (no cache)...$(COLOR_RESET)"
	@DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose build --no-cache --parallel
	@echo "$(COLOR_GREEN)✓ Build completed$(COLOR_RESET)"

.PHONY: push
push: ## Push images to registry
	@echo "$(COLOR_GREEN)Pushing images to $(REGISTRY)...$(COLOR_RESET)"
	@docker push $(BACKEND_IMAGE):$(VERSION)
	@docker push $(FRONTEND_IMAGE):$(VERSION)
	@if [ "$(VERSION)" != "latest" ]; then \
		docker push $(BACKEND_IMAGE):latest; \
		docker push $(FRONTEND_IMAGE):latest; \
	fi
	@echo "$(COLOR_GREEN)✓ Push completed$(COLOR_RESET)"

.PHONY: push-backend
push-backend: ## Push backend image only
	@echo "$(COLOR_GREEN)Pushing backend image...$(COLOR_RESET)"
	@docker push $(BACKEND_IMAGE):$(VERSION)
	@echo "$(COLOR_GREEN)✓ Backend push completed$(COLOR_RESET)"

.PHONY: push-frontend
push-frontend: ## Push frontend image only
	@echo "$(COLOR_GREEN)Pushing frontend image...$(COLOR_RESET)"
	@docker push $(FRONTEND_IMAGE):$(VERSION)
	@echo "$(COLOR_GREEN)✓ Frontend push completed$(COLOR_RESET)"

.PHONY: pull
pull: ## Pull images from registry
	@echo "$(COLOR_GREEN)Pulling images from $(REGISTRY)...$(COLOR_RESET)"
	@docker pull $(BACKEND_IMAGE):$(VERSION)
	@docker pull $(FRONTEND_IMAGE):$(VERSION)
	@echo "$(COLOR_GREEN)✓ Pull completed$(COLOR_RESET)"

.PHONY: up
up: ## Start services
	@echo "$(COLOR_GREEN)Starting services...$(COLOR_RESET)"
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose up -d
	@echo "$(COLOR_GREEN)✓ Services started$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_YELLOW)Access the application:$(COLOR_RESET)"
	@echo "  Web Interface: http://localhost"
	@echo "  Backend API:   http://localhost:8080/api/v1"
	@echo ""
	@echo "$(COLOR_BLUE)View logs:$(COLOR_RESET) make logs"
	@echo "$(COLOR_BLUE)Stop services:$(COLOR_RESET) make down"

.PHONY: down
down: ## Stop services
	@echo "$(COLOR_YELLOW)Stopping services...$(COLOR_RESET)"
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose down
	@echo "$(COLOR_GREEN)✓ Services stopped$(COLOR_RESET)"

.PHONY: restart
restart: ## Restart services
	@echo "$(COLOR_YELLOW)Restarting services...$(COLOR_RESET)"
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose restart
	@echo "$(COLOR_GREEN)✓ Services restarted$(COLOR_RESET)"

.PHONY: logs
logs: ## View logs (use Ctrl+C to exit)
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose logs -f

.PHONY: logs-backend
logs-backend: ## View backend logs only
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose logs -f backend

.PHONY: logs-frontend
logs-frontend: ## View frontend logs only
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose logs -f frontend

.PHONY: ps
ps: ## Show running containers
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose ps

.PHONY: stats
stats: ## Show container resource usage
	@docker stats iptables-backend iptables-frontend

.PHONY: exec-backend
exec-backend: ## Execute shell in backend container
	@docker exec -it iptables-backend sh

.PHONY: exec-frontend
exec-frontend: ## Execute shell in frontend container
	@docker exec -it iptables-frontend sh

.PHONY: clean
clean: ## Stop and remove containers, networks, volumes
	@echo "$(COLOR_YELLOW)Cleaning up...$(COLOR_RESET)"
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose down -v
	@echo "$(COLOR_GREEN)✓ Cleanup completed$(COLOR_RESET)"

.PHONY: clean-images
clean-images: ## Remove built images
	@echo "$(COLOR_YELLOW)Removing images...$(COLOR_RESET)"
	@docker rmi -f iptables-web-manager-backend:latest || true
	@docker rmi -f iptables-web-manager-frontend:latest || true
	@docker rmi -f $(BACKEND_IMAGE):$(VERSION) || true
	@docker rmi -f $(FRONTEND_IMAGE):$(VERSION) || true
	@echo "$(COLOR_GREEN)✓ Images removed$(COLOR_RESET)"

.PHONY: clean-all
clean-all: clean clean-images ## Clean everything (containers, volumes, images)
	@echo "$(COLOR_GREEN)✓ Complete cleanup finished$(COLOR_RESET)"

.PHONY: prune
prune: ## Prune unused Docker resources
	@echo "$(COLOR_YELLOW)Pruning Docker resources...$(COLOR_RESET)"
	@docker system prune -f
	@echo "$(COLOR_GREEN)✓ Prune completed$(COLOR_RESET)"

.PHONY: validate
validate: ## Validate docker-compose.yml
	@echo "$(COLOR_GREEN)Validating docker-compose.yml...$(COLOR_RESET)"
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose config > /dev/null
	@echo "$(COLOR_GREEN)✓ Configuration is valid$(COLOR_RESET)"

.PHONY: build-and-push
build-and-push: build push ## Build and push images

.PHONY: build-and-up
build-and-up: build up ## Build and start services

.PHONY: build-and-up-no-cache
build-and-up-no-cache: build-no-cache up ## Build and start services (no cache)

.PHONY: build-and-up-no-cache
build-and-up-no-cache: build-no-cache up ## Build and start services (no cache)

.PHONY: build-and-up-no-cache
build-and-up-no-cache: build-no-cache up ## Build and start services (no cache)

.PHONY: build-and-up-no-cache
build-and-up-no-cache: build-no-cache up ## Build and start services (no cache)

.PHONY: pull-and-up
pull-and-up: pull up ## Pull and start services

.PHONY: release
release: ## Create a release (build, tag, push)
	@if [ "$(VERSION)" = "latest" ]; then \
		echo "$(COLOR_YELLOW)Error: Please specify VERSION for release$(COLOR_RESET)"; \
		echo "Example: make release VERSION=1.0.0"; \
		exit 1; \
	fi
	@echo "$(COLOR_GREEN)Creating release $(VERSION)...$(COLOR_RESET)"
	@$(MAKE) build VERSION=$(VERSION)
	@$(MAKE) push VERSION=$(VERSION)
	@echo "$(COLOR_GREEN)✓ Release $(VERSION) completed$(COLOR_RESET)"

.PHONY: dev
dev: ## Start in development mode (with logs)
	@echo "$(COLOR_GREEN)Starting in development mode...$(COLOR_RESET)"
	@DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose up --build

.PHONY: health
health: ## Check service health
	@echo "$(COLOR_GREEN)Checking service health...$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_BLUE)Backend:$(COLOR_RESET)"
	@curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost:8080/api/v1/rules || echo "  Status: Unreachable"
	@echo ""
	@echo "$(COLOR_BLUE)Frontend:$(COLOR_RESET)"
	@curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost || echo "  Status: Unreachable"
	@echo ""

.PHONY: backup-db
backup-db: ## Backup database
	@echo "$(COLOR_GREEN)Backing up database...$(COLOR_RESET)"
	@mkdir -p backups
	@cp data/iptables.db backups/iptables-$(shell date +%Y%m%d-%H%M%S).db
	@echo "$(COLOR_GREEN)✓ Database backed up to backups/$(COLOR_RESET)"

.PHONY: restore-db
restore-db: ## Restore database (use FILE=path/to/backup.db)
	@if [ -z "$(FILE)" ]; then \
		echo "$(COLOR_YELLOW)Error: Please specify FILE$(COLOR_RESET)"; \
		echo "Example: make restore-db FILE=backups/iptables-20240101-120000.db"; \
		exit 1; \
	fi
	@echo "$(COLOR_YELLOW)Restoring database from $(FILE)...$(COLOR_RESET)"
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose down
	@cp $(FILE) data/iptables.db
	@REGISTRY=$(REGISTRY) NAMESPACE=$(NAMESPACE) VERSION=$(VERSION) docker compose up -d
	@echo "$(COLOR_GREEN)✓ Database restored$(COLOR_RESET)"

.PHONY: test
test: ## Run basic tests
	@echo "$(COLOR_GREEN)Running tests...$(COLOR_RESET)"
	@echo "  Testing backend API..."
	@curl -s http://localhost:8080/api/v1/rules > /dev/null && echo "  $(COLOR_GREEN)✓ Backend API OK$(COLOR_RESET)" || echo "  $(COLOR_YELLOW)✗ Backend API Failed$(COLOR_RESET)"
	@echo "  Testing frontend..."
	@curl -s http://localhost > /dev/null && echo "  $(COLOR_GREEN)✓ Frontend OK$(COLOR_RESET)" || echo "  $(COLOR_YELLOW)✗ Frontend Failed$(COLOR_RESET)"

.PHONY: version
version: ## Show version information
	@echo "$(COLOR_BOLD)Version Information:$(COLOR_RESET)"
	@echo "  Project: $(PROJECT_NAME)"
	@echo "  Version: $(VERSION)"
	@echo "  Registry: $(REGISTRY)"
	@echo "  Namespace: $(NAMESPACE)"
	@echo ""
	@echo "$(COLOR_BOLD)Image Tags:$(COLOR_RESET)"
	@echo "  Backend:  $(BACKEND_IMAGE):$(VERSION)"
	@echo "  Frontend: $(FRONTEND_IMAGE):$(VERSION)"

.PHONY: login
login: ## Login to Docker registry
	@echo "$(COLOR_GREEN)Logging in to $(REGISTRY)...$(COLOR_RESET)"
	@docker login $(REGISTRY)

.PHONY: setup
setup: ## Initial setup
	@echo "$(COLOR_GREEN)Running initial setup...$(COLOR_RESET)"
	@mkdir -p data backups
	@chmod +x scripts/*.sh
	@chmod +x docker-start.sh docker-stop.sh
	@echo "$(COLOR_GREEN)✓ Setup completed$(COLOR_RESET)"

.DEFAULT_GOAL := help
