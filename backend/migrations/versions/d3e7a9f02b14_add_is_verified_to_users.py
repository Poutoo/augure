"""add is_verified to users

Revision ID: d3e7a9f02b14
Revises: cf87b587ccc2
Create Date: 2026-06-17 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3e7a9f02b14'
down_revision: Union[str, None] = 'cf87b587ccc2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False))
    op.execute("UPDATE users SET is_verified = TRUE WHERE email = 'test@test.fr'")


def downgrade() -> None:
    op.drop_column('users', 'is_verified')
