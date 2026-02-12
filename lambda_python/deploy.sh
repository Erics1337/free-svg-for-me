#!/bin/bash
set -e

# ============================================================
# Deploy Python Lambda to AWS
# Deploys the NEW gemini-svg-generator-python Lambda function
# ============================================================

FUNCTION_NAME="gemini-svg-generator-python"
REGION="us-east-1"
RUNTIME="python3.13"
HANDLER="lambda_function.handler"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Deploying Python Lambda: $FUNCTION_NAME ==="

# 1. Clean previous build artifacts
echo "[1/5] Cleaning previous build..."
rm -rf "$SCRIPT_DIR/package" "$SCRIPT_DIR/deployment.zip"

# 2. Install dependencies into package directory (targeting Lambda's Amazon Linux)
echo "[2/5] Installing dependencies..."
pip3 install \
    --target "$SCRIPT_DIR/package" \
    --platform manylinux2014_x86_64 \
    --implementation cp \
    --python-version 3.13 \
    --only-binary=:all: \
    -r "$SCRIPT_DIR/requirements.txt" \
    --quiet

# 3. Create deployment zip
echo "[3/5] Creating deployment package..."
cd "$SCRIPT_DIR/package"
zip -r9 "$SCRIPT_DIR/deployment.zip" . -x "*.pyc" "__pycache__/*" > /dev/null

# Add the lambda function itself
cd "$SCRIPT_DIR"
zip -g "$SCRIPT_DIR/deployment.zip" lambda_function.py > /dev/null

echo "    Package size: $(du -h deployment.zip | cut -f1)"

# 4. Check if function exists, create if not (usually handled by Terraform, but good for quick updates)
# Just use update-function-code here assuming Terraform created it

# 5. Deploy the code
echo "[5/5] Uploading code..."
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$SCRIPT_DIR/deployment.zip" \
    --region "$REGION" \
    --query '{FunctionName: FunctionName, Runtime: Runtime, CodeSize: CodeSize}' \
    --output table

# Wait for the code update to complete
echo "    Waiting for code update..."
aws lambda wait function-updated \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION"

echo ""
echo "=== Deployment complete! ==="
echo "Function: $FUNCTION_NAME"
echo "Runtime:  $RUNTIME"
echo "Handler:  $HANDLER"

# Get the Function URL
FUNCTION_URL=$(aws lambda list-function-url-configs \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION" \
    --query 'FunctionUrlConfigs[0].FunctionUrl' \
    --output text 2>/dev/null || echo "N/A")

echo "URL:      $FUNCTION_URL"
