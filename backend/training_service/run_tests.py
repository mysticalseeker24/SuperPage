#!/usr/bin/env python3
"""
SuperPage Training Service - Test Runner

Comprehensive test runner for the training service with detailed reporting
and coverage analysis.

Usage:
    python run_tests.py                    # Run all tests
    python run_tests.py --unit             # Run only unit tests
    python run_tests.py --integration      # Run only integration tests
    python run_tests.py --coverage         # Run with coverage report
    python run_tests.py --verbose          # Verbose output

Author: SuperPage Team
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path


def run_command(cmd, description=""):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"Running: {description or cmd}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=False)
        print(f"\n✅ {description or 'Command'} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {description or 'Command'} failed with exit code {e.returncode}")
        return False


def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description="SuperPage Training Service Test Runner")
    parser.add_argument("--unit", action="store_true", help="Run only unit tests")
    parser.add_argument("--integration", action="store_true", help="Run only integration tests")
    parser.add_argument("--coverage", action="store_true", help="Generate coverage report")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")
    parser.add_argument("--fast", action="store_true", help="Skip slow tests")
    parser.add_argument("--gpu", action="store_true", help="Include GPU tests")
    
    args = parser.parse_args()
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print("SuperPage Training Service - Test Suite")
    print("=" * 60)
    print(f"Working directory: {os.getcwd()}")
    print(f"Python version: {sys.version}")
    
    # Check if required packages are installed
    try:
        import pytest
        import torch
        import flwr
        print(f"PyTorch version: {torch.__version__}")
        print(f"Flower version: {flwr.__version__}")
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("Please install requirements: pip install -r requirements.txt")
        return False
    
    # Build pytest command
    pytest_cmd = ["python", "-m", "pytest"]
    
    # Add verbosity
    if args.verbose:
        pytest_cmd.append("-vv")
    else:
        pytest_cmd.append("-v")
    
    # Add test selection
    if args.unit:
        pytest_cmd.extend(["-m", "unit"])
    elif args.integration:
        pytest_cmd.extend(["-m", "integration"])
    
    # Add coverage
    if args.coverage:
        pytest_cmd.extend([
            "--cov=train_federated",
            "--cov-report=term-missing",
            "--cov-report=html:htmlcov",
            "--cov-fail-under=80"
        ])
    
    # Skip slow tests
    if args.fast:
        pytest_cmd.extend(["-m", "not slow"])
    
    # Include GPU tests
    if args.gpu:
        pytest_cmd.extend(["-m", "gpu"])
    else:
        pytest_cmd.extend(["-m", "not gpu"])
    
    # Add other options
    pytest_cmd.extend([
        "--tb=short",
        "--color=yes",
        "--durations=10"
    ])
    
    # Run tests
    cmd = " ".join(pytest_cmd)
    success = run_command(cmd, "Running test suite")
    
    if success and args.coverage:
        print("\n📊 Coverage Report Generated:")
        print("  - Terminal: See above output")
        print("  - HTML: Open htmlcov/index.html in your browser")
    
    # Run additional checks
    if success:
        print("\n🔍 Running additional code quality checks...")
        
        # Check for Python syntax errors
        flake8_cmd = "python -m flake8 train_federated.py --max-line-length=100 --ignore=E203,W503"
        run_command(flake8_cmd, "Checking code style with flake8")
        
        # Check for type hints (if mypy is available)
        try:
            import mypy
            mypy_cmd = "python -m mypy train_federated.py --ignore-missing-imports"
            run_command(mypy_cmd, "Checking type hints with mypy")
        except ImportError:
            print("⚠️  MyPy not available, skipping type checking")
    
    # Summary
    print("\n" + "="*60)
    if success:
        print("🎉 All tests completed successfully!")
        print("\nNext steps:")
        print("  1. Review test coverage report")
        print("  2. Run training: python train_federated.py")
        print("  3. Check model output in models/latest/")
    else:
        print("❌ Some tests failed. Please review the output above.")
        return False
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
