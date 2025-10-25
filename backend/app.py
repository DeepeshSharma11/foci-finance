from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import requests
import json
import os
from datetime import datetime, timedelta
from config import Config

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
CORS(app)
cache = Cache(app)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Tracked stocks and indices
TRACKED_STOCKS = Config.TRACKED_STOCKS
MARKET_INDICES = Config.MARKET_INDICES

class StockService:
    def __init__(self):
        self.alpha_vantage_key = Config.ALPHA_VANTAGE_API_KEY
        self.base_url = Config.ALPHA_VANTAGE_BASE_URL
    
    def get_stock_quote(self, symbol):
        """Fetch stock quote from Alpha Vantage"""
        try:
            url = f"{self.base_url}?function=GLOBAL_QUOTE&symbol={symbol}&apikey={self.alpha_vantage_key}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'Global Quote' in data:
                quote = data['Global Quote']
                return {
                    'symbol': quote['01. symbol'],
                    'price': float(quote['05. price']),
                    'change': float(quote['09. change']),
                    'change_percent': float(quote['10. change percent'].replace('%', '')),
                    'volume': int(quote['06. volume']),
                    'latest_trading_day': quote['07. latest trading day']
                }
            return None
        except Exception as e:
            print(f"Error fetching stock data for {symbol}: {e}")
            return self.get_fallback_data(symbol)
    
    def get_fallback_data(self, symbol):
        """Generate fallback data when API fails"""
        base_prices = {
            'AAPL': 178.72, 'GOOGL': 138.21, 'MSFT': 330.53, 'AMZN': 145.80,
            'TSLA': 248.42, 'META': 312.65, 'NVDA': 435.15, 'JPM': 159.32,
            'JNJ': 157.89, 'V': 239.76, '^DJI': 34261.42, '^GSPC': 4453.53, '^IXIC': 13760.70
        }
        
        base_price = base_prices.get(symbol, 100)
        change = (hash(symbol + datetime.now().strftime('%H')) % 200 - 100) / 10
        change_percent = (change / base_price) * 100
        
        return {
            'symbol': symbol,
            'price': base_price + change,
            'change': change,
            'change_percent': change_percent,
            'volume': 1000000,
            'latest_trading_day': datetime.now().strftime('%Y-%m-%d')
        }

class NewsService:
    def __init__(self):
        self.gnews_key = Config.GNEWS_API_KEY
        self.base_url = Config.GNEWS_BASE_URL
    
    def get_financial_news(self, max_results=6):
        """Fetch financial news from GNews API"""
        try:
            url = f"{self.base_url}/top-headlines?category=business&lang=en&country=us&max={max_results}&apikey={self.gnews_key}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'articles' in data:
                return data['articles']
            return self.get_fallback_news(max_results)
        except Exception as e:
            print(f"Error fetching news: {e}")
            return self.get_fallback_news(max_results)
    
    def get_fallback_news(self, max_results=6):
        """Generate fallback news when API fails"""
        fallback_news = [
            {
                'source': {'name': 'Financial Times'},
                'title': 'Markets Show Resilience Amid Economic Uncertainty',
                'publishedAt': (datetime.now() - timedelta(hours=2)).isoformat() + 'Z',
                'url': 'https://example.com/article1',
                'description': 'Global markets demonstrate stability despite ongoing economic challenges.'
            },
            {
                'source': {'name': 'Bloomberg'},
                'title': 'Tech Stocks Lead Market Rally as Earnings Season Begins',
                'publishedAt': (datetime.now() - timedelta(hours=4)).isoformat() + 'Z',
                'url': 'https://example.com/article2',
                'description': 'Technology sector outperforms as companies report strong quarterly results.'
            },
            {
                'source': {'name': 'Reuters'},
                'title': 'Central Banks Maintain Hawkish Stance on Inflation',
                'publishedAt': (datetime.now() - timedelta(hours=6)).isoformat() + 'Z',
                'url': 'https://example.com/article3',
                'description': 'Major central banks continue tight monetary policies to combat inflation.'
            },
            {
                'source': {'name': 'Wall Street Journal'},
                'title': 'Investment Firms Increase Exposure to Emerging Markets',
                'publishedAt': (datetime.now() - timedelta(hours=8)).isoformat() + 'Z',
                'url': 'https://example.com/article4',
                'description': 'Institutional investors shift focus to high-growth emerging economies.'
            },
            {
                'source': {'name': 'CNBC'},
                'title': 'Cryptocurrency Market Shows Signs of Stabilization',
                'publishedAt': (datetime.now() - timedelta(hours=10)).isoformat() + 'Z',
                'url': 'https://example.com/article5',
                'description': 'Digital asset prices find support after recent volatility.'
            },
            {
                'source': {'name': 'Forbes'},
                'title': 'Sustainable Investing Gains Traction Among Millennials',
                'publishedAt': (datetime.now() - timedelta(hours=12)).isoformat() + 'Z',
                'url': 'https://example.com/article6',
                'description': 'Younger investors prioritize ESG factors in portfolio construction.'
            }
        ]
        return fallback_news[:max_results]

# Initialize services
stock_service = StockService()
news_service = NewsService()

# Routes
@app.route('/')
def home():
    return jsonify({
        'message': 'Foci Finance API',
        'version': '1.0.0',
        'endpoints': {
            '/api/stocks': 'Get all tracked stocks',
            '/api/stocks/<symbol>': 'Get specific stock data',
            '/api/indices': 'Get market indices',
            '/api/news': 'Get financial news',
            '/api/market-status': 'Get current market status'
        }
    })

@app.route('/api/stocks')
@cache.cached(timeout=300)  # Cache for 5 minutes
@limiter.limit("50 per minute")
def get_all_stocks():
    """Get data for all tracked stocks"""
    try:
        stocks_data = []
        for symbol in TRACKED_STOCKS[:6]:  # Limit to first 6 for performance
            stock_data = stock_service.get_stock_quote(symbol)
            if stock_data:
                stocks_data.append(stock_data)
        
        return jsonify({
            'success': True,
            'data': stocks_data,
            'count': len(stocks_data),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/stocks/<symbol>')
@cache.cached(timeout=300)  # Cache for 5 minutes
@limiter.limit("100 per minute")
def get_stock(symbol):
    """Get data for specific stock"""
    try:
        stock_data = stock_service.get_stock_quote(symbol.upper())
        if stock_data:
            return jsonify({
                'success': True,
                'data': stock_data,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Stock not found',
                'timestamp': datetime.now().isoformat()
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/indices')
@cache.cached(timeout=300)  # Cache for 5 minutes
@limiter.limit("50 per minute")
def get_market_indices():
    """Get data for market indices"""
    try:
        indices_data = []
        for symbol in MARKET_INDICES:
            index_data = stock_service.get_stock_quote(symbol)
            if index_data:
                indices_data.append(index_data)
        
        return jsonify({
            'success': True,
            'data': indices_data,
            'count': len(indices_data),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/news')
@cache.cached(timeout=3600)  # Cache for 1 hour
@limiter.limit("50 per minute")
def get_news():
    """Get financial news"""
    try:
        news_data = news_service.get_financial_news(6)
        return jsonify({
            'success': True,
            'data': news_data,
            'count': len(news_data),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/market-status')
@cache.cached(timeout=60)  # Cache for 1 minute
@limiter.limit("100 per minute")
def get_market_status():
    """Get current market status (open/closed)"""
    try:
        now = datetime.now()
        day = now.weekday()  # Monday=0, Sunday=6
        hour = now.hour
        minute = now.minute
        
        # Simple market hours check (9:30 AM - 4:00 PM ET, Monday-Friday)
        is_market_open = (day >= 0 and day <= 4 and  # Monday to Friday
                         ((hour > 9 or (hour == 9 and minute >= 30)) and hour < 16))
        
        return jsonify({
            'success': True,
            'data': {
                'is_open': is_market_open,
                'status': 'open' if is_market_open else 'closed',
                'timestamp': now.isoformat(),
                'next_open': get_next_market_open(now)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

def get_next_market_open(current_time):
    """Calculate next market open time"""
    if current_time.weekday() >= 5:  # Weekend
        days_until_monday = (7 - current_time.weekday()) % 7
        next_open = current_time + timedelta(days=days_until_monday)
    else:  # Weekday
        if current_time.hour >= 16:  # After market close
            next_open = current_time + timedelta(days=1)
        else:  # Before market open
            next_open = current_time
    
    # Set to 9:30 AM
    next_open = next_open.replace(hour=9, minute=30, second=0, microsecond=0)
    return next_open.isoformat()

@app.route('/api/contact', methods=['POST'])
@limiter.limit("10 per hour")
def contact_form():
    """Handle contact form submissions"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Here you would typically:
        # 1. Save to database
        # 2. Send email notification
        # 3. Log the contact request
        
        # For now, just return success
        return jsonify({
            'success': True,
            'message': 'Contact form submitted successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'success': False,
        'error': 'Rate limit exceeded'
    }), 429

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    if not os.path.exists(Config.UPLOAD_FOLDER):
        os.makedirs(Config.UPLOAD_FOLDER)
    
    # Run the application
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=Config.DEBUG
    )