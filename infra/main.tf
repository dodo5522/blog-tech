data "aws_caller_identity" "current" {}

locals {
  site_name = "tech-blog"

  default_tags = merge(
    {
      Project   = local.site_name
      ManagedBy = "terraform"
    },
    var.tags,
  )

  origins = {
    studio = {
      bucket_name         = var.studio_bucket_name
      distribution_label  = "studio"
      default_root_object = "index.html"
    }
  }

  deploy_bucket_arns = concat(
    [for bucket in aws_s3_bucket.static : bucket.arn],
    ["arn:aws:s3:::${var.site_bucket_name}"],
  )

  deploy_object_arns = concat(
    [for bucket in aws_s3_bucket.static : "${bucket.arn}/*"],
    ["arn:aws:s3:::${var.site_bucket_name}/*"],
  )

  deploy_distribution_arns = concat(
    [for distribution in aws_cloudfront_distribution.static : distribution.arn],
    [var.site_cloudfront_distribution_arn],
  )
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = length(var.github_oidc_subjects) > 0 ? var.github_oidc_subjects : [
        "repo:${var.github_repository}:ref:refs/heads/main",
      ]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "${local.site_name}-github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
  tags               = local.default_tags
}

data "aws_iam_policy_document" "github_actions_deploy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObject",
    ]
    resources = concat(local.deploy_bucket_arns, local.deploy_object_arns)
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::${var.tf_state_bucket_name}",
    ]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values = [
        var.tf_state_key,
        "${var.tf_state_key}.tflock",
      ]
    }
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
    ]
    resources = [
      "arn:aws:s3:::${var.tf_state_bucket_name}/${var.tf_state_key}",
      "arn:aws:s3:::${var.tf_state_bucket_name}/${var.tf_state_key}.tflock",
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetDistribution",
      "cloudfront:GetInvalidation",
    ]
    resources = local.deploy_distribution_arns
  }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name   = "${local.site_name}-github-actions-deploy"
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.github_actions_deploy.json
}

resource "aws_s3_bucket" "static" {
  for_each = local.origins

  bucket = each.value.bucket_name
  tags   = local.default_tags
}

resource "aws_s3_bucket_versioning" "static" {
  for_each = aws_s3_bucket.static

  bucket = each.value.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  for_each = aws_s3_bucket.static

  bucket = each.value.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "static" {
  for_each = aws_s3_bucket.static

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "static" {
  for_each = local.origins

  name                              = "${local.site_name}-${each.value.distribution_label}-oac"
  description                       = "Origin access control for ${local.site_name} ${each.value.distribution_label}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "directory_index" {
  for_each = local.origins

  name    = "${local.site_name}-${each.value.distribution_label}-directory-index"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite extensionless static paths to index.html."
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      var uri = request.uri;

      if (uri.endsWith("/")) {
        request.uri = uri + "index.html";
      } else if (!uri.includes(".")) {
        request.uri = uri + "/index.html";
      }

      return request;
    }
  EOT
}

resource "aws_cloudfront_distribution" "static" {
  for_each = local.origins

  enabled             = true
  default_root_object = each.value.default_root_object
  comment             = "${local.site_name} ${each.value.distribution_label}"
  price_class         = var.cloudfront_price_class
  tags                = local.default_tags

  origin {
    domain_name              = aws_s3_bucket.static[each.key].bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.static[each.key].id
    origin_id                = "${each.key}Bucket"
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${each.key}Bucket"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.directory_index[each.key].arn
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 60
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 60
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

data "aws_iam_policy_document" "bucket_policy" {
  for_each = aws_s3_bucket.static

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${each.value.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.static[each.key].arn]
    }
  }
}

resource "aws_s3_bucket_policy" "static" {
  for_each = aws_s3_bucket.static

  bucket = each.value.id
  policy = data.aws_iam_policy_document.bucket_policy[each.key].json
}
