from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Database
    mongodb_url: str = Field(default="mongodb://localhost:27017", env="MONGODB_URL")
    database_name: str = Field(default="clinica-dashboard", env="DATABASE_NAME")
    
    # Security
    secret_key: str = Field(default="clinic-dashboard-default-secret-change-me", env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # API Configuration
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    debug: bool = Field(default=False, env="DEBUG")
    
    # External APIs
    waha_base_url: str = Field(default="http://pampaservers.com:60513", env="WAHA_BASE_URL")
    waha_api_key: str = Field(default="pampaserver2025enservermuA!", env="WAHA_API_KEY")
    n8n_base_url: str = Field(default="", env="N8N_BASE_URL")
    n8n_api_key: str = Field(default="", env="N8N_API_KEY")
    
    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173,https://dashboard-clinica.vercel.app",
        env="CORS_ORIGINS"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    # Admin UI
    admin_ui_port: int = Field(default=8501, env="ADMIN_UI_PORT")
    admin_ui_host: str = Field(default="0.0.0.0", env="ADMIN_UI_HOST")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()