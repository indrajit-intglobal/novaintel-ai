from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str  # Supabase uses UUID strings
    email: str
    full_name: str
    is_active: bool = True
    email_verified: bool = False
    message: str = ""
    role: str = "presales_manager"  # Optional, for backward compatibility
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None

class UserSettingsUpdate(BaseModel):
    default_industry: str | None = None
    proposal_tone: str | None = None
    ai_response_style: str | None = None
    secure_mode: bool | None = None
    auto_save_insights: bool | None = None

