import json
from sqlalchemy import create_engine, TypeDecorator, Text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from config import settings


class JSONColumn(TypeDecorator):
    impl = Text

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return None

    def process_result_value(self, value, dialect):
        if value is not None:
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return []
        return []


DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {"sslmode": "require"}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
