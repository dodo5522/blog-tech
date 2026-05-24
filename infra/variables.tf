variable "aws_region" {
  type        = string
  description = "AWS region for S3, IAM, and other regional resources."
}

variable "studio_bucket_name" {
  type        = string
  description = "S3 bucket name for the static Sanity Studio."
}

variable "site_bucket_name" {
  type        = string
  description = "S3 bucket name for the public site managed outside this Terraform stack."
}

variable "site_cloudfront_distribution_arn" {
  type        = string
  description = "CloudFront distribution ARN for the public site managed outside this Terraform stack."
}

variable "tf_state_bucket_name" {
  type        = string
  description = "S3 bucket name used by Terraform backend state."
}

variable "tf_state_key" {
  type        = string
  description = "S3 object key used by Terraform backend state."
}

variable "github_repository" {
  type        = string
  description = "GitHub repository in owner/name format."
}

variable "github_oidc_subjects" {
  type        = list(string)
  description = "Allowed GitHub OIDC subjects for deployment."
  default     = []
}

variable "cloudfront_price_class" {
  type        = string
  description = "CloudFront price class for both distributions."
  default     = "PriceClass_200"
}

variable "tags" {
  type        = map(string)
  description = "Additional tags applied to AWS resources."
  default     = {}
}
