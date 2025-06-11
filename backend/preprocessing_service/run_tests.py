#!/usr/bin/env python3
"""
Test runner for SuperPage Preprocessing Service

Usage:
    python run_tests.py              # Run all tests
    python run_tests.py --unit       # Run only unit tests
    python run_tests.py --integration # Run only integration tests
    python run_tests.py --coverage   # Run with coverage report
    python run_tests.py --ml         # Run ML-specific tests
"""

import sys
import subprocess
import argparse


def run_tests(test_type="all", coverage=False):
    """Run tests with specified options"""
    
    cmd = ["python", "-m", "pytest"]
    
    if coverage:
        cmd.extend(["--cov=.", "--cov-report=term-missing", "--cov-report=html"])
    
    if test_type == "unit":
        cmd.extend(["-m", "not integration and not ml"])
    elif test_type == "integration":
        cmd.extend(["-m", "integration"])
    elif test_type == "ml":
        cmd.extend(["-m", "ml"])
    
    cmd.extend(["-v", "tests/"])
    
    print(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description="Run SuperPage Preprocessing Service tests")
    parser.add_argument("--unit", action="store_true", help="Run only unit tests")
    parser.add_argument("--integration", action="store_true", help="Run only integration tests")
    parser.add_argument("--ml", action="store_true", help="Run only ML-related tests")
    parser.add_argument("--coverage", action="store_true", help="Generate coverage report")
    
    args = parser.parse_args()
    
    if args.unit:
        test_type = "unit"
    elif args.integration:
        test_type = "integration"
    elif args.ml:
        test_type = "ml"
    else:
        test_type = "all"
    
    exit_code = run_tests(test_type, args.coverage)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
