import os
from datetime import timedelta

class Config:
    # API Keys
    ALPHA_VANTAGE_API_KEY = '4AOOOTOE9Q87NXL2'
    GNEWS_API_KEY = '1f60e6ccea3d31a90e6a1c2fa458979b'
    
    # API URLs
    ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'
    GNEWS_BASE_URL = 'https://gnews.io/api/v4'
    
    # Application Settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'foci-finance-secret-key-2023'
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///foci_finance.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://focifinance.com",
        "https://www.focifinance.com"
    ]
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = "memory://"
    RATELIMIT_STRATEGY = "fixed-window"
    RATELIMIT_DEFAULT = "200 per day;50 per hour"
    
    # Cache
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300
    
    # Stock Settings
    TRACKED_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'JNJ', 'V']
    MARKET_INDICES = ['^DJI', '^GSPC', '^IXIC']
    
    # Refresh Intervals (in seconds)
    STOCK_REFRESH_INTERVAL = 300  # 5 minutes
    NEWS_REFRESH_INTERVAL = 3600  # 1 hour
    
    # Email Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'info@focifinance.com')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'info@focifinance.com')
    
    # Security
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'foci-finance-jwt-secret'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # File Upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = 'uploads'
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')