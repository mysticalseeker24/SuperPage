# SuperPage Deployment Information

## Current Live Deployment (Sepolia Testnet)

### Smart Contract Details
- **Contract Name**: SuperPagePrediction
- **Contract Address**: `0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D`
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Explorer URL**: https://sepolia.etherscan.io/address/0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D

### Deployment Transaction
- **Transaction Hash**: `0x0528026d188b6fbaed14d8b92c85fbd74136a303396e87e3b46d884bf9700fcb`
- **Deployer Address**: `0xf60944AF65a3F35b02cc251fe884767213dFAB8D`
- **Gas Used**: 1,043,454 gas
- **Gas Price**: 2,000,000,000 wei (2 gwei)
- **Deployment Cost**: 0.002086908 ETH
- **Timestamp**: 2025-06-12T08:04:28.811Z

### Contract Verification
- ✅ **Contract Owner**: `0xf60944AF65a3F35b02cc251fe884767213dFAB8D`
- ✅ **Total Predictions**: 0 (newly deployed)
- ✅ **Deployer Authorized**: true
- ✅ **Contract Operational**: Ready for predictions

### Environment Configuration
```bash
# Blockchain Service Environment Variables
BLOCKCHAIN_PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e
SUPERPAGE_CONTRACT_ADDRESS=0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D
BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266
INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266
ETHERSCAN_API_KEY=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA
```

### Gas Optimization
- **Reduced Gas Price**: 2 gwei (down from 20 gwei)
- **Gas Limit**: 2,000,000 (down from 6,000,000)
- **Cost Savings**: ~90% reduction in transaction costs
- **Network**: Sepolia testnet for development and testing

### Service Endpoints
- **Frontend Application**: http://localhost:3000 (Requires MetaMask wallet connection)
- **Blockchain Service**: http://localhost:8003
- **Prediction Service**: http://localhost:8002
- **Ingestion Service**: http://localhost:8010
- **Preprocessing Service**: http://localhost:8001

### Quick Verification Commands
```bash
# Check contract on Etherscan
curl "https://api-sepolia.etherscan.io/api?module=contract&action=getabi&address=0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D&apikey=PEK4R6W3IDZGATUF3JDU7KTGBCGWM6UJRA"

# Test blockchain service health
curl http://localhost:8003/health

# Check transaction status
curl http://localhost:8003/transaction/0x0528026d188b6fbaed14d8b92c85fbd74136a303396e87e3b46d884bf9700fcb
```

### Deployment History
1. **Previous**: `0x45341d82d59b3C4C43101782d97a4dBb97a42dba` (deprecated)
2. **Current**: `0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D` (active)

### Frontend Integration
- **Wallet Authentication**: Mandatory MetaMask connection before site access
- **Smart Contract Integration**: Direct interaction with deployed contract
- **Real-time Updates**: Live transaction status and prediction storage
- **User Experience**: Seamless Web3 integration with beautiful UI

### Notes
- Successfully deployed with reduced gas costs
- All environment files and documentation updated
- Frontend application with wallet-first authentication implemented
- Ready for production use on Sepolia testnet
- Contract verified and operational
- Complete end-to-end Web3 application ready
