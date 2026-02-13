#!/bin/bash
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

# Check if .env exists
if [ -f "../.env" ]; then
  # Extract GEMINI_API_KEY from .env, handling potential quotes
  API_KEY=$(grep GEMINI_API_KEY ../.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
  
  if [ -n "$API_KEY" ]; then
    export TF_VAR_gemini_api_key=$API_KEY
    echo "Loaded GEMINI_API_KEY from ../.env"
  else
    echo "Warning: GEMINI_API_KEY not found in ../.env"
  fi

  # Extract PostHog variables
  POSTHOG_KEY=$(grep NEXT_PUBLIC_POSTHOG_KEY ../.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
  POSTHOG_HOST=$(grep NEXT_PUBLIC_POSTHOG_HOST ../.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

  if [ -n "$POSTHOG_KEY" ]; then
    export TF_VAR_posthog_api_key=$POSTHOG_KEY
    echo "Loaded NEXT_PUBLIC_POSTHOG_KEY from ../.env"
  else
    echo "Warning: NEXT_PUBLIC_POSTHOG_KEY not found in ../.env"
  fi

  if [ -n "$POSTHOG_HOST" ]; then
    export TF_VAR_posthog_host=$POSTHOG_HOST
    echo "Loaded NEXT_PUBLIC_POSTHOG_HOST from ../.env"
  fi
else
  echo "Warning: ../.env file not found"
fi

# Set the AWS profile to the correct user (using default)
# export AWS_PROFILE=erics1337

# Run terraform apply, passing any arguments (like -auto-approve)
terraform apply "$@"
