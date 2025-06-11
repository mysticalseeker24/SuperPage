/**
 * SuperPage Blockchain Service - Get Transaction Status Script
 * 
 * HardHat script to query transaction status and details from the blockchain.
 * This script is called by the Python blockchain service via subprocess.
 * 
 * Environment Variables Required:
 * - TX_HASH: Transaction hash to query
 * - PRIVATE_KEY: Private key for blockchain connection
 */

const { ethers } = require("hardhat");

async function main() {
    try {
        // Validate required environment variables
        const txHash = process.env.TX_HASH;
        const privateKey = process.env.PRIVATE_KEY;
        
        if (!txHash) {
            throw new Error("Missing required environment variable: TX_HASH");
        }
        
        if (!privateKey) {
            throw new Error("Missing required environment variable: PRIVATE_KEY");
        }
        
        // Validate transaction hash format
        if (!ethers.utils.isHexString(txHash, 32)) {
            throw new Error(`Invalid transaction hash format: ${txHash}`);
        }
        
        // Create wallet and provider
        const wallet = new ethers.Wallet(privateKey);
        const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
        const signer = wallet.connect(provider);
        
        console.error(`Querying transaction: ${txHash}`);
        
        // Get transaction details
        const tx = await provider.getTransaction(txHash);
        
        if (!tx) {
            const response = {
                status: "not_found",
                txHash: txHash,
                error: "Transaction not found",
                timestamp: new Date().toISOString()
            };
            console.log(JSON.stringify(response));
            return;
        }
        
        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(txHash);
        
        let status = "pending";
        let blockNumber = null;
        let gasUsed = null;
        let confirmations = 0;
        
        if (receipt) {
            status = receipt.status === 1 ? "confirmed" : "failed";
            blockNumber = receipt.blockNumber;
            gasUsed = receipt.gasUsed.toString();
            
            // Get current block number to calculate confirmations
            const currentBlock = await provider.getBlockNumber();
            confirmations = currentBlock - receipt.blockNumber;
        }
        
        // Get block details if transaction is mined
        let blockTimestamp = null;
        if (blockNumber) {
            const block = await provider.getBlock(blockNumber);
            blockTimestamp = new Date(block.timestamp * 1000).toISOString();
        }
        
        // Prepare response data
        const responseData = {
            status: status,
            txHash: txHash,
            blockNumber: blockNumber,
            gasUsed: gasUsed,
            gasPrice: tx.gasPrice ? tx.gasPrice.toString() : null,
            gasLimit: tx.gasLimit ? tx.gasLimit.toString() : null,
            confirmations: confirmations,
            from: tx.from,
            to: tx.to,
            value: tx.value ? tx.value.toString() : "0",
            nonce: tx.nonce,
            blockTimestamp: blockTimestamp,
            timestamp: new Date().toISOString()
        };
        
        console.error(`Transaction status: ${status}`);
        console.error(`Block number: ${blockNumber}`);
        console.error(`Confirmations: ${confirmations}`);
        
        // Output JSON response
        console.log(JSON.stringify(responseData));
        
    } catch (error) {
        console.error(`Error querying transaction: ${error.message}`);
        
        // Output error response
        const errorResponse = {
            status: "error",
            error: error.message,
            txHash: process.env.TX_HASH || "unknown",
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
