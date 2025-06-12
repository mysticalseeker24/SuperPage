@echo off
REM SuperPage Multi-Agent System Startup Script for Windows
REM This script orchestrates the complete SuperPage system deployment

setlocal enabledelayedexpansion

REM Configuration
set COMPOSE_FILE=docker-compose.yml
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=development

echo.
echo 🚀 SuperPage Multi-Agent System Startup
echo =========================================
echo Environment: %ENVIRONMENT%
echo.

REM Function to check prerequisites
:check_prerequisites
echo 🔍 Checking prerequisites...

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)
echo ✅ Docker is installed

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)
echo ✅ Docker Compose is installed

REM Check if Docker daemon is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker daemon is not running. Please start Docker first.
    exit /b 1
)
echo ✅ Docker daemon is running

REM Check environment files
if not exist ".env" (
    echo ⚠️  .env file not found. Using default configuration.
) else (
    echo ✅ .env file found
)

echo.
goto cleanup_previous

:cleanup_previous
echo 🧹 Cleaning up previous deployment...

REM Stop and remove containers
docker-compose -f %COMPOSE_FILE% down --remove-orphans >nul 2>&1

REM Remove unused networks
docker network prune -f >nul 2>&1

echo ✅ Previous deployment cleaned up
echo.
goto build_images

:build_images
echo 🔨 Building Docker images...

REM Build all services
docker-compose -f %COMPOSE_FILE% build --parallel
if errorlevel 1 (
    echo ❌ Failed to build Docker images
    exit /b 1
)

echo ✅ All Docker images built successfully
echo.
goto start_services

:start_services
echo 🚀 Starting SuperPage services...

REM Set compose file based on environment
if "%ENVIRONMENT%"=="production" (
    set COMPOSE_FILE=docker-compose.prod.yml
    echo ✅ Using production configuration
) else if "%ENVIRONMENT%"=="development" (
    set COMPOSE_FILE=docker-compose.yml
    if exist "docker-compose.override.yml" (
        echo ✅ Using development configuration with overrides
    )
) else if "%ENVIRONMENT%"=="test" (
    set COMPOSE_FILE=docker-compose.yml
    set MONGODB_URL=mongodb://admin:superpage123@mongodb:27017/superpage_test?authSource=admin
    echo ✅ Using test configuration
)

REM Start services in correct order
echo Starting database...
docker-compose -f %COMPOSE_FILE% up -d mongodb
if errorlevel 1 (
    echo ❌ Failed to start MongoDB
    exit /b 1
)

REM Wait for MongoDB to be ready
echo Waiting for MongoDB to be ready...
timeout /t 10 /nobreak >nul

echo Starting training service...
docker-compose -f %COMPOSE_FILE% up training-service
if errorlevel 1 (
    echo ❌ Failed to start training service
    exit /b 1
)

echo Starting core services...
docker-compose -f %COMPOSE_FILE% up -d ingestion-service preprocessing-service
if errorlevel 1 (
    echo ❌ Failed to start core services
    exit /b 1
)

REM Wait for core services
timeout /t 15 /nobreak >nul

echo Starting prediction service...
docker-compose -f %COMPOSE_FILE% up -d prediction-service
if errorlevel 1 (
    echo ❌ Failed to start prediction service
    exit /b 1
)

REM Wait for prediction service
timeout /t 10 /nobreak >nul

echo Starting blockchain service...
docker-compose -f %COMPOSE_FILE% up -d blockchain-service
if errorlevel 1 (
    echo ❌ Failed to start blockchain service
    exit /b 1
)

REM Start optional services for development
if "%ENVIRONMENT%"=="development" (
    echo Starting development tools...
    docker-compose -f %COMPOSE_FILE% up -d mongo-express monitor >nul 2>&1
)

echo ✅ All services started successfully
echo.
goto check_health

:check_health
echo 🏥 Checking service health...

REM Check each service health
set services=ingestion-service:8010 preprocessing-service:8001 prediction-service:8002 blockchain-service:8003

for %%s in (%services%) do (
    for /f "tokens=1,2 delims=:" %%a in ("%%s") do (
        echo Checking %%a...
        
        REM Wait up to 60 seconds for service to be healthy
        set /a counter=0
        :health_loop
        curl -f -s "http://localhost:%%b/health" >nul 2>&1
        if not errorlevel 1 (
            echo ✅ %%a is healthy
            goto next_service
        )
        set /a counter+=1
        if !counter! geq 12 (
            echo ⚠️  %%a health check failed
            goto next_service
        )
        timeout /t 5 /nobreak >nul
        goto health_loop
        :next_service
    )
)

echo.
goto display_urls

:display_urls
echo 🌐 Service URLs:
echo ✅ Ingestion Service:     http://localhost:8010/docs
echo ✅ Preprocessing Service: http://localhost:8001/docs
echo ✅ Prediction Service:    http://localhost:8002/docs
echo ✅ Blockchain Service:    http://localhost:8003/docs

if "%ENVIRONMENT%"=="development" (
    echo ✅ MongoDB Express:       http://localhost:8081
    echo ✅ Prometheus Monitor:    http://localhost:9090
)

echo ✅ Smart Contract:        https://sepolia.etherscan.io/address/0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D
echo.
goto run_tests

:run_tests
if not "%ENVIRONMENT%"=="development" goto finish

echo 🧪 Running system tests...

REM Test ingestion service
echo Testing ingestion service...
curl -X POST "http://localhost:8010/ingest" -H "Content-Type: application/json" -d "{\"url\": \"https://github.com/ethereum/ethereum-org-website\", \"project_id\": \"test-ethereum-org\"}" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Ingestion service test passed
) else (
    echo ⚠️  Ingestion service test failed
)

REM Test prediction service
echo Testing prediction service...
curl -X POST "http://localhost:8002/predict" -H "Content-Type: application/json" -d "{\"features\": [8.5, 0.95, 0.88, 15000, 0.85, 2000000, 0.92]}" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Prediction service test passed
) else (
    echo ⚠️  Prediction service test failed
)

echo.
goto finish

:finish
echo 🎉 SuperPage Multi-Agent System is now running!
echo.
echo Use 'docker-compose logs -f' to follow logs
echo Use 'docker-compose down' to stop all services
echo.

REM Follow logs if requested
if "%2"=="logs" (
    echo 📋 Following logs (Ctrl+C to exit):
    docker-compose -f %COMPOSE_FILE% logs -f
)

goto :eof

REM Handle script arguments
if "%1"=="clean" (
    call :cleanup_previous
    exit /b 0
)

if "%1"=="logs" (
    docker-compose -f %COMPOSE_FILE% logs --tail=10
    exit /b 0
)

if "%1"=="health" (
    call :check_health
    exit /b 0
)

if "%1"=="urls" (
    call :display_urls
    exit /b 0
)

REM Main execution
call :check_prerequisites
