#!/usr/bin/env python3
"""
SuperPage Blockchain Service - Smart Contract Integration

This service handles publishing prediction results to the blockchain using HardHat
and Ethers.js integration. It provides secure on-chain storage of prediction scores
with cryptographic proofs for transparency and immutability.

Features:
- POST /publish endpoint for publishing prediction results
- Secure private key management via environment variables
- HardHat script integration via subprocess calls
- Transaction monitoring and status tracking
- Comprehensive error handling and logging
- Gas optimization and retry mechanisms

Author: SuperPage Team
"""

import os
import sys
import json
import asyncio
import subprocess
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from pathlib import Path

import structlog
import uvicorn
from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
import httpx

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# Environment variables
PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("SUPERPAGE_CONTRACT_ADDRESS")
NETWORK_URL = os.getenv("BLOCKCHAIN_NETWORK_URL", "http://localhost:8545")
HARDHAT_PROJECT_PATH = os.getenv("HARDHAT_PROJECT_PATH", "../contracts")
GAS_LIMIT = int(os.getenv("GAS_LIMIT", "500000"))
GAS_PRICE = os.getenv("GAS_PRICE", "20000000000")  # 20 gwei
PREDICTION_SERVICE_URL = os.getenv("PREDICTION_SERVICE_URL", "http://localhost:8002")

# Validate required environment variables
if not PRIVATE_KEY:
    logger.error("BLOCKCHAIN_PRIVATE_KEY environment variable is required")
    sys.exit(1)

if not CONTRACT_ADDRESS:
    logger.error("SUPERPAGE_CONTRACT_ADDRESS environment variable is required")
    sys.exit(1)


# Pydantic models
class PublishRequest(BaseModel):
    """Request model for publishing prediction results"""
    project_id: str = Field(
        ..., 
        description="Unique project identifier",
        min_length=1,
        max_length=100
    )
    score: float = Field(
        ..., 
        description="Prediction score (0.0 to 1.0)",
        ge=0.0,
        le=1.0
    )
    proof: str = Field(
        ..., 
        description="Cryptographic proof or hash of prediction data",
        min_length=1
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional metadata for the prediction"
    )
    
    @validator('project_id')
    def validate_project_id(cls, v):
        """Validate project ID format"""
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError("Project ID must contain only alphanumeric characters, hyphens, and underscores")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "defi-protocol-xyz",
                "score": 0.7234,
                "proof": "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
                "metadata": {
                    "model_version": "v1.0.0",
                    "timestamp": "2024-01-15T10:30:00Z",
                    "features_hash": "0xabcdef..."
                }
            }
        }


class TransactionStatus(BaseModel):
    """Transaction status information"""
    tx_hash: str = Field(..., description="Transaction hash")
    status: str = Field(..., description="Transaction status")
    block_number: Optional[int] = Field(None, description="Block number if confirmed")
    gas_used: Optional[int] = Field(None, description="Gas used for transaction")
    timestamp: str = Field(..., description="Transaction timestamp")


class PublishResponse(BaseModel):
    """Response model for publish endpoint"""
    success: bool = Field(..., description="Whether the publication was successful")
    transaction: TransactionStatus = Field(..., description="Transaction details")
    project_id: str = Field(..., description="Project ID that was published")
    score: float = Field(..., description="Published prediction score")
    contract_address: str = Field(..., description="Smart contract address")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "transaction": {
                    "tx_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                    "status": "confirmed",
                    "block_number": 12345678,
                    "gas_used": 85000,
                    "timestamp": "2024-01-15T10:30:00Z"
                },
                "project_id": "defi-protocol-xyz",
                "score": 0.7234,
                "contract_address": "0xabcdef1234567890abcdef1234567890abcdef12"
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    blockchain_connected: bool = Field(..., description="Blockchain connection status")
    contract_address: str = Field(..., description="Smart contract address")
    network_url: str = Field(..., description="Blockchain network URL")
    hardhat_available: bool = Field(..., description="HardHat availability")


# Create FastAPI app
app = FastAPI(
    title="SuperPage Blockchain Service",
    description="Smart contract integration for publishing prediction results on-chain",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BlockchainManager:
    """Manages blockchain interactions and HardHat script execution"""
    
    def __init__(self):
        self.hardhat_path = Path(HARDHAT_PROJECT_PATH)
        self.contract_address = CONTRACT_ADDRESS
        self.network_url = NETWORK_URL
        
    async def check_hardhat_availability(self) -> bool:
        """Check if HardHat is available and properly configured"""
        try:
            # Check if HardHat project exists
            if not self.hardhat_path.exists():
                logger.warning("HardHat project path not found", path=str(self.hardhat_path))
                return False
            
            # Check if package.json exists
            package_json = self.hardhat_path / "package.json"
            if not package_json.exists():
                logger.warning("package.json not found in HardHat project")
                return False
            
            # Test HardHat command
            result = await self._run_command(["npx", "hardhat", "--version"], cwd=self.hardhat_path)
            return result.returncode == 0
            
        except Exception as e:
            logger.error("Error checking HardHat availability", error=str(e))
            return False
    
    async def check_blockchain_connection(self) -> bool:
        """Check blockchain network connectivity"""
        try:
            # Use HardHat to check network connection
            result = await self._run_command([
                "npx", "hardhat", "run", "scripts/check-network.js", 
                "--network", "localhost"
            ], cwd=self.hardhat_path)
            
            return result.returncode == 0
            
        except Exception as e:
            logger.error("Error checking blockchain connection", error=str(e))
            return False
    
    async def publish_prediction(self, project_id: str, score: float, 
                               proof: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Publish prediction result to smart contract
        
        Args:
            project_id: Unique project identifier
            score: Prediction score (0.0 to 1.0)
            proof: Cryptographic proof
            metadata: Additional metadata
            
        Returns:
            Transaction result dictionary
            
        Raises:
            HTTPException: If publication fails
        """
        try:
            logger.info("Publishing prediction to blockchain", 
                       project_id=project_id, score=score)
            
            # Prepare script arguments
            script_args = [
                "npx", "hardhat", "run", "scripts/publish-prediction.js",
                "--network", "localhost"
            ]
            
            # Set environment variables for the script
            env = os.environ.copy()
            env.update({
                "PROJECT_ID": project_id,
                "PREDICTION_SCORE": str(score),
                "PROOF_HASH": proof,
                "METADATA": json.dumps(metadata),
                "CONTRACT_ADDRESS": self.contract_address,
                "PRIVATE_KEY": PRIVATE_KEY,
                "GAS_LIMIT": str(GAS_LIMIT),
                "GAS_PRICE": GAS_PRICE
            })
            
            # Execute HardHat script
            result = await self._run_command(script_args, cwd=self.hardhat_path, env=env)
            
            if result.returncode != 0:
                error_msg = result.stderr.decode() if result.stderr else "Unknown error"
                logger.error("HardHat script execution failed", 
                           error=error_msg, returncode=result.returncode)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Blockchain transaction failed: {error_msg}"
                )
            
            # Parse script output
            output = result.stdout.decode().strip()
            try:
                transaction_data = json.loads(output)
            except json.JSONDecodeError:
                logger.error("Failed to parse HardHat script output", output=output)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Invalid response from blockchain script"
                )
            
            logger.info("Prediction published successfully", 
                       tx_hash=transaction_data.get("txHash"))
            
            return transaction_data
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Unexpected error publishing prediction", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Blockchain service error: {str(e)}"
            )
    
    async def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """
        Get transaction status from blockchain
        
        Args:
            tx_hash: Transaction hash to check
            
        Returns:
            Transaction status information
        """
        try:
            script_args = [
                "npx", "hardhat", "run", "scripts/get-transaction.js",
                "--network", "localhost"
            ]
            
            env = os.environ.copy()
            env.update({
                "TX_HASH": tx_hash,
                "PRIVATE_KEY": PRIVATE_KEY
            })
            
            result = await self._run_command(script_args, cwd=self.hardhat_path, env=env)
            
            if result.returncode != 0:
                logger.error("Failed to get transaction status", tx_hash=tx_hash)
                return {"status": "unknown", "error": "Failed to query blockchain"}
            
            output = result.stdout.decode().strip()
            return json.loads(output)
            
        except Exception as e:
            logger.error("Error getting transaction status", error=str(e), tx_hash=tx_hash)
            return {"status": "error", "error": str(e)}
    
    async def _run_command(self, cmd: List[str], cwd: Optional[Path] = None, 
                          env: Optional[Dict[str, str]] = None) -> subprocess.CompletedProcess:
        """
        Run a command asynchronously
        
        Args:
            cmd: Command and arguments to run
            cwd: Working directory
            env: Environment variables
            
        Returns:
            Completed process result
        """
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=cwd,
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            return subprocess.CompletedProcess(
                args=cmd,
                returncode=process.returncode,
                stdout=stdout,
                stderr=stderr
            )
            
        except Exception as e:
            logger.error("Command execution failed", cmd=cmd, error=str(e))
            raise


# Global blockchain manager
blockchain_manager = BlockchainManager()


# API Endpoints
@app.post("/publish", response_model=PublishResponse)
async def publish_prediction(
    request: PublishRequest,
    background_tasks: BackgroundTasks
) -> PublishResponse:
    """
    Publish prediction result to blockchain smart contract
    
    This endpoint accepts prediction results and publishes them to the blockchain
    for permanent, transparent storage. The transaction is executed via HardHat
    scripts and returns the transaction hash and status.
    """
    logger.info("Received publish request", project_id=request.project_id, score=request.score)
    
    try:
        # Validate blockchain connectivity
        if not await blockchain_manager.check_blockchain_connection():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Blockchain network unavailable"
            )
        
        # Publish to blockchain
        transaction_data = await blockchain_manager.publish_prediction(
            project_id=request.project_id,
            score=request.score,
            proof=request.proof,
            metadata=request.metadata
        )
        
        # Create transaction status
        transaction_status = TransactionStatus(
            tx_hash=transaction_data["txHash"],
            status=transaction_data.get("status", "pending"),
            block_number=transaction_data.get("blockNumber"),
            gas_used=transaction_data.get("gasUsed"),
            timestamp=datetime.now().isoformat()
        )
        
        # Schedule background task to monitor transaction
        background_tasks.add_task(
            monitor_transaction, 
            transaction_data["txHash"], 
            request.project_id
        )
        
        logger.info("Prediction published successfully", 
                   project_id=request.project_id, 
                   tx_hash=transaction_data["txHash"])
        
        return PublishResponse(
            success=True,
            transaction=transaction_status,
            project_id=request.project_id,
            score=request.score,
            contract_address=CONTRACT_ADDRESS
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Publish request failed", error=str(e), project_id=request.project_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Publication failed: {str(e)}"
        )


async def monitor_transaction(tx_hash: str, project_id: str):
    """Background task to monitor transaction confirmation"""
    try:
        logger.info("Monitoring transaction", tx_hash=tx_hash, project_id=project_id)
        
        # Wait for transaction confirmation (simplified)
        await asyncio.sleep(30)  # Wait 30 seconds
        
        status_data = await blockchain_manager.get_transaction_status(tx_hash)
        
        if status_data.get("status") == "confirmed":
            logger.info("Transaction confirmed", tx_hash=tx_hash, project_id=project_id)
        else:
            logger.warning("Transaction not confirmed", tx_hash=tx_hash, status=status_data)
            
    except Exception as e:
        logger.error("Error monitoring transaction", error=str(e), tx_hash=tx_hash)


@app.get("/transaction/{tx_hash}")
async def get_transaction_status(tx_hash: str) -> Dict[str, Any]:
    """Get transaction status by hash"""
    try:
        status_data = await blockchain_manager.get_transaction_status(tx_hash)
        return status_data
    except Exception as e:
        logger.error("Error getting transaction status", error=str(e), tx_hash=tx_hash)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get transaction status: {str(e)}"
        )


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint"""
    blockchain_connected = await blockchain_manager.check_blockchain_connection()
    hardhat_available = await blockchain_manager.check_hardhat_availability()
    
    return HealthResponse(
        status="healthy" if blockchain_connected and hardhat_available else "degraded",
        blockchain_connected=blockchain_connected,
        contract_address=CONTRACT_ADDRESS,
        network_url=NETWORK_URL,
        hardhat_available=hardhat_available
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "SuperPage Blockchain Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "publish": "/publish",
            "transaction": "/transaction/{tx_hash}",
            "health": "/health"
        }
    }


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8003,
        reload=True,
        log_level="info"
    )
