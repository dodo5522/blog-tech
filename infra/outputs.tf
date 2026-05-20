output "site_bucket_name" {
  value = aws_s3_bucket.static["site"].bucket
}

output "site_cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.static["site"].id
}

output "site_cloudfront_domain_name" {
  value = aws_cloudfront_distribution.static["site"].domain_name
}

output "site_url" {
  value = "https://${aws_cloudfront_distribution.static["site"].domain_name}"
}

output "studio_bucket_name" {
  value = aws_s3_bucket.static["studio"].bucket
}

output "studio_cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.static["studio"].id
}

output "studio_cloudfront_domain_name" {
  value = aws_cloudfront_distribution.static["studio"].domain_name
}

output "studio_url" {
  value = "https://${aws_cloudfront_distribution.static["studio"].domain_name}"
}

output "github_actions_deploy_role_arn" {
  value = aws_iam_role.github_actions_deploy.arn
}
