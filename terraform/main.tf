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

variable "supabase_url" {
  type        = string
  description = "Supabase project URL. Must be supplied via terraform.tfvars or TF_VAR_supabase_url."
}

variable "supabase_service_role_key" {
  type      = string
  sensitive = true
}

# ==============================================================================
# 1. TypeScript Lambda (Node.js) - RESTORED
# ==============================================================================

# Zip the built TypeScript code
data "archive_file" "lambda_zip_ts" {
  type        = "zip"
  source_file = "${path.module}/../lambda_typescript/dist/index.js"
  output_path = "${path.module}/lambda_function_payload_ts.zip"
}

# TypeScript Lambda Function
resource "aws_lambda_function" "svg_generator" {
  filename         = data.archive_file.lambda_zip_ts.output_path
  function_name    = "gemini-svg-generator"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 300 # 5 minutes
  memory_size      = 1024
  source_code_hash = data.archive_file.lambda_zip_ts.output_base64sha256

  environment {
    variables = {
      GEMINI_API_KEY            = var.gemini_api_key
      POSTHOG_API_KEY           = var.posthog_api_key
      POSTHOG_HOST              = var.posthog_host
      SUPABASE_URL              = var.supabase_url
      SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
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

# Zip the Python code - We use the prebuilt zip from deploy.sh to include dependencies
# data "archive_file" "lambda_zip_py" {
#   type        = "zip"
#   source_dir  = "${path.module}/../lambda_python"
#   excludes    = ["package", "deployment.zip", "deploy.sh", "__pycache__"]
#   output_path = "${path.module}/lambda_function_payload_py.zip"
# }

# Python Lambda Function
resource "aws_lambda_function" "svg_generator_python" {
  filename         = "${path.module}/../lambda_python/deployment.zip"
  function_name    = "gemini-svg-generator-python"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "run.sh"
  runtime          = "python3.13"
  timeout          = 300 # 5 minutes
  memory_size      = 1024
  source_code_hash = filebase64sha256("${path.module}/../lambda_python/deployment.zip")
  layers = [
    "arn:aws:lambda:us-east-1:753240598075:layer:LambdaAdapterLayerX86:26"
  ]

  environment {
    variables = {
      GEMINI_API_KEY          = var.gemini_api_key
      POSTHOG_API_KEY         = var.posthog_api_key
      POSTHOG_HOST            = var.posthog_host
      AWS_LAMBDA_EXEC_WRAPPER = "/opt/bootstrap"
      AWS_LWA_INVOKE_MODE     = "response_stream"
      PORT                    = "8080"
    }
  }
}

# Function URL for Python Lambda
resource "aws_lambda_function_url" "svg_generator_python_url" {
  function_name      = aws_lambda_function.svg_generator_python.function_name
  authorization_type = "NONE"
  # Streaming is enabled via Lambda Web Adapter on the Python function.
  invoke_mode = "RESPONSE_STREAM"

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

# DynamoDB Table for Rate Limiting
resource "aws_dynamodb_table" "usage_tracking" {
  name         = "svg-generator-usage"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ip_date"

  attribute {
    name = "ip_date"
    type = "S"
  }
}

# Add IAM Policy for DynamoDB Access
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "svg_generator_dynamodb_policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.usage_tracking.arn
      }
    ]
  })
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
