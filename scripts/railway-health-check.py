#!/usr/bin/env python3
"""
Railway Health Check Script for SuperPage
Run this after deploying all services to Railway
"""

import asyncio
import aiohttp
import json
import sys
from typing import Dict, List, Tuple
from datetime import datetime

# Railway service URLs - UPDATE THESE WITH YOUR ACTUAL RAILWAY URLs
RAILWAY_SERVICES = {
    "ingestion": "https://your-ingestion-service.up.railway.app",
    "preprocessing": "https://your-preprocessing-service.up.railway.app", 
    "prediction": "https://your-prediction-service.up.railway.app",
    "blockchain": "https://your-blockchain-service.up.railway.app"
}

# Instructions for updating URLs
INSTRUCTIONS = """
🔧 SETUP INSTRUCTIONS:
1. Deploy all services to Railway
2. Get the Railway URLs for each service
3. Update the RAILWAY_SERVICES dictionary in this script
4. Run: python scripts/railway-health-check.py

Example Railway URLs:
- https://superpage-ingestion-production.up.railway.app
- https://superpage-preprocessing-production.up.railway.app
- https://superpage-prediction-production.up.railway.app
- https://superpage-blockchain-production.up.railway.app
"""

async def check_service_health(session: aiohttp.ClientSession, name: str, url: str) -> Tuple[str, bool, Dict]:
    """Check health of a single service"""
    try:
        print(f"🔍 Checking {name} at {url}")
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

def check_urls_configured():
    """Check if Railway URLs are properly configured"""
    default_urls = [
        "https://your-ingestion-service.up.railway.app",
        "https://your-preprocessing-service.up.railway.app",
        "https://your-prediction-service.up.railway.app", 
        "https://your-blockchain-service.up.railway.app"
    ]
    
    for service_url in RAILWAY_SERVICES.values():
        if service_url in default_urls:
            return False
    return True

async def main():
    """Main health check function"""
    print("🚀 SuperPage Railway Health Check")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    # Check if URLs are configured
    if not check_urls_configured():
        print("❌ Railway URLs not configured!")
        print(INSTRUCTIONS)
        return False
    
    print("📋 Configured Services:")
    for name, url in RAILWAY_SERVICES.items():
        print(f"  {name:15} | {url}")
    print()
    
    async with aiohttp.ClientSession() as session:
        # Check all service health endpoints
        print("📊 Health Check Results:")
        print("-" * 50)
        
        health_tasks = [
            check_service_health(session, name, url) 
            for name, url in RAILWAY_SERVICES.items()
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
            print("❌ Some services are unhealthy. Check Railway logs and configuration.")
            print("\n🔧 Troubleshooting:")
            print("1. Check Railway service logs")
            print("2. Verify environment variables are set")
            print("3. Ensure services are using Railway-specific Dockerfiles")
            print("4. Check Railway service status in dashboard")
            return False
        
        # Test specific endpoints if all are healthy
        print("🧪 Endpoint Testing:")
        print("-" * 30)
        
        # Test prediction service
        if "prediction" in RAILWAY_SERVICES:
            print("Testing prediction endpoint...")
            pred_success, pred_data = await test_prediction_endpoint(session, RAILWAY_SERVICES["prediction"])
            if pred_success:
                print("✅ Prediction test successful")
                print(f"   Score: {pred_data.get('score', 'N/A')}")
                print(f"   Explanations: {len(pred_data.get('explanations', []))} features")
            else:
                print(f"❌ Prediction test failed: {pred_data.get('error', 'Unknown')}")
            print()
        
        print("🎉 Railway deployment verification completed!")
        print("\n📋 Next Steps:")
        print("1. Update frontend API URLs to use Railway endpoints")
        print("2. Test full user flow from frontend")
        print("3. Monitor Railway service logs")
        print("4. Set up Railway monitoring/alerts")
        return True

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Health check cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Health check failed: {e}")
        sys.exit(1)
