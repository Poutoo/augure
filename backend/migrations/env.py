from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Importe Base + tous les modèles pour que leurs tables soient enregistrées
from app.config import settings
from app.database import Base
from app.models import Interest, Trend, TrendTag, User, user_interests  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    # Pydantic-settings lit le .env — on utilise l'objet settings,
    # pas os.environ qui ne serait pas peuplé automatiquement.
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    cfg = dict(config.get_section(config.config_ini_section) or {})
    cfg["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(cfg, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
