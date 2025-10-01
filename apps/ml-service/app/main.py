from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import threading

from app.api.training_routes import router as training_router
from app.api.recommendation_routes import router as recommendation_router
from app.services.kafka_consumer import KafkaConsumerService
from app.services.event_handler import ProductViewEventHandler
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="ML Recommendation Service",
    description="TensorFlow Recommenders based ML service",
    version="1.0.0"
)

# Global instances
kafka_consumer = None
event_handler = None
consumer_thread = None

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(training_router, prefix="/api/training", tags=["Training"])
app.include_router(recommendation_router, prefix="/api", tags=["Recommendations"])


@app.get("/")
async def root():
    return {
        "service": "ML Recommendation Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "kafka_consumer": "running" if kafka_consumer and kafka_consumer.running else "stopped"
    }


@app.on_event("startup")
async def startup_event():
    """
    Khởi động Kafka consumer khi app start
    Consumer sẽ chạy trong background thread
    """
    global kafka_consumer, event_handler, consumer_thread

    try:
        logger.info("Starting Kafka consumer...")

        # Initialize event handler
        event_handler = ProductViewEventHandler()

        # Initialize Kafka consumer
        kafka_consumer = KafkaConsumerService()
        kafka_consumer.connect()

        # Register handler cho 'product.viewed' topic
        kafka_consumer.register_handler(
            settings.kafka_topic_product_view,
            event_handler.handle_product_viewed
        )

        # Start consumer trong background thread
        consumer_thread = threading.Thread(
            target=kafka_consumer.start,
            daemon=True
        )
        consumer_thread.start()

        logger.info("Kafka consumer started successfully")

    except Exception as e:
        logger.error(f"Failed to start Kafka consumer: {e}", exc_info=True)


@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup khi app shutdown
    """
    global kafka_consumer, event_handler

    logger.info("Shutting down...")

    if kafka_consumer:
        kafka_consumer.stop()

    if event_handler:
        event_handler.close()

    logger.info("Shutdown complete")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.http_port,
        reload=True
    )