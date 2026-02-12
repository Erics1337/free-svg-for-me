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

# ==============================================================================
# 1. TypeScript Lambda (Node.js) - RESTORED
# ==============================================================================

# Zip the built TypeScript code
data "archive_file" "lambda_zip_ts" {
  type        = "zip"
  source_file = "${path.module}/../typescript_lambda/dist/index.js"
  output_path = "${path.module}/lambda_function_payload_ts.zip"
}

# TypeScript Lambda Function
resource "aws_lambda_function" "svg_generator" {
  filename      = data.archive_file.lambda_zip_ts.output_path
  function_name = "gemini-svg-generator"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 300 # 5 minutes
  memory_size   = 1024
  source_code_hash = data.archive_file.lambda_zip_ts.output_base64sha256

  environment {
    variables = {
      GEMINI_API_KEY  = var.gemini_api_key
      POSTHOG_API_KEY = var.posthog_api_key
      POSTHOG_HOST    = var.posthog_host
    }
  }
}

# Function URL for TypeScript Lambda
resource "aws_lambda_function_url" "svg_generator_url" {
  function_name      = aws_lambda_function.svg_generator.function_name
  authorization_type = "NONE"
  invoke_mode        = "RESPONSE_STREAM" # Enable streaming!
  
  cors {
    allow_origins = [
      "https://www.freesvgforme.com",
      "https://freesvgforme.com",
      "http://localhost:3000"
    ]
    allow_methods = ["POST"]
    allow_headers = ["content-type"]
    max_age       = 3600
  }
}


# ==============================================================================
# 2. Python Lambda (Python 3.13) - NEW
# ==============================================================================

# Zip the Python code
data "archive_file" "lambda_zip_py" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda_python"
  excludes    = ["package", "deployment.zip", "deploy.sh", "__pycache__"]
  output_path = "${path.module}/lambda_function_payload_py.zip"
}

# Python Lambda Function
resource "aws_lambda_function" "svg_generator_python" {
  filename      = data.archive_file.lambda_zip_py.output_path
  function_name = "gemini-svg-generator-python"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "lambda_function.handler"
  runtime       = "python3.13"
  timeout       = 300 # 5 minutes
  memory_size   = 1024
  source_code_hash = data.archive_file.lambda_zip_py.output_base64sha256

  environment {
    variables = {
      GEMINI_API_KEY  = var.gemini_api_key
      POSTHOG_API_KEY = var.posthog_api_key
      POSTHOG_HOST    = var.posthog_host
    }
  }
}

# Function URL for Python Lambda
resource "aws_lambda_function_url" "svg_generator_python_url" {
  function_name      = aws_lambda_function.svg_generator_python.function_name
  authorization_type = "NONE"
  # Python managed runtime doesn't support RESPONSE_STREAM natively in same way
  # It defaults to BUFFERED, but we can try RESPONSE_STREAM if using custom adapter
  # For now, let's stick to default (BUFFERED) as implemented in handler
  invoke_mode        = "BUFFERED" 
  
  cors {
    allow_origins = [
      "*" # Allow all for testing
    ]
    allow_methods = ["POST"]
    allow_headers = ["content-type"]
    max_age       = 3600
  }
}


# ==============================================================================
# IAM & Shared Resources
# ==============================================================================

# IAM Role for Lambda
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

# ==============================================================================
# Outputs
# ==============================================================================

output "function_url_ts" {
  value = aws_lambda_function_url.svg_generator_url.function_url
}

output "function_url_python" {
  value = aws_lambda_function_url.svg_generator_python_url.function_url
}
