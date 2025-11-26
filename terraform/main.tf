provider "aws" {
  region = "us-east-1" # Change to your region
}

variable "gemini_api_key" {
  type      = string
  sensitive = true
}

variable "posthog_api_key" {
  type      = string
  sensitive = true
}

variable "posthog_host" {
  type    = string
  default = "https://us.i.posthog.com"
}

# 1. Zip the built Lambda code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/dist/index.js"
  output_path = "${path.module}/lambda_function_payload.zip"
}

# 2. Create the Lambda Function
resource "aws_lambda_function" "svg_generator" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "gemini-svg-generator"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 300 # 5 minutes
  memory_size   = 1024
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      GEMINI_API_KEY  = var.gemini_api_key
      POSTHOG_API_KEY = var.posthog_api_key
      POSTHOG_HOST    = var.posthog_host
    }
  }
}

# 3. IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "svg_generator_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 4. Create a Function URL
resource "aws_lambda_function_url" "svg_generator_url" {
  function_name      = aws_lambda_function.svg_generator.function_name
  authorization_type = "NONE"
  invoke_mode        = "RESPONSE_STREAM" # Enable streaming!
  
  cors {
    allow_origins = ["*"] # Restrict this to your domain in production
    allow_methods = ["POST"]
    allow_headers = ["content-type"]
    max_age       = 3600
  }
}

# 5. Output the URL
output "function_url" {
  value = aws_lambda_function_url.svg_generator_url.function_url
}
