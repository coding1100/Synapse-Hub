data "aws_availability_zones" "available" {
  state = "available"
}

resource "random_id" "suffix" {
  byte_length = 2
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  azs         = slice(data.aws_availability_zones.available.names, 0, 3)

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.20.0"

  name = "${local.name_prefix}-vpc"
  cidr = var.vpc_cidr

  azs             = local.azs
  private_subnets = ["10.40.1.0/24", "10.40.2.0/24", "10.40.3.0/24"]
  public_subnets  = ["10.40.101.0/24", "10.40.102.0/24", "10.40.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false

  tags = local.tags
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.36.0"

  cluster_name    = "${local.name_prefix}-eks"
  cluster_version = var.eks_cluster_version

  cluster_endpoint_public_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    core = {
      desired_size   = 3
      min_size       = 3
      max_size       = 10
      instance_types = ["m6i.large"]
      capacity_type  = "ON_DEMAND"

      labels = {
        role = "core"
      }
    }
  }

  tags = local.tags
}

resource "aws_security_group" "data_services" {
  name        = "${local.name_prefix}-data-sg"
  description = "Access for PostgreSQL, Redis, and OpenSearch"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "Redis"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "OpenSearch"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_db_subnet_group" "postgres" {
  name       = "${local.name_prefix}-postgres-subnets"
  subnet_ids = module.vpc.private_subnets

  tags = local.tags
}

resource "aws_db_instance" "postgres" {
  identifier = "${local.name_prefix}-postgres"

  engine               = "postgres"
  engine_version       = "16.4"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  db_name              = "synapsehub"
  username             = var.db_username
  password             = var.db_password
  skip_final_snapshot  = true
  storage_encrypted    = true
  multi_az             = true
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.postgres.name

  vpc_security_group_ids = [aws_security_group.data_services.id]

  tags = local.tags
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnets"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name_prefix}-redis"
  description                = "SynapseHub Redis cache and pub/sub"
  node_type                  = "cache.t4g.medium"
  num_cache_clusters         = 2
  engine                     = "redis"
  engine_version             = "7.1"
  automatic_failover_enabled = true
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.data_services.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = local.tags
}

resource "aws_opensearch_domain" "search" {
  domain_name    = "${local.name_prefix}-search"
  engine_version = "OpenSearch_2.17"

  cluster_config {
    instance_type  = "m6g.large.search"
    instance_count = 2
    zone_awareness_enabled = true
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 80
    volume_type = "gp3"
  }

  vpc_options {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.data_services.id]
  }

  encrypt_at_rest {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  node_to_node_encryption {
    enabled = true
  }

  tags = local.tags
}

resource "aws_s3_bucket" "files" {
  bucket = "${local.name_prefix}-files-${random_id.suffix.hex}"

  tags = local.tags
}

resource "aws_s3_bucket_versioning" "files" {
  bucket = aws_s3_bucket.files.id

  versioning_configuration {
    status = "Enabled"
  }
}