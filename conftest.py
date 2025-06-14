"""
Global pytest configuration for SuperPage project
Provides common fixtures and test utilities
"""

import os
import sys
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock

# Add backend directories to Python path for testing
backend_dirs = [
    'backend/ingestion_service',
    'backend/preprocessing_service', 
    'backend/prediction_service',
    'backend/blockchain_service'
]

for backend_dir in backend_dirs:
    if os.path.exists(backend_dir):
        sys.path.insert(0, os.path.abspath(backend_dir))

# Set testing environment variables
os.environ.update({
    'TESTING': 'true',
    'FIRECRAWL_API_KEY': 'test_key_for_ci',
    'MONGODB_URL': 'mongodb://localhost:27017/test_superpage',
    'DATABASE_NAME': 'test_superpage',
    'BLOCKCHAIN_PRIVATE_KEY': '0x0000000000000000000000000000000000000000000000000000000000000001',
    'SUPERPAGE_CONTRACT_ADDRESS': '0x0000000000000000000000000000000000000000',
    'BLOCKCHAIN_NETWORK_URL': 'http://localhost:8545',
    'FRONTEND_URL': 'http://localhost:3000',
    'MODEL_PATH': '/tmp/test_model.pth',
    'SCALER_PATH': '/tmp/test_scaler.pkl'
})

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def mock_database():
    """Mock database for testing"""
    mock_db = Mock()
    mock_db.projects = Mock()
    mock_db.projects.find = AsyncMock(return_value=[])
    mock_db.projects.find_one = AsyncMock(return_value=None)
    mock_db.projects.insert_one = AsyncMock()
    mock_db.projects.update_one = AsyncMock()
    return mock_db

@pytest.fixture
def mock_firecrawl_client():
    """Mock Firecrawl client for testing"""
    mock_client = Mock()
    mock_client.scrape = Mock(return_value={'content': 'test content'})
    mock_client.crawl = Mock(return_value={'data': []})
    mock_client.extract = Mock(return_value={'data': {}})
    return mock_client

@pytest.fixture
def sample_project_data():
    """Sample project data for testing"""
    return {
        'project_id': 'test-project-123',
        'title': 'Test Web3 Project',
        'description': 'A test project for unit testing',
        'category': 'DeFi',
        'team_experience': 5.5,
        'previous_funding': 1000000,
        'traction': 5000,
        'url': 'https://test-project.com',
        'wallet_address': '0x1234567890123456789012345678901234567890'
    }

@pytest.fixture
def sample_features():
    """Sample ML features for testing"""
    return [5.5, 0.75, 0.82, 1500, 0.65, 500000, 0.72]

@pytest.fixture
def mock_model():
    """Mock ML model for testing"""
    mock_model = Mock()
    mock_model.predict = Mock(return_value=[0.85])
    mock_model.eval = Mock()
    return mock_model

@pytest.fixture
def mock_blockchain_manager():
    """Mock blockchain manager for testing"""
    mock_manager = Mock()
    mock_manager.check_blockchain_connection = AsyncMock(return_value=True)
    mock_manager.check_hardhat_availability = AsyncMock(return_value=True)
    mock_manager.publish_prediction = AsyncMock(return_value={'tx_hash': '0xtest'})
    return mock_manager

# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line("markers", "slow: mark test as slow running")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "unit: mark test as unit test")

def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically"""
    for item in items:
        # Add unit marker to all tests by default
        if not any(marker.name in ['integration', 'slow'] for marker in item.iter_markers()):
            item.add_marker(pytest.mark.unit)
        
        # Add asyncio marker to async tests
        if asyncio.iscoroutinefunction(item.function):
            item.add_marker(pytest.mark.asyncio)

# Skip tests if dependencies are not available
def pytest_runtest_setup(item):
    """Setup function to skip tests based on availability"""
    # Skip blockchain tests if Node.js is not available
    if 'blockchain' in str(item.fspath) and not os.path.exists('backend/blockchain_service/node_modules'):
        pytest.skip("Node.js dependencies not installed for blockchain service")
    
    # Skip tests that require external services in CI
    if os.getenv('GITHUB_ACTIONS') and item.get_closest_marker('integration'):
        pytest.skip("Integration tests skipped in CI environment")
