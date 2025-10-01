from pydantic import BaseModel
from typing import Optional, List


class ProductViewEvent(BaseModel):
    """Event khi user xem product"""
    user_id: Optional[str] = None
    product_id: str
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    timestamp: Optional[int] = None


class ProductRecommendation(BaseModel):
    """Recommendation response"""
    product_id: str
    score: float
    reason: str  # "similar_category", "same_brand", "collaborative", etc.


class RecommendationRequest(BaseModel):
    """Request for recommendations"""
    user_id: Optional[str] = None
    product_id: Optional[str] = None
    limit: int = 10


class RecommendationResponse(BaseModel):
    """Response with recommendations"""
    recommendations: List[ProductRecommendation]
    user_id: Optional[str] = None