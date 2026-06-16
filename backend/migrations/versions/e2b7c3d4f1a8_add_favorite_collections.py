"""add_favorite_collections

Revision ID: e2b7c3d4f1a8
Revises: f3daea0ed346
Create Date: 2026-06-16 10:00:00.000000

"""
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'e2b7c3d4f1a8'
down_revision: Union[str, None] = 'f3daea0ed346'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'favorite_collections',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('emoji', sa.String(10), nullable=False, server_default='🔖'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_favcol_user', 'favorite_collections', ['user_id'])

    op.create_table(
        'favorite_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('collection_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('thread_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('trend_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['collection_id'], ['favorite_collections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['thread_id'], ['threads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trend_id'], ['trends.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('collection_id', 'thread_id', name='uq_favitem_col_thread'),
        sa.UniqueConstraint('collection_id', 'trend_id', name='uq_favitem_col_trend'),
    )
    op.create_index('ix_favitem_col', 'favorite_items', ['collection_id'])


def downgrade() -> None:
    op.drop_table('favorite_items')
    op.drop_table('favorite_collections')
