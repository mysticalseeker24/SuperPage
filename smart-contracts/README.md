# SuperPage Smart Contracts

Smart contracts for the SuperPage fundraising prediction platform, designed for deployment on Sepolia testnet.

## Overview

The `FundraisePrediction` contract provides a simple, gas-efficient way to store fundraising prediction results on-chain with cryptographic proofs. Each prediction is immutably recorded and can be retrieved by its unique identifier.

## Contract Features

- **Simple Prediction Storage**: Store predictions with submitter, score, timestamp, and proof
- **Gas Optimized**: Efficient storage patterns and minimal gas usage
- **Testnet Focused**: Designed specifically for Sepolia testnet deployment
- **Event Emission**: Transparent logging of all prediction submissions
- **Comprehensive Testing**: Full test suite with edge case coverage

## Contract Structure

### Prediction Struct
```solidity
struct Prediction {
    address submitter;      // Address that submitted the prediction
    uint8 score;           // Prediction score (0-100)
    uint256 timestamp;     // Block timestamp when submitted
    bytes proof;          // Cryptographic proof data
}
```

### Main Functions
- `submitPrediction(bytes32 id, uint8 score, bytes calldata proof)` - Submit a new prediction
- `getPrediction(bytes32 id)` - Retrieve prediction data
- `predictionExists(bytes32 id)` - Check if prediction exists
- `getTotalPredictions()` - Get total number of predictions

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Sepolia testnet ETH

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your private key and Sepolia RPC URL
   ```

3. **Get Sepolia ETH**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Or use [Chainlink Faucet](https://faucets.chain.link/sepolia)

### Development

1. **Compile Contracts**
   ```bash
   npm run compile
   ```

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Run Tests with Gas Report**
   ```bash
   npm run test:gas
   ```

### Deployment

1. **Deploy to Sepolia**
   ```bash
   npm run deploy:sepolia
   ```

2. **Verify Contract (Optional)**
   ```bash
   npm run verify:sepolia <CONTRACT_ADDRESS>
   ```

### Local Development

1. **Start Local Node**
   ```bash
   npm run node
   ```

2. **Deploy to Local Network**
   ```bash
   npm run deploy:localhost
   ```

## Environment Variables

Required for Sepolia deployment:

```bash
# Private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Sepolia RPC URL or Infura Project ID
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
# OR
INFURA_PROJECT_ID=your_infura_project_id

# Optional: Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Testing

The test suite covers:
- Contract deployment
- Prediction submission and retrieval
- Input validation and edge cases
- Event emission
- Gas optimization
- Multiple user scenarios

Run tests:
```bash
npm test                # Basic test run
npm run test:verbose    # Verbose output
npm run test:gas        # With gas reporting
```

## Security Considerations

- **Testnet Only**: This configuration excludes mainnet for safety
- **Input Validation**: All inputs are validated before storage
- **Immutable Storage**: Predictions cannot be modified once submitted
- **No Access Control**: Anyone can submit predictions (by design)

## Gas Optimization

The contract is optimized for gas efficiency:
- Minimal storage operations
- Efficient data packing
- Simple validation logic
- Prediction submission: ~60-80k gas

## Contract Verification

After deployment, verify your contract on Etherscan:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Integration

### JavaScript/TypeScript Integration

```javascript
const { ethers } = require('ethers');

// Connect to contract
const contract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
);

// Submit prediction
const predictionId = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('project-123')
);
const score = 75; // 75% success probability
const proof = ethers.utils.toUtf8Bytes('proof-hash-data');

await contract.submitPrediction(predictionId, score, proof);

// Get prediction
const prediction = await contract.getPrediction(predictionId);
console.log('Score:', prediction.score);
console.log('Submitter:', prediction.submitter);
```

### Python Integration

```python
from web3 import Web3

# Connect to contract
contract = w3.eth.contract(
    address=contract_address,
    abi=contract_abi
)

# Submit prediction
prediction_id = Web3.keccak(text='project-123')
score = 75
proof = b'proof-hash-data'

tx_hash = contract.functions.submitPrediction(
    prediction_id, score, proof
).transact({'from': account})

# Get prediction
prediction = contract.functions.getPrediction(prediction_id).call()
```

## Troubleshooting

### Common Issues

1. **Insufficient Balance**
   - Get Sepolia ETH from faucets
   - Check balance: `npx hardhat console --network sepolia`

2. **Network Connection**
   - Verify SEPOLIA_URL in .env
   - Check Infura project ID and limits

3. **Gas Estimation Failures**
   - Increase gas limit in hardhat.config.js
   - Check network congestion

4. **Verification Failures**
   - Ensure contract is deployed and confirmed
   - Check Etherscan API key
   - Wait for block confirmations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
