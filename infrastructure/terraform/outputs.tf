output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "VPC ID"
}

output "eks_cluster_name" {
  value       = module.eks.cluster_name
  description = "EKS cluster name"
}

output "eks_cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  description = "EKS API endpoint"
}

output "postgres_endpoint" {
  value       = aws_db_instance.postgres.address
  description = "RDS PostgreSQL endpoint"
}

output "redis_endpoint" {
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  description = "ElastiCache primary endpoint"
}

output "opensearch_endpoint" {
  value       = aws_opensearch_domain.search.endpoint
  description = "OpenSearch endpoint"
}

output "files_bucket_name" {
  value       = aws_s3_bucket.files.id
  description = "S3 bucket for file uploads"
}