variable "aws_region" {
  type        = string
  description = "AWS region for S3, IAM, and other regional resources."
}

variable "site_name" {
  type        = string
  description = "Short site name used in resource names."
}

variable "bucket_name" {
  type        = string
  description = "S3 bucket name for static site assets."
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
