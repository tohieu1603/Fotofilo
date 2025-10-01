import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticService implements OnModuleDestroy {
  private readonly logger = new Logger(ElasticService.name);

  constructor(private readonly client: Client) {}

  async index<T = unknown>(index: string, body: T) {
    return this.client.index({ index, body });
  }

  async search<T = unknown>(index: string, query: T) {
    return this.client.search({ index, body: query });
  }

  async delete(index: string, id: string) {
    return this.client.delete({ index, id });
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
