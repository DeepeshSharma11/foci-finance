// Environment Variables Configuration
const ENV = {
    ALPHA_VANTAGE_API_KEY: '4AOOOTOE9Q87NXL2',
    ALPHA_VANTAGE_BASE_URL: 'https://www.alphavantage.co/query',
    
    // NewsAPI Configuration
    NEWSAPI_API_KEY: 'b727a16201914612bacd69b420f47e6d',
    NEWSAPI_BASE_URL: 'https://newsapi.org/v2',
    
    // Fallback news configuration
    GNEWS_API_KEYS: [
        '1f60e6ccea3d31a90e6a1c2fa458979b',
        '86b626d5f8e2c6b36e8c53a3f3a9a9d0'
    ],
    GNEWS_BASE_URL: 'https://gnews.io/api/v4',
    
    FORM_SUBMIT_EMAIL: 'niku3325@gmail.com',
    FORM_SUBMIT_ENDPOINT: 'https://formsubmit.co/ajax',
    SITE_NAME: 'Foci Finance',
    SITE_URL: 'https://focifinance.com',
    CONTACT_EMAIL: 'info@focifinance.com',
    SUPPORT_EMAIL: 'Deepeshtech8433@gmail.com',
    COMPANY_NAME: 'Foci Finance',
    FOUNDER_NIKHIL: 'Nikhil Singh',
    FOUNDER_DEEPESH: 'Deepesh Sharma',
    MAIN_WEBSITE: 'https://focitech.site',
    ALPHA_VANTAGE_RATE_LIMIT: 5,
    NEWSAPI_RATE_LIMIT: 100,
    TRACKED_STOCKS: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'JNJ', 'V'],
    MARKET_INDICES: ['^DJI', '^GSPC', '^IXIC'],
    STOCK_REFRESH_INTERVAL: 300000,
    NEWS_REFRESH_INTERVAL: 3600000,
    MARKET_STATUS_REFRESH: 60000,
    DEFAULT_CURRENCY: 'USD',
    DEFAULT_LANGUAGE: 'en',
    TIMEZONE: 'America/New_York',
    ENABLE_HTTPS: true,
    CSP_ENABLED: true,
    XSS_PROTECTION: true,
    ENABLE_REAL_TIME_DATA: true,
    ENABLE_NEWS_FEED: true,
    ENABLE_CALCULATOR: true,
    ENABLE_CONTACT_FORM: true
};

// DOM Elements
const stockTicker = document.getElementById('stockTicker');
const marketsGrid = document.getElementById('marketsGrid');
const marketsLoading = document.getElementById('marketsLoading');
const marketsError = document.getElementById('marketsError');
const newsGrid = document.getElementById('newsGrid');
const newsLoading = document.getElementById('newsLoading');
const newsError = document.getElementById('newsError');
const currentPrice = document.getElementById('currentPrice');
const priceChange = document.getElementById('priceChange');
const marketStatus = document.getElementById('marketStatus');
const dowJones = document.getElementById('dowJones');
const sp500 = document.getElementById('sp500');
const nasdaq = document.getElementById('nasdaq');

// Global variables
let stockData = {};
let priceChart;
let isOnline = navigator.onLine;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    loadStockTicker();
    loadMarketData();
    loadNews();
    setupAutoRefresh();
    
    // Trading pairs interaction
    setupTradingPairs();
    
    // Calculator functionality
    setupCalculator();

    // Setup contact form
    setupContactForm();

    // Setup lazy loading
    setupLazyLoading();

    // Setup offline detection
    setupOfflineDetection();

    // Setup mobile nav scrolling
    setupMobileNavScrolling();
});

// Initialize price charts
function initializeCharts() {
    const priceCtx = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
            datasets: [{
                label: 'AAPL',
                data: [178.50, 178.75, 179.20, 178.90, 179.50, 179.80, 178.72],
                borderColor: '#06d6a0',
                backgroundColor: 'rgba(6, 214, 160, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    display: false
                },
                x: {
                    display: false
                }
            },
            elements: {
                point: {
                    radius: 0
                }
            }
        }
    });

    // Investment chart
    const investmentCtx = document.getElementById('investmentChart').getContext('2d');
    new Chart(investmentCtx, {
        type: 'doughnut',
        data: {
            labels: ['Initial Investment', 'Contributions', 'Interest'],
            datasets: [{
                data: [10000, 60000, 25937],
                backgroundColor: [
                    '#2563eb',
                    '#06d6a0',
                    '#f59e0b'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Load stock ticker data
async function loadStockTicker() {
    try {
        // Show loading state
        stockTicker.innerHTML = '<div class="ticker-item skeleton-loader" style="height: 20px; width: 100%;"></div>';
        
        const stocks = [];
        
        // Fetch data for first 5 stocks for ticker
        for (let i = 0; i < 5; i++) {
            const symbol = ENV.TRACKED_STOCKS[i];
            const data = await fetchStockData(symbol);
            if (data) {
                stocks.push(data);
                stockData[symbol] = data;
            }
        }
        
        displayStockTicker(stocks);
    } catch (error) {
        console.error('Error loading stock ticker:', error);
        handleTickerError(error);
    }
}

// Fetch stock data from Alpha Vantage with fallback
async function fetchStockData(symbol) {
    try {
        // Check if we're online
        if (!isOnline) {
            throw new Error('Offline - using cached data');
        }

        const response = await fetch(
            `${ENV.ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ENV.ALPHA_VANTAGE_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data['Global Quote'] && data['Global Quote']['05. price']) {
            return {
                symbol: data['Global Quote']['01. symbol'],
                price: parseFloat(data['Global Quote']['05. price']),
                change: parseFloat(data['Global Quote']['09. change']),
                changePercent: parseFloat(data['Global Quote']['10. change percent'].replace('%', ''))
            };
        } else {
            console.warn(`No data returned for ${symbol}`);
            return generateFallbackData(symbol);
        }
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return generateFallbackData(symbol);
    }
}

// Generate fallback data when API fails
function generateFallbackData(symbol) {
    const basePrices = {
        'AAPL': 178.72, 'GOOGL': 138.21, 'MSFT': 330.53, 'AMZN': 145.80,
        'TSLA': 248.42, 'META': 312.65, 'NVDA': 435.15, 'JPM': 159.32,
        'JNJ': 157.89, 'V': 239.76, '^DJI': 34261.42, '^GSPC': 4453.53, '^IXIC': 13760.70
    };
    
    const basePrice = basePrices[symbol] || 100;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;
    
    return {
        symbol: symbol,
        price: basePrice + change,
        change: change,
        changePercent: changePercent
    };
}

// Display stock ticker
function displayStockTicker(stocks) {
    stockTicker.innerHTML = '';
    
    // Filter out null values
    const validStocks = stocks.filter(stock => stock !== null);
    
    if (validStocks.length === 0) {
        stockTicker.innerHTML = '<div class="ticker-item">Market data temporarily unavailable</div>';
        return;
    }
    
    validStocks.forEach(stock => {
        const tickerItem = document.createElement('div');
        tickerItem.className = 'ticker-item';
        
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const changeIcon = stock.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        tickerItem.innerHTML = `
            <span class="stock-symbol">${stock.symbol}</span>
            <span class="stock-price">$${formatPrice(stock.price)}</span>
            <span class="price-change ${changeClass}">
                <i class="fas ${changeIcon}"></i>
                ${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
            </span>
        `;
        
        stockTicker.appendChild(tickerItem);
    });
}

// Load market data
async function loadMarketData() {
    try {
        marketsLoading.style.display = 'block';
        marketsError.style.display = 'none';
        marketsGrid.style.display = 'none';
        
        const stocks = [];
        const indices = [];
        
        // Fetch stock data
        for (const symbol of ENV.TRACKED_STOCKS.slice(0, 6)) {
            const data = await fetchStockData(symbol);
            if (data) {
                stocks.push(data);
                stockData[symbol] = data;
            }
        }
        
        // Fetch index data
        for (const symbol of ENV.MARKET_INDICES) {
            const data = await fetchStockData(symbol);
            if (data) {
                indices.push(data);
            }
        }
        
        displayMarketData(stocks, indices);
        
        // Update trading widget with first stock
        if (stocks.length > 0) {
            updateTradingWidget('AAPL');
        }
        
    } catch (error) {
        console.error('Error loading market data:', error);
        handleMarketError(error);
    }
}

// Display market data
function displayMarketData(stocks, indices) {
    // Update indices
    if (indices && indices.length >= 3) {
        updateIndexDisplay(dowJones, indices[0]);
        updateIndexDisplay(sp500, indices[1]);
        updateIndexDisplay(nasdaq, indices[2]);
    }
    
    // Update markets grid
    marketsLoading.style.display = 'none';
    marketsGrid.style.display = 'grid';
    marketsGrid.innerHTML = '';
    
    stocks.forEach(stock => {
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const changeIcon = stock.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        const marketCard = document.createElement('div');
        marketCard.className = 'feature-card lazy-load';
        marketCard.innerHTML = `
            <div class="feature-icon">
                <i class="fas fa-chart-line"></i>
            </div>
            <h3>${stock.symbol}</h3>
            <div class="stock-price" style="font-size: 1.5rem; font-weight: 700; margin-bottom: 5px;">
                $${formatPrice(stock.price)}
            </div>
            <div class="price-change ${changeClass}" style="font-weight: 600;">
                <i class="fas ${changeIcon}"></i>
                ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
            </div>
        `;
        
        marketsGrid.appendChild(marketCard);
    });

    // Trigger lazy loading
    setTimeout(() => {
        document.querySelectorAll('.lazy-load').forEach(el => {
            el.classList.add('lazy-loaded');
        });
    }, 100);
}

// Update index display
function updateIndexDisplay(element, index) {
    if (!index) return;
    
    const changeClass = index.change >= 0 ? 'positive' : 'negative';
    element.innerHTML = `
        <div style="font-size: 1.2rem; font-weight: 700;">${formatPrice(index.price)}</div>
        <div class="${changeClass}" style="font-size: 0.9rem;">
            ${index.change >= 0 ? '+' : ''}${index.change.toFixed(2)} (${index.change >= 0 ? '+' : ''}${index.changePercent.toFixed(2)}%)
        </div>
    `;
}

// Enhanced News Loading with NewsAPI
async function loadNews() {
    try {
        newsLoading.style.display = 'block';
        newsError.style.display = 'none';
        newsGrid.style.display = 'none';
        
        let articles = [];
        
        // Try NewsAPI first (primary source)
        articles = await fetchNewsFromNewsAPI();
        
        if (articles.length > 0) {
            displayNews(articles);
            return;
        }
        
        // Try GNews as fallback
        articles = await tryGNewsWithMultipleKeys();
        
        if (articles.length > 0) {
            displayNews(articles);
            return;
        }
        
        // Use enhanced fallback news
        throw new Error('All news sources failed, using enhanced fallback');
        
    } catch (error) {
        console.error('Error loading news:', error);
        displayNews(generateEnhancedFallbackNews());
    }
}

// Fetch news from NewsAPI (Primary Source)
async function fetchNewsFromNewsAPI() {
    try {
        if (!isOnline) {
            throw new Error('Offline - cannot fetch news');
        }

        const response = await fetch(
            `${ENV.NEWSAPI_BASE_URL}/top-headlines?category=business&language=en&pageSize=6&apiKey=${ENV.NEWSAPI_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`NewsAPI HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            console.log('NewsAPI successful, loaded', data.articles.length, 'articles');
            return data.articles.map(article => ({
                source: { name: article.source?.name || 'News Source' },
                title: article.title,
                publishedAt: article.publishedAt,
                url: article.url,
                description: article.description,
                urlToImage: article.urlToImage
            }));
        } else {
            throw new Error('No articles found in NewsAPI response');
        }
        
    } catch (error) {
        console.error('NewsAPI error:', error);
        return [];
    }
}

// GNews Fallback
async function tryGNewsWithMultipleKeys() {
    for (const apiKey of ENV.GNEWS_API_KEYS) {
        try {
            const response = await fetch(
                `${ENV.GNEWS_BASE_URL}/top-headlines?category=business&lang=en&country=us&max=6&apikey=${apiKey}`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data.articles && data.articles.length > 0) {
                    console.log(`GNews successful with key: ${apiKey.substring(0, 8)}...`);
                    return data.articles;
                }
            }
        } catch (error) {
            console.warn(`GNews key ${apiKey.substring(0, 8)}... failed`);
            continue;
        }
    }
    return [];
}

// Enhanced Fallback News with Real Financial Content
function generateEnhancedFallbackNews() {
    const currentDate = new Date();
    
    return [
        {
            source: { name: 'Bloomberg' },
            title: 'Stock Markets Rally as Tech Earnings Beat Expectations',
            publishedAt: new Date(currentDate - 2 * 60 * 60 * 1000).toISOString(),
            url: 'https://www.bloomberg.com/markets',
            description: 'Major indices climb as technology companies report stronger-than-expected quarterly results amid economic recovery.'
        },
        {
            source: { name: 'Reuters' },
            title: 'Federal Reserve Holds Rates Steady, Signals Caution on Inflation',
            publishedAt: new Date(currentDate - 4 * 60 * 60 * 1000).toISOString(),
            url: 'https://www.reuters.com/business/finance',
            description: 'Central bank maintains current interest rates while monitoring inflation trends and employment data closely.'
        },
        {
            source: { name: 'Financial Times' },
            title: 'Global Investment Funds Increase Allocation to Emerging Markets',
            publishedAt: new Date(currentDate - 6 * 60 * 60 * 1000).toISOString(),
            url: 'https://www.ft.com/markets',
            description: 'Institutional investors shift portfolios toward high-growth economies in Asia and Latin America.'
        },
        {
            source: { name: 'Wall Street Journal' },
            title: 'Cryptocurrency Regulations Take Center Stage in Financial Policy',
            publishedAt: new Date(currentDate - 8 * 60 * 60 * 1000).toISOString(),
            url: 'https://www.wsj.com/news/markets',
            description: 'Regulators worldwide develop new frameworks for digital asset trading and investor protection.'
        },
        {
            source: { name: 'CNBC' },
            title: 'Sustainable Investing Sees Record Inflows Amid Climate Focus',
            publishedAt: new Date(currentDate - 10 * 60 * 60 * 1000).toISOString(),
            url: 'https://www.cnbc.com/finance',
            description: 'ESG funds attract unprecedented capital as investors prioritize environmental and social factors.'
        },
        {
            source: { name: 'Yahoo Finance' },
            title: 'Housing Market Shows Resilience Despite Economic Headwinds',
            publishedAt: new Date(currentDate - 12 * 60 * 60 * 1000).toISOString(),
            url: 'https://finance.yahoo.com',
            description: 'Real estate prices stabilize as mortgage rates find equilibrium and inventory levels improve.'
        }
    ];
}

// Display News with Enhanced Features
function displayNews(articles) {
    newsLoading.style.display = 'none';
    newsGrid.style.display = 'grid';
    newsGrid.innerHTML = '';
    
    articles.forEach((article, index) => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card lazy-load';
        
        const date = new Date(article.publishedAt);
        const timeAgo = getTimeAgo(date);
        
        // Validate and ensure URL is proper
        let articleUrl = article.url;
        let isRealArticle = true;
        
        if (!articleUrl || articleUrl.includes('example.com') || articleUrl === '#') {
            const realSites = [
                'https://www.bloomberg.com/markets',
                'https://www.reuters.com/business',
                'https://www.cnbc.com/finance',
                'https://www.ft.com/markets',
                'https://www.wsj.com/news/markets',
                'https://finance.yahoo.com'
            ];
            articleUrl = realSites[index] || realSites[0];
            isRealArticle = false;
        }
        
        // Add image if available
        const imageHtml = article.urlToImage ? 
            `<div class="news-image" style="background-image: url('${article.urlToImage}')"></div>` :
            `<div class="news-image-placeholder"><i class="fas fa-newspaper"></i></div>`;
        
        newsCard.innerHTML = `
            ${imageHtml}
            <div class="news-content">
                <div class="news-source">${article.source.name}</div>
                <div class="news-title">${article.title}</div>
                <div class="news-description">${article.description || 'Latest financial news and market updates.'}</div>
                <div class="news-footer">
                    <div class="news-date">${timeAgo}</div>
                    <a href="${articleUrl}" target="_blank" class="news-link">
                        ${isRealArticle ? 'Read Full Story' : 'Explore News'} 
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
        
        newsGrid.appendChild(newsCard);
    });

    // Trigger lazy loading
    setTimeout(() => {
        document.querySelectorAll('.lazy-load').forEach(el => {
            el.classList.add('lazy-loaded');
        });
    }, 100);
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
}

// Setup trading pairs interaction
function setupTradingPairs() {
    const tradingPairs = document.querySelectorAll('.trading-pair');
    
    tradingPairs.forEach(pair => {
        pair.addEventListener('click', function() {
            tradingPairs.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            const symbol = this.getAttribute('data-symbol');
            updateTradingWidget(symbol);
        });
    });
}

// Update trading widget with selected symbol
function updateTradingWidget(symbol) {
    const stock = stockData[symbol];
    if (!stock) return;
    
    // Update price and change
    currentPrice.textContent = `$${formatPrice(stock.price)}`;
    
    const changeClass = stock.change >= 0 ? 'positive' : 'negative';
    const changeIcon = stock.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    priceChange.className = `price-change ${changeClass}`;
    priceChange.innerHTML = `<i class="fas ${changeIcon}"></i><span>${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%</span>`;
    
    // Update chart with new data
    updateChartData(symbol);
}

// Update chart with new data
function updateChartData(symbol) {
    // Generate some random data for demonstration
    // In a real app, you'd fetch historical data
    const basePrice = stockData[symbol] ? stockData[symbol].price : 100;
    const newData = Array.from({length: 7}, (_, i) => {
        const variation = (Math.random() - 0.5) * 10;
        return basePrice + variation * (i + 1);
    });
    
    priceChart.data.datasets[0].data = newData;
    priceChart.data.datasets[0].label = symbol;
    priceChart.update();
}

// Setup calculator
function setupCalculator() {
    const calculateBtn = document.getElementById('calculateBtn');
    calculateBtn.addEventListener('click', calculateInvestment);
    
    // Calculate initial values
    calculateInvestment();
}

// Calculate investment
function calculateInvestment() {
    const initialInvestment = parseFloat(document.getElementById('initialInvestment').value);
    const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value);
    const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value);
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) / 100;
    
    const monthlyRate = expectedReturn / 12;
    const months = investmentPeriod * 12;
    
    // Future value of initial investment
    const futureValueInitial = initialInvestment * Math.pow(1 + expectedReturn, investmentPeriod);
    
    // Future value of monthly contributions
    const futureValueContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    
    const totalFutureValue = futureValueInitial + futureValueContributions;
    const totalContributions = initialInvestment + (monthlyContribution * months);
    const interestEarned = totalFutureValue - totalContributions;
    
    // Update results
    document.getElementById('initialResult').textContent = formatCurrency(initialInvestment);
    document.getElementById('contributionsResult').textContent = formatCurrency(totalContributions);
    document.getElementById('interestResult').textContent = formatCurrency(interestEarned);
    document.getElementById('futureValueResult').textContent = formatCurrency(totalFutureValue);
}

// Setup contact form with AJAX
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Use FormSubmit.co with AJAX
        fetch(ENV.FORM_SUBMIT_ENDPOINT + '/' + ENV.FORM_SUBMIT_EMAIL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: data.name,
                email: data.email,
                subject: data.subject,
                message: data.message,
                _subject: 'New Contact Form Submission - Foci Finance',
                _template: 'table',
                _captcha: 'false'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success === 'true') {
                // Show success message
                formMessage.textContent = 'Thank you! Your message has been sent successfully. We will get back to you soon.';
                formMessage.className = 'form-message success';
                
                // Reset form
                contactForm.reset();
            } else {
                throw new Error('Form submission failed');
            }
        })
        .catch(error => {
            // Show error message
            formMessage.textContent = 'Sorry, there was an error sending your message. Please try again or contact us directly at info@focifinance.com.';
            formMessage.className = 'form-message error';
            console.error('Form submission error:', error);
        })
        .finally(() => {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Hide message after 5 seconds
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        });
    });
}

// Setup lazy loading
function setupLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('lazy-loaded');
                observer.unobserve(entry.target);
            }
        });
    });
    
    // Observe all lazy-load elements
    document.querySelectorAll('.lazy-load').forEach(el => {
        observer.observe(el);
    });
}

// Setup offline detection
function setupOfflineDetection() {
    window.addEventListener('online', () => {
        isOnline = true;
        console.log('Application is online');
        // Refresh data when coming back online
        loadStockTicker();
        loadMarketData();
        loadNews();
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        console.log('Application is offline - using cached data');
        // Show offline indicator
        const offlineIndicator = document.createElement('div');
        offlineIndicator.style.cssText = 'position: fixed; top: 80px; left: 0; width: 100%; background: var(--warning); color: white; text-align: center; padding: 10px; z-index: 1001;';
        offlineIndicator.textContent = 'You are currently offline. Some data may not be up to date.';
        document.body.appendChild(offlineIndicator);
        
        setTimeout(() => {
            document.body.removeChild(offlineIndicator);
        }, 5000);
    });
}

// Setup mobile nav scrolling
function setupMobileNavScrolling() {
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileNavLinks = document.querySelector('.mobile-nav-links');
    
    // Auto-scroll to active item
    function scrollToActiveItem() {
        const activeItem = mobileNavLinks.querySelector('.active');
        if (activeItem) {
            const containerWidth = mobileNav.offsetWidth;
            const itemOffset = activeItem.offsetLeft;
            const itemWidth = activeItem.offsetWidth;
            
            mobileNav.scrollLeft = itemOffset - (containerWidth / 2) + (itemWidth / 2);
        }
    }
    
    // Update active nav item based on scroll position
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.mobile-nav-links a');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
        
        // Scroll to active item
        scrollToActiveItem();
    });
    
    // Initial scroll to active item
    setTimeout(scrollToActiveItem, 100);
}

// Setup auto-refresh
function setupAutoRefresh() {
    // Refresh stock data every 5 minutes
    setInterval(() => {
        if (isOnline) {
            loadStockTicker();
            loadMarketData();
        }
    }, ENV.STOCK_REFRESH_INTERVAL);
    
    // Refresh news every 1 hour
    setInterval(() => {
        if (isOnline) {
            loadNews();
        }
    }, ENV.NEWS_REFRESH_INTERVAL);
    
    // Update market status
    updateMarketStatus();
    setInterval(updateMarketStatus, ENV.MARKET_STATUS_REFRESH);
}

// Update market status
function updateMarketStatus() {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Simple market hours check (9:30 AM - 4:00 PM ET, Monday-Friday)
    const isMarketOpen = day >= 1 && day <= 5 && 
                        ((hours > 9 || (hours === 9 && minutes >= 30)) && hours < 16);
    
    if (isMarketOpen) {
        marketStatus.className = 'market-status market-open';
        marketStatus.innerHTML = '<i class="fas fa-circle"></i><span>Market Open</span>';
    } else {
        marketStatus.className = 'market-status market-closed';
        marketStatus.innerHTML = '<i class="fas fa-circle"></i><span>Market Closed</span>';
    }
}

// Format price for display
function formatPrice(price) {
    if (price > 1000) {
        return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    } else {
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

// Format currency for display
function formatCurrency(value) {
    return '$' + value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Error handlers
function handleTickerError(error) {
    console.error('Ticker error:', error);
    stockTicker.innerHTML = '<div class="ticker-item">Market data temporarily unavailable</div>';
}

function handleMarketError(error) {
    console.error('Market error:', error);
    marketsLoading.style.display = 'none';
    marketsError.style.display = 'block';
    
    // Show fallback data
    const fallbackStocks = ENV.TRACKED_STOCKS.slice(0, 6).map(symbol => generateFallbackData(symbol));
    const fallbackIndices = ENV.MARKET_INDICES.map(symbol => generateFallbackData(symbol));
    displayMarketData(fallbackStocks, fallbackIndices);
}

function handleNewsError(error) {
    console.error('News error:', error);
    newsLoading.style.display = 'none';
    newsError.style.display = 'block';
}

// Mobile Navigation Active State
const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');

mobileNavLinks.forEach(link => {
    link.addEventListener('click', function() {
        mobileNavLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        
        // Scroll to active item
        setTimeout(() => {
            const mobileNclav = document.querySelector('.mobile-nav');
            const containerWidth = mobileNav.offsetWidth;
            const itemOffset = this.offsetLeft;
            const itemWidth = this.offsetWidth;
            
            mobilearNav.scrollLeft = itemOffset - (containerWidth / 2) + (itemWidth / 2);
        }, 100);
    });
});

// Test NewsAPI function
async function testNewsAPI() {
    try {
        const response = await fetch(
            `${ENV.NEWSAPI_BASE_URL}/top-headlines?category=business&language=en&pageSize=1&apiKey=${ENV.NEWSAPI_API_KEY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            console.log('NewsAPI Test Result:', data);
            return data;
        } else {
            console.error('NewsAPI Test Failed:', response.status);
            return null;
        }
    } catch (error) {
        console.error('NewsAPI Test Error:', error);
        return null;
    }
}

// Uncomment to test NewsAPI in browser console
// testNewsAPI();