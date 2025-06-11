/**
 * SuperPage Smart Contracts - Sepolia Deployment Script
 * 
 * HardHat script to deploy the FundraisePrediction smart contract to Sepolia testnet.
 * This script reads environment variables for secure deployment and outputs the contract address.
 * 
 * Required Environment Variables:
 * - PRIVATE_KEY: Private key of the deployer account
 * - SEPOLIA_URL: Sepolia RPC endpoint URL (or INFURA_PROJECT_ID)
 * 
 * Usage:
 *   npx hardhat run scripts/deploySepolia.js --network sepolia
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log("🚀 Starting FundraisePrediction contract deployment to Sepolia...");
        console.log("=" .repeat(60));
        
        // Validate environment variables
        const privateKey = process.env.PRIVATE_KEY || process.env.BLOCKCHAIN_PRIVATE_KEY;
        const sepoliaUrl = process.env.SEPOLIA_URL || process.env.SEPOLIA_RPC_URL;
        
        if (!privateKey) {
            throw new Error("PRIVATE_KEY environment variable is required for deployment");
        }
        
        if (!sepoliaUrl && !process.env.INFURA_PROJECT_ID) {
            console.warn("⚠️  Warning: No SEPOLIA_URL or INFURA_PROJECT_ID found. Using default Infura endpoint.");
        }
        
        // Get network information
        const network = await ethers.provider.getNetwork();
        console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
        
        // Validate we're on Sepolia
        if (network.chainId !== 11155111) {
            throw new Error(`Expected Sepolia testnet (Chain ID: 11155111), but got Chain ID: ${network.chainId}`);
        }
        
        // Get the contract factory
        const FundraisePrediction = await ethers.getContractFactory("FundraisePrediction");
        
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log(`👤 Deployer address: ${deployer.address}`);
        
        // Check deployer balance
        const balance = await deployer.getBalance();
        const balanceEth = ethers.utils.formatEther(balance);
        console.log(`💰 Deployer balance: ${balanceEth} ETH`);
        
        if (balance.isZero()) {
            throw new Error("❌ Deployer account has insufficient balance. Please fund the account with Sepolia ETH.");
        }
        
        if (parseFloat(balanceEth) < 0.01) {
            console.warn("⚠️  Warning: Low balance. Consider adding more Sepolia ETH for future transactions.");
        }
        
        // Estimate gas for deployment
        const deploymentData = FundraisePrediction.getDeployTransaction();
        const gasEstimate = await ethers.provider.estimateGas(deploymentData);
        const gasPrice = await ethers.provider.getGasPrice();
        const estimatedCost = gasEstimate.mul(gasPrice);
        
        console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
        console.log(`💸 Estimated cost: ${ethers.utils.formatEther(estimatedCost)} ETH`);
        
        // Deploy the contract
        console.log("\n🔨 Deploying FundraisePrediction contract...");
        const contract = await FundraisePrediction.deploy();
        
        console.log(`📝 Transaction hash: ${contract.deployTransaction.hash}`);
        console.log("⏳ Waiting for deployment confirmation...");
        
        // Wait for deployment to complete
        await contract.deployed();
        
        console.log(`✅ FundraisePrediction deployed to: ${contract.address}`);
        
        // Wait for additional confirmations
        console.log("⏳ Waiting for block confirmations...");
        const receipt = await contract.deployTransaction.wait(2);
        
        console.log(`🎯 Deployment confirmed in block: ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
        
        // Verify deployment by calling a view function
        console.log("\n🔍 Verifying deployment...");
        const totalPredictions = await contract.getTotalPredictions();
        console.log(`📊 Initial total predictions: ${totalPredictions.toString()}`);
        
        // Create deployment summary
        const deploymentInfo = {
            contractName: "FundraisePrediction",
            contractAddress: contract.address,
            deployerAddress: deployer.address,
            transactionHash: contract.deployTransaction.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: contract.deployTransaction.gasPrice.toString(),
            deploymentCost: ethers.utils.formatEther(receipt.gasUsed.mul(contract.deployTransaction.gasPrice)),
            network: network.name,
            chainId: network.chainId,
            timestamp: new Date().toISOString(),
            sepoliaExplorerUrl: `https://sepolia.etherscan.io/address/${contract.address}`
        };
        
        console.log("\n📋 Deployment Summary:");
        console.log("=" .repeat(60));
        console.log(JSON.stringify(deploymentInfo, null, 2));
        
        // Save deployment info to file
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const deploymentFile = path.join(deploymentsDir, `sepolia-deployment-${Date.now()}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        console.log(`💾 Deployment info saved to: ${deploymentFile}`);
        
        // Output environment variable for easy copy-paste
        console.log("\n🔧 Environment Variables:");
        console.log("=" .repeat(60));
        console.log(`export FUNDRAISE_PREDICTION_CONTRACT_ADDRESS=${contract.address}`);
        console.log(`export SEPOLIA_CONTRACT_ADDRESS=${contract.address}`);
        
        console.log("\n🎉 Deployment completed successfully!");
        console.log(`🌐 View on Sepolia Etherscan: ${deploymentInfo.sepoliaExplorerUrl}`);
        
        console.log("\n📝 Next Steps:");
        console.log("1. Update your .env file with the contract address");
        console.log("2. Verify the contract on Etherscan (optional):");
        console.log(`   npx hardhat verify --network sepolia ${contract.address}`);
        console.log("3. Test the contract with sample predictions");
        
    } catch (error) {
        console.error("\n❌ Deployment failed:");
        console.error("=" .repeat(60));
        console.error(`Error: ${error.message}`);
        
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.error("\n💡 Solution: Fund your deployer account with Sepolia ETH");
            console.error("   - Get Sepolia ETH from: https://sepoliafaucet.com/");
            console.error("   - Or use: https://faucets.chain.link/sepolia");
        } else if (error.code === 'NETWORK_ERROR') {
            console.error("\n💡 Solution: Check your network configuration");
            console.error("   - Verify SEPOLIA_URL or INFURA_PROJECT_ID");
            console.error("   - Check your internet connection");
        } else if (error.message.includes('Chain ID')) {
            console.error("\n💡 Solution: Ensure you're deploying to Sepolia testnet");
            console.error("   - Use: npx hardhat run scripts/deploySepolia.js --network sepolia");
        }
        
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment script error:", error);
        process.exit(1);
    });
