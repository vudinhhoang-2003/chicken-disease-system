import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from app.core import models
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

def seed_users(db: Session):
    """Create default users if not exist"""
    user = db.query(models.User).filter(models.User.email == "admin@gmail.com").first()
    if not user:
        logger.info("👤 Creating default admin user...")
        admin_user = models.User(
            email="admin@gmail.com",
            full_name="Super Admin",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        logger.info("✅ Admin user created: admin@gmail.com / admin123")
    else:
        logger.info("✅ Admin user already exists.")

def seed_knowledge_base(db: Session):
    """
    Import data from knowledge_base.json to Database if table is empty.
    """
    # Check if data already exists
    if db.query(models.Disease).first():
        logger.info("✅ Knowledge base already initialized in Database.")
        return

    json_path = Path("knowledge_base/raw_data/knowlege_base.json")
    if not json_path.exists():
        logger.warning(f"⚠️ Seed file not found at {json_path}")
        return

    try:
        logger.info("🌱 Seeding knowledge base from JSON...")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for item in data:
            # Create Disease
            disease = models.Disease(
                code=item["id"],
                name_vi=item["ten_benh_tieng_viet"],
                name_en=item["ten_benh_tieng_anh"],
                symptoms=item["trieu_chung_nhan_dien"],
                cause=item["nguyen_nhan"],
                prevention=item["phong_benh"]
            )
            db.add(disease)
            db.flush() # Get ID

            # Create Treatment Steps
            for step_data in item.get("phac_do_dieu_tri", []):
                step = models.TreatmentStep(
                    disease_id=disease.id,
                    step_order=step_data.get("buoc", 1),
                    description=step_data.get("mo_ta"),
                    action=step_data.get("hanh_dong")
                )
                db.add(step)
                db.flush()

                # Create Medicines
                if "thuoc_goi_y" in step_data:
                    for med_data in step_data["thuoc_goi_y"]:
                        medicine = models.Medicine(
                            step_id=step.id,
                            name=med_data.get("ten_thuoc"),
                            active_ingredient=med_data.get("hoat_chat"),
                            manufacturer=med_data.get("nha_san_xuat"),
                            dosage=med_data.get("lieu_dung"),
                            reference_source=med_data.get("nguon_tham_khao")
                        )
                        db.add(medicine)
        
        db.commit()
        logger.info("✅ Successfully seeded knowledge base!")
        
    except Exception as e:
        logger.error(f"❌ Error seeding database: {e}")
        db.rollback()
