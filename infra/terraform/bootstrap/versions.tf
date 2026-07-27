terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
  // Bootstrap intentionally uses LOCAL state — the S3 bucket that
  // holds the main workspace's remote state doesn't exist yet.
}
