// One-time bootstrap of the S3 + DynamoDB backing store for the
// main workspace's remote state. Run this ONCE per AWS account:
//
//   cd infra/terraform/bootstrap
//   terraform init
//   terraform apply
//
// After it succeeds, run `terraform init` in the parent directory —
// the backend.tf there references the bucket + table this module
// creates.

variable "region" {
  description = "Region the state bucket + lock table live in. Doesn't need to match the workload region."
  type        = string
  default     = "us-east-1"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform state. Must match the `bucket` field in ../backend.tf."
  type        = string
  default     = "experient-tf-state-392821800047"
}

variable "lock_table_name" {
  description = "DynamoDB table for state locking. Must match the `dynamodb_table` field in ../backend.tf."
  type        = string
  default     = "experient-tf-locks"
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "experient-quest"
      Component = "tf-state"
      ManagedBy = "terraform"
    }
  }
}

resource "aws_s3_bucket" "state" {
  bucket        = var.state_bucket_name
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket = aws_s3_bucket.state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "locks" {
  name         = var.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

output "state_bucket" {
  value       = aws_s3_bucket.state.bucket
  description = "Copy this into ../backend.tf's `bucket` field if you changed the default."
}

output "lock_table" {
  value       = aws_dynamodb_table.locks.name
  description = "Copy this into ../backend.tf's `dynamodb_table` field if you changed the default."
}
