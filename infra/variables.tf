variable "aws_region" {
  type        = string
  description = "AWS region for S3, IAM, and other regional resources."
}

variable "site_name" {
  type        = string
  description = "Short site name used in resource names."
}

variable "site_bucket_name" {
  type        = string
  description = "S3 bucket name for the public Astro site."
}

variable "studio_bucket_name" {
  type        = string
  description = "S3 bucket name for the static Sanity Studio."
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
