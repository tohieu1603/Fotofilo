from typing import List, Dict, Optional
import logging
from app.config import settings
from app.services.redis_service import RedisService
from app.services.product_service_client import ProductServiceClient
from app.services.tfrs_service import TFRSRecommendationService
from app.models.product import ProductRecommendation

logger = logging.getLogger(__name__)


class RecommendationService:
    """
    Main Recommendation Service sử dụng TensorFlow Recommenders
    Two-Tower model architecture cho personalized recommendations
    """

    def __init__(self):
        self.redis = RedisService()
        self.product_client = ProductServiceClient()
        self.product_client.connect()

        # TensorFlow Recommenders engine
        self.tfrs_service = TFRSRecommendationService()

    def get_product_info(self, product_id: str) -> Optional[Dict]:
        """
        Lấy thông tin product từ Product Service qua gRPC
        Hoặc lấy từ Redis cache trước
        """
        # Try Redis cache first
        cached = self.redis.get_product_features(product_id)
        if cached:
            return cached

        # Call Product Service
        product_info = self.product_client.get_product(product_id)

        # Cache for future use
        if product_info:
            self.redis.save_product_features(product_id, product_info)

        return product_info

    def get_recommendations_for_user(
        self,
        user_id: str,
        current_product_id: Optional[str] = None,
        limit: int = 10
    ) -> List[ProductRecommendation]:
        """
        AI-powered personalized recommendations using TensorFlow Recommenders
        """

        # Check cache
        cached = self.redis.get_recommendations_cache(user_id)
        if cached:
            logger.info(f"Returning cached recommendations for user {user_id}")
            return [ProductRecommendation(**item) for item in cached[:limit]]

        recommendations: List[ProductRecommendation] = []

        try:
            # Get recommendations from TFRS model
            tfrs_recs = self.tfrs_service.get_recommendations(
                user_id=user_id,
                k=limit,
                filter_viewed=True
            )

            for product_id, score in tfrs_recs:
                recommendations.append(ProductRecommendation(
                    product_id=product_id,
                    score=score,
                    reason="ai_personalized"
                ))

            logger.info(f"Got {len(recommendations)} TFRS recommendations for user {user_id}")

        except Exception as e:
            logger.error(f"TFRS recommendation failed: {e}", exc_info=True)

        # Fallback to popular if not enough
        if len(recommendations) < limit:
            popular = self.get_popular_recommendations(limit=limit - len(recommendations))
            existing_ids = {r.product_id for r in recommendations}

            for prod in popular:
                if prod.product_id not in existing_ids:
                    recommendations.append(prod)

        # Cache results
        cache_data = [rec.dict() for rec in recommendations[:limit]]
        self.redis.save_recommendations_cache(user_id, cache_data, ttl=300)

        return recommendations[:limit]

    def get_similar_products(
        self,
        product_id: str,
        limit: int = 10
    ) -> List[ProductRecommendation]:
        """
        Lấy similar products
        Fallback: dựa trên category/brand nếu model chưa có
        """
        product_info = self.get_product_info(product_id)
        if not product_info:
            return []

        category_id = product_info.get('category_id')
        brand_id = product_info.get('brand_id')

        results = []

        # Lấy products cùng category/brand từ Product Service
        if category_id:
            similar_by_category = self.product_client.search_products(
                category_id=category_id,
                limit=limit
            )
            for prod in similar_by_category:
                if prod['id'] != product_id:
                    score = 1.0 if prod.get('brand_id') == brand_id else 0.7
                    results.append(ProductRecommendation(
                        product_id=prod['id'],
                        score=score,
                        reason="similar_category"
                    ))

        return results[:limit]


    def get_popular_recommendations(self, limit: int = 10) -> List[ProductRecommendation]:
        """Lấy popular products từ Redis"""
        popular_ids = self.redis.get_popular_products(limit=limit)

        results = []
        for idx, product_id in enumerate(popular_ids):
            score = 0.4 - (idx * 0.02)  # Giảm dần theo ranking
            results.append(ProductRecommendation(
                product_id=product_id,
                score=max(score, 0.2),
                reason="popular"
            ))

        return results

    def close(self):
        """Close connections"""
        if self.product_client:
            self.product_client.close()