import { Module, Global } from '@nestjs/common';
import { ElasticService } from './elastic.service';
import { Client } from '@elastic/elasticsearch';

@Global()
@Module({
  providers: [
    {
      provide: Client,
      useFactory: () => {
        return new Client({
          node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
          auth: process.env.ELASTICSEARCH_USERNAME
            ? {
                username: process.env.ELASTICSEARCH_USERNAME,
                password: process.env.ELASTICSEARCH_PASSWORD,
              }
            : undefined,
        });
      },
    },
    ElasticService,
  ],
  exports: [ElasticService],
})
export class ElasticModule {}
