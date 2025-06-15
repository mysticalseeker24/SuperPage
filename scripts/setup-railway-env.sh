#!/bin/bash

# SuperPage Railway Environment Setup Script
# This script helps set up environment variables for Railway deployment

set -e

echo "🚂 SuperPage Railway Environment Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Login to Railway
echo -e "${BLUE}Logging into Railway...${NC}"
railway login

# List projects
echo -e "${BLUE}Available Railway projects:${NC}"
railway projects

# Prompt for project selection
read -p "Enter your Railway project ID or name: " PROJECT_ID
railway link $PROJECT_ID

echo -e "${GREEN}✅ Linked to Railway project: $PROJECT_ID${NC}"

# Environment variables to set
declare -A ENV_VARS=(
    ["FIRECRAWL_API_KEY"]="fc-62e1fc5b845c40948b28fd133fbef7cf"
    ["BLOCKCHAIN_PRIVATE_KEY"]="a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e"
    ["BLOCKCHAIN_NETWORK_URL"]="https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266"
    ["SUPERPAGE_CONTRACT_ADDRESS"]="0x45341d82d59b3C4C43101782d97a4dBb97a42dba"
    ["INFURA_PROJECT_ID"]="ea1e0f21469f412995bdaaa76ac1c266"
    ["ETHERSCAN_API_KEY"]="PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA"
    ["FRONTEND_URL"]="https://superpage-frontend.netlify.app"
    ["PORT"]="8000"
)

# Services to configure
SERVICES=("ingestion" "preprocessing" "prediction" "blockchain")

echo -e "${BLUE}Setting up environment variables for all services...${NC}"

# Set environment variables for each service
for service in "${SERVICES[@]}"; do
    echo -e "${YELLOW}Configuring $service service...${NC}"
    
    # Set common environment variables
    for var_name in "${!ENV_VARS[@]}"; do
        var_value="${ENV_VARS[$var_name]}"
        
        # Skip blockchain-specific vars for other services
        if [[ "$service" != "blockchain" && "$var_name" =~ ^(BLOCKCHAIN_|INFURA_|ETHERSCAN_|SUPERPAGE_CONTRACT_) ]]; then
            continue
        fi
        
        echo "Setting $var_name for $service service..."
        railway variables set $var_name="$var_value" --service superpage-$service || echo "Failed to set $var_name"
    done
    
    echo -e "${GREEN}✅ Configured $service service${NC}"
done

# Set up database connection
echo -e "${BLUE}Setting up database connection...${NC}"

# Check if PostgreSQL service exists
if railway services | grep -q "postgres"; then
    echo -e "${GREEN}✅ PostgreSQL service found${NC}"
    
    # Link database to all services
    for service in "${SERVICES[@]}"; do
        echo "Linking database to $service service..."
        railway variables set DATABASE_URL="\${{Postgres.DATABASE_URL}}" --service superpage-$service || echo "Failed to link database to $service"
    done
else
    echo -e "${YELLOW}⚠️  PostgreSQL service not found. Creating one...${NC}"
    railway add --database postgresql
    echo -e "${GREEN}✅ PostgreSQL service created${NC}"
    
    # Wait a moment for the service to initialize
    sleep 5
    
    # Link database to all services
    for service in "${SERVICES[@]}"; do
        echo "Linking database to $service service..."
        railway variables set DATABASE_URL="\${{Postgres.DATABASE_URL}}" --service superpage-$service || echo "Failed to link database to $service"
    done
fi

# Display service URLs
echo -e "${BLUE}Getting service URLs...${NC}"
for service in "${SERVICES[@]}"; do
    url=$(railway domain --service superpage-$service 2>/dev/null || echo "Not deployed yet")
    echo -e "${GREEN}$service service: $url${NC}"
done

# Setup database schema
echo -e "${BLUE}Setting up database schema...${NC}"
read -p "Do you want to set up the database schema now? (y/n): " setup_db

if [[ $setup_db == "y" || $setup_db == "Y" ]]; then
    # Get database URL
    db_url=$(railway variables get DATABASE_URL --service postgres 2>/dev/null || echo "")
    
    if [[ -n "$db_url" ]]; then
        echo "Setting up database schema..."
        psql "$db_url" -f scripts/setup-postgres-schema.sql || echo "Failed to set up schema. You can run it manually later."
        echo -e "${GREEN}✅ Database schema setup complete${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not get database URL. Set up schema manually later.${NC}"
    fi
fi

# Generate GitHub secrets
echo -e "${BLUE}Generating GitHub secrets configuration...${NC}"

# Get Railway token
railway_token=$(railway whoami --json | jq -r '.token' 2>/dev/null || echo "")

if [[ -n "$railway_token" ]]; then
    echo -e "${GREEN}GitHub Secrets to add:${NC}"
    echo "RAILWAY_TOKEN=$railway_token"
    
    # Get service IDs
    for service in "${SERVICES[@]}"; do
        service_id=$(railway status --service superpage-$service --json | jq -r '.serviceId' 2>/dev/null || echo "unknown")
        var_name="RAILWAY_$(echo $service | tr '[:lower:]' '[:upper:]')_SERVICE_ID"
        echo "$var_name=$service_id"
    done
else
    echo -e "${YELLOW}⚠️  Could not get Railway token. Add GitHub secrets manually.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Railway environment setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Add the GitHub secrets shown above to your repository"
echo "2. Deploy your services: railway up"
echo "3. Set up your frontend on Netlify"
echo "4. Test all endpoints"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "railway logs --service superpage-ingestion    # View logs"
echo "railway shell --service superpage-ingestion   # Access service shell"
echo "railway variables --service superpage-ingestion # View environment variables"
echo "railway status                                 # View all services status"
