import uuid
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, BigInteger, DateTime, Integer, select, text
from sqlalchemy.engine import URL
from dotenv import load_dotenv
import os

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database config
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "root")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "file_db")

# Base for all models
Base = declarative_base()

# Document Model
class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    collection_name = Column(String(255), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    document_count = Column(Integer, nullable=False, default=1)
    chunk_count = Column(Integer, nullable=False, default=0)
    file_size = Column(BigInteger, nullable=True)
    upload_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    storage_path = Column(String(500), nullable=True)


class DBService:
    def __init__(self):
        self.mysql_user = MYSQL_USER
        self.mysql_password = MYSQL_PASSWORD
        self.mysql_host = MYSQL_HOST
        self.mysql_port = int(MYSQL_PORT)
        self.mysql_database = MYSQL_DATABASE
        
        # Initialize engines as None - will be created during init
        self.engine = None
        self.async_session = None

    def _create_base_url(self):
        """Create SQLAlchemy URL object for base connection (no database)"""
        return URL.create(
            drivername="mysql+aiomysql",
            username=self.mysql_user,
            password=self.mysql_password,
            host=self.mysql_host,
            port=self.mysql_port
        )

    def _create_database_url(self):
        """Create SQLAlchemy URL object for database connection"""
        return URL.create(
            drivername="mysql+aiomysql",
            username=self.mysql_user,
            password=self.mysql_password,
            host=self.mysql_host,
            port=self.mysql_port,
            database=self.mysql_database
        )

    async def _create_database_if_not_exists(self):
        """Create database if it doesn't exist"""
        base_url = self._create_base_url()
        
        try:
            logger.info(f"🔗 Connecting to MySQL server at {self.mysql_host}:{self.mysql_port} with user: {self.mysql_user}")
            logger.info(f"🔍 Password length: {len(self.mysql_password)} characters")
            
            temp_engine = create_async_engine(base_url, echo=False)
            
            async with temp_engine.begin() as conn:
                # Check if database exists
                logger.info(f"🔍 Checking if database '{self.mysql_database}' exists...")
                result = await conn.execute(
                    text("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = :db_name"),
                    {"db_name": self.mysql_database}
                )
                db_exists = result.fetchone()
                
                if not db_exists:
                    # Create database
                    logger.info(f"📝 Creating database '{self.mysql_database}'...")
                    await conn.execute(
                        text(f"CREATE DATABASE `{self.mysql_database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                    )
                    logger.info(f"✅ Successfully created database '{self.mysql_database}'")
                else:
                    logger.info(f"✅ Database '{self.mysql_database}' already exists")
            
            await temp_engine.dispose()
            
        except Exception as e:
            logger.error(f"❌ Error creating database: {str(e)}")
            logger.error(f"🔧 Connection details - Host: {self.mysql_host}, Port: {self.mysql_port}, User: {self.mysql_user}")
            logger.error("💡 Troubleshooting steps:")
            logger.error("   1. Check if MySQL container is running: docker ps")
            logger.error("   2. Verify container logs: docker logs mysql")
            logger.error("   3. Test manual connection: docker exec -it mysql mysql -u chintan -p")
            logger.error("   4. Check port mapping: netstat -an | grep 3306")
            logger.error("   5. Verify .env file values")
            
            # Let's also test a simple connection
            logger.error("🧪 Attempting basic connection test...")
            try:
                import aiomysql
                conn = await aiomysql.connect(
                    host=self.mysql_host,
                    port=self.mysql_port,
                    user=self.mysql_user,
                    password=self.mysql_password
                )
                await conn.ensure_closed()
                logger.error("✅ Basic aiomysql connection successful - issue might be with SQLAlchemy URL")
            except Exception as basic_error:
                logger.error(f"❌ Basic connection also failed: {str(basic_error)}")
            
            raise

    async def init_db(self):
        """Initialize database and create tables"""
        try:
            logger.info("🚀 Initializing database connection...")
            
            # First, create database if it doesn't exist
            await self._create_database_if_not_exists()
            
            # Now create engine with the database
            database_url = self._create_database_url()
            logger.info(f"🔗 Connecting to database '{self.mysql_database}'...")
            
            self.engine = create_async_engine(database_url, echo=True, future=True)
            self.async_session = sessionmaker(
                self.engine, 
                expire_on_commit=False, 
                class_=AsyncSession
            )
            
            # Create tables
            logger.info("📋 Creating database tables...")
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            logger.info("✅ Database initialized successfully (tables created if missing)")
            
        except Exception as e:
            logger.error(f"❌ Error initializing database: {str(e)}")
            raise

    async def test_connection(self):
        """Test database connection"""
        try:
            if not self.engine:
                raise Exception("Database not initialized. Call init_db() first.")
                
            async with self.engine.begin() as conn:
                result = await conn.execute(text("SELECT 1 as test"))
                test_result = result.fetchone()
                logger.info(f"✅ Database connection test successful - Result: {test_result}")
                return True
        except Exception as e:
            logger.error(f"❌ Database connection test failed: {str(e)}")
            return False

    async def insert_document(
        self, 
        collection_name: str, 
        filename: str, 
        document_count: int = 1,
        chunk_count: int = 0,
        file_size: int = None,
        storage_path: str = None
    ) -> str:
        """Insert a new document record"""
        if not self.async_session:
            raise Exception("Database not initialized. Call init_db() first.")
            
        async with self.async_session() as session:
            doc = Document(
                collection_name=collection_name,
                filename=filename,
                document_count=document_count,
                chunk_count=chunk_count,
                file_size=file_size,
                storage_path=storage_path,
            )
            session.add(doc)
            await session.commit()
            await session.refresh(doc)
            logger.info(f"✅ Inserted document {filename} into DB with id {doc.id}")
            return doc.id

    async def get_all_documents(self):
        """Fetch all documents"""
        if not self.async_session:
            raise Exception("Database not initialized. Call init_db() first.")
            
        async with self.async_session() as session:
            result = await session.execute(
                select(Document).order_by(Document.upload_date.desc())
            )
            return result.scalars().all()

    async def get_all_documents_paginated(self, limit: int = 10, offset: int = 0):
        """Fetch documents with pagination"""
        if not self.async_session:
            raise Exception("Database not initialized. Call init_db() first.")
            
        async with self.async_session() as session:
            result = await session.execute(
                select(Document)
                .order_by(Document.upload_date.desc())
                .limit(limit)
                .offset(offset)
            )
            return result.scalars().all()
    async def count_all_documents(self) -> int:
        """Count total number of documents"""
        if not self.async_session:
            raise Exception("Database not initialized. Call init_db() first.")
            
        async with self.async_session() as session:
            result = await session.execute(
                select(text("COUNT(1)")).select_from(Document)
            )
            count = result.scalar_one()
            return count if count is not None else 0
        
    async def get_document_by_collection(self, collection_name: str):
        """Get document by collection name"""
        if not self.async_session:
            raise Exception("Database not initialized. Call init_db() first.")
            
        async with self.async_session() as session:
            result = await session.execute(
                select(Document).where(Document.collection_name == collection_name)
            )
            return result.scalars().first()
        
    async def get_document_by_id(self, id: str):
        """Get document by collection name"""
        if not self.async_session:
            raise Exception("Database not initialized. Call init_db() first.")
            
        async with self.async_session() as session:
            result = await session.execute(
                select(Document).where(Document.id == id)
            )
            return result.scalars().first()

    async def delete_document(self, document_id: str) -> bool:
        """Delete a document by ID"""
        if not self.async_session:
            raise Exception("Database not initialized. Call init_db() first.")
            
        async with self.async_session() as session:
            result = await session.execute(
                select(Document).where(Document.id == document_id)
            )
            doc = result.scalars().first()
            if doc:
                await session.delete(doc)
                await session.commit()
                logger.info(f"✅ Deleted document {document_id}")
                return True
            return False

    async def close(self):
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
            logger.info("✅ Database connections closed")


# Global instance
_db_service_instance = None

async def get_db_service() -> DBService:
    """Dependency to get database service instance"""
    global _db_service_instance
    if _db_service_instance is None:
        _db_service_instance = DBService()
        await _db_service_instance.init_db()
    return _db_service_instance