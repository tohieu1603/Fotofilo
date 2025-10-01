from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_topic_product_view: str = "product.view"
    kafka_topic_recommendations: str = "product.recommendations"
    kafka_group_id: str = "ml-service-group"

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 2

    # gRPC & HTTP
    grpc_port: int = 50051
    http_port: int = 8000

    # Product Service gRPC
    product_service_grpc_url: str = "product-service:50051"

    # Recommendation settings
    max_recommendations: int = 20
    user_history_limit: int = 50
    similarity_threshold: float = 0.3

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()