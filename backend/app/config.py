from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 h
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # --- AI & Content ---
    OLLAMA_URL: str = "http://localhost:11434/api/generate"
    AI_MODEL: str = "llama3"
    DEFAULT_DESCRIPTION: str = "La description de cette tendance n'est pas encore disponible. Nous vous prions de nous excuser pour ce désagrément et vous invitons à réessayer ultérieurement."
    DEFAULT_CONTEXT: str = "Le contexte de cette tendance n'est pas encore disponible. Nous vous prions de nous excuser pour ce désagrément et vous invitons à réessayer ultérieurement."
    DEFAULT_USAGE: str = "L'exemple d'usage pour cette tendance n'est pas encore disponible. Nous vous prions de nous excuser pour ce désagrément et vous invitons à réessayer ultérieurement."

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
