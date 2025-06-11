# SuperPage Training Service

The training service implements federated learning for fundraising success prediction using Flower and PyTorch. It trains a neural network on the SuperPage dataset to predict Web3 project fundraising outcomes while preserving privacy through federated learning.

## Features

- **Federated Learning**: Flower-based federated learning with multiple client simulation
- **PyTorch Neural Network**: Deep learning model for tabular regression/classification
- **Privacy-First**: Decentralized training without sharing raw data
- **Model Persistence**: Automatic model saving to `/models/latest`
- **Comprehensive Testing**: Unit tests with 80%+ coverage
- **Docker Support**: Both CPU and CUDA-enabled containers
- **Command-Line Interface**: Flexible training parameters

## Architecture

### Neural Network Model
```
Input (7 features) → Dense(64) → ReLU → Dropout(0.2) →
Dense(32) → ReLU → Dropout(0.2) →
Dense(16) → ReLU → Dropout(0.2) →
Dense(1) → Sigmoid → Output (probability)
```

### Input Features
1. **TeamExperience** - Years of combined team experience
2. **PitchQuality** - NLP-scored pitch quality (0-1)
3. **TokenomicsScore** - Tokenomics fairness score (0-1)
4. **Traction** - Normalized user engagement/GitHub stars
5. **CommunityEngagement** - Social media metrics (0-1)
6. **PreviousFunding** - Historical funding amount (USD)
7. **RaiseSuccessProb** - Computed success probability (0-1)

### Target
- **SuccessLabel** - Binary success indicator (0/1)

## Quick Start

### Local Development

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Run Training**
```bash
python train_federated.py --rounds 5 --lr 0.001 --batch-size 32
```

3. **Run Tests**
```bash
python run_tests.py --coverage
```

### Docker Deployment

**CPU Version:**
```bash
docker build -t superpage-training .
docker run -v $(pwd)/models:/app/models superpage-training
```

**CUDA Version:**
```bash
docker build --target cuda -t superpage-training-gpu .
docker run --gpus all -v $(pwd)/models:/app/models superpage-training-gpu
```

## Command Line Options

```bash
python train_federated.py [OPTIONS]

Options:
  --rounds INT        Number of federated learning rounds (default: 3)
  --lr FLOAT         Learning rate (default: 0.001)
  --batch-size INT   Batch size for training (default: 32)
  --clients INT      Number of federated clients to simulate (default: 3)
  --data-path STR    Path to training dataset (default: ../../Dataset/dummy_dataset_aligned.csv)
```

## Federated Learning Process

1. **Data Loading**: Load and preprocess SuperPage dataset
2. **Client Simulation**: Split data among multiple federated clients
3. **Local Training**: Each client trains on local data slice
4. **Weight Aggregation**: FedAvg algorithm combines client updates
5. **Global Model**: Updated global model distributed to clients
6. **Iteration**: Repeat for specified number of rounds
7. **Model Saving**: Final model saved to `/models/latest`

## Model Performance

The model is evaluated on multiple metrics:
- **Accuracy**: Overall prediction accuracy
- **Precision**: True positive rate
- **Recall**: Sensitivity to positive cases
- **F1-Score**: Harmonic mean of precision and recall
- **Loss**: Binary cross-entropy loss

## File Structure

```
backend/training_service/
├── train_federated.py      # Main federated learning implementation
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container configuration
├── README.md              # This file
├── pytest.ini            # Test configuration
├── run_tests.py           # Test runner script
└── tests/
    └── test_training.py   # Comprehensive unit tests
```

## Testing

The service includes comprehensive unit tests covering:

- **Model Architecture**: PyTorch model instantiation and forward pass
- **Data Processing**: Loading, preprocessing, and federated splits
- **Federated Learning**: Client simulation and weight aggregation
- **Model Persistence**: Saving and loading trained models
- **Edge Cases**: Error handling and boundary conditions

### Running Tests

```bash
# All tests with coverage
python run_tests.py --coverage

# Unit tests only
python run_tests.py --unit

# Fast tests (skip slow ones)
python run_tests.py --fast

# Verbose output
python run_tests.py --verbose
```

## Environment Variables

- `FLOWER_MODE`: Set to "server" or "client" for distributed deployment
- `CUDA_VISIBLE_DEVICES`: GPU selection for CUDA containers
- `PYTHONPATH`: Include parent directories for imports

## Integration with SuperPage

The training service integrates with other SuperPage components:

1. **Data Source**: Uses datasets from `Dataset/` directory
2. **Model Output**: Saves models to `models/latest/` for inference service
3. **Preprocessing**: Compatible with preprocessing service feature format
4. **Monitoring**: Structured logging for integration with monitoring stack

## Development

### Code Quality
- **Black**: Code formatting
- **Flake8**: Style checking
- **MyPy**: Type checking
- **Pytest**: Testing framework

### Adding New Features
1. Implement feature in `train_federated.py`
2. Add corresponding unit tests in `tests/test_training.py`
3. Update documentation
4. Run full test suite: `python run_tests.py --coverage`

## Troubleshooting

### Common Issues

**CUDA Out of Memory:**
```bash
# Reduce batch size
python train_federated.py --batch-size 16

# Use CPU
docker build --target base -t superpage-training-cpu .
```

**Dataset Not Found:**
```bash
# Specify custom path
python train_federated.py --data-path /path/to/dataset.csv
```

**Low Model Performance:**
```bash
# Increase training rounds
python train_federated.py --rounds 10

# Adjust learning rate
python train_federated.py --lr 0.0001
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `python run_tests.py`
5. Submit a pull request

## License

This project is part of the SuperPage ecosystem. See the main repository LICENSE file for details.
