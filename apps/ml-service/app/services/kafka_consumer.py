import json
import logging
from typing import Callable, Dict, Any
from kafka import KafkaConsumer
from kafka.errors import KafkaError
from app.config import settings

logger = logging.getLogger(__name__)


class KafkaConsumerService:
    """
    Kafka Consumer để lắng nghe events từ các services khác
    Đặc biệt là 'product.viewed' từ Product Service
    """

    def __init__(self):
        self.consumer = None
        self.handlers: Dict[str, Callable] = {}
        self.running = False

    def connect(self):
        """Kết nối tới Kafka consumer"""
        try:
            self.consumer = KafkaConsumer(
                settings.kafka_topic_product_view,  # 'product.viewed'
                bootstrap_servers=settings.kafka_bootstrap_servers,
                group_id=settings.kafka_group_id,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                key_deserializer=lambda k: k.decode('utf-8') if k else None,
                auto_offset_reset='latest',  # Chỉ xử lý message mới
                enable_auto_commit=True,
                max_poll_records=10
            )
            logger.info(
                f"Kafka consumer connected - Topic: {settings.kafka_topic_product_view}, "
                f"Group: {settings.kafka_group_id}"
            )
        except Exception as e:
            logger.error(f"Failed to connect Kafka consumer: {e}")
            raise

    def register_handler(self, topic: str, handler: Callable):
        """
        Đăng ký handler cho một topic

        Args:
            topic: Kafka topic name
            handler: Async function để xử lý message
        """
        self.handlers[topic] = handler
        logger.info(f"Registered handler for topic: {topic}")

    async def handle_message(self, topic: str, message: Dict[str, Any]):
        """Xử lý message từ Kafka"""
        handler = self.handlers.get(topic)
        if handler:
            try:
                await handler(message)
            except Exception as e:
                logger.error(f"Error in handler for topic {topic}: {e}", exc_info=True)
        else:
            logger.warning(f"No handler registered for topic: {topic}")

    def start(self):
        """Bắt đầu consume messages"""
        if not self.consumer:
            self.connect()

        self.running = True
        logger.info("Starting Kafka consumer loop...")

        try:
            for message in self.consumer:
                if not self.running:
                    break

                topic = message.topic
                value = message.value
                key = message.key

                logger.info(
                    f"Received message - Topic: {topic}, Key: {key}, "
                    f"Partition: {message.partition}, Offset: {message.offset}"
                )

                # Xử lý message đồng bộ (vì kafka consumer không async)
                # Handler sẽ được gọi trong event loop riêng
                import asyncio
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                loop.run_until_complete(self.handle_message(topic, value))

        except KafkaError as e:
            logger.error(f"Kafka error: {e}")
        except Exception as e:
            logger.error(f"Error in consumer loop: {e}", exc_info=True)
        finally:
            self.stop()

    def stop(self):
        """Dừng consumer"""
        self.running = False
        if self.consumer:
            self.consumer.close()
            logger.info("Kafka consumer stopped")

    def close(self):
        """Alias cho stop()"""
        self.stop()