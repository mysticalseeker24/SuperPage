#!/usr/bin/env python3
"""
SuperPage Deployment Verification Script
Checks all services are running correctly after deployment
"""

import asyncio
import aiohttp
import json
import sys
from typing import Dict, List, Tuple
from datetime import datetime

# Service URLs - automatically detect environment
import os

# Check if we're running in CI/CD or local environment
if os.getenv('GITHUB_ACTIONS'):
    # Production URLs for CI/CD
    SERVICES = {
        "ingestion": "https://superpage-ingestion.onrender.com",
        "preprocessing": "https://superpage-preprocessing.onrender.com",
        "prediction": "https://superpage-prediction.onrender.com",
        "blockchain": "https://superpage-blockchain.onrender.com"
    }
else:
    # Local development URLs
    SERVICES = {
        "ingestion": "http://localhost:8010",
        "preprocessing": "http://localhost:8001",
        "prediction": "http://localhost:8002",
        "blockchain": "http://localhost:8003"
    }

async def check_service_health(session: aiohttp.ClientSession, name: str, url: str) -> Tuple[str, bool, Dict]:
    """Check health of a single service"""
    try:
        async with session.get(f"{url}/health", timeout=30) as response:
            if response.status == 200:
                data = await response.json()
                return name, True, data
            else:
                return name, False, {"error": f"HTTP {response.status}"}
    except Exception as e:
        return name, False, {"error": str(e)}

async def test_prediction_endpoint(session: aiohttp.ClientSession, url: str) -> Tuple[bool, Dict]:
    """Test prediction service with sample data"""
    try:
        # Sample feature vector for testing
        test_features = [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]
        
        payload = {"features": test_features}
        
        async with session.post(f"{url}/predict", json=payload, timeout=60) as response:
            if response.status == 200:
                data = await response.json()
                return True, data
            else:
                return False, {"error": f"HTTP {response.status}"}
    except Exception as e:
        return False, {"error": str(e)}

async def test_ingestion_endpoint(session: aiohttp.ClientSession, url: str) -> Tuple[bool, Dict]:
    """Test ingestion service with sample data"""
    try:
        async with session.get(f"{url}/web3-sites", timeout=30) as response:
            if response.status == 200:
                data = await response.json()
                return True, {"sites_count": data.get("total_count", 0)}
            else:
                return False, {"error": f"HTTP {response.status}"}
    except Exception as e:
        return False, {"error": str(e)}

async def main():
    """Main verification function"""
    print("🔍 SuperPage Deployment Verification")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    async with aiohttp.ClientSession() as session:
        # Check all service health endpoints
        print("📊 Health Check Results:")
        print("-" * 30)
        
        health_tasks = [
            check_service_health(session, name, url) 
            for name, url in SERVICES.items()
        ]
        
        health_results = await asyncio.gather(*health_tasks)
        
        all_healthy = True
        for name, is_healthy, data in health_results:
            status = "✅ HEALTHY" if is_healthy else "❌ UNHEALTHY"
            print(f"{name:15} | {status}")
            
            if is_healthy:
                # Print key health info
                if "service" in data:
                    print(f"                | Service: {data['service']}")
                if "version" in data:
                    print(f"                | Version: {data['version']}")
                if "model_loaded" in data:
                    print(f"                | Model: {'✅ Loaded' if data['model_loaded'] else '❌ Not Loaded'}")
            else:
                print(f"                | Error: {data.get('error', 'Unknown')}")
                all_healthy = False
            print()
        
        if not all_healthy:
            print("❌ Some services are unhealthy. Check logs and configuration.")
            return False
        
        # Test specific endpoints
        print("🧪 Endpoint Testing:")
        print("-" * 30)
        
        # Test prediction service
        if "prediction" in SERVICES:
            print("Testing prediction endpoint...")
            pred_success, pred_data = await test_prediction_endpoint(session, SERVICES["prediction"])
            if pred_success:
                print("✅ Prediction test successful")
                print(f"   Score: {pred_data.get('score', 'N/A')}")
                print(f"   Explanations: {len(pred_data.get('explanations', []))} features")
            else:
                print(f"❌ Prediction test failed: {pred_data.get('error', 'Unknown')}")
            print()
        
        # Test ingestion service
        if "ingestion" in SERVICES:
            print("Testing ingestion endpoint...")
            ing_success, ing_data = await test_ingestion_endpoint(session, SERVICES["ingestion"])
            if ing_success:
                print("✅ Ingestion test successful")
                print(f"   Web3 sites configured: {ing_data.get('sites_count', 0)}")
            else:
                print(f"❌ Ingestion test failed: {ing_data.get('error', 'Unknown')}")
            print()
        
        print("🎉 Deployment verification completed!")
        return True

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Verification cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Verification failed: {e}")
        sys.exit(1)
