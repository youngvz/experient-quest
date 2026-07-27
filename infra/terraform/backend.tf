// S3 remote state. The bucket + DynamoDB lock table are created by
// the one-time `bootstrap/` module before the first `terraform init`
// here. See infra/README.md for the boot sequence.
//
// If you're on a fresh machine and see a "backend not initialized"
// error, run `terraform init` after `make tf-bootstrap-apply` has
// produced the state bucket.

terraform {
  backend "s3" {
    bucket         = "experient-tf-state-392821800047"
    key            = "experient-quest/server/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "experient-tf-locks"
    encrypt        = true
  }
}
