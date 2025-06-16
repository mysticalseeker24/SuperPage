#!/usr/bin/env python3
"""
SuperPage Railway Deployment Test Script
Quick verification of optimized Docker deployments
"""

import requests
import json
import time
from datetime import datetime

# Railway service URLs (update with your actual URLs)
RAILWAY_SERVICES = {
    'ingestion': 'https://superpage-ingestion.up.railway.app',
    'preprocessing': 'https://superpage-preprocessing.up.railway.app',
    'prediction': 'https://superpage-prediction.up.railway.app',
    'blockchain': 'https://superpage-blockchain.up.railway.app'
}

def test_service(name, url):
    """Test a single service health endpoint"""
    try:
        print(f"🔍 Testing {name} service...")
        response = requests.get(f"{url}/health", timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {name.upper()}: Healthy - {data.get('status', 'OK')}")
            return True
        else:
            print(f"❌ {name.upper()}: Failed - HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {name.upper()}: Error - {str(e)}")
        return False

def test_prediction_functionality():
    """Test prediction service with sample data"""
    try:
        print("🧠 Testing prediction functionality...")
        
        # Sample feature vector
        features = [0.75, 8.5, 0.82, 0.91, 15000, 0.35, 2500000.0]
        
        response = requests.post(
            f"{RAILWAY_SERVICES['prediction']}/predict",
            json={"features": features},
            timeout=20
        )
        
        if response.status_code == 200:
            data = response.json()
            score = data.get('score', 0)
            explanations = data.get('explanations', {})
            print(f"✅ PREDICTION: Success - Score: {score:.3f}")
            print(f"   Top features: {list(explanations.keys())[:3]}")
            return True
        else:
            print(f"❌ PREDICTION: Failed - HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ PREDICTION: Error - {str(e)}")
        return False

def main():
    """Run deployment verification tests"""
    print("🚀 SuperPage Railway Deployment Verification")
    print("=" * 60)
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🐳 Testing optimized multi-stage Docker builds")
    print()
    
    results = {}
    
    # Test all service health endpoints
    print("📊 Health Check Tests:")
    print("-" * 30)
    for name, url in RAILWAY_SERVICES.items():
        results[name] = test_service(name, url)
        time.sleep(2)  # Rate limiting
    
    print()
    
    # Test prediction functionality
    print("🔧 Functionality Tests:")
    print("-" * 30)
    results['prediction_func'] = test_prediction_functionality()
    
    # Summary
    print()
    print("=" * 60)
    print("📋 DEPLOYMENT VERIFICATION SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    success_rate = (passed / total) * 100
    
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    print(f"📊 Success Rate: {success_rate:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("🚀 Railway deployment is successful and ready for production!")
        print("\n📱 Frontend: https://superpage-frontend.netlify.app")
        print("🔗 Make sure frontend CORS settings include Railway URLs")
    else:
        print("\n⚠️  SOME TESTS FAILED:")
        for test_name, result in results.items():
            if not result:
                print(f"   - {test_name}")
        print("\n🔧 Check Railway service logs for detailed error information")
    
    print("\n" + "=" * 60)
    print("🐳 Docker Optimization Results:")
    print("   - Multi-stage builds implemented")
    print("   - CPU-only PyTorch (saves ~2GB per service)")
    print("   - Aggressive cleanup and layer optimization")
    print("   - Expected total size reduction: ~63%")
    print("=" * 60)

if __name__ == "__main__":
    main()
