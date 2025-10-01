import redis
import json
from typing import List, Optional, Dict
from app.config import settings


class RedisService:
    """Service để lưu user history và product features"""

    def __init__(self):
        self.client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            decode_responses=True
        )

    def add_user_view(self, user_id: str, product_id: str, timestamp: int):
        """Thêm product vào history của user"""
        key = f"user:history:{user_id}"

        # Add to sorted set (score = timestamp)
        self.client.zadd(key, {product_id: timestamp})

        # Keep only last N items
        self.client.zremrangebyrank(key, 0, -(settings.user_history_limit + 1))

    def get_user_history(self, user_id: str, limit: int = 10) -> List[str]:
        """Lấy history của user (recent first)"""
        key = f"user:history:{user_id}"

        # Get most recent items
        product_ids = self.client.zrevrange(key, 0, limit - 1)
        return list(product_ids)

    def save_product_features(self, product_id: str, features: Dict):
        """Lưu features của product để tính similarity"""
        key = f"product:features:{product_id}"
        self.client.setex(key, 86400, json.dumps(features))  # TTL 24h

    def get_product_features(self, product_id: str) -> Optional[Dict]:
        """Lấy features của product"""
        key = f"product:features:{product_id}"
        data = self.client.get(key)

        if data:
            return json.loads(data)
        return None

    def increment_product_view_count(self, product_id: str):
        """Tăng view count cho product (để tính popularity)"""
        key = "product:popularity"
        self.client.zincrby(key, 1, product_id)

    def get_popular_products(self, limit: int = 10) -> List[str]:
        """Lấy top popular products"""
        key = "product:popularity"
        product_ids = self.client.zrevrange(key, 0, limit - 1)
        return list(product_ids)

    def save_recommendations_cache(self, user_id: str, recommendations: List[Dict], ttl: int = 300):
        """Cache recommendations cho user (5 phút)"""
        key = f"recommendations:{user_id}"
        self.client.setex(key, ttl, json.dumps(recommendations))

    def get_recommendations_cache(self, user_id: str) -> Optional[List[Dict]]:
        """Lấy cached recommendations"""
        key = f"recommendations:{user_id}"
        data = self.client.get(key)

        if data:
            return json.loads(data)
        return None