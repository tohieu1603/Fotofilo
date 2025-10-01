import logging
import os
from typing import List, Dict, Optional, Tuple
from app.models.tfrs_model import ProductRecommender
from app.services.redis_service import RedisService
from app.services.product_service_client import ProductServiceClient

logger = logging.getLogger(__name__)


class TFRSRecommendationService:
    """
    TensorFlow Recommenders service
    Main recommendation engine sử dụng Two-Tower model
    """

    def __init__(self):
        self.redis = RedisService()
        self.product_client = ProductServiceClient()
        self.product_client.connect()

        self.model = ProductRecommender(embedding_dim=64)
        self.model_path = "models/tfrs_recommender"

        # Load pre-trained model
        self._load_model()

    def _load_model(self):
        """Load pre-trained model nếu có"""
        try:
            if os.path.exists(f"{self.model_path}_model"):
                self.model.load(self.model_path)
                logger.info("Loaded TensorFlow Recommenders model")
            else:
                logger.warning("No pre-trained model found. Need to train first.")
        except Exception as e:
            logger.error(f"Error loading model: {e}")

    def collect_training_data(self) -> Tuple[List[Dict], List[Dict]]:
        """
        Collect training data from Redis và Product Service
        """
        logger.info("Collecting training data...")

        # 1. Get user interactions from Redis
        interactions = []
        user_keys = self.redis.client.keys("user:history:*")

        for user_key in user_keys:
            user_id = user_key.split(":")[-1]
            product_ids = self.redis.get_user_history(user_id, limit=100)

            for product_id in product_ids:
                interactions.append({
                    'user_id': user_id,
                    'product_id': product_id
                })

        logger.info(f"Collected {len(interactions)} interactions from {len(user_keys)} users")

        # 2. Get product info
        unique_product_ids = list(set([i['product_id'] for i in interactions]))
        products = []

        # Batch get products from Product Service
        products_data = self.product_client.get_products_by_ids(unique_product_ids)

        # Fallback: get from Redis cache
        for product_id in unique_product_ids:
            product = next((p for p in products_data if p['id'] == product_id), None)

            if not product:
                # Try Redis cache
                product = self.redis.get_product_features(product_id)

            if product:
                products.append({
                    'id': product['id'],
                    'category_id': product.get('category_id', ''),
                    'brand_id': product.get('brand_id', '')
                })

        logger.info(f"Collected {len(products)} products")

        return interactions, products

    def train_model(self, epochs: int = 5):
        """
        Train TensorFlow Recommenders model
        """
        logger.info("Starting model training...")

        # Collect data
        interactions, products = self.collect_training_data()

        if len(interactions) < 50:
            logger.error("Not enough interactions to train. Need at least 50.")
            return False

        if len(products) < 10:
            logger.error("Not enough products to train. Need at least 10.")
            return False

        try:
            # Train model
            self.model.prepare_and_train(
                interactions=interactions,
                products=products,
                epochs=epochs,
                batch_size=2048
            )

            # Save model
            os.makedirs("models", exist_ok=True)
            self.model.save(self.model_path)

            logger.info("Model training completed and saved!")
            return True

        except Exception as e:
            logger.error(f"Error during training: {e}", exc_info=True)
            return False

    def get_recommendations(
        self,
        user_id: str,
        k: int = 10,
        filter_viewed: bool = True
    ) -> List[Tuple[str, float]]:
        """
        Get personalized recommendations cho user
        """
        if not self.model.is_trained:
            logger.warning("Model not trained. Returning popular products.")
            return self._get_popular_fallback(k)

        try:
            # Get user history để filter
            filter_products = None
            if filter_viewed:
                history = self.redis.get_user_history(user_id, limit=100)
                filter_products = set(history) if history else None

            # Get recommendations from TFRS model
            recommendations = self.model.recommend(
                user_id=user_id,
                k=k * 2,  # Get more để filter
                filter_products=filter_products
            )

            # Return top k after filtering
            return recommendations[:k]

        except Exception as e:
            logger.error(f"Error getting recommendations: {e}", exc_info=True)
            return self._get_popular_fallback(k)

    def _get_popular_fallback(self, k: int = 10) -> List[Tuple[str, float]]:
        """Fallback to popular products"""
        popular_ids = self.redis.get_popular_products(limit=k)

        return [(pid, 0.5) for pid in popular_ids]