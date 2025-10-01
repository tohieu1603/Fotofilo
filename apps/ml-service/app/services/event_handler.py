import logging
from typing import Dict, Any
from app.services.recommendation_service import RecommendationService
from app.services.kafka_producer import KafkaProducerService

logger = logging.getLogger(__name__)


class ProductViewEventHandler:
    """
    Handler cho 'product.viewed' event từ Product Service

    Flow:
    1. Nhận event product.viewed từ Kafka
    2. Lấy recommendations từ ML model
    3. Gửi danh sách product IDs qua Kafka
    4. Product Service sẽ consume và query chi tiết
    """

    def __init__(self):
        self.recommendation_service = RecommendationService()
        self.kafka_producer = KafkaProducerService()

    async def handle_product_viewed(self, message: Dict[str, Any]):
        """
        Xử lý event khi user xem sản phẩm

        Message format:
        {
            "userId": "user123",
            "productId": "prod456",
            "productName": "iPhone 15",
            "timestamp": "2025-09-30T10:00:00Z"
        }
        """
        try:
            user_id = message.get('userId')
            product_id = message.get('productId')

            if not user_id or not product_id:
                logger.warning(f"Missing userId or productId in message: {message}")
                return

            logger.info(
                f"Processing product.viewed event - User: {user_id}, Product: {product_id}"
            )

            # Lấy recommendations từ ML model
            # Ưu tiên personalized recommendations cho user
            recommendations = self.recommendation_service.get_recommendations_for_user(
                user_id=user_id,
                current_product_id=product_id,
                limit=10
            )

            # Extract chỉ product IDs
            product_ids = [rec.product_id for rec in recommendations]

            if not product_ids:
                logger.info(f"No recommendations found for user {user_id}")
                return

            # Gửi product IDs qua Kafka
            success = self.kafka_producer.send_recommendations(
                user_id=user_id,
                product_ids=product_ids,
                request_id=f"view_{product_id}_{user_id}"
            )

            if success:
                logger.info(
                    f"Successfully sent {len(product_ids)} recommendations for user {user_id}"
                )
            else:
                logger.error(f"Failed to send recommendations for user {user_id}")

        except Exception as e:
            logger.error(
                f"Error handling product.viewed event: {e}",
                exc_info=True
            )

    def close(self):
        """Cleanup resources"""
        if self.recommendation_service:
            self.recommendation_service.close()
        if self.kafka_producer:
            self.kafka_producer.close()