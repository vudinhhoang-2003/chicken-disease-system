from typing import Any
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security
from app.core.database import get_db
from app.core.models import User
from app.config import get_settings
from pydantic import BaseModel
from typing import Optional

settings = get_settings()
router = APIRouter()

class UserCreate(BaseModel):

    email: Optional[str] = None

    password: str

    full_name: str

    phone: str # Phone is mandatory

    role: str = "farmer" # farmer, vet, admin



class Token(BaseModel):

    access_token: str

    token_type: str

    user_role: str

    user_name: str



@router.post("/login", response_model=Token)

def login_access_token(

    db: Session = Depends(get_db), 

    form_data: OAuth2PasswordRequestForm = Depends()

) -> Any:

    """

    OAuth2 compatible token login, supports Login via Email OR Phone

    """

    # Tìm kiếm user bằng Email HOẶC Số điện thoại

    user = db.query(User).filter(

        (User.email == form_data.username) | (User.phone == form_data.username)

    ).first()

    

    if not user or not security.verify_password(form_data.password, user.hashed_password):

        raise HTTPException(status_code=400, detail="Email/Số điện thoại hoặc mật khẩu không đúng")

    

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)

    

    return {

        "access_token": security.create_access_token(

            user.id, expires_delta=access_token_expires

        ),

        "token_type": "bearer",

        "user_role": user.role,

        "user_name": user.full_name

    }



@router.post("/register", response_model=Token)

def register_user(

    user_in: UserCreate,

    db: Session = Depends(get_db)

) -> Any:

    """

    Create new user with mandatory Phone and optional Email

    """

    # 1. Kiểm tra số điện thoại (Khóa chính mới)

    user_by_phone = db.query(User).filter(User.phone == user_in.phone).first()

    if user_by_phone:

        raise HTTPException(

            status_code=400,

            detail="Số điện thoại này đã được đăng ký trong hệ thống.",

        )



    # 2. Kiểm tra email (nếu người dùng có nhập)

    if user_in.email:

        user_by_email = db.query(User).filter(User.email == user_in.email).first()

        if user_by_email:

            raise HTTPException(

                status_code=400,

                detail="Email này đã được sử dụng.",

            )

        

    user = User(

        email=user_in.email,

        hashed_password=security.get_password_hash(user_in.password),

        full_name=user_in.full_name,

        phone=user_in.phone,

        role=user_in.role,

    )

    db.add(user)

    db.commit()

    db.refresh(user)

    

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)

    

    return {

        "access_token": security.create_access_token(

            user.id, expires_delta=access_token_expires

        ),

        "token_type": "bearer",

        "user_role": user.role,

        "user_name": user.full_name

    }
