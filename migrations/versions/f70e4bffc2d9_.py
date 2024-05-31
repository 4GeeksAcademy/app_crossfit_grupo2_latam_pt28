"""empty message

Revision ID: f70e4bffc2d9
Revises: f0905804032f
Create Date: 2024-05-31 14:21:55.200729

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f70e4bffc2d9'
down_revision = 'f0905804032f'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('message', schema=None) as batch_op:
        batch_op.add_column(sa.Column('recipient_id', sa.Integer(), nullable=False))
        batch_op.create_foreign_key(None, 'user', ['recipient_id'], ['id'])
        batch_op.drop_column('is_broadcast')
        batch_op.drop_column('subject')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('message', schema=None) as batch_op:
        batch_op.add_column(sa.Column('subject', sa.VARCHAR(length=255), autoincrement=False, nullable=False))
        batch_op.add_column(sa.Column('is_broadcast', sa.BOOLEAN(), autoincrement=False, nullable=True))
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('recipient_id')

    # ### end Alembic commands ###
