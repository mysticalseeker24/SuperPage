/**
 * Check account balance on Sepolia testnet
 */

const { ethers } = require("hardhat");

async function main() {
    try {
        console.log("Checking account balance on Sepolia...");
        
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("Account address:", deployer.address);
        
        // Check balance
        const balance = await deployer.getBalance();
        console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
        
        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("Network:", network.name);
        console.log("Chain ID:", network.chainId);
        
        if (balance.isZero()) {
            console.log("\n❌ Account has no ETH!");
            console.log("You need Sepolia testnet ETH to deploy contracts.");
            console.log("Get free Sepolia ETH from these faucets:");
            console.log("- https://sepoliafaucet.com/");
            console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
            console.log("- https://sepolia-faucet.pk910.de/");
        } else {
            console.log("\n✅ Account has sufficient balance for deployment!");
        }
        
    } catch (error) {
        console.error("Error checking balance:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
