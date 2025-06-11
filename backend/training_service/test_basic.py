#!/usr/bin/env python3
"""
Basic functionality test for SuperPage Training Service
"""

import sys
import torch
import numpy as np
import pandas as pd
from pathlib import Path

# Test imports
try:
    from train_federated import FundraisingPredictor, DataProcessor, create_data_loaders
    print("✅ All imports successful")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Test model instantiation
try:
    model = FundraisingPredictor()
    print(f"✅ Model created: {model.__class__.__name__}")
    print(f"   Input size: {model.input_size}")
    print(f"   Hidden sizes: {model.hidden_sizes}")
except Exception as e:
    print(f"❌ Model creation failed: {e}")
    sys.exit(1)

# Test model forward pass
try:
    dummy_input = torch.randn(4, 7)  # Batch of 4, 7 features
    output = model(dummy_input)
    print(f"✅ Forward pass successful")
    print(f"   Input shape: {dummy_input.shape}")
    print(f"   Output shape: {output.shape}")
    print(f"   Output range: [{output.min().item():.4f}, {output.max().item():.4f}]")
except Exception as e:
    print(f"❌ Forward pass failed: {e}")
    sys.exit(1)

# Test data loaders with dummy data
try:
    X_dummy = np.random.randn(50, 7)
    y_dummy = np.random.randint(0, 2, 50)
    
    train_loader, val_loader = create_data_loaders(X_dummy, y_dummy, batch_size=8)
    print(f"✅ Data loaders created")
    print(f"   Train batches: {len(train_loader)}")
    print(f"   Val batches: {len(val_loader)}")
    
    # Test one batch
    for batch_X, batch_y in train_loader:
        print(f"   Batch X shape: {batch_X.shape}")
        print(f"   Batch y shape: {batch_y.shape}")
        break
        
except Exception as e:
    print(f"❌ Data loader test failed: {e}")
    sys.exit(1)

# Test dataset path
dataset_path = "../../Dataset/dummy_dataset_aligned.csv"
if Path(dataset_path).exists():
    print(f"✅ Dataset found at: {dataset_path}")
    try:
        df = pd.read_csv(dataset_path)
        print(f"   Dataset shape: {df.shape}")
        print(f"   Columns: {list(df.columns)}")
    except Exception as e:
        print(f"⚠️  Dataset exists but can't be loaded: {e}")
else:
    print(f"⚠️  Dataset not found at: {dataset_path}")
    print("   This is expected if running from different directory")

print("\n🎉 All basic tests passed! Training service is ready.")
print("\nNext steps:")
print("1. Ensure dataset is available")
print("2. Run: python train_federated.py --rounds 2 --batch-size 16")
print("3. Check models/latest/ for saved model")
