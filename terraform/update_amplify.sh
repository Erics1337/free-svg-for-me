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

# Check for PostHog Key
if [ -z "$NEXT_PUBLIC_POSTHOG_KEY" ]; then
  echo "Enter your PostHog Project API Key (starts with phc_):"
  read NEXT_PUBLIC_POSTHOG_KEY
fi

# Check for PostHog Host
if [ -z "$NEXT_PUBLIC_POSTHOG_HOST" ]; then
  echo "Enter your PostHog Host (default: https://us.i.posthog.com):"
  read NEXT_PUBLIC_POSTHOG_HOST
  if [ -z "$NEXT_PUBLIC_POSTHOG_HOST" ]; then
    NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
  fi
fi

echo "Updating Amplify App ($AMPLIFY_APP_ID) branch $AMPLIFY_BRANCH..."

# Update the environment variable
aws amplify update-branch \
  --app-id "$AMPLIFY_APP_ID" \
  --branch-name "$AMPLIFY_BRANCH" \
  --environment-variables "NEXT_PUBLIC_LAMBDA_FUNCTION_URL=$LAMBDA_URL,NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY,NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST"

echo "Done! You may need to trigger a new build in Amplify for the changes to take effect."
