import grpc
import logging
from typing import Optional, Dict, List
from app.config import settings

logger = logging.getLogger(__name__)


class ProductServiceClient:
    """gRPC client để gọi Product Service"""

    def __init__(self):
        self.channel = None
        self.stub = None

    def connect(self):
        """Kết nối tới Product Service"""
        try:
            self.channel = grpc.insecure_channel(settings.product_service_grpc_url)
            # Import proto generated code (sẽ cần generate từ .proto files)
            # self.stub = product_pb2_grpc.ProductServiceStub(self.channel)
            logger.info(f"Connected to Product Service at {settings.product_service_grpc_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Product Service: {e}")

    def get_product(self, product_id: str) -> Optional[Dict]:
        """
        Lấy thông tin product từ Product Service
        Returns: {id, name, category_id, brand_id}
        """
        try:
            # TODO: Implement gRPC call khi có proto
            # request = product_pb2.GetProductRequest(id=product_id)
            # response = self.stub.GetProduct(request)
            # return response

            # Temporary: Return mock data
            logger.warning(f"Mock call: get_product({product_id})")
            return None

        except grpc.RpcError as e:
            logger.error(f"gRPC error calling GetProduct: {e}")
            return None
        except Exception as e:
            logger.error(f"Error calling GetProduct: {e}")
            return None

    def get_products_by_ids(self, product_ids: List[str]) -> List[Dict]:
        """
        Lấy thông tin nhiều products
        """
        try:
            # TODO: Implement batch get products
            logger.warning(f"Mock call: get_products_by_ids({len(product_ids)} products)")
            return []

        except Exception as e:
            logger.error(f"Error calling get_products_by_ids: {e}")
            return []

    def search_products(
        self,
        category_id: Optional[str] = None,
        brand_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict]:
        """
        Search products by category/brand
        """
        try:
            # TODO: Implement gRPC call
            logger.warning(f"Mock call: search_products(category={category_id}, brand={brand_id})")
            return []

        except Exception as e:
            logger.error(f"Error calling search_products: {e}")
            return []

    def close(self):
        """Đóng connection"""
        if self.channel:
            self.channel.close()
            logger.info("Product Service connection closed")