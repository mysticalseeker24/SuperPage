/**
 * SuperPage Blockchain Service - Network Check Script
 * 
 * HardHat script to verify blockchain network connectivity and status.
 * This script is called by the Python blockchain service for health checks.
 */

const { ethers } = require("hardhat");

async function main() {
    try {
        console.error("Checking blockchain network connectivity...");
        
        // Connect to provider (use hardhat's configured provider)
        const provider = ethers.provider;
        
        // Test basic connectivity
        const network = await provider.getNetwork();
        console.error(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
        
        // Get current block number
        const blockNumber = await provider.getBlockNumber();
        console.error(`Current block number: ${blockNumber}`);
        
        // Get latest block
        const block = await provider.getBlock("latest");
        console.error(`Latest block hash: ${block.hash}`);
        console.error(`Block timestamp: ${new Date(block.timestamp * 1000).toISOString()}`);
        
        // Check if we can get gas price
        const gasPrice = await provider.getGasPrice();
        console.error(`Current gas price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
        
        // Prepare success response
        const responseData = {
            success: true,
            network: {
                name: network.name,
                chainId: network.chainId
            },
            blockNumber: blockNumber,
            latestBlockHash: block.hash,
            blockTimestamp: new Date(block.timestamp * 1000).toISOString(),
            gasPrice: gasPrice.toString(),
            gasPriceGwei: ethers.utils.formatUnits(gasPrice, "gwei"),
            timestamp: new Date().toISOString()
        };
        
        console.log(JSON.stringify(responseData));
        
    } catch (error) {
        console.error(`Network check failed: ${error.message}`);
        
        // Output error response
        const errorResponse = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
        
        console.log(JSON.stringify(errorResponse));
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the main function
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
