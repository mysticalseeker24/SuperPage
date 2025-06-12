/**
 * SuperPage Blockchain Service - HardHat Configuration
 * 
 * Configuration for HardHat development environment and blockchain interactions.
 */

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

// Load environment variables
require('dotenv').config();

const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development network
    localhost: {
      url: "http://localhost:8545",
      accounts: [PRIVATE_KEY],
      chainId: 31337,
      gas: 6000000,
      gasPrice: 20000000000, // 20 gwei
      timeout: 60000
    },
    
    // Hardhat network for testing
    hardhat: {
      chainId: 31337,
      gas: 6000000,
      gasPrice: 20000000000,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10,
        accountsBalance: "10000000000000000000000" // 10000 ETH
      }
    },
    
    // Sepolia testnet
    sepolia: {
      url: INFURA_PROJECT_ID ? `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}` : "",
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gas: 2000000,
      gasPrice: 2000000000, // 2 gwei instead of 20 gwei
      timeout: 60000
    },
    
    // Ethereum mainnet
    mainnet: {
      url: INFURA_PROJECT_ID ? `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}` : "",
      accounts: [PRIVATE_KEY],
      chainId: 1,
      gas: 6000000,
      gasPrice: 20000000000,
      timeout: 60000
    }
  },
  
  // Etherscan verification
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  
  // Path configurations
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  // Mocha test configuration
  mocha: {
    timeout: 60000
  }
};
