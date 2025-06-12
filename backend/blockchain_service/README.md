# SuperPage Blockchain Service

The blockchain service provides secure on-chain publishing of prediction results using smart contracts. It integrates FastAPI with HardHat/Ethers.js to enable transparent, immutable storage of fundraising predictions on the Ethereum blockchain.

## Features

- **Smart Contract Integration**: Publish predictions to Ethereum smart contracts
- **HardHat Integration**: Seamless integration with HardHat development environment
- **Secure Key Management**: Environment-based private key and contract address management
- **Transaction Monitoring**: Real-time transaction status tracking and confirmation
- **Gas Optimization**: Configurable gas limits and pricing for cost efficiency
- **Comprehensive Testing**: Unit tests with subprocess mocking for HardHat scripts
- **Production Ready**: Docker support with multi-stage builds

## Architecture

### Smart Contract
The `SuperPagePrediction.sol` contract provides:
- Immutable prediction storage with cryptographic proofs
- Access control for authorized publishers
- Event emission for transparency
- Gas-optimized operations

### API Integration
- **FastAPI Service**: Async REST API for blockchain interactions
- **HardHat Scripts**: JavaScript scripts for contract interactions
- **Subprocess Bridge**: Python-to-Node.js communication via subprocess calls

## API Endpoints

### POST /publish
Publish a prediction result to the blockchain smart contract.

**Request:**
```json
{
  "project_id": "defi-protocol-xyz",
  "score": 0.7234,
  "proof": "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
  "metadata": {
    "model_version": "v1.0.0",
    "timestamp": "2024-01-15T10:30:00Z",
    "features_hash": "0xabcdef..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "tx_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "status": "confirmed",
    "block_number": 12345678,
    "gas_used": 85000,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "project_id": "defi-protocol-xyz",
  "score": 0.7234,
  "contract_address": "0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D"
}
```

### GET /transaction/{tx_hash}
Get transaction status and details by hash.

### GET /health
Health check endpoint with blockchain connectivity status.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- HardHat development environment
- Ethereum node (Infura or local)

### Environment Setup

1. **Copy Environment File**
```bash
cp .env.example .env
```

2. **Configure Environment Variables**
```bash
# Required
BLOCKCHAIN_PRIVATE_KEY=0x...your_private_key...
SUPERPAGE_CONTRACT_ADDRESS=0x...contract_address...

# Optional
BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/...your_infura_project_id...
GAS_LIMIT=2000000
GAS_PRICE=2000000000
```

### Local Development

1. **Install Dependencies**
```bash
# Python dependencies
pip install -r requirements.txt

# Node.js dependencies
npm install
```
2. **Start Local Blockchain**
```bash
npx hardhat node
```

3. **Deploy Smart Contract**
```bash
npx hardhat run scripts/deploy.js --network sepolia (npx hardhat run scripts/publish-prediction.js --network sepolia)
```

4. **Run Service**
```bash
python main.py
# Or with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

### Docker Deployment

**Development:**
```bash
docker build -t superpage-blockchain .
docker run -p 8003:8003 --env-file .env superpage-blockchain
```

**Production:**
```bash
docker build --target production -t superpage-blockchain-prod .
docker run -p 8003:8003 --env-file .env superpage-blockchain-prod
```

## Current Deployment (Sepolia Testnet)

### Live Contract Information
- **Contract Address**: `0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D`
- **Network**: Sepolia Testnet (Chain ID: 11155111)
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D)
- **Deployer**: `0xf60944AF65a3F35b02cc251fe884767213dFAB8D`
- **Transaction Hash**: `0x0528026d188b6fbaed14d8b92c85fbd74136a303396e87e3b46d884bf9700fcb`
- **Gas Used**: 1,043,454 gas
- **Deployment Cost**: 0.002086908 ETH

### Contract Status
- ✅ **Deployed**: Successfully deployed to Sepolia testnet
- ✅ **Verified**: Contract owner and authorization confirmed
- ✅ **Operational**: Ready for prediction publishing
- ✅ **Gas Optimized**: Using 2 gwei gas price for cost efficiency

## Smart Contract

### SuperPagePrediction.sol

The smart contract provides the following functionality:

```solidity
// Publish a prediction
function publishPrediction(
    string memory projectId,
    uint256 score,           // Score scaled by 1e18 (0.7234 → 723400000000000000)
    bytes32 proofHash,       // Cryptographic proof
    string memory metadata   // JSON metadata
) external returns (uint256 predictionId)

// Get prediction data
function getPrediction(string memory projectId) 
    external view returns (
        uint256 score,
        bytes32 proofHash,
        string memory metadata,
        uint256 timestamp,
        address publisher
    )
```

### Contract Features
- **Access Control**: Only authorized publishers can submit predictions
- **Immutable Storage**: Predictions cannot be modified once published
- **Event Emission**: `PredictionPublished` events for transparency
- **Gas Optimization**: Efficient storage patterns and operations

## HardHat Scripts

### publish-prediction.js
Publishes prediction data to the smart contract.

**Environment Variables:**
- `PROJECT_ID`: Project identifier
- `PREDICTION_SCORE`: Score (0.0 to 1.0)
- `PROOF_HASH`: Cryptographic proof (32 bytes hex)
- `METADATA`: JSON metadata string
- `CONTRACT_ADDRESS`: Smart contract address
- `PRIVATE_KEY`: Publisher private key

### get-transaction.js
Queries transaction status and details.

**Environment Variables:**
- `TX_HASH`: Transaction hash to query
- `PRIVATE_KEY`: Private key for blockchain access

### check-network.js
Verifies blockchain network connectivity and status.

## Testing

The service includes comprehensive unit tests covering:

- **API Endpoints**: FastAPI endpoint testing with various scenarios
- **Subprocess Mocking**: HardHat script integration testing
- **Environment Validation**: Configuration and security testing
- **Error Handling**: Edge cases and failure scenarios
- **Property-based Testing**: Hypothesis-driven validation

### Running Tests

```bash
# All tests with coverage
pytest --cov=main --cov-report=html

# Specific test categories
pytest -m unit          # Unit tests only
pytest -m api           # API tests only
pytest -m subprocess    # Subprocess integration tests

# Fast tests (skip slow ones)
pytest -m "not slow"
```

## Security Considerations

### Private Key Management
- Store private keys in environment variables only
- Never commit private keys to version control
- Use hardware wallets or key management services in production
- Rotate keys regularly

### Smart Contract Security
- Access control for authorized publishers
- Input validation for all parameters
- Gas limit protection against DoS attacks
- Event emission for transparency

### Network Security
- Use HTTPS for all external communications
- Validate all blockchain responses
- Implement retry mechanisms with exponential backoff
- Monitor for unusual transaction patterns

## Gas Optimization

### Default Settings
- **Gas Limit**: 500,000 (configurable)
- **Gas Price**: 20 gwei (configurable)
- **Network**: Localhost for development

### Cost Estimation
- **Publish Prediction**: ~85,000 gas (~$3-10 depending on network)
- **Query Prediction**: Free (view function)
- **Authorization**: ~45,000 gas (one-time setup)

## Integration with SuperPage

The blockchain service integrates with other SuperPage components:

1. **Prediction Service**: Receives prediction results for publishing
2. **Frontend**: Provides transaction status and blockchain verification
3. **Monitoring**: Structured logging for transaction tracking
4. **CI/CD**: Automated testing and deployment pipelines

## Troubleshooting

### Common Issues

**Private Key Not Set:**
```bash
# Error: BLOCKCHAIN_PRIVATE_KEY environment variable is required
export BLOCKCHAIN_PRIVATE_KEY=0x...your_key...
```

**Contract Address Missing:**
```bash
# Error: SUPERPAGE_CONTRACT_ADDRESS environment variable is required
export SUPERPAGE_CONTRACT_ADDRESS=0x...contract_address...
```

**Blockchain Connection Failed:**
```bash
# Check if local node is running
npx hardhat node

# Or check network URL
export BLOCKCHAIN_NETWORK_URL=http://localhost:8545
```

**Transaction Failed:**
```bash
# Check gas settings
export GAS_LIMIT=500000
export GAS_PRICE=20000000000

# Check account balance
npx hardhat run scripts/check-balance.js
```

**HardHat Not Found:**
```bash
# Install HardHat dependencies
npm install

# Verify installation
npx hardhat --version
```

## Development

### Adding New Features
1. Update smart contract if needed
2. Create/modify HardHat scripts
3. Update Python service endpoints
4. Add comprehensive tests
5. Update documentation

### Testing Smart Contracts
```bash
# Compile contracts
npx hardhat compile

# Run contract tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `pytest`
5. Test smart contract changes: `npx hardhat test`
6. Submit a pull request

## License

This project is part of the SuperPage ecosystem. See the main repository LICENSE file for details.
