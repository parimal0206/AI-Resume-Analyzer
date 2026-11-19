import json
import numpy as np
from typing import List, Union
from functools import lru_cache
from app.core.config import settings

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

# Lazy-loaded model singleton
_model = None


def get_model():
    global _model
    if _model is None and SentenceTransformer:
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model


class EmbeddingService:
    def __init__(self):
        self._model = get_model()

    def encode(self, text: Union[str, List[str]]) -> np.ndarray:
        """Encode text into embeddings. Returns numpy array."""
        if self._model is None:
            # Fallback: return deterministic pseudo-embeddings based on text hash
            # This allows the system to work without sentence-transformers installed
            if isinstance(text, str):
                text = [text]
            return np.array([self._hash_embedding(t) for t in text])

        return self._model.encode(text, convert_to_numpy=True, normalize_embeddings=True)

    def _hash_embedding(self, text: str, dim: int = 384) -> np.ndarray:
        """Deterministic pseudo-embedding for fallback."""
        import hashlib
        hash_obj = hashlib.md5(text.encode())
        hash_bytes = hash_obj.digest()
        # Expand to dim dimensions
        vec = np.frombuffer(hash_bytes * (dim // 16 + 1), dtype=np.uint8)[:dim].astype(np.float32)
        # Normalize
        vec = vec / (np.linalg.norm(vec) + 1e-8)
        return vec

    def similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Cosine similarity between two embeddings."""
        return float(np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2) + 1e-8))

    def batch_similarity(self, query_emb: np.ndarray, candidate_embs: np.ndarray) -> np.ndarray:
        """Cosine similarity between query and batch of candidates."""
        norms_q = np.linalg.norm(query_emb) + 1e-8
        norms_c = np.linalg.norm(candidate_embs, axis=1) + 1e-8
        return np.dot(candidate_embs, query_emb) / (norms_c * norms_q)


# Global instance for easy import
embedding_service = EmbeddingService()