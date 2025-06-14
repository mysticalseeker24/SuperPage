#!/bin/bash
# SuperPage Render Environment Setup Script
# Helps configure environment variables for Render deployment

echo "🚀 SuperPage Render Environment Setup"
echo "======================================"
echo

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "⚠️  Render CLI not found. Install it with:"
    echo "   npm install -g @render/cli"
    echo "   or visit: https://render.com/docs/cli"
    echo
fi

echo "📋 Required Environment Variables for Render:"
echo "--------------------------------------------"

echo
echo "🔑 SENSITIVE VARIABLES (Set manually in Render Dashboard):"
echo
echo "FIRECRAWL_API_KEY=fc-62e1fc5b845c40948b28fd133fbef7cf"
echo "MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/superpage"
echo "BLOCKCHAIN_PRIVATE_KEY=your_ethereum_private_key_here"
echo "BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/your_project_id"
echo "SEP_RPC_URL=https://sepolia.infura.io/v3/your_project_id"
echo "INFURA_PROJECT_ID=your_infura_project_id"
echo "ETHERSCAN_API_KEY=your_etherscan_api_key"

echo
echo "✅ NON-SENSITIVE VARIABLES (Already configured in render.yaml):"
echo
echo "DATABASE_NAME=superpage"
echo "SERVICE_VERSION=1.0.0"
echo "LOG_LEVEL=INFO"
echo "HOST=0.0.0.0"
echo "PORT=8000"

echo
echo "📝 Setup Instructions:"
echo "---------------------"
echo "1. Fork the SuperPage repository to your GitHub account"
echo "2. Login to Render.com and connect your GitHub account"
echo "3. Create a new Blueprint and select your forked repository"
echo "4. Render will detect the render.yaml file automatically"
echo "5. Set the sensitive environment variables listed above"
echo "6. Deploy and monitor the services"

echo
echo "🔍 Verification:"
echo "----------------"
echo "After deployment, run the verification script:"
echo "python scripts/verify-deployment.py"

echo
echo "📚 Documentation:"
echo "-----------------"
echo "- Deployment Guide: DEPLOYMENT.md"
echo "- Render Docs: https://render.com/docs"
echo "- SuperPage Repo: https://github.com/mysticalseeker24/SuperPage"

echo
echo "🎉 Setup guide complete!"
echo "Follow the instructions above to deploy SuperPage to Render."
