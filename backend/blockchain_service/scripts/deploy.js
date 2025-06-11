/**
 * SuperPage Blockchain Service - Smart Contract Deployment Script
 * 
 * HardHat script to deploy the SuperPagePrediction smart contract.
 * This script handles deployment to various networks and outputs the contract address.
 */

const { ethers } = require("hardhat");

async function main() {
    try {
        console.log("Starting SuperPagePrediction contract deployment...");
        
        // Get the contract factory
        const SuperPagePrediction = await ethers.getContractFactory("SuperPagePrediction");
        
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contract with account:", deployer.address);
        
        // Check deployer balance
        const balance = await deployer.getBalance();
        console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
        
        if (balance.isZero()) {
            throw new Error("Deployer account has insufficient balance");
        }
        
        // Deploy the contract
        console.log("Deploying SuperPagePrediction contract...");
        const contract = await SuperPagePrediction.deploy();
        
        // Wait for deployment to complete
        await contract.deployed();
        
        console.log("SuperPagePrediction deployed to:", contract.address);
        console.log("Transaction hash:", contract.deployTransaction.hash);
        
        // Wait for a few confirmations
        console.log("Waiting for confirmations...");
        await contract.deployTransaction.wait(2);
        
        // Verify deployment
        const owner = await contract.getOwner();
        const totalPredictions = await contract.getTotalPredictions();
        const isAuthorized = await contract.isAuthorizedPublisher(deployer.address);
        
        console.log("Deployment verification:");
        console.log("- Contract owner:", owner);
        console.log("- Total predictions:", totalPredictions.toString());
        console.log("- Deployer authorized:", isAuthorized);
        
        // Output deployment information
        const deploymentInfo = {
            contractAddress: contract.address,
            deployerAddress: deployer.address,
            transactionHash: contract.deployTransaction.hash,
            blockNumber: contract.deployTransaction.blockNumber,
            gasUsed: contract.deployTransaction.gasLimit.toString(),
            gasPrice: contract.deployTransaction.gasPrice.toString(),
            network: (await ethers.provider.getNetwork()).name,
            chainId: (await ethers.provider.getNetwork()).chainId,
            timestamp: new Date().toISOString()
        };
        
        console.log("\nDeployment Summary:");
        console.log(JSON.stringify(deploymentInfo, null, 2));
        
        // Save deployment info to file
        const fs = require('fs');
        const deploymentFile = `deployment-${Date.now()}.json`;
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        console.log(`Deployment info saved to: ${deploymentFile}`);
        
        console.log("\nNext steps:");
        console.log("1. Set SUPERPAGE_CONTRACT_ADDRESS environment variable:");
        console.log(`   export SUPERPAGE_CONTRACT_ADDRESS=${contract.address}`);
        console.log("2. Update your .env file with the contract address");
        console.log("3. Test the contract with a sample prediction");
        
    } catch (error) {
        console.error("Deployment failed:", error.message);
        
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.error("Please ensure the deployer account has sufficient ETH for deployment");
        } else if (error.code === 'NETWORK_ERROR') {
            console.error("Please check your network connection and RPC URL");
        }
        
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
