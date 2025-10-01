import json
import logging
from typing import List
from kafka import KafkaProducer
from kafka.errors import KafkaError
from app.config import settings

logger = logging.getLogger(__name__)


class KafkaProducerService:
    """
    Kafka Producer để gửi recommendations (productIds)
    từ ML service sang Product service
    """

    def __init__(self):
        self.producer = None
        self._connect()

    def _connect(self):
        """Kết nối tới Kafka"""
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=settings.kafka_bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                acks='all',
                retries=3,
                max_in_flight_requests_per_connection=1
            )
            logger.info(f"Connected to Kafka: {settings.kafka_bootstrap_servers}")
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            raise

    def send_recommendations(
        self,
        user_id: str,
        product_ids: List[str],
        request_id: str = None
    ) -> bool:
        """
        Gửi danh sách product IDs lên Kafka topic 'product.recommendations'
        Product service sẽ consume và query chi tiết sản phẩm

        Args:
            user_id: ID của user
            product_ids: Danh sách product IDs được recommend
            request_id: Optional request ID để tracking

        Returns:
            bool: True nếu gửi thành công
        """
        if not self.producer:
            logger.error("Kafka producer not initialized")
            return False

        try:
            message = {
                "user_id": user_id,
                "product_ids": product_ids,
                "request_id": request_id,
                "timestamp": None  # Kafka sẽ tự động thêm timestamp
            }

            # Gửi message với key là user_id để đảm bảo ordering
            future = self.producer.send(
                settings.kafka_topic_recommendations,
                key=user_id,
                value=message
            )

            # Wait for send to complete (blocking)
            record_metadata = future.get(timeout=10)

            logger.info(
                f"Sent recommendations to Kafka - Topic: {record_metadata.topic}, "
                f"Partition: {record_metadata.partition}, "
                f"Offset: {record_metadata.offset}, "
                f"User: {user_id}, "
                f"Products: {len(product_ids)}"
            )

            return True

        except KafkaError as e:
            logger.error(f"Kafka error sending recommendations: {e}")
            return False
        except Exception as e:
            logger.error(f"Error sending recommendations: {e}")
            return False

    def close(self):
        """Đóng kết nối Kafka producer"""
        if self.producer:
            self.producer.flush()
            self.producer.close()
            logger.info("Kafka producer closed")