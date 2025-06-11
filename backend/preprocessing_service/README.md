# SuperPage Preprocessing Service

The preprocessing service transforms raw ingestion data into ML-ready features using advanced text processing, tokenization, and feature scaling techniques.

## Features

- **Text Processing**: Clean and normalize text data with regex-based cleaning
- **Tokenization**: Hugging Face transformers for advanced text tokenization
- **Feature Scaling**: MinMaxScaler for numeric feature normalization
- **TF-IDF Vectorization**: Text feature extraction using TF-IDF
- **MongoDB Integration**: Fetch raw data from ingestion database
- **Dependency Injection**: Clean architecture with FastAPI dependencies
- **Comprehensive Logging**: Structured logging for monitoring and debugging

## API Endpoints

### GET /features/{project_id}
Processes raw project data and returns ML-ready feature vector.

**Response:**
```json
{
  "project_id": "proj_12345",
  "features": [0.75, 0.82, 0.45, 0.91, 0.33],
  "feature_names": ["team_experience", "pitch_quality", "tokenomics_score", "traction", "community_engagement"],
  "processing_metadata": {
    "text_fields_processed": 3,
    "numeric_fields_scaled": 5,
    "processing_timestamp": "2024-01-15T10:30:00Z",
    "tokenizer_model": "distilbert-base-uncased",
    "total_features": 5
  }
}
```

### GET /health
Health check endpoint for monitoring service status and dependencies.

### GET /
Root endpoint with service information and available endpoints.

## Feature Processing Pipeline

### 1. Text Processing
- **HTML Tag Removal**: Strip HTML tags from text content
- **URL Cleaning**: Remove URLs and links
- **Special Character Normalization**: Clean special characters while preserving punctuation
- **Whitespace Normalization**: Standardize spacing

### 2. Tokenization
- **Hugging Face Tokenizers**: Use DistilBERT tokenizer by default
- **Token Statistics**: Extract token count, average token length
- **Text Metrics**: Calculate text length, sentence count

### 3. Numeric Feature Extraction
- **Team Experience**: Years of combined team experience
- **Funding Amount**: Historical or target funding amounts
- **Team Size**: Number of team members
- **Traction Score**: User engagement and growth metrics
- **Community Metrics**: Social media followers, GitHub stars

### 4. Feature Scaling
- **MinMax Scaling**: Normalize features to 0-1 range
- **Missing Value Handling**: Default values for missing data
- **Type Conversion**: Ensure all features are float type

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `MONGODB_URL`: MongoDB connection string
- `DATABASE_NAME`: Database name for raw data
- `TOKENIZER_MODEL`: Hugging Face model name (default: distilbert-base-uncased)

## Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run the service:
   ```bash
   python main.py
   ```

4. Access the API:
   - Service: http://localhost:8001
   - Documentation: http://localhost:8001/docs
   - Health Check: http://localhost:8001/health

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t superpage-preprocessing .

# Run container
docker run -p 8001:8001 \
  -e MONGODB_URL=mongodb://host:27017 \
  -e TOKENIZER_MODEL=distilbert-base-uncased \
  superpage-preprocessing
```

## ML Models

### Text Processing Models
- **DistilBERT Tokenizer**: Fast and efficient tokenization
- **TF-IDF Vectorizer**: Traditional text feature extraction
- **Custom Text Cleaning**: Regex-based preprocessing

### Feature Engineering
- **Numeric Scaling**: MinMax normalization for consistent ranges
- **Text Statistics**: Length, token count, sentence metrics
- **Combined Features**: Unified feature vector for ML models

## Dependencies

The service uses dependency injection for:
- **Database Connection**: MongoDB client injection
- **ML Models**: Cached tokenizer, scaler, and vectorizer instances
- **Configuration**: Environment-based settings

## Error Handling

- **Database Errors**: Graceful fallback to mock data for development
- **Model Loading Errors**: Detailed error messages and service unavailable responses
- **Processing Errors**: Comprehensive logging and error propagation
- **Validation Errors**: Pydantic model validation with clear error messages

## Testing

The service includes comprehensive unit tests with property-based testing using Hypothesis.

### Running Tests

```bash
# Run all tests
python run_tests.py

# Run only unit tests (fast)
python run_tests.py --unit

# Run with coverage report
python run_tests.py --coverage

# Run hypothesis property-based tests
python run_tests.py --hypothesis

# Run fast tests only (exclude slow hypothesis tests)
python run_tests.py --fast

# Run ML-specific tests
python run_tests.py --ml

# Run specific test file
python -m pytest tests/test_preprocessing.py -v

# Run hypothesis tests with custom example count
python run_tests.py --hypothesis --max-examples 50
```

### Test Coverage

The tests cover:
- **Text Processing**: HTML removal, URL cleaning, whitespace normalization
- **Feature Extraction**: Numeric and text feature processing with edge cases
- **ML Components**: Tokenizer, scaler, and vectorizer initialization
- **FastAPI Endpoints**: Request/response validation and error handling
- **Feature Vector Validation**: Length consistency and data type validation
- **Property-Based Testing**: Hypothesis-generated edge cases for numeric inputs
- **Raw Data Mocking**: Comprehensive testing with various data scenarios
- **Error Scenarios**: Invalid data types, missing fields, extreme values

### Property-Based Testing with Hypothesis

The service includes comprehensive property-based tests using Hypothesis for:
- **Numeric Edge Cases**: Tests with extreme values, negative numbers, and boundary conditions
- **String Processing**: Tests with various text formats, empty strings, and special characters
- **Data Type Validation**: Tests with invalid data types and malformed inputs
- **Feature Vector Consistency**: Ensures consistent output regardless of input variations

## Monitoring

The service provides comprehensive monitoring through:
- **Health Checks**: Dependency status monitoring
- **Structured Logging**: JSON-formatted logs with context
- **Processing Metrics**: Feature count, processing time tracking
- **Error Tracking**: Detailed error logging with project context
