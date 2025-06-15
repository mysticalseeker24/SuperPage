#!/bin/bash

# SuperPage Railway Deployment Script
# Deploys each microservice individually using Railway CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚂 SuperPage Railway Deployment${NC}"
echo "=================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Login to Railway
echo -e "${BLUE}Logging into Railway...${NC}"
railway login

# Check if already linked to a project
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}Creating new Railway project...${NC}"
    railway new SuperPage
else
    echo -e "${GREEN}✅ Already linked to Railway project${NC}"
fi

# Add PostgreSQL database if not exists
echo -e "${BLUE}Setting up PostgreSQL database...${NC}"
railway add postgresql || echo -e "${YELLOW}PostgreSQL database may already exist${NC}"

# Services to deploy
declare -a services=("ingestion" "preprocessing" "prediction" "blockchain")

# Deploy each service
for service in "${services[@]}"; do
    echo -e "${BLUE}Deploying $service service...${NC}"
    
    # Navigate to service directory
    service_dir="backend/${service}_service"
    if [ ! -d "$service_dir" ]; then
        echo -e "${RED}❌ Directory $service_dir not found${NC}"
        continue
    fi
    
    cd "$service_dir"
    
    # Create service if it doesn't exist
    service_name="superpage-$service"
    echo "Creating Railway service: $service_name"
    railway add --service "$service_name" || echo "Service may already exist"

    # Link to the service
    railway service "$service_name"

    # Deploy the service
    echo "Deploying $service_name..."
    railway up
    
    # Set environment variables
    echo "Setting environment variables for $service_name..."

    # Common environment variables for all services
    railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
    railway variables --set "FRONTEND_URL=https://superpage-frontend.netlify.app"
    railway variables --set "PORT=8000"
    
    # Service-specific environment variables
    case "$service" in
        "ingestion"|"preprocessing")
            railway variables --set "FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf"
            ;;
        "blockchain")
            railway variables --set "BLOCKCHAIN_PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e"
            railway variables --set "BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266"
            railway variables --set "SUPERPAGE_CONTRACT_ADDRESS=0x45341d82d59b3C4C43101782d97a4dBb97a42dba"
            railway variables --set "INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266"
            railway variables --set "ETHERSCAN_API_KEY=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA"
            ;;
    esac
    
    # Navigate back to root
    cd ../..
    
    echo -e "${GREEN}✅ $service service deployed successfully${NC}"
    echo ""
done

# Set up database schema
echo -e "${BLUE}Setting up database schema...${NC}"
read -p "Do you want to set up the database schema now? (y/n): " setup_schema

if [[ $setup_schema == "y" || $setup_schema == "Y" ]]; then
    echo -e "${YELLOW}⚠️  To get the database URL:${NC}"
    echo "1. Run: railway service postgres"
    echo "2. Run: railway variables"
    echo "3. Copy the DATABASE_URL value"
    echo "4. Run: psql [DATABASE_URL] -f scripts/setup-postgres-schema.sql"
    echo ""
    echo -e "${BLUE}Or set up schema later from Railway dashboard → PostgreSQL → Data tab${NC}"
fi

# Display deployment status
echo -e "${BLUE}Checking deployment status...${NC}"
railway status

# Display service URLs
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
for service in "${services[@]}"; do
    service_name="superpage-$service"
    url=$(railway domain --service "$service_name" 2>/dev/null || echo "Deploying...")
    echo -e "${GREEN}$service: $url${NC}"
done

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Wait for all services to finish deploying"
echo "2. Test health endpoints:"
echo "   curl https://superpage-ingestion.up.railway.app/health"
echo "   curl https://superpage-preprocessing.up.railway.app/health"
echo "   curl https://superpage-prediction.up.railway.app/health"
echo "   curl https://superpage-blockchain.up.railway.app/health"
echo "3. Deploy frontend to Netlify with Railway URLs"
echo "4. Set up GitHub Actions with Railway service IDs"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "railway logs --service superpage-ingestion    # View logs"
echo "railway shell --service superpage-ingestion   # Access service shell"
echo "railway variables --service superpage-ingestion # View environment variables"
echo "railway status                                 # View all services status"
echo ""
echo -e "${GREEN}🚂 SuperPage is now deployed on Railway!${NC}"
