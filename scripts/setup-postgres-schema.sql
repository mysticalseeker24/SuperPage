-- SuperPage PostgreSQL Schema Setup
-- Creates tables for all SuperPage services

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ingestion Service Tables
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(255) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    extracted_data JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster project lookups
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_project_id ON ingestion_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_created_at ON ingestion_jobs(created_at);

-- Preprocessing Service Tables
CREATE TABLE IF NOT EXISTS processed_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(255) NOT NULL,
    features JSONB NOT NULL,
    feature_names JSONB NOT NULL,
    processing_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster feature lookups
CREATE INDEX IF NOT EXISTS idx_processed_features_project_id ON processed_features(project_id);
CREATE INDEX IF NOT EXISTS idx_processed_features_created_at ON processed_features(created_at);

-- Prediction Service Tables
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(255) NOT NULL,
    prediction_score DECIMAL(5,4) NOT NULL CHECK (prediction_score >= 0 AND prediction_score <= 1),
    confidence_score DECIMAL(5,4),
    shap_explanations JSONB,
    model_version VARCHAR(50),
    features_used JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster prediction lookups
CREATE INDEX IF NOT EXISTS idx_predictions_project_id ON predictions(project_id);
CREATE INDEX IF NOT EXISTS idx_predictions_score ON predictions(prediction_score);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at);

-- Blockchain Service Tables
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(255) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    contract_address VARCHAR(42) NOT NULL,
    prediction_score DECIMAL(5,4) NOT NULL,
    proof_hash VARCHAR(66),
    block_number BIGINT,
    gas_used INTEGER,
    gas_price BIGINT,
    transaction_status VARCHAR(20) DEFAULT 'pending',
    network VARCHAR(20) DEFAULT 'sepolia',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster blockchain lookups
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_project_id ON blockchain_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_status ON blockchain_transactions(transaction_status);
CREATE INDEX IF NOT EXISTS idx_blockchain_created_at ON blockchain_transactions(created_at);

-- Projects Master Table (unified view)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    description TEXT,
    url TEXT,
    category VARCHAR(100),
    team_size INTEGER,
    team_experience DECIMAL(3,1),
    previous_funding BIGINT DEFAULT 0,
    traction INTEGER DEFAULT 0,
    wallet_address VARCHAR(42),
    status VARCHAR(50) DEFAULT 'active',
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create comprehensive indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_project_id ON projects(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_team_experience ON projects(team_experience);
CREATE INDEX IF NOT EXISTS idx_projects_previous_funding ON projects(previous_funding);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_ingestion_jobs_updated_at 
    BEFORE UPDATE ON ingestion_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processed_features_updated_at 
    BEFORE UPDATE ON processed_features 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO projects (project_id, name, description, category, team_size, team_experience, url) 
VALUES 
    ('sample-defi-project', 'Sample DeFi Protocol', 'A sample decentralized finance project for testing', 'DeFi', 5, 3.5, 'https://sample-defi.com'),
    ('sample-nft-project', 'Sample NFT Marketplace', 'A sample NFT marketplace project for testing', 'NFT', 8, 4.2, 'https://sample-nft.com'),
    ('sample-dao-project', 'Sample DAO Platform', 'A sample DAO governance platform for testing', 'DAO', 12, 5.0, 'https://sample-dao.com')
ON CONFLICT (project_id) DO NOTHING;

-- Create views for easier querying
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.project_id,
    p.name,
    p.category,
    p.team_experience,
    p.previous_funding,
    ij.status as ingestion_status,
    ij.created_at as ingested_at,
    pf.created_at as processed_at,
    pr.prediction_score,
    pr.created_at as predicted_at,
    bt.transaction_hash,
    bt.transaction_status as blockchain_status,
    bt.created_at as published_at
FROM projects p
LEFT JOIN ingestion_jobs ij ON p.project_id = ij.project_id
LEFT JOIN processed_features pf ON p.project_id = pf.project_id
LEFT JOIN predictions pr ON p.project_id = pr.project_id
LEFT JOIN blockchain_transactions bt ON p.project_id = bt.project_id
ORDER BY p.created_at DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO superpage_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO superpage_user;

-- Display table information
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%ingestion%' 
OR tablename LIKE '%processed%' 
OR tablename LIKE '%predictions%' 
OR tablename LIKE '%blockchain%' 
OR tablename = 'projects'
ORDER BY tablename;
