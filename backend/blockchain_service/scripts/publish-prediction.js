/**
 * SuperPage Blockchain Service - Publish Prediction Script
 * 
 * HardHat script to publish prediction results to the SuperPage smart contract.
 * This script is called by the Python blockchain service via subprocess.
 * 
 * Environment Variables Required:
 * - PROJECT_ID: Unique project identifier
 * - PREDICTION_SCORE: Prediction score (0.0 to 1.0)
 * - PROOF_HASH: Cryptographic proof hash
 * - METADATA: JSON string of additional metadata
 * - CONTRACT_ADDRESS: Smart contract address
 * - PRIVATE_KEY: Private key for signing transactions
 * - GAS_LIMIT: Gas limit for transaction
 * - GAS_PRICE: Gas price in wei
 */

const { ethers } = require("hardhat");

// SuperPage contract ABI (simplified for prediction publishing)
const SUPERPAGE_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "projectId", "type": "string"},
            {"internalType": "uint256", "name": "score", "type": "uint256"},
            {"internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
            {"internalType": "string", "name": "metadata", "type": "string"}
        ],
        "name": "publishPrediction",
        "outputs": [
            {"internalType": "uint256", "name": "predictionId", "type": "uint256"}
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "projectId", "type": "string"}
        ],
        "name": "getPrediction",
        "outputs": [
            {"internalType": "uint256", "name": "score", "type": "uint256"},
            {"internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
            {"internalType": "string", "name": "metadata", "type": "string"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "publisher", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "string", "name": "projectId", "type": "string"},
            {"indexed": true, "internalType": "address", "name": "publisher", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "score", "type": "uint256"},
            {"indexed": false, "internalType": "uint256", "name": "predictionId", "type": "uint256"}
        ],
        "name": "PredictionPublished",
        "type": "event"
    }
];

async function main() {
    try {
        // Validate required environment variables
        const requiredEnvVars = [
            'PROJECT_ID', 'PREDICTION_SCORE', 'PROOF_HASH', 
            'METADATA', 'CONTRACT_ADDRESS', 'PRIVATE_KEY'
        ];
        
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }
        
        // Extract environment variables
        const projectId = process.env.PROJECT_ID;
        const predictionScore = parseFloat(process.env.PREDICTION_SCORE);
        const proofHash = process.env.PROOF_HASH;
        const metadata = process.env.METADATA;
        const contractAddress = process.env.CONTRACT_ADDRESS;
        const privateKey = process.env.PRIVATE_KEY;
        const gasLimit = parseInt(process.env.GAS_LIMIT || "500000");
        const gasPrice = process.env.GAS_PRICE || "20000000000"; // 20 gwei
        
        // Validate inputs
        if (predictionScore < 0 || predictionScore > 1) {
            throw new Error(`Invalid prediction score: ${predictionScore}. Must be between 0 and 1.`);
        }
        
        if (!ethers.utils.isAddress(contractAddress)) {
            throw new Error(`Invalid contract address: ${contractAddress}`);
        }
        
        // Validate proof hash format (should be 32 bytes hex)
        if (!proofHash.startsWith('0x') || proofHash.length !== 66) {
            throw new Error(`Invalid proof hash format: ${proofHash}. Must be 32 bytes hex string.`);
        }
        
        // Validate metadata is valid JSON
        let parsedMetadata;
        try {
            parsedMetadata = JSON.parse(metadata);
        } catch (e) {
            throw new Error(`Invalid metadata JSON: ${metadata}`);
        }
        
        // Create wallet from private key
        const wallet = new ethers.Wallet(privateKey);

        // Connect to provider (use hardhat's configured provider)
        const provider = ethers.provider;
        const signer = wallet.connect(provider);
        
        // Check network connection
        try {
            await provider.getNetwork();
        } catch (e) {
            throw new Error(`Failed to connect to blockchain network: ${e.message}`);
        }
        
        // Check account balance
        const balance = await signer.getBalance();
        if (balance.isZero()) {
            throw new Error("Insufficient balance for transaction");
        }

        // Get current nonce to handle pending transactions
        const nonce = await signer.getTransactionCount("pending");
        console.error(`Using nonce: ${nonce}`);
        
        // Create contract instance
        const contract = new ethers.Contract(contractAddress, SUPERPAGE_ABI, signer);
        
        // Convert score to uint256 (multiply by 10^18 for precision)
        const scoreWei = ethers.utils.parseEther(predictionScore.toString());
        
        // Convert proof hash to bytes32
        const proofBytes32 = ethers.utils.hexZeroPad(proofHash, 32);
        
        // Get current gas price from network and add buffer for replacement transactions
        let networkGasPrice;
        try {
            networkGasPrice = await provider.getGasPrice();
            console.error(`Current network gas price: ${networkGasPrice.toString()} wei`);
        } catch (e) {
            console.error(`Failed to get network gas price, using configured value: ${e.message}`);
            networkGasPrice = ethers.utils.parseUnits(gasPrice, "wei");
        }

        // Use higher of configured gas price or network gas price + 20% buffer
        const configuredGasPrice = ethers.utils.parseUnits(gasPrice, "wei");
        const bufferedNetworkPrice = networkGasPrice.mul(120).div(100); // Add 20% buffer
        const finalGasPrice = configuredGasPrice.gt(bufferedNetworkPrice) ? configuredGasPrice : bufferedNetworkPrice;

        console.error(`Using gas price: ${finalGasPrice.toString()} wei (${ethers.utils.formatUnits(finalGasPrice, "gwei")} gwei)`);

        // Prepare transaction options
        const txOptions = {
            gasLimit: gasLimit,
            gasPrice: finalGasPrice,
            nonce: nonce
        };
        
        console.error(`Publishing prediction for project: ${projectId}`);
        console.error(`Score: ${predictionScore} (${scoreWei.toString()} wei)`);
        console.error(`Proof: ${proofHash}`);
        console.error(`Contract: ${contractAddress}`);
        
        // Call the publishPrediction function
        const tx = await contract.publishPrediction(
            projectId,
            scoreWei,
            proofBytes32,
            metadata,
            txOptions
        );
        
        console.error(`Transaction submitted: ${tx.hash}`);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        console.error(`Transaction confirmed in block: ${receipt.blockNumber}`);
        console.error(`Gas used: ${receipt.gasUsed.toString()}`);
        
        // Extract prediction ID from events
        let predictionId = null;
        try {
            if (receipt.events && receipt.events.length > 0) {
                const event = receipt.events.find(e => e.event === 'PredictionPublished');
                if (event && event.args && event.args.predictionId) {
                    predictionId = event.args.predictionId.toString();
                }
            }
            // If no events found, try parsing logs directly
            if (!predictionId && receipt.logs && receipt.logs.length > 0) {
                console.error(`Found ${receipt.logs.length} logs, but no parsed events. This is normal.`);
                // For now, we'll use the totalPredictions as a fallback
                predictionId = "unknown";
            }
        } catch (eventError) {
            console.error(`Error parsing events: ${eventError.message}`);
            predictionId = "unknown";
        }
        
        // Prepare response data
        const responseData = {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            status: "confirmed",
            predictionId: predictionId,
            projectId: projectId,
            score: predictionScore,
            timestamp: new Date().toISOString(),
            contractAddress: contractAddress
        };
        
        // Output JSON response for Python service to parse
        console.log(JSON.stringify(responseData));
        
    } catch (error) {
        console.error(`Error publishing prediction: ${error.message}`);
        
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
