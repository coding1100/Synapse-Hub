variable "aws_region" {
  description = "AWS region for SynapseHub infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project tag and naming prefix"
  type        = string
  default     = "synapsehub"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.40.0.0/16"
}

variable "eks_cluster_version" {
  description = "EKS Kubernetes version"
  type        = string
  default     = "1.31"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_allocated_storage" {
  description = "RDS storage in GB"
  type        = number
  default     = 100
}

variable "db_username" {
  description = "RDS admin username"
  type        = string
  default     = "synapsehub"
}

variable "db_password" {
  description = "RDS admin password"
  type        = string
  sensitive   = true
}