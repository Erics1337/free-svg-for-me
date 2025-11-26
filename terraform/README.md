# Serverless SVG Generation with AWS Lambda

This project uses a standalone AWS Lambda function to handle long-running SVG generation tasks, bypassing the 30-second timeout limits of standard serverless functions (like those in Vercel or AWS Amplify).

## Architecture

1.  **Client**: Sends a request to the Next.js API route (`/api/generate`).
2.  **Next.js API**: Acts as a proxy. It forwards the request to the AWS Lambda Function URL.
3.  **AWS Lambda**: Runs the Gemini AI generation logic. It has a 5-minute timeout and supports streaming.
4.  **Response**: The Lambda streams the generated SVG code back to the Next.js API, which streams it back to the client.

## 1. Prerequisites

- [Terraform installed](https://developer.hashicorp.com/terraform/downloads)
- AWS CLI configured with credentials (`aws configure`)
- Node.js and npm installed

## 2. Deploying Updates to the Lambda

If you modify the code in `lambda/index.ts` (e.g., changing prompts or models), you must redeploy the Lambda function.

1.  **Build the Code**:
    ```bash
    cd lambda
    npm install
    npm run build
    ```

2.  **Deploy with Terraform**:
    ```bash
    cd ../terraform
    terraform apply
    ```
    *You will be prompted for your `gemini_api_key`.*

## 3. Environment Variables

To connect your Next.js application to the Lambda function, you need to set the `LAMBDA_FUNCTION_URL` environment variable.

### Local Development
Add this to your `.env` file:
```bash
NEXT_PUBLIC_LAMBDA_FUNCTION_URL=https://<your-function-url>.lambda-url.us-east-1.on.aws/
```
*(You can get this URL from the `terraform apply` output)*

### Production (AWS Amplify)
1.  Go to the **AWS Amplify Console**.
2.  Navigate to **App settings** -> **Environment variables**.
3.  Add:
    - Key: `NEXT_PUBLIC_LAMBDA_FUNCTION_URL`
    - Value: `https://<your-function-url>.lambda-url.us-east-1.on.aws/`

## 4. Rotating the API Key

The `GEMINI_API_KEY` is stored securely in the Lambda function's environment variables. To rotate it:

1.  Run `terraform apply` in the `terraform/` directory.
2.  Enter the **new** API key when prompted.
3.  Terraform will update the Lambda configuration with the new key.

## Troubleshooting

- **Timeout Errors**: The Lambda is configured with a 5-minute timeout. If generation takes longer, check the AWS CloudWatch logs for the `gemini-svg-generator` function.
- **CORS Issues**: The Function URL is configured to allow all origins (`*`). If you see CORS errors, check the `main.tf` configuration.
