"""Initial migration

Revision ID: aab4b40a16b7
Revises: 
Create Date: 2025-03-18 23:48:42.479813

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'aab4b40a16b7'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('employee',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('employee_id', sa.String(length=50), nullable=False),
    sa.Column('role', sa.String(length=20), nullable=False),
    sa.Column('password_hash', sa.String(length=200), nullable=False),
    sa.Column('is_admin', sa.Boolean(), nullable=True),
    sa.Column('rating', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('employee_id')
    )
    op.create_table('project',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('priority', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('deadline', sa.DateTime(), nullable=True),
    sa.Column('employee_id', sa.Integer(), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['employee.id'], ),
    sa.ForeignKeyConstraint(['employee_id'], ['employee.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('rating',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('rating', sa.Float(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['employee.id'], ),
    sa.ForeignKeyConstraint(['employee_id'], ['employee.id'], ),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('rating')
    op.drop_table('project')
    op.drop_table('employee')
    # ### end Alembic commands ###
