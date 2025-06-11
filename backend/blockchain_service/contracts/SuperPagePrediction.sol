// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SuperPagePrediction
 * @dev Smart contract for storing and managing fundraising prediction results
 * 
 * This contract provides a decentralized, transparent way to store prediction
 * results from the SuperPage ML model. Each prediction is immutably recorded
 * with cryptographic proofs for verification.
 * 
 * Features:
 * - Immutable prediction storage
 * - Cryptographic proof verification
 * - Access control for authorized publishers
 * - Event emission for transparency
 * - Gas-optimized operations
 */

contract SuperPagePrediction {
    
    // Struct to store prediction data
    struct Prediction {
        uint256 score;          // Prediction score (scaled by 1e18 for precision)
        bytes32 proofHash;      // Cryptographic proof hash
        string metadata;        // Additional metadata (JSON string)
        uint256 timestamp;      // Block timestamp when published
        address publisher;      // Address that published the prediction
        bool exists;           // Flag to check if prediction exists
    }
    
    // State variables
    mapping(string => Prediction) public predictions;
    mapping(address => bool) public authorizedPublishers;
    address public owner;
    uint256 public totalPredictions;
    
    // Events
    event PredictionPublished(
        string indexed projectId,
        address indexed publisher,
        uint256 score,
        uint256 predictionId
    );
    
    event PublisherAuthorized(address indexed publisher, bool authorized);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "SuperPagePrediction: caller is not the owner");
        _;
    }
    
    modifier onlyAuthorizedPublisher() {
        require(
            authorizedPublishers[msg.sender] || msg.sender == owner,
            "SuperPagePrediction: caller is not authorized to publish"
        );
        _;
    }
    
    modifier validProjectId(string memory projectId) {
        require(bytes(projectId).length > 0, "SuperPagePrediction: project ID cannot be empty");
        require(bytes(projectId).length <= 100, "SuperPagePrediction: project ID too long");
        _;
    }
    
    modifier validScore(uint256 score) {
        require(score <= 1e18, "SuperPagePrediction: score cannot exceed 1.0 (1e18)");
        _;
    }
    
    /**
     * @dev Constructor sets the contract deployer as the owner
     */
    constructor() {
        owner = msg.sender;
        authorizedPublishers[msg.sender] = true;
        emit PublisherAuthorized(msg.sender, true);
    }
    
    /**
     * @dev Publish a new prediction result
     * @param projectId Unique identifier for the project
     * @param score Prediction score (0 to 1e18, representing 0.0 to 1.0)
     * @param proofHash Cryptographic hash of the prediction proof
     * @param metadata Additional metadata as JSON string
     * @return predictionId Unique ID for this prediction
     */
    function publishPrediction(
        string memory projectId,
        uint256 score,
        bytes32 proofHash,
        string memory metadata
    ) 
        external 
        onlyAuthorizedPublisher
        validProjectId(projectId)
        validScore(score)
        returns (uint256 predictionId)
    {
        // Check if prediction already exists for this project
        require(
            !predictions[projectId].exists,
            "SuperPagePrediction: prediction already exists for this project"
        );
        
        // Validate proof hash
        require(proofHash != bytes32(0), "SuperPagePrediction: proof hash cannot be empty");
        
        // Create new prediction
        predictions[projectId] = Prediction({
            score: score,
            proofHash: proofHash,
            metadata: metadata,
            timestamp: block.timestamp,
            publisher: msg.sender,
            exists: true
        });
        
        // Increment total predictions counter
        totalPredictions++;
        predictionId = totalPredictions;
        
        // Emit event
        emit PredictionPublished(projectId, msg.sender, score, predictionId);
        
        return predictionId;
    }
    
    /**
     * @dev Get prediction data for a project
     * @param projectId Project identifier to query
     * @return score Prediction score
     * @return proofHash Cryptographic proof hash
     * @return metadata Additional metadata
     * @return timestamp When the prediction was published
     * @return publisher Address that published the prediction
     */
    function getPrediction(string memory projectId)
        external
        view
        validProjectId(projectId)
        returns (
            uint256 score,
            bytes32 proofHash,
            string memory metadata,
            uint256 timestamp,
            address publisher
        )
    {
        Prediction memory prediction = predictions[projectId];
        require(prediction.exists, "SuperPagePrediction: prediction does not exist");
        
        return (
            prediction.score,
            prediction.proofHash,
            prediction.metadata,
            prediction.timestamp,
            prediction.publisher
        );
    }
    
    /**
     * @dev Check if a prediction exists for a project
     * @param projectId Project identifier to check
     * @return exists Whether the prediction exists
     */
    function predictionExists(string memory projectId) 
        external 
        view 
        validProjectId(projectId)
        returns (bool exists) 
    {
        return predictions[projectId].exists;
    }
    
    /**
     * @dev Authorize or deauthorize a publisher
     * @param publisher Address to authorize/deauthorize
     * @param authorized Whether to authorize (true) or deauthorize (false)
     */
    function setAuthorizedPublisher(address publisher, bool authorized) 
        external 
        onlyOwner 
    {
        require(publisher != address(0), "SuperPagePrediction: invalid publisher address");
        authorizedPublishers[publisher] = authorized;
        emit PublisherAuthorized(publisher, authorized);
    }
    
    /**
     * @dev Transfer ownership of the contract
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "SuperPagePrediction: new owner is the zero address");
        require(newOwner != owner, "SuperPagePrediction: new owner is the same as current owner");
        
        address previousOwner = owner;
        owner = newOwner;
        
        // Authorize new owner as publisher
        authorizedPublishers[newOwner] = true;
        emit PublisherAuthorized(newOwner, true);
        
        emit OwnershipTransferred(previousOwner, newOwner);
    }
    
    /**
     * @dev Get the current owner of the contract
     * @return Current owner address
     */
    function getOwner() external view returns (address) {
        return owner;
    }
    
    /**
     * @dev Get total number of predictions published
     * @return Total predictions count
     */
    function getTotalPredictions() external view returns (uint256) {
        return totalPredictions;
    }
    
    /**
     * @dev Check if an address is authorized to publish
     * @param publisher Address to check
     * @return Whether the address is authorized
     */
    function isAuthorizedPublisher(address publisher) external view returns (bool) {
        return authorizedPublishers[publisher];
    }
}
