from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260317_02"
down_revision = "20260317_01"
branch_labels = None
depends_on = None


def _create_timescaledb_extension() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")


def _create_market_ticker_hypertable() -> None:
    op.execute(
        """
        SELECT create_hypertable(
            'market_ticker_events',
            'event_time',
            if_not_exists => TRUE
        )
        """
    )


def _set_market_ticker_retention(days: int) -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM timescaledb_information.jobs
                WHERE hypertable_name = 'market_ticker_events'
                  AND proc_name = 'policy_retention'
            ) THEN
                PERFORM remove_retention_policy('market_ticker_events', if_exists => TRUE);
            END IF;
            PERFORM add_retention_policy(
                'market_ticker_events',
                drop_after => make_interval(days => %s),
                if_not_exists => TRUE
            );
        END
        $$;
        """
        % days
    )


def upgrade() -> None:
    _create_timescaledb_extension()

    op.create_table(
        "app_settings",
        sa.Column("key", sa.String(length=255), primary_key=True),
        sa.Column(
            "value",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_table(
        "market_ticker_events",
        sa.Column("event_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("market_listing_id", sa.Integer(), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("exchange_id", sa.Integer(), nullable=False),
        sa.Column("raw_symbol", sa.String(length=64), nullable=False),
        sa.Column("trade_price", sa.Numeric(24, 8), nullable=False),
        sa.Column("signed_change_rate", sa.Numeric(20, 10), nullable=True),
        sa.Column("acc_trade_volume_24h", sa.Numeric(30, 10), nullable=True),
        sa.Column(
            "source_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["exchange_id"], ["exchanges.id"]),
        sa.ForeignKeyConstraint(["market_listing_id"], ["market_listings.id"]),
        sa.PrimaryKeyConstraint("event_time", "market_listing_id", "received_at"),
    )
    op.create_index(
        "ix_market_ticker_events_market_listing_id_event_time",
        "market_ticker_events",
        ["market_listing_id", "event_time"],
    )
    op.create_index(
        "ix_market_ticker_events_exchange_id_event_time",
        "market_ticker_events",
        ["exchange_id", "event_time"],
    )

    op.create_table(
        "latest_market_tickers",
        sa.Column("market_listing_id", sa.Integer(), primary_key=True),
        sa.Column("exchange_id", sa.Integer(), nullable=False),
        sa.Column("raw_symbol", sa.String(length=64), nullable=False),
        sa.Column("trade_price", sa.Numeric(24, 8), nullable=False),
        sa.Column("signed_change_rate", sa.Numeric(20, 10), nullable=True),
        sa.Column("acc_trade_volume_24h", sa.Numeric(30, 10), nullable=True),
        sa.Column("event_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "source_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["exchange_id"], ["exchanges.id"]),
        sa.ForeignKeyConstraint(["market_listing_id"], ["market_listings.id"]),
    )

    _create_market_ticker_hypertable()
    _set_market_ticker_retention(days=3)


def downgrade() -> None:
    op.execute("SELECT remove_retention_policy('market_ticker_events', if_exists => TRUE)")
    op.drop_table("latest_market_tickers")
    op.drop_index(
        "ix_market_ticker_events_exchange_id_event_time",
        table_name="market_ticker_events",
    )
    op.drop_index(
        "ix_market_ticker_events_market_listing_id_event_time",
        table_name="market_ticker_events",
    )
    op.drop_table("market_ticker_events")
    op.drop_table("app_settings")
