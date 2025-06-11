/**
 * SuperPage Smart Contracts - HardHat Configuration
 * 
 * Configuration for HardHat development environment focused on Sepolia testnet deployment.
 * This configuration prioritizes testnet usage and excludes mainnet for safety.
 */

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

// Load environment variables
require('dotenv').config();

// Environment variables with validation
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.BLOCKCHAIN_PRIVATE_KEY;
const SEPOLIA_URL = process.env.SEPOLIA_URL || process.env.SEPOLIA_RPC_URL;
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// Validate required environment variables for Sepolia deployment
if (!PRIVATE_KEY) {
    console.warn("Warning: PRIVATE_KEY not set. Sepolia deployment will not work.");
}

if (!SEPOLIA_URL && !INFURA_PROJECT_ID) {
    console.warn("Warning: Neither SEPOLIA_URL nor INFURA_PROJECT_ID set. Using default Infura endpoint.");
}

// Default Sepolia URL using Infura
const DEFAULT_SEPOLIA_URL = INFURA_PROJECT_ID 
    ? `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`
    : "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID";

module.exports = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            metadata: {
                // Do not include metadata hash for deterministic builds
                bytecodeHash: "none"
            }
        }
    },
    
    networks: {
        // Local development network
        localhost: {
            url: "http://localhost:8545",
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
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
            },
            // Enable console.log in contracts
            allowUnlimitedContractSize: false,
            blockGasLimit: 6000000
        },
        
        // Sepolia testnet - PRIMARY DEPLOYMENT TARGET
        sepolia: {
            url: SEPOLIA_URL || DEFAULT_SEPOLIA_URL,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
            chainId: 11155111,
            gas: 6000000,
            gasPrice: 20000000000, // 20 gwei
            timeout: 120000, // 2 minutes
            confirmations: 2
        }
        
        // NOTE: Mainnet intentionally excluded for safety
        // This ensures accidental mainnet deployments are prevented
    },
    
    // Etherscan verification configuration
    etherscan: {
        apiKey: {
            sepolia: ETHERSCAN_API_KEY
        }
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
        timeout: 120000, // 2 minutes for network tests
        reporter: 'spec'
    },
    
    // Gas reporter configuration (optional)
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: 'USD'
    }
};
