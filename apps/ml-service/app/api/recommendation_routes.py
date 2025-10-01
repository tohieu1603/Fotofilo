from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
import uuid

from app.services.recommendation_service import RecommendationService
from app.services.kafka_producer import KafkaProducerService

logger = logging.getLogger(__name__)

router = APIRouter()
recommendation_service = RecommendationService()
kafka_producer = KafkaProducerService()


class RecommendationRequest(BaseModel):
    user_id: str
    current_product_id: Optional[str] = None
    limit: int = 10


class RecommendationResponse(BaseModel):
    request_id: str
    user_id: str
    product_ids: List[str]
    message: str


@router.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Lấy recommendations từ ML model và gửi product IDs qua Kafka
    Product service sẽ consume message này và query chi tiết sản phẩm
    """
    try:
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())

        # Lấy recommendations từ ML service
        recommendations = recommendation_service.get_recommendations_for_user(
            user_id=request.user_id,
            current_product_id=request.current_product_id,
            limit=request.limit
        )

        # Extract chỉ product IDs
        product_ids = [rec.product_id for rec in recommendations]

        # Gửi product IDs qua Kafka
        success = kafka_producer.send_recommendations(
            user_id=request.user_id,
            product_ids=product_ids,
            request_id=request_id
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send recommendations to Kafka"
            )

        logger.info(
            f"Sent {len(product_ids)} product IDs to Kafka for user {request.user_id}"
        )

        return RecommendationResponse(
            request_id=request_id,
            user_id=request.user_id,
            product_ids=product_ids,
            message=f"Successfully sent {len(product_ids)} recommendations"
        )

    except Exception as e:
        logger.error(f"Error getting recommendations: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error getting recommendations: {str(e)}"
        )


@router.get("/recommendations/{user_id}", response_model=RecommendationResponse)
async def get_recommendations_by_user_id(user_id: str, limit: int = 10):
    """
    Lấy recommendations cho user (GET endpoint)
    """
    request = RecommendationRequest(
        user_id=user_id,
        limit=limit
    )
    return await get_recommendations(request)


@router.post("/similar-products", response_model=RecommendationResponse)
async def get_similar_products(
    product_id: str,
    user_id: Optional[str] = None,
    limit: int = 10
):
    """
    Lấy similar products và gửi qua Kafka
    """
    try:
        request_id = str(uuid.uuid4())

        # Lấy similar products
        similar = recommendation_service.get_similar_products(
            product_id=product_id,
            limit=limit
        )

        product_ids = [rec.product_id for rec in similar]

        # Gửi qua Kafka
        success = kafka_producer.send_recommendations(
            user_id=user_id or "anonymous",
            product_ids=product_ids,
            request_id=request_id
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send recommendations to Kafka"
            )

        return RecommendationResponse(
            request_id=request_id,
            user_id=user_id or "anonymous",
            product_ids=product_ids,
            message=f"Successfully sent {len(product_ids)} similar products"
        )

    except Exception as e:
        logger.error(f"Error getting similar products: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error getting similar products: {str(e)}"
        )