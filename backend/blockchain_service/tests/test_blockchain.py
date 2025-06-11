#!/usr/bin/env python3
"""
Unit tests for SuperPage Blockchain Service

Tests cover:
- FastAPI endpoint functionality
- HardHat script integration via subprocess mocking
- Environment variable validation
- Error handling and edge cases
- Transaction status monitoring
- Smart contract interaction simulation

Author: SuperPage Team
"""

import os
import sys
import json
import asyncio
import subprocess
import unittest
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from hypothesis import given, strategies as st

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, BlockchainManager, blockchain_manager


class TestBlockchainManager(unittest.TestCase):
    """Test cases for BlockchainManager functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.manager = BlockchainManager()
        self.sample_project_id = "test-project-123"
        self.sample_score = 0.7234
        self.sample_proof = "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890"
        self.sample_metadata = {"model_version": "v1.0.0", "timestamp": "2024-01-15T10:30:00Z"}
    
    @patch('main.Path.exists')
    async def test_check_hardhat_availability_success(self, mock_exists):
        """Test successful HardHat availability check."""
        mock_exists.return_value = True
        
        with patch.object(self.manager, '_run_command') as mock_run:
            mock_run.return_value = Mock(returncode=0)
            
            result = await self.manager.check_hardhat_availability()
            self.assertTrue(result)
            
            # Verify HardHat version command was called
            mock_run.assert_called_with(
                ["npx", "hardhat", "--version"], 
                cwd=self.manager.hardhat_path
            )
    
    @patch('main.Path.exists')
    async def test_check_hardhat_availability_missing_project(self, mock_exists):
        """Test HardHat availability check with missing project."""
        mock_exists.return_value = False
        
        result = await self.manager.check_hardhat_availability()
        self.assertFalse(result)
    
    async def test_check_blockchain_connection_success(self):
        """Test successful blockchain connection check."""
        with patch.object(self.manager, '_run_command') as mock_run:
            mock_run.return_value = Mock(returncode=0)
            
            result = await self.manager.check_blockchain_connection()
            self.assertTrue(result)
            
            # Verify network check command was called
            mock_run.assert_called_with([
                "npx", "hardhat", "run", "scripts/check-network.js", 
                "--network", "localhost"
            ], cwd=self.manager.hardhat_path)
    
    async def test_check_blockchain_connection_failure(self):
        """Test blockchain connection check failure."""
        with patch.object(self.manager, '_run_command') as mock_run:
            mock_run.return_value = Mock(returncode=1)
            
            result = await self.manager.check_blockchain_connection()
            self.assertFalse(result)
    
    async def test_publish_prediction_success(self):
        """Test successful prediction publishing."""
        mock_transaction_data = {
            "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            "blockNumber": 12345678,
            "gasUsed": "85000",
            "status": "confirmed"
        }
        
        with patch.object(self.manager, '_run_command') as mock_run:
            mock_run.return_value = Mock(
                returncode=0,
                stdout=json.dumps(mock_transaction_data).encode()
            )
            
            result = await self.manager.publish_prediction(
                self.sample_project_id,
                self.sample_score,
                self.sample_proof,
                self.sample_metadata
            )
            
            self.assertEqual(result, mock_transaction_data)
            
            # Verify correct command was called
            mock_run.assert_called_once()
            args, kwargs = mock_run.call_args
            
            self.assertEqual(args[0][0:3], ["npx", "hardhat", "run"])
            self.assertIn("scripts/publish-prediction.js", args[0][3])
            self.assertEqual(kwargs["cwd"], self.manager.hardhat_path)
            
            # Verify environment variables were set
            env = kwargs["env"]
            self.assertEqual(env["PROJECT_ID"], self.sample_project_id)
            self.assertEqual(env["PREDICTION_SCORE"], str(self.sample_score))
            self.assertEqual(env["PROOF_HASH"], self.sample_proof)
            self.assertEqual(env["METADATA"], json.dumps(self.sample_metadata))
    
    async def test_publish_prediction_script_failure(self):
        """Test prediction publishing with script failure."""
        with patch.object(self.manager, '_run_command') as mock_run:
            mock_run.return_value = Mock(
                returncode=1,
                stderr=b"Script execution failed"
            )
            
            with pytest.raises(Exception):  # Should raise HTTPException
                await self.manager.publish_prediction(
                    self.sample_project_id,
                    self.sample_score,
                    self.sample_proof,
                    self.sample_metadata
                )
    
    async def test_publish_prediction_invalid_json_response(self):
        """Test prediction publishing with invalid JSON response."""
        with patch.object(self.manager, '_run_command') as mock_run:
            mock_run.return_value = Mock(
                returncode=0,
                stdout=b"Invalid JSON response"
            )
            
            with pytest.raises(Exception):  # Should raise HTTPException
                await self.manager.publish_prediction(
                    self.sample_project_id,
                    self.sample_score,
                    self.sample_proof,
                    self.sample_metadata
                )
    
    async def test_get_transaction_status_success(self):
        """Test successful transaction status retrieval."""
        tx_hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        mock_status_data = {
            "status": "confirmed",
            "blockNumber": 12345678,
            "gasUsed": "85000"
        }
        
        with patch.object(self.manager, '_run_command') as mock_run:
            mock_run.return_value = Mock(
                returncode=0,
                stdout=json.dumps(mock_status_data).encode()
            )
            
            result = await self.manager.get_transaction_status(tx_hash)
            self.assertEqual(result, mock_status_data)
            
            # Verify correct command was called
            mock_run.assert_called_once()
            args, kwargs = mock_run.call_args
            
            self.assertEqual(args[0][0:3], ["npx", "hardhat", "run"])
            self.assertIn("scripts/get-transaction.js", args[0][3])
            
            # Verify environment variables
            env = kwargs["env"]
            self.assertEqual(env["TX_HASH"], tx_hash)
    
    async def test_get_transaction_status_failure(self):
        """Test transaction status retrieval failure."""
        tx_hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        
        with patch.object(self.manager, '_run_command') as mock_run:
            mock_run.return_value = Mock(returncode=1)
            
            result = await self.manager.get_transaction_status(tx_hash)
            
            self.assertEqual(result["status"], "unknown")
            self.assertIn("error", result)
    
    async def test_run_command_success(self):
        """Test successful command execution."""
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            mock_process = AsyncMock()
            mock_process.communicate.return_value = (b"success", b"")
            mock_process.returncode = 0
            mock_subprocess.return_value = mock_process
            
            result = await self.manager._run_command(["echo", "test"])
            
            self.assertEqual(result.returncode, 0)
            self.assertEqual(result.stdout, b"success")
    
    async def test_run_command_failure(self):
        """Test command execution failure."""
        with patch('asyncio.create_subprocess_exec') as mock_subprocess:
            mock_subprocess.side_effect = Exception("Command failed")
            
            with pytest.raises(Exception):
                await self.manager._run_command(["invalid", "command"])


class TestBlockchainAPI(unittest.TestCase):
    """Test cases for FastAPI endpoints."""
    
    def setUp(self):
        """Set up test client."""
        self.client = TestClient(app)
        self.valid_publish_request = {
            "project_id": "test-project-123",
            "score": 0.7234,
            "proof": "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
            "metadata": {
                "model_version": "v1.0.0",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }
    
    def test_root_endpoint(self):
        """Test root endpoint."""
        response = self.client.get("/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["service"], "SuperPage Blockchain Service")
        self.assertIn("endpoints", data)
    
    @patch.object(blockchain_manager, 'check_blockchain_connection')
    @patch.object(blockchain_manager, 'check_hardhat_availability')
    async def test_health_endpoint(self, mock_hardhat, mock_blockchain):
        """Test health check endpoint."""
        mock_blockchain.return_value = True
        mock_hardhat.return_value = True
        
        response = self.client.get("/health")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)
        self.assertIn("blockchain_connected", data)
        self.assertIn("hardhat_available", data)
    
    @patch.object(blockchain_manager, 'check_blockchain_connection')
    @patch.object(blockchain_manager, 'publish_prediction')
    async def test_publish_endpoint_success(self, mock_publish, mock_connection):
        """Test successful publish request."""
        mock_connection.return_value = True
        mock_publish.return_value = {
            "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            "blockNumber": 12345678,
            "gasUsed": "85000",
            "status": "confirmed"
        }
        
        response = self.client.post("/publish", json=self.valid_publish_request)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertTrue(data["success"])
        self.assertIn("transaction", data)
        self.assertEqual(data["project_id"], self.valid_publish_request["project_id"])
        self.assertEqual(data["score"], self.valid_publish_request["score"])
    
    def test_publish_endpoint_invalid_project_id(self):
        """Test publish request with invalid project ID."""
        invalid_request = self.valid_publish_request.copy()
        invalid_request["project_id"] = ""  # Empty project ID
        
        response = self.client.post("/publish", json=invalid_request)
        self.assertEqual(response.status_code, 422)  # Validation error
    
    def test_publish_endpoint_invalid_score(self):
        """Test publish request with invalid score."""
        invalid_request = self.valid_publish_request.copy()
        invalid_request["score"] = 1.5  # Score > 1.0
        
        response = self.client.post("/publish", json=invalid_request)
        self.assertEqual(response.status_code, 422)  # Validation error
    
    def test_publish_endpoint_invalid_proof(self):
        """Test publish request with invalid proof."""
        invalid_request = self.valid_publish_request.copy()
        invalid_request["proof"] = ""  # Empty proof
        
        response = self.client.post("/publish", json=invalid_request)
        self.assertEqual(response.status_code, 422)  # Validation error
    
    @patch.object(blockchain_manager, 'check_blockchain_connection')
    async def test_publish_endpoint_blockchain_unavailable(self, mock_connection):
        """Test publish request when blockchain is unavailable."""
        mock_connection.return_value = False
        
        response = self.client.post("/publish", json=self.valid_publish_request)
        self.assertEqual(response.status_code, 503)  # Service unavailable
    
    @patch.object(blockchain_manager, 'get_transaction_status')
    async def test_get_transaction_endpoint_success(self, mock_get_status):
        """Test successful transaction status retrieval."""
        tx_hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        mock_status = {
            "status": "confirmed",
            "blockNumber": 12345678,
            "gasUsed": "85000"
        }
        mock_get_status.return_value = mock_status
        
        response = self.client.get(f"/transaction/{tx_hash}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data, mock_status)
    
    @patch.object(blockchain_manager, 'get_transaction_status')
    async def test_get_transaction_endpoint_failure(self, mock_get_status):
        """Test transaction status retrieval failure."""
        tx_hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        mock_get_status.side_effect = Exception("Transaction query failed")
        
        response = self.client.get(f"/transaction/{tx_hash}")
        self.assertEqual(response.status_code, 500)


class TestEnvironmentValidation(unittest.TestCase):
    """Test cases for environment variable validation."""
    
    def test_missing_private_key(self):
        """Test behavior when private key is missing."""
        with patch.dict(os.environ, {}, clear=True):
            with patch('sys.exit') as mock_exit:
                # Re-import to trigger validation
                import importlib
                import main
                importlib.reload(main)
                
                mock_exit.assert_called_with(1)
    
    def test_missing_contract_address(self):
        """Test behavior when contract address is missing."""
        with patch.dict(os.environ, {"BLOCKCHAIN_PRIVATE_KEY": "0x123"}, clear=True):
            with patch('sys.exit') as mock_exit:
                # Re-import to trigger validation
                import importlib
                import main
                importlib.reload(main)
                
                mock_exit.assert_called_with(1)


class TestHypothesisProperties(unittest.TestCase):
    """Property-based tests using Hypothesis."""
    
    @given(st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), whitelist_characters='-_')))
    def test_project_id_validation(self, project_id):
        """Test project ID validation with various inputs."""
        from main import PublishRequest
        
        try:
            request = PublishRequest(
                project_id=project_id,
                score=0.5,
                proof="0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890"
            )
            # If validation passes, project_id should be valid
            self.assertTrue(project_id.replace('-', '').replace('_', '').isalnum())
        except ValueError:
            # If validation fails, project_id should be invalid
            self.assertFalse(project_id.replace('-', '').replace('_', '').isalnum())
    
    @given(st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False))
    def test_score_validation_valid_range(self, score):
        """Test score validation with valid range."""
        from main import PublishRequest
        
        request = PublishRequest(
            project_id="test-project",
            score=score,
            proof="0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890"
        )
        self.assertEqual(request.score, score)
    
    @given(st.floats(min_value=-1000.0, max_value=1000.0, allow_nan=False, allow_infinity=False).filter(lambda x: x < 0.0 or x > 1.0))
    def test_score_validation_invalid_range(self, score):
        """Test score validation with invalid range."""
        from main import PublishRequest
        
        with pytest.raises(ValueError):
            PublishRequest(
                project_id="test-project",
                score=score,
                proof="0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890"
            )


if __name__ == '__main__':
    unittest.main()
