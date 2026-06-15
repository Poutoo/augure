"""add community tables

Revision ID: a3f1e8c20d45
Revises: ec0f7c9bf290
Create Date: 2026-06-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f1e8c20d45'
down_revision: Union[str, None] = 'ec0f7c9bf290'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'threads',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('author_id', sa.UUID(), nullable=False),
        sa.Column('trend_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_locked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trend_id'], ['trends.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_threads_author_id'), 'threads', ['author_id'], unique=False)
    op.create_index(op.f('ix_threads_trend_id'), 'threads', ['trend_id'], unique=False)

    op.create_table(
        'comments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('author_id', sa.UUID(), nullable=False),
        sa.Column('thread_id', sa.UUID(), nullable=True),
        sa.Column('trend_id', sa.UUID(), nullable=True),
        sa.Column('parent_comment_id', sa.UUID(), nullable=True),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['thread_id'], ['threads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trend_id'], ['trends.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_comment_id'], ['comments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_comments_author_id'), 'comments', ['author_id'], unique=False)
    op.create_index(op.f('ix_comments_thread_id'), 'comments', ['thread_id'], unique=False)
    op.create_index(op.f('ix_comments_trend_id'), 'comments', ['trend_id'], unique=False)
    op.create_index(op.f('ix_comments_parent_comment_id'), 'comments', ['parent_comment_id'], unique=False)

    op.create_table(
        'likes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('thread_id', sa.UUID(), nullable=True),
        sa.Column('comment_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['thread_id'], ['threads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['comment_id'], ['comments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'thread_id', name='uq_like_user_thread'),
        sa.UniqueConstraint('user_id', 'comment_id', name='uq_like_user_comment'),
    )
    op.create_index(op.f('ix_likes_user_id'), 'likes', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_likes_user_id'), table_name='likes')
    op.drop_table('likes')

    op.drop_index(op.f('ix_comments_parent_comment_id'), table_name='comments')
    op.drop_index(op.f('ix_comments_trend_id'), table_name='comments')
    op.drop_index(op.f('ix_comments_thread_id'), table_name='comments')
    op.drop_index(op.f('ix_comments_author_id'), table_name='comments')
    op.drop_table('comments')

    op.drop_index(op.f('ix_threads_trend_id'), table_name='threads')
    op.drop_index(op.f('ix_threads_author_id'), table_name='threads')
    op.drop_table('threads')
