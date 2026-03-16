from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    llm_provider: str = Field(default="local", alias="LLM_PROVIDER")
    ollama_base_url: str = Field(default="http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="llama3.1:8b", alias="OLLAMA_MODEL")
    sqlite_db_path: str = Field(
        default="data/careerfit.db",
        alias="SQLITE_DB_PATH",
    )
    database_url: str | None = Field(default=None, alias="DATABASE_URL")


settings = Settings()
