// MongoDB Initialization Script for SuperPage
// This script sets up the database and collections for the SuperPage system

// Switch to the superpage database
db = db.getSiblingDB('superpage');

// Create collections with proper indexes
db.createCollection('raw_data');
db.createCollection('processed_features');
db.createCollection('predictions');
db.createCollection('blockchain_transactions');

// Create indexes for better performance
db.raw_data.createIndex({ "project_id": 1 }, { unique: true });
db.raw_data.createIndex({ "created_at": 1 });
db.raw_data.createIndex({ "url": 1 });

db.processed_features.createIndex({ "project_id": 1 }, { unique: true });
db.processed_features.createIndex({ "created_at": 1 });
db.processed_features.createIndex({ "processing_status": 1 });

db.predictions.createIndex({ "project_id": 1 });
db.predictions.createIndex({ "created_at": 1 });
db.predictions.createIndex({ "score": 1 });

db.blockchain_transactions.createIndex({ "project_id": 1 });
db.blockchain_transactions.createIndex({ "tx_hash": 1 }, { unique: true });
db.blockchain_transactions.createIndex({ "created_at": 1 });
db.blockchain_transactions.createIndex({ "status": 1 });

// Insert sample data for testing
db.raw_data.insertOne({
    project_id: "sample-project-1",
    url: "https://github.com/ethereum/ethereum-org-website",
    title: "Ethereum.org Website",
    description: "The official Ethereum website and documentation portal",
    content: "Ethereum is a decentralized platform that runs smart contracts...",
    metadata: {
        github_stars: 4500,
        contributors: 250,
        last_commit: new Date(),
        language: "TypeScript"
    },
    created_at: new Date(),
    status: "completed"
});

db.processed_features.insertOne({
    project_id: "sample-project-1",
    features: {
        TeamExperience: 8.5,
        PitchQuality: 0.92,
        TokenomicsScore: 0.85,
        Traction: 4500,
        CommunityEngagement: 0.78,
        PreviousFunding: 0,
        RaiseSuccessProb: 0.88
    },
    feature_vector: [8.5, 0.92, 0.85, 4500, 0.78, 0, 0.88],
    processing_metadata: {
        tokenizer_model: "distilbert-base-uncased",
        scaler_type: "minmax",
        processing_time_ms: 1250
    },
    created_at: new Date(),
    processing_status: "completed"
});

print("SuperPage database initialized successfully!");
print("Collections created: raw_data, processed_features, predictions, blockchain_transactions");
print("Indexes created for optimal query performance");
print("Sample data inserted for testing");
