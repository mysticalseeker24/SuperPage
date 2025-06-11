/**
 * SuperPage Smart Contracts - FundraisePrediction Tests
 * 
 * Comprehensive test suite for the FundraisePrediction smart contract.
 * Tests deployment, prediction submission, retrieval, and edge cases.
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FundraisePrediction", function () {
    let FundraisePrediction;
    let contract;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    // Test data
    const testPredictionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-project-1"));
    const testScore = 75;
    const testProof = ethers.utils.toUtf8Bytes("proof-data-hash-12345");

    beforeEach(async function () {
        // Get the ContractFactory and Signers
        FundraisePrediction = await ethers.getContractFactory("FundraisePrediction");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Deploy a fresh contract for each test
        contract = await FundraisePrediction.deploy();
        await contract.deployed();
    });

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(contract.address).to.not.equal(ethers.constants.AddressZero);
        });

        it("Should initialize with zero total predictions", async function () {
            expect(await contract.getTotalPredictions()).to.equal(0);
        });

        it("Should have correct contract interface", async function () {
            // Check that all required functions exist
            expect(typeof contract.submitPrediction).to.equal("function");
            expect(typeof contract.getPrediction).to.equal("function");
            expect(typeof contract.predictionExists).to.equal("function");
            expect(typeof contract.getTotalPredictions).to.equal("function");
        });
    });

    describe("submitPrediction", function () {
        it("Should submit a prediction successfully", async function () {
            await expect(contract.submitPrediction(testPredictionId, testScore, testProof))
                .to.emit(contract, "PredictionSubmitted")
                .withArgs(testPredictionId, owner.address, testScore, await getBlockTimestamp());

            expect(await contract.getTotalPredictions()).to.equal(1);
            expect(await contract.predictionExists(testPredictionId)).to.be.true;
        });

        it("Should store prediction data correctly", async function () {
            await contract.submitPrediction(testPredictionId, testScore, testProof);

            const prediction = await contract.getPrediction(testPredictionId);
            expect(prediction.submitter).to.equal(owner.address);
            expect(prediction.score).to.equal(testScore);
            expect(prediction.proof).to.equal(ethers.utils.hexlify(testProof));
            expect(prediction.timestamp).to.be.gt(0);
        });

        it("Should allow different users to submit predictions", async function () {
            const predictionId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-project-2"));
            const score2 = 50;
            const proof2 = ethers.utils.toUtf8Bytes("proof-data-hash-67890");

            // Submit from owner
            await contract.submitPrediction(testPredictionId, testScore, testProof);

            // Submit from addr1
            await contract.connect(addr1).submitPrediction(predictionId2, score2, proof2);

            expect(await contract.getTotalPredictions()).to.equal(2);

            const prediction1 = await contract.getPrediction(testPredictionId);
            const prediction2 = await contract.getPrediction(predictionId2);

            expect(prediction1.submitter).to.equal(owner.address);
            expect(prediction2.submitter).to.equal(addr1.address);
        });

        it("Should reject zero prediction ID", async function () {
            const zeroPredictionId = ethers.constants.HashZero;
            
            await expect(
                contract.submitPrediction(zeroPredictionId, testScore, testProof)
            ).to.be.revertedWith("FundraisePrediction: prediction ID cannot be zero");
        });

        it("Should reject score greater than 100", async function () {
            await expect(
                contract.submitPrediction(testPredictionId, 101, testProof)
            ).to.be.revertedWith("FundraisePrediction: score must be between 0 and 100");
        });

        it("Should accept score of 0", async function () {
            await expect(contract.submitPrediction(testPredictionId, 0, testProof))
                .to.emit(contract, "PredictionSubmitted")
                .withArgs(testPredictionId, owner.address, 0, await getBlockTimestamp());
        });

        it("Should accept score of 100", async function () {
            await expect(contract.submitPrediction(testPredictionId, 100, testProof))
                .to.emit(contract, "PredictionSubmitted")
                .withArgs(testPredictionId, owner.address, 100, await getBlockTimestamp());
        });

        it("Should reject empty proof", async function () {
            const emptyProof = [];
            
            await expect(
                contract.submitPrediction(testPredictionId, testScore, emptyProof)
            ).to.be.revertedWith("FundraisePrediction: proof cannot be empty");
        });

        it("Should reject duplicate prediction IDs", async function () {
            // Submit first prediction
            await contract.submitPrediction(testPredictionId, testScore, testProof);

            // Try to submit with same ID
            await expect(
                contract.submitPrediction(testPredictionId, 50, testProof)
            ).to.be.revertedWith("FundraisePrediction: prediction already exists");
        });
    });

    describe("getPrediction", function () {
        beforeEach(async function () {
            await contract.submitPrediction(testPredictionId, testScore, testProof);
        });

        it("Should return correct prediction data", async function () {
            const prediction = await contract.getPrediction(testPredictionId);
            
            expect(prediction.submitter).to.equal(owner.address);
            expect(prediction.score).to.equal(testScore);
            expect(prediction.proof).to.equal(ethers.utils.hexlify(testProof));
            expect(prediction.timestamp).to.be.gt(0);
        });

        it("Should revert for non-existent prediction", async function () {
            const nonExistentId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("non-existent"));
            
            await expect(
                contract.getPrediction(nonExistentId)
            ).to.be.revertedWith("FundraisePrediction: prediction does not exist");
        });
    });

    describe("predictionExists", function () {
        it("Should return false for non-existent prediction", async function () {
            expect(await contract.predictionExists(testPredictionId)).to.be.false;
        });

        it("Should return true for existing prediction", async function () {
            await contract.submitPrediction(testPredictionId, testScore, testProof);
            expect(await contract.predictionExists(testPredictionId)).to.be.true;
        });
    });

    describe("getTotalPredictions", function () {
        it("Should return correct count after multiple submissions", async function () {
            expect(await contract.getTotalPredictions()).to.equal(0);

            await contract.submitPrediction(testPredictionId, testScore, testProof);
            expect(await contract.getTotalPredictions()).to.equal(1);

            const predictionId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-project-2"));
            await contract.submitPrediction(predictionId2, 50, testProof);
            expect(await contract.getTotalPredictions()).to.equal(2);
        });
    });

    describe("Events", function () {
        it("Should emit PredictionSubmitted event with correct parameters", async function () {
            const tx = await contract.submitPrediction(testPredictionId, testScore, testProof);
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt.blockNumber);

            await expect(tx)
                .to.emit(contract, "PredictionSubmitted")
                .withArgs(testPredictionId, owner.address, testScore, block.timestamp);
        });
    });

    describe("Gas Optimization", function () {
        it("Should use reasonable gas for prediction submission", async function () {
            const tx = await contract.submitPrediction(testPredictionId, testScore, testProof);
            const receipt = await tx.wait();

            // Gas usage should be reasonable (less than 120k gas)
            expect(receipt.gasUsed.toNumber()).to.be.lessThan(120000);
            console.log(`Gas used for prediction submission: ${receipt.gasUsed.toNumber()}`);
        });
    });

    // Helper function to get current block timestamp
    async function getBlockTimestamp() {
        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber + 1);
        return block.timestamp;
    }
});
