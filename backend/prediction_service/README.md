# SuperPage Prediction Service

The prediction service provides real-time fundraising success predictions using the trained federated learning model with SHAP explanations for interpretability. It loads the PyTorch model at startup and serves predictions via a FastAPI REST API.

## Features

- **Model Loading**: Automatic loading of trained PyTorch model and scaler at startup
- **Real-time Predictions**: Fast inference with thread-safe model serving
- **SHAP Explanations**: Top 3 feature importance explanations for each prediction
- **FastAPI Integration**: Modern async API with automatic documentation
- **Comprehensive Testing**: Unit tests with 80%+ coverage including SHAP validation
- **Production Ready**: Docker support with health checks and monitoring
- **Error Handling**: Robust error handling with detailed logging

## API Endpoints

### POST /predict
Make a fundraising success prediction with feature explanations.

**Request:**
```json
{
  "features": [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]
}
```

**Response:**
```json
{
  "score": 0.7234,
  "explanations": [
    {
      "feature_name": "PitchQuality",
      "importance": 0.1456,
      "feature_value": 0.75
    },
    {
      "feature_name": "TeamExperience",
      "importance": 0.1123,
      "feature_value": 5.5
    },
    {
      "feature_name": "TokenomicsScore",
      "importance": 0.0987,
      "feature_value": 0.82
    }
  ],
  "model_metadata": {
    "model_version": "2024-01-15T10:30:00",
    "device": "cpu",
    "input_features": 7
  }
}
```

### GET /health
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_info": {
    "status": "loaded",
    "metadata": {...}
  }
}
```

### GET /model/info
Get detailed model information.

## Feature Vector Format

The prediction endpoint expects exactly 7 features in this order:

1. **TeamExperience** (float): Years of combined team experience (0.5-15.0)
2. **PitchQuality** (float): NLP-scored pitch quality (0.0-1.0)
3. **TokenomicsScore** (float): Tokenomics fairness score (0.0-1.0)
4. **Traction** (float): Normalized user engagement/GitHub stars (1-25000)
5. **CommunityEngagement** (float): Social media metrics (0.0-0.5)
6. **PreviousFunding** (float): Historical funding amount in USD (0-100M)
7. **RaiseSuccessProb** (float): Computed success probability (0.0-1.0)

## Quick Start

### Local Development

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Ensure Model is Available**
```bash
# Model should be at ../training_service/models/latest/
ls ../training_service/models/latest/
# Should show: fundraising_model.pth, scaler.pkl
```

3. **Run Service**
```bash
python main.py
# Or with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

4. **Test Prediction**
```bash
curl -X POST "http://localhost:8002/predict" \
  -H "Content-Type: application/json" \
  -d '{"features": [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]}'
```

### Docker Deployment

**Development:**
```bash
docker build -t superpage-prediction .
docker run -p 8002:8002 -v $(pwd)/../training_service/models:/app/models superpage-prediction
```

**Production:**
```bash
docker build --target production -t superpage-prediction-prod .
docker run -p 8002:8002 -v $(pwd)/../training_service/models:/app/models superpage-prediction-prod
```

## Testing

The service includes comprehensive unit tests covering:

- **Model Loading**: PyTorch model and scaler loading validation
- **Prediction Logic**: Inference accuracy and error handling
- **SHAP Integration**: Explanation computation and validation
- **API Endpoints**: FastAPI endpoint testing with various scenarios
- **Thread Safety**: Concurrent access and model management
- **Property-based Testing**: Hypothesis-driven edge case validation

### Running Tests

```bash
# All tests with coverage
pytest --cov=main --cov=model_loader --cov-report=html

# Specific test categories
pytest -m unit          # Unit tests only
pytest -m api           # API tests only
pytest -m shap          # SHAP tests only

# Fast tests (skip slow ones)
pytest -m "not slow"

# Verbose output
pytest -v
```

## SHAP Explanations

The service uses SHAP (SHapley Additive exPlanations) to provide interpretable predictions:

- **Background Dataset**: Representative samples for SHAP baseline
- **Feature Importance**: Quantified impact of each feature on prediction
- **Top 3 Features**: Most influential features for each prediction
- **Signed Values**: Positive/negative contribution to final score

### SHAP Validation

Tests ensure SHAP explanations:
- Return exactly 3 explanations (or fewer if explainer unavailable)
- Are ordered by absolute importance value
- Sum to approximately the prediction difference from baseline
- Include valid feature names and values

## Architecture

### Model Management
- **Singleton Pattern**: Single model instance across application
- **Thread Safety**: RLock for concurrent access protection
- **Lazy Loading**: Model loaded on first request or startup
- **Error Recovery**: Graceful handling of model loading failures

### SHAP Integration
- **Background Sampling**: Realistic feature distributions for baseline
- **Efficient Computation**: Cached explainer for fast inference
- **Fallback Handling**: Graceful degradation when SHAP unavailable

### API Design
- **Async FastAPI**: Modern async framework for high performance
- **Pydantic Validation**: Automatic request/response validation
- **Structured Logging**: Comprehensive logging for monitoring
- **Error Handling**: Detailed error responses with appropriate HTTP codes

## Environment Variables

- `MODEL_PATH`: Path to trained PyTorch model (default: ../training_service/models/latest/fundraising_model.pth)
- `SCALER_PATH`: Path to fitted scaler (default: ../training_service/models/latest/scaler.pkl)
- `SHAP_BACKGROUND_SAMPLES`: Number of background samples for SHAP (default: 100)

## Integration with SuperPage

The prediction service integrates with other SuperPage components:

1. **Training Service**: Loads models from training service output
2. **Preprocessing Service**: Compatible with preprocessing service feature format
3. **Frontend**: Provides predictions for Web3 project evaluation
4. **Monitoring**: Structured logging for integration with monitoring stack

## Performance

- **Startup Time**: ~5-10 seconds (model loading + SHAP initialization)
- **Prediction Latency**: ~10-50ms per prediction
- **Throughput**: ~100-500 predictions/second (depending on hardware)
- **Memory Usage**: ~200-500MB (model + SHAP background data)

## Monitoring

The service provides several monitoring endpoints:

- `/health`: Basic health check with model status
- `/model/info`: Detailed model information and metadata
- Structured logs with prediction metrics and timing

## Troubleshooting

### Common Issues

**Model Not Found:**
```bash
# Check model files exist
ls ../training_service/models/latest/
# Run training service first if missing
cd ../training_service && python train_federated.py
```

**SHAP Initialization Failed:**
```bash
# Check logs for SHAP errors
# Service will still work without SHAP explanations
```

**Prediction Errors:**
```bash
# Validate feature vector format
# Ensure exactly 7 numeric values
# Check for NaN or infinite values
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `pytest`
5. Submit a pull request

## License

This project is part of the SuperPage ecosystem. See the main repository LICENSE file for details.
