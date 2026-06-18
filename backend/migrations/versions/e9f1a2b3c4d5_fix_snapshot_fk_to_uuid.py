"""fix trends_snapshots FK: replace trend_slug (VARCHAR) with trend_id (UUID)

Revision ID: e9f1a2b3c4d5
Revises: d3e7a9f02b14
Create Date: 2026-06-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'e9f1a2b3c4d5'
down_revision: Union[str, None] = 'd3e7a9f02b14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Supprimer l'index sur trend_slug
    op.drop_index('ix_trends_snapshots_trend_slug', table_name='trends_snapshots')

    # 2. Ajouter trend_id nullable (nécessaire pour la migration des données)
    op.add_column('trends_snapshots', sa.Column('trend_id', sa.UUID(), nullable=True))

    # 3. Remplir trend_id en résolvant le slug vers l'id
    op.execute("""
        UPDATE trends_snapshots ts
        SET trend_id = t.id
        FROM trends t
        WHERE t.slug = ts.trend_slug
    """)

    # 4. Passer trend_id NOT NULL maintenant que les données sont migrées
    op.alter_column('trends_snapshots', 'trend_id', nullable=False)

    # 5. Ajouter la FK vers trends.id
    op.create_foreign_key(
        'trends_snapshots_trend_id_fkey',
        'trends_snapshots', 'trends',
        ['trend_id'], ['id'],
        ondelete='CASCADE',
    )

    # 6. Créer l'index sur trend_id
    op.create_index(
        op.f('ix_trends_snapshots_trend_id'),
        'trends_snapshots', ['trend_id'],
        unique=False,
    )

    # 7. Supprimer l'ancienne FK et colonne trend_slug
    op.drop_constraint('trends_snapshots_trend_slug_fkey', 'trends_snapshots', type_='foreignkey')
    op.drop_column('trends_snapshots', 'trend_slug')


def downgrade() -> None:
    # Recréer trend_slug nullable, repeupler depuis trends.id → slug, puis NOT NULL
    op.add_column('trends_snapshots', sa.Column('trend_slug', sa.String(length=255), nullable=True))

    op.execute("""
        UPDATE trends_snapshots ts
        SET trend_slug = t.slug
        FROM trends t
        WHERE t.id = ts.trend_id
    """)

    op.alter_column('trends_snapshots', 'trend_slug', nullable=False)

    op.create_foreign_key(
        'trends_snapshots_trend_slug_fkey',
        'trends_snapshots', 'trends',
        ['trend_slug'], ['slug'],
        ondelete='CASCADE',
    )

    op.create_index('ix_trends_snapshots_trend_slug', 'trends_snapshots', ['trend_slug'], unique=False)

    op.drop_constraint('trends_snapshots_trend_id_fkey', 'trends_snapshots', type_='foreignkey')
    op.drop_index(op.f('ix_trends_snapshots_trend_id'), table_name='trends_snapshots')
    op.drop_column('trends_snapshots', 'trend_id')
