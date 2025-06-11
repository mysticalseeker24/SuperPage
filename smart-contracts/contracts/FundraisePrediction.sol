// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FundraisePrediction
 * @dev Smart contract for storing fundraising prediction results
 * 
 * This contract provides a simplified, gas-efficient way to store prediction
 * results with cryptographic proofs. Each prediction is immutably recorded
 * and can be retrieved by its unique identifier.
 * 
 * @author SuperPage Team
 * @notice This contract is designed for testnet use only (Sepolia)
 */
contract FundraisePrediction {
    
    /**
     * @dev Struct to store prediction data
     * @param submitter Address that submitted the prediction
     * @param score Prediction score (0-100 representing 0.0% to 100.0% success probability)
     * @param timestamp Block timestamp when the prediction was submitted
     * @param proof Cryptographic proof data for verification
     */
    struct Prediction {
        address submitter;      // Address that submitted the prediction
        uint8 score;           // Prediction score (0-100)
        uint256 timestamp;     // Block timestamp when submitted
        bytes proof;          // Cryptographic proof data
    }
    
    /// @dev Mapping from prediction ID to prediction data
    mapping(bytes32 => Prediction) public predictions;
    
    /// @dev Total number of predictions submitted
    uint256 public totalPredictions;
    
    /**
     * @dev Event emitted when a new prediction is submitted
     * @param id Unique identifier for the prediction
     * @param submitter Address that submitted the prediction
     * @param score Prediction score (0-100)
     * @param timestamp Block timestamp
     */
    event PredictionSubmitted(
        bytes32 indexed id,
        address indexed submitter,
        uint8 score,
        uint256 timestamp
    );
    
    /**
     * @dev Submit a new prediction result
     * @param id Unique identifier for the prediction (e.g., keccak256 of project data)
     * @param score Prediction score (0-100 representing success probability percentage)
     * @param proof Cryptographic proof data for verification
     * 
     * Requirements:
     * - Prediction ID must not already exist
     * - Score must be between 0 and 100
     * - Proof data must not be empty
     * 
     * Emits a {PredictionSubmitted} event.
     */
    function submitPrediction(
        bytes32 id, 
        uint8 score, 
        bytes calldata proof
    ) public {
        // Validate inputs
        require(id != bytes32(0), "FundraisePrediction: prediction ID cannot be zero");
        require(score <= 100, "FundraisePrediction: score must be between 0 and 100");
        require(proof.length > 0, "FundraisePrediction: proof cannot be empty");
        require(predictions[id].submitter == address(0), "FundraisePrediction: prediction already exists");
        
        // Store the prediction
        predictions[id] = Prediction({
            submitter: msg.sender,
            score: score,
            timestamp: block.timestamp,
            proof: proof
        });
        
        // Increment total predictions counter
        totalPredictions++;
        
        // Emit event
        emit PredictionSubmitted(id, msg.sender, score, block.timestamp);
    }
    
    /**
     * @dev Get prediction data by ID
     * @param id Unique identifier for the prediction
     * @return prediction The complete prediction struct
     * 
     * Requirements:
     * - Prediction must exist for the given ID
     */
    function getPrediction(bytes32 id) public view returns (Prediction memory prediction) {
        require(predictions[id].submitter != address(0), "FundraisePrediction: prediction does not exist");
        return predictions[id];
    }
    
    /**
     * @dev Check if a prediction exists for the given ID
     * @param id Unique identifier to check
     * @return exists True if prediction exists, false otherwise
     */
    function predictionExists(bytes32 id) public view returns (bool exists) {
        return predictions[id].submitter != address(0);
    }
    
    /**
     * @dev Get the total number of predictions submitted
     * @return count Total predictions count
     */
    function getTotalPredictions() public view returns (uint256 count) {
        return totalPredictions;
    }
}
