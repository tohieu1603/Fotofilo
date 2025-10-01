import tensorflow as tf
import tensorflow_recommenders as tfrs
import numpy as np
import pickle
import logging
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class TwoTowerRecommenderModel(tfrs.Model):
    """
    Two-Tower Model architecture:
    - User Tower: Encode user features
    - Item Tower: Encode product features
    - Similarity: Dot product between towers
    """

    def __init__(
        self,
        user_model: tf.keras.Model,
        item_model: tf.keras.Model,
        task: tfrs.tasks.Retrieval
    ):
        super().__init__()
        self.user_model = user_model
        self.item_model = item_model
        self.task = task

    def compute_loss(self, features: Dict[str, tf.Tensor], training=False) -> tf.Tensor:
        """Compute loss during training"""
        user_embeddings = self.user_model(features["user_id"])
        item_embeddings = self.item_model(features["product_id"])

        return self.task(user_embeddings, item_embeddings)


class ProductRecommender:
    """
    TensorFlow Recommenders model cho product recommendations
    Sử dụng Two-Tower architecture
    """

    def __init__(self, embedding_dim: int = 32):
        self.embedding_dim = embedding_dim
        self.model: Optional[TwoTowerRecommenderModel] = None
        self.user_index = None
        self.item_index = None

        # Vocabularies
        self.user_ids_vocabulary = None
        self.product_ids_vocabulary = None
        self.category_vocabulary = None
        self.brand_vocabulary = None

        self.is_trained = False

    def build_user_model(self, user_ids: List[str]) -> tf.keras.Model:
        """
        Build user tower
        Input: user_id
        Output: user embedding
        """
        # Create vocabulary
        self.user_ids_vocabulary = tf.keras.layers.StringLookup(mask_token=None)
        self.user_ids_vocabulary.adapt(user_ids)

        user_model = tf.keras.Sequential([
            self.user_ids_vocabulary,
            tf.keras.layers.Embedding(
                input_dim=self.user_ids_vocabulary.vocabulary_size(),
                output_dim=self.embedding_dim
            )
        ], name="user_model")

        return user_model

    def build_item_model(
        self,
        product_ids: List[str],
        categories: List[str],
        brands: List[str]
    ) -> tf.keras.Model:
        """
        Build item tower with multiple features:
        - product_id
        - category_id
        - brand_id
        """
        # Product ID vocabulary
        self.product_ids_vocabulary = tf.keras.layers.StringLookup(mask_token=None)
        self.product_ids_vocabulary.adapt(product_ids)

        # Category vocabulary
        self.category_vocabulary = tf.keras.layers.StringLookup(mask_token=None)
        self.category_vocabulary.adapt(categories)

        # Brand vocabulary
        self.brand_vocabulary = tf.keras.layers.StringLookup(mask_token=None)
        self.brand_vocabulary.adapt(brands)

        # Build model
        product_id_input = tf.keras.Input(shape=(), dtype=tf.string, name='product_id')
        category_input = tf.keras.Input(shape=(), dtype=tf.string, name='category_id')
        brand_input = tf.keras.Input(shape=(), dtype=tf.string, name='brand_id')

        # Embeddings
        product_embedding = tf.keras.layers.Embedding(
            input_dim=self.product_ids_vocabulary.vocabulary_size(),
            output_dim=self.embedding_dim
        )(self.product_ids_vocabulary(product_id_input))

        category_embedding = tf.keras.layers.Embedding(
            input_dim=self.category_vocabulary.vocabulary_size(),
            output_dim=self.embedding_dim // 2
        )(self.category_vocabulary(category_input))

        brand_embedding = tf.keras.layers.Embedding(
            input_dim=self.brand_vocabulary.vocabulary_size(),
            output_dim=self.embedding_dim // 2
        )(self.brand_vocabulary(brand_input))

        # Concatenate features
        concatenated = tf.keras.layers.Concatenate()([
            product_embedding,
            category_embedding,
            brand_embedding
        ])

        # Dense layers
        x = tf.keras.layers.Dense(128, activation='relu')(concatenated)
        x = tf.keras.layers.Dropout(0.2)(x)
        x = tf.keras.layers.Dense(self.embedding_dim)(x)

        item_model = tf.keras.Model(
            inputs={'product_id': product_id_input, 'category_id': category_input, 'brand_id': brand_input},
            outputs=x,
            name="item_model"
        )

        return item_model

    def prepare_and_train(
        self,
        interactions: List[Dict],
        products: List[Dict],
        epochs: int = 5,
        batch_size: int = 4096
    ):
        """
        Train recommendation model

        interactions: [{'user_id': 'u1', 'product_id': 'p1'}, ...]
        products: [{'id': 'p1', 'category_id': 'c1', 'brand_id': 'b1'}, ...]
        """
        logger.info("Preparing training data...")

        # Extract unique values
        user_ids = list(set([i['user_id'] for i in interactions]))
        product_ids = [p['id'] for p in products]
        categories = [p.get('category_id', '') for p in products]
        brands = [p.get('brand_id', '') for p in products]

        # Build models
        logger.info("Building user and item models...")
        user_model = self.build_user_model(user_ids)
        item_model = self.build_item_model(product_ids, categories, brands)

        # Prepare candidates dataset (all products)
        products_dict = {p['id']: p for p in products}

        candidates_ds = tf.data.Dataset.from_tensor_slices({
            'product_id': product_ids,
            'category_id': [products_dict[pid].get('category_id', '') for pid in product_ids],
            'brand_id': [products_dict[pid].get('brand_id', '') for pid in product_ids]
        })

        # Create retrieval task
        task = tfrs.tasks.Retrieval(
            metrics=tfrs.metrics.FactorizedTopK(
                candidates=candidates_ds.batch(128).map(item_model)
            )
        )

        # Build recommender model
        self.model = TwoTowerRecommenderModel(user_model, item_model, task)
        self.model.compile(optimizer=tf.keras.optimizers.Adagrad(learning_rate=0.1))

        # Prepare training dataset
        logger.info(f"Preparing {len(interactions)} interactions for training...")

        train_data = []
        for interaction in interactions:
            product = products_dict.get(interaction['product_id'])
            if product:
                train_data.append({
                    'user_id': interaction['user_id'],
                    'product_id': interaction['product_id'],
                    'category_id': product.get('category_id', ''),
                    'brand_id': product.get('brand_id', '')
                })

        train_ds = tf.data.Dataset.from_tensor_slices({
            'user_id': [d['user_id'] for d in train_data],
            'product_id': [d['product_id'] for d in train_data],
            'category_id': [d['category_id'] for d in train_data],
            'brand_id': [d['brand_id'] for d in train_data]
        })

        train_ds = train_ds.shuffle(10000).batch(batch_size).cache()

        # Train
        logger.info(f"Training model for {epochs} epochs...")
        self.model.fit(train_ds, epochs=epochs, verbose=1)

        # Build BruteForce index for fast retrieval
        logger.info("Building retrieval index...")
        self.item_index = tfrs.layers.factorized_top_k.BruteForce(self.model.user_model)
        self.item_index.index_from_dataset(
            candidates_ds.batch(100).map(lambda x: (x['product_id'], self.model.item_model(x)))
        )

        self.is_trained = True
        logger.info("Training completed!")

    def recommend(
        self,
        user_id: str,
        k: int = 10,
        filter_products: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        """
        Get recommendations for user
        Returns: [(product_id, score), ...]
        """
        if not self.is_trained or self.item_index is None:
            logger.warning("Model not trained yet")
            return []

        try:
            # Get recommendations
            scores, product_ids = self.item_index(tf.constant([user_id]), k=k)

            # Convert to list
            recommendations = []
            for product_id, score in zip(product_ids[0].numpy(), scores[0].numpy()):
                product_id_str = product_id.decode('utf-8')

                # Filter if needed
                if filter_products and product_id_str in filter_products:
                    continue

                recommendations.append((product_id_str, float(score)))

            return recommendations

        except Exception as e:
            logger.error(f"Error getting recommendations: {e}", exc_info=True)
            return []

    def save(self, path: str):
        """Save model"""
        logger.info(f"Saving model to {path}")

        # Save TF model
        self.model.save(f"{path}_model")

        # Save vocabularies and metadata
        metadata = {
            'embedding_dim': self.embedding_dim,
            'is_trained': self.is_trained,
            'user_ids_vocabulary': self.user_ids_vocabulary,
            'product_ids_vocabulary': self.product_ids_vocabulary,
            'category_vocabulary': self.category_vocabulary,
            'brand_vocabulary': self.brand_vocabulary
        }

        with open(f"{path}_metadata.pkl", 'wb') as f:
            pickle.dump(metadata, f)

        logger.info("Model saved successfully")

    def load(self, path: str):
        """Load model"""
        logger.info(f"Loading model from {path}")

        # Load TF model
        self.model = tf.keras.models.load_model(f"{path}_model")

        # Load metadata
        with open(f"{path}_metadata.pkl", 'rb') as f:
            metadata = pickle.load(f)

        self.embedding_dim = metadata['embedding_dim']
        self.is_trained = metadata['is_trained']
        self.user_ids_vocabulary = metadata['user_ids_vocabulary']
        self.product_ids_vocabulary = metadata['product_ids_vocabulary']
        self.category_vocabulary = metadata['category_vocabulary']
        self.brand_vocabulary = metadata['brand_vocabulary']

        # Rebuild index
        # Note: Cần rebuild candidates dataset để tạo lại index
        logger.warning("Index needs to be rebuilt after loading")

        logger.info("Model loaded successfully")