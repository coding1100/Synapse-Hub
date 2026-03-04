# Observability Guide

## Metrics

Every backend service exposes Prometheus metrics at `/metrics`.

Local Prometheus config:

- `infrastructure/docker/prometheus.yml`

Kubernetes Prometheus config map:

- `infrastructure/kubernetes/observability.yaml`

## Dashboards

Grafana is available at `http://localhost:3001` in local Compose.

Default credentials:

- Username: `admin`
- Password: `admin`

Recommended dashboards:

- Request latency and throughput by service
- Websocket connection counts
- Redis publish/subscribe volume
- PostgreSQL connection and query rates
- Elasticsearch query latency and errors

## Logs (ELK)

Compose stack includes Elasticsearch, Kibana, and Logstash.

- Elasticsearch: `http://localhost:9200`
- Kibana: `http://localhost:5601`
- Logstash ingest: TCP `5044`

Logstash pipeline config:

- `infrastructure/docker/logstash.conf`

## Alerts

Recommended alerts:

- API error rate > threshold
- P95 message send latency degradation
- Redis connection failures
- Migration failures on deploy
- Disk usage saturation for PostgreSQL/OpenSearch

## Error tracking

Add Sentry or equivalent by injecting DSNs into services and web runtime env.