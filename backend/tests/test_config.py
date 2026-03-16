from app.core.config import Settings


def test_settings_build_database_url() -> None:
    settings = Settings(
        db_host="127.0.0.1",
        db_port=5432,
        db_name="session_trading",
        db_user="session_trading",
        db_password="session_trading",
    )

    assert (
        settings.database_url
        == "postgresql+asyncpg://session_trading:session_trading@127.0.0.1:5432/session_trading"
    )
