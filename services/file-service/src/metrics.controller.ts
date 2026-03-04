import { Controller, Get, Header } from '@nestjs/common';
import { collectDefaultMetrics, register } from 'prom-client';

let isMetricsInitialized = false;

if (!isMetricsInitialized) {
  collectDefaultMetrics();
  isMetricsInitialized = true;
}

@Controller()
export class MetricsController {
  @Get('metrics')
  @Header('Content-Type', register.contentType)
  async metrics() {
    return register.metrics();
  }
}