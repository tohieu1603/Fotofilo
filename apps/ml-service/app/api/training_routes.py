from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.services.tfrs_service import TFRSRecommendationService

router = APIRouter()
tfrs_service = TFRSRecommendationService()


class TrainRequest(BaseModel):
    epochs: int = 5


class TrainResponse(BaseModel):
    status: str
    message: str


@router.post("/train", response_model=TrainResponse)
async def train_model(request: TrainRequest, background_tasks: BackgroundTasks):
    """
    Train TensorFlow Recommenders model
    This will run in background
    """

    def train_task():
        tfrs_service.train_model(epochs=request.epochs)

    background_tasks.add_task(train_task)

    return TrainResponse(
        status="started",
        message=f"Model training started with {request.epochs} epochs. Running in background."
    )


@router.get("/model/status")
async def get_model_status():
    """Get model training status"""
    return {
        "is_trained": tfrs_service.model.is_trained,
        "model_path": tfrs_service.model_path
    }