#!/bin/bash

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
else
  echo "Warning: ../.env file not found"
fi

# Run terraform apply, passing any arguments (like -auto-approve)
terraform apply "$@"
