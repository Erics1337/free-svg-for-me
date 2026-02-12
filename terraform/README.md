# Serverless SVG Generation with AWS Lambda

This project uses standalone AWS Lambda functions to handle long-running SVG generation tasks, bypassing the 30-second timeout limits of standard serverless functions (like those in Vercel or AWS Amplify).

## Architecture

We currently run two parallel Lambda functions for testing and migration purposes:

1.  **Node.js (Legacy/Production)**: `gemini-svg-generator`
    - Runtime: Node.js 20.x
    - Features: Response streaming (faster time-to-first-byte).
    - Path: `typescript_lambda/`
2.  **Python (New/Beta)**: `gemini-svg-generator-python`
    - Runtime: Python 3.13
    - Features: threading-based timeouts, full PostHog analytics, standard JSON response.
    - Path: `lambda_python/`

The frontend connects to **one** of these via the `NEXT_PUBLIC_LAMBDA_FUNCTION_URL` environment variable.

## 1. Prerequisites

- [Terraform installed](https://developer.hashicorp.com/terraform/downloads)
- AWS CLI configured with credentials (`aws configure`)
- Node.js and npm installed
- Python 3.13 installed

## 2. Deploying Updates

### Node.js Lambda (Original)

To update the TypeScript/Node.js function:

```bash
cd typescript_lambda
npm install
npm run build
cd ../terraform
./deploy.sh
```

### Python Lambda (New)

To update the Python function (code or dependencies):

```bash
cd lambda_python
./deploy.sh
```

_Note: `deploy.sh` handles installing Linux-compatible dependencies._

### Infrastructure Changes (Terraform)

To update IAM roles, timeouts, or environment variables for **both** functions:

```bash
cd terraform
./deploy.sh
```

## 3. Environment Variables

To switch your frontend between the Node.js and Python backends, update the `NEXT_PUBLIC_LAMBDA_FUNCTION_URL` environment variable.

### Local Development

Update your `.env` file:

```bash
# Node.js (Streaming)
NEXT_PUBLIC_LAMBDA_FUNCTION_URL=https://<node-url>.lambda-url.us-east-1.on.aws/

# OR

# Python (JSON)
NEXT_PUBLIC_LAMBDA_FUNCTION_URL=https://<python-url>.lambda-url.us-east-1.on.aws/
```

### Production (AWS Amplify)

1.  Go to the **AWS Amplify Console**.
2.  Navigate to **App settings** -> **Environment variables**.
3.  Update `NEXT_PUBLIC_LAMBDA_FUNCTION_URL` to the desired endpoint.

## 4. Rotating the API Key

The `GEMINI_API_KEY` is stored securely in the Lambda function's environment variables. To rotate it:

1.  Run `./deploy.sh` in the `terraform/` directory.
2.  Enter the **new** API key when prompted.
3.  Terraform will update the configuration for **both** Lambdas.
