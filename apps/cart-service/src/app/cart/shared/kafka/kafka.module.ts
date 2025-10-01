import { Global, Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { KafkaService } from "./kafka.service";


@Global()
@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'KAFKA_SERVICE',
                transport: Transport.KAFKA,
                options: {
                    client: {
                        brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
                    },
                    consumer: {
                        groupId: process.env.KAFKA_GROUP_ID || 'cart-service-group',    
                    },
                },
            },
        ]),
    ],
    providers: [KafkaService],
    exports: [KafkaService],
})
export class KafkaModule {}