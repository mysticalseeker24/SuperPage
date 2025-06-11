#!/bin/bash

# SuperPage Multi-Agent System Startup Script
# This script orchestrates the complete SuperPage system deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENVIRONMENT=${1:-development}  # development, production, or test

echo -e "${BLUE}🚀 SuperPage Multi-Agent System Startup${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_status "Docker is installed"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_status "Docker Compose is installed"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    print_status "Docker daemon is running"
    
    # Check environment files
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Using default configuration."
    else
        print_status ".env file found"
    fi
    
    echo ""
}

# Function to clean up previous deployment
cleanup_previous() {
    echo -e "${BLUE}🧹 Cleaning up previous deployment...${NC}"
    
    # Stop and remove containers
    docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
    
    # Remove unused networks
    docker network prune -f 2>/dev/null || true
    
    print_status "Previous deployment cleaned up"
    echo ""
}

# Function to build images
build_images() {
    echo -e "${BLUE}🔨 Building Docker images...${NC}"
    
    # Build all services
    docker-compose -f $COMPOSE_FILE build --parallel
    
    print_status "All Docker images built successfully"
    echo ""
}

# Function to start services
start_services() {
    echo -e "${BLUE}🚀 Starting SuperPage services...${NC}"
    
    case $ENVIRONMENT in
        "production")
            COMPOSE_FILE="docker-compose.prod.yml"
            print_status "Using production configuration"
            ;;
        "development")
            COMPOSE_FILE="docker-compose.yml"
            if [ -f "docker-compose.override.yml" ]; then
                print_status "Using development configuration with overrides"
            fi
            ;;
        "test")
            COMPOSE_FILE="docker-compose.yml"
            export MONGODB_URL="mongodb://admin:superpage123@mongodb:27017/superpage_test?authSource=admin"
            print_status "Using test configuration"
            ;;
    esac
    
    # Start services in correct order
    echo -e "${YELLOW}Starting database...${NC}"
    docker-compose -f $COMPOSE_FILE up -d mongodb
    
    # Wait for MongoDB to be ready
    echo -e "${YELLOW}Waiting for MongoDB to be ready...${NC}"
    sleep 10
    
    echo -e "${YELLOW}Starting training service...${NC}"
    docker-compose -f $COMPOSE_FILE up training-service
    
    echo -e "${YELLOW}Starting core services...${NC}"
    docker-compose -f $COMPOSE_FILE up -d ingestion-service preprocessing-service
    
    # Wait for core services
    sleep 15
    
    echo -e "${YELLOW}Starting prediction service...${NC}"
    docker-compose -f $COMPOSE_FILE up -d prediction-service
    
    # Wait for prediction service
    sleep 10
    
    echo -e "${YELLOW}Starting blockchain service...${NC}"
    docker-compose -f $COMPOSE_FILE up -d blockchain-service
    
    # Start optional services
    if [ "$ENVIRONMENT" = "development" ]; then
        echo -e "${YELLOW}Starting development tools...${NC}"
        docker-compose -f $COMPOSE_FILE up -d mongo-express monitor 2>/dev/null || true
    fi
    
    print_status "All services started successfully"
    echo ""
}

# Function to check service health
check_health() {
    echo -e "${BLUE}🏥 Checking service health...${NC}"
    
    services=("ingestion-service:8000" "preprocessing-service:8001" "prediction-service:8002" "blockchain-service:8003")
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        echo -e "${YELLOW}Checking ${name}...${NC}"
        
        # Wait up to 60 seconds for service to be healthy
        for i in {1..12}; do
            if curl -f -s "http://localhost:${port}/health" > /dev/null 2>&1; then
                print_status "${name} is healthy"
                break
            elif [ $i -eq 12 ]; then
                print_warning "${name} health check failed"
            else
                sleep 5
            fi
        done
    done
    echo ""
}

# Function to display service URLs
display_urls() {
    echo -e "${BLUE}🌐 Service URLs:${NC}"
    echo -e "${GREEN}Ingestion Service:    http://localhost:8000/docs${NC}"
    echo -e "${GREEN}Preprocessing Service: http://localhost:8001/docs${NC}"
    echo -e "${GREEN}Prediction Service:   http://localhost:8002/docs${NC}"
    echo -e "${GREEN}Blockchain Service:   http://localhost:8003/docs${NC}"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        echo -e "${GREEN}MongoDB Express:      http://localhost:8081${NC}"
        echo -e "${GREEN}Prometheus Monitor:   http://localhost:9090${NC}"
    fi
    
    echo -e "${GREEN}Smart Contract:       https://sepolia.etherscan.io/address/0x45341d82d59b3C4C43101782d97a4dBb97a42dba${NC}"
    echo ""
}

# Function to run system tests
run_tests() {
    echo -e "${BLUE}🧪 Running system tests...${NC}"
    
    # Test ingestion service
    echo -e "${YELLOW}Testing ingestion service...${NC}"
    curl -X POST "http://localhost:8000/ingest" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://github.com/ethereum/ethereum-org-website", "project_id": "test-ethereum-org"}' \
        > /dev/null 2>&1 && print_status "Ingestion service test passed" || print_warning "Ingestion service test failed"
    
    # Test prediction service
    echo -e "${YELLOW}Testing prediction service...${NC}"
    curl -X POST "http://localhost:8002/predict" \
        -H "Content-Type: application/json" \
        -d '{"features": [8.5, 0.95, 0.88, 15000, 0.85, 2000000, 0.92]}' \
        > /dev/null 2>&1 && print_status "Prediction service test passed" || print_warning "Prediction service test failed"
    
    echo ""
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 Recent logs:${NC}"
    docker-compose -f $COMPOSE_FILE logs --tail=10
}

# Main execution
main() {
    check_prerequisites
    
    if [ "$1" = "clean" ]; then
        cleanup_previous
        exit 0
    fi
    
    cleanup_previous
    build_images
    start_services
    check_health
    display_urls
    
    if [ "$ENVIRONMENT" = "development" ]; then
        run_tests
    fi
    
    echo -e "${GREEN}🎉 SuperPage Multi-Agent System is now running!${NC}"
    echo -e "${YELLOW}Use 'docker-compose logs -f' to follow logs${NC}"
    echo -e "${YELLOW}Use 'docker-compose down' to stop all services${NC}"
    echo ""
    
    # Follow logs if requested
    if [ "$2" = "logs" ]; then
        echo -e "${BLUE}📋 Following logs (Ctrl+C to exit):${NC}"
        docker-compose -f $COMPOSE_FILE logs -f
    fi
}

# Handle script arguments
case "$1" in
    "clean")
        cleanup_previous
        ;;
    "logs")
        show_logs
        ;;
    "health")
        check_health
        ;;
    "urls")
        display_urls
        ;;
    *)
        main "$@"
        ;;
esac
