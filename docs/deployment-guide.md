# Deployment Guide

## CI/CD summary

GitHub Actions workflows are defined in:

- `.github/workflows/ci-cd.yml`
- `.github/workflows/terraform.yml`

Pipeline stages:

1. Install dependencies
2. Run unit/integration/e2e tests
3. Build all workspaces
4. Build and push Docker images
5. Apply Kubernetes manifests

## Docker Compose deployment

```bash
docker-compose up --build -d
```

This launches:

- API gateway and all microservices
- Web app
- PostgreSQL, Redis, Elasticsearch, MinIO
- Prometheus, Grafana, Kibana, Logstash

## Kubernetes deployment

```bash
kubectl apply -f infrastructure/kubernetes/synapsehub.yaml
kubectl apply -f infrastructure/kubernetes/observability.yaml
```

Suggested production workflow:

1. Replace placeholder container images with your registry tags.
2. Replace default secrets (`JWT`, DB creds, S3 keys).
3. Add cert-manager TLS, HPA, PodDisruptionBudgets, and NetworkPolicies.
4. Run Prisma migrations as a Kubernetes Job before rollout.

## Terraform deployment

1. Configure AWS credentials.
2. Copy tfvars example and set secure values.

```bash
cp infrastructure/terraform/terraform.tfvars.example infrastructure/terraform/terraform.tfvars
```

3. Execute Terraform workflow:

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

Provisioned resources:

- VPC + subnets + NAT
- EKS cluster + managed node group
- RDS PostgreSQL
- ElastiCache Redis
- OpenSearch domain
- S3 bucket for files

## Post-deploy checks

- Gateway health: `GET /health`
- Service health: `GET /health` on each service
- Metrics endpoints: `GET /metrics`
- Realtime websocket handshake + channel broadcast
- Search indexing and query path
- Bot and integration event ingestion path