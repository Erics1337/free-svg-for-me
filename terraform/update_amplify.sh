#!/bin/bash

# Get the new Lambda URL from Terraform output
LAMBDA_URL=$(terraform output -raw function_url)

if [ -z "$LAMBDA_URL" ]; then
  echo "Error: Could not get Lambda URL from Terraform"
  exit 1
fi

echo "New Lambda URL: $LAMBDA_URL"

# Check if Amplify App ID is provided
if [ -z "$AMPLIFY_APP_ID" ]; then
  echo "Enter your Amplify App ID (found in App Settings > General):"
  read AMPLIFY_APP_ID
fi

if [ -z "$AMPLIFY_BRANCH" ]; then
  AMPLIFY_BRANCH="main"
fi

echo "Updating Amplify App ($AMPLIFY_APP_ID) branch $AMPLIFY_BRANCH..."

# Update the environment variable
aws amplify update-branch \
  --app-id "$AMPLIFY_APP_ID" \
  --branch-name "$AMPLIFY_BRANCH" \
  --environment-variables "NEXT_PUBLIC_LAMBDA_FUNCTION_URL=$LAMBDA_URL"

echo "Done! You may need to trigger a new build in Amplify for the changes to take effect."
