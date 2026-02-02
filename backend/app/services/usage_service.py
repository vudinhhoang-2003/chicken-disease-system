import logging
from sqlalchemy.orm import Session
from app.core import models
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

class UsageService:
    @staticmethod
    def log_usage(
        feature: str,
        provider: str,
        model: str,
        user_id: int = None,
        tokens_prompt: int = 0,
        tokens_completion: int = 0,
        cost_est: float = 0.0
    ):
        """Ghi nhật ký sử dụng AI"""
        db = SessionLocal()
        try:
            total_tokens = tokens_prompt + tokens_completion
            log = models.UsageLog(
                user_id=user_id,
                feature=feature,
                provider=provider,
                model=model,
                tokens_prompt=tokens_prompt,
                tokens_completion=tokens_completion,
                total_tokens=total_tokens,
                cost_est=cost_est
            )
            db.add(log)
            db.commit()
            logger.info(f"📊 Usage Log: {feature} | {provider} | {total_tokens} tokens")
        except Exception as e:
            logger.error(f"❌ Failed to log usage: {e}")
        finally:
            db.close()

# Singleton
usage_service = UsageService()
