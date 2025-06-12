@echo off
REM Test script to publish a sample prediction to the smart contract

echo Testing SuperPage Prediction Publishing...
echo.

REM Set required environment variables for testing
set PROJECT_ID=test-project-001
set PREDICTION_SCORE=0.7234
set PROOF_HASH=0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890
set METADATA={"model_version":"v1.0.0","timestamp":"2025-06-12T09:15:00Z","features_hash":"0xabcdef123456","confidence":0.85}
set CONTRACT_ADDRESS=0x0F0ee547b6d82308D55B00B9e978fB1D348ae16D
set PRIVATE_KEY=a8a6f100ed77edf366914903d669367174436ad272085a414f0a11033d04936e
set GAS_LIMIT=500000
set GAS_PRICE=2000000000

echo Environment variables set:
echo PROJECT_ID=%PROJECT_ID%
echo PREDICTION_SCORE=%PREDICTION_SCORE%
echo CONTRACT_ADDRESS=%CONTRACT_ADDRESS%
echo.

echo Running prediction publishing script...
npx hardhat run scripts/publish-prediction.js --network sepolia

echo.
echo Test completed.
pause
