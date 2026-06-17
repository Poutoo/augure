"""merge multiple heads

Revision ID: 1d731941913c
Revises: 713a82e71e1b, e2b7c3d4f1a8
Create Date: 2026-06-17 14:04:07.330214

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1d731941913c'
down_revision: Union[str, None] = ('713a82e71e1b', 'e2b7c3d4f1a8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
