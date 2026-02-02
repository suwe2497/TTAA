class StockDataProvider {
    constructor() {
        this.providers = [
            this.fetchFromAlphaVantage.bind(this),
            this.fetchFromFinnhub.bind(this),
            this.fetchFromPolygon.bind(this),
            this.fetchFromIEX.bind(this),
            this.generateFallbackData.bind(this) // 最後回退到模擬數據
        ];
    }
    
    // 尝試多個數據源直到成功
    async getStockData(symbol) {
        for (const provider of this.providers) {
            try {
                const result = await provider(symbol);
                if (result && result.price) {
                    return {
                        ...result,
                        dataSource: provider.name.replace('fetchFrom', '').replace('bind', '')
                    };
                }
            } catch (error) {
                console.warn(`${provider.name} 失敗:`, error.message);
                continue;
            }
        }
        
        // 如果所有提供商都失敗，返回模擬數據
        return this.generateFallbackData(symbol);
    }
    
    // Alpha Vantage 免費 API (需要免費密鑰)
    async fetchFromAlphaVantage(symbol) {
        // 注意：Alpha Vantage 需要註冊獲取免費 API 密鑰
        // 每天 500 次請求限制
        const apiKey = 'demo'; // 使用 demo 密鑰進行測試
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data['Error Message']) {
            throw new Error('Invalid API call or rate limit reached');
        }
        
        const quote = data['Global Quote'];
        if (!quote) {
            throw new Error('No data returned');
        }
        
        return {
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseInt(quote['06. volume']).toLocaleString()
        };
    }
    
    // Finnhub 免費 API (需要免費密鑰)
    async fetchFromFinnhub(symbol) {
        // 注意：Finnhub 需要免費 API 密鑰
        // 每秒 60 次請求限制
        const apiKey = 'cq0gvnv48v6rhdtvnrig'; // demo 密鑰
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (typeof data.c === 'undefined') {
            throw new Error('No price data returned');
        }
        
        return {
            symbol: symbol,
            price: data.c, // 當前價格
            change: data.c - data.pc, // 漲跌額
            changePercent: ((data.c - data.pc) / data.pc * 100).toFixed(2), // 漲跌幅
            volume: data.v?.toLocaleString() || 'N/A'
        };
    }
    
    // Polygon.io 免費 API (需要免費密鑰)
    async fetchFromPolygon(symbol) {
        // 注意：Polygon 需要註冊獲取免費 API 密鑰
        // 每天 500 次請求限制
        const apiKey = 'YOUR_POLYGON_API_KEY'; // 需要替換為真實密鑰
        const url = `https://api.polygon.io/v1/last_quote/stocks/${symbol}?apiKey=${apiKey}`;
        
        // 由於沒有真實密鑰，我們跳過這個 API
        throw new Error('Polygon API key not provided');
    }
    
    // IEX Cloud 免費 API (需要免費密鑰)
    async fetchFromIEX(symbol) {
        // 注意：IEX Cloud 需要註冊獲取免費 API 密鑰
        // 每月 50,000 次請求限制
        const publishableToken = 'pk_8e8...'; // 需要替換為真實密鑰
        const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${publishableToken}`;
        
        // 由於沒有真實密鑰，我們跳過這個 API
        throw new Error('IEX Cloud token not provided');
    }
    
    // 通用免費 API - 1
    async fetchFromFreeAPI(symbol) {
        try {
            // 使用 Financial Modeling Prep API (有限免費配額)
            const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=dem`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data || data.Error || data.length === 0) {
                throw new Error('No data returned from FMP');
            }
            
            const stock = data[0];
            return {
                symbol: stock.symbol,
                price: stock.price,
                change: stock.change,
                changePercent: stock.changesPercentage.replace('%', ''),
                volume: stock.volume?.toLocaleString() || 'N/A'
            };
        } catch (error) {
            throw new Error('Financial Modeling Prep API failed');
        }
    }
    
    // 通用免費 API - 2 (使用 Yahoo Finance 的替代接口)
    async fetchFromAlternativeAPI(symbol) {
        try {
            // 使用 twelvedata 或其他服務的替代接口
            const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=demo`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code || data.status === 'error') {
                throw new Error('TwelveData API error');
            }
            
            return {
                symbol: data.symbol || symbol,
                price: parseFloat(data.close) || parseFloat(data.price),
                change: parseFloat(data.change) || 0,
                changePercent: parseFloat(data.percent_change) || 0,
                volume: data.volume ? parseInt(data.volume).toLocaleString() : 'N/A'
            };
        } catch (error) {
            throw new Error('Alternative API failed');
        }
    }
    
    // 最終備用：生成模擬數據
    generateFallbackData(symbol) {
        // 使用之前實現的邏輯生成模擬數據
        let basePrice;
        
        switch(symbol.toUpperCase()) {
            case 'AAPL':
                basePrice = 175 + (Math.random() * 10 - 5);
                break;
            case 'GOOGL':
                basePrice = 140 + (Math.random() * 15 - 7.5);
                break;
            case 'MSFT':
                basePrice = 370 + (Math.random() * 20 - 10);
                break;
            case 'AMZN':
                basePrice = 175 + (Math.random() * 15 - 7.5);
                break;
            case 'TSLA':
                basePrice = 410 + (Math.random() * 20 - 10);
                break;
            case 'NVDA':
                basePrice = 850 + (Math.random() * 50 - 25);
                break;
            case 'META':
                basePrice = 480 + (Math.random() * 20 - 10);
                break;
            case 'NFLX':
                basePrice = 550 + (Math.random() * 25 - 12.5);
                break;
            default:
                basePrice = 50 + (Math.random() * 300);
        }
        
        const changePercent = (Math.random() - 0.5) * 0.1;
        const changeAmount = basePrice * changePercent;
        const currentPrice = basePrice + changeAmount;
        const volume = Math.floor(Math.random() * 10000000) + 1000000;
        
        return {
            symbol: symbol,
            price: parseFloat(currentPrice.toFixed(2)),
            change: parseFloat(changeAmount.toFixed(2)),
            changePercent: parseFloat((changePercent * 100).toFixed(2)),
            volume: volume.toLocaleString(),
            dataSource: 'mock'
        };
    }
}

// 更新主應用以使用新的多數據源系統
class AIStockAnalyzer {
    constructor() {
        this.api = new StockDataProvider(); // 使用新的多數據源提供者
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.stockSymbol = document.getElementById('stockSymbol');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.analysisType = document.querySelector('input[name="analysisType"]:checked');
        this.currentSymbol = document.getElementById('currentSymbol');
        this.currentPrice = document.getElementById('currentPrice');
        this.priceChange = document.getElementById('priceChange');
        this.priceChangePercent = document.getElementById('priceChangePercent');
        this.volume = document.getElementById('volume');
        this.sentimentValue = document.getElementById('sentimentValue');
        this.recommendation = document.getElementById('recommendation');
        this.analysisFactors = document.getElementById('analysisFactors');
        this.newsContainer = document.getElementById('newsContainer');
        this.chartLoader = document.getElementById('chartLoader');
    }
    
    bindEvents() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeStock());
        
        // 監聽分析類型變化
        document.querySelectorAll('input[name="analysisType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.analysisType = e.target;
            });
        });
        
        // 支援 Enter 鍵搜索
        this.stockSymbol.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzeStock();
            }
        });
    }
    
    async analyzeStock() {
        const symbol = this.stockSymbol.value.trim().toUpperCase();
        if (!symbol) {
            alert('請輸入股票代號');
            return;
        }
        
        // 顯示加載狀態
        this.showLoadingState();
        
        // 獲取真實數據（帶有多數據源支持）
        await this.generateRealData(symbol);
        
        // 隱藏加載狀態
        this.hideLoadingState();
        
        // 更新 UI
        this.updateUI();
    }
    
    showLoadingState() {
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.textContent = '分析中...';
        this.chartLoader.style.display = 'block';
    }
    
    hideLoadingState() {
        this.analyzeBtn.disabled = false;
        this.analyzeBtn.textContent = 'AI 分析';
        this.chartLoader.style.display = 'none';
    }
    
    async generateRealData(symbol) {
        // 顯示加載狀態
        this.chartLoader.style.display = 'block';
        
        try {
            // 使用多數據源獲取真實數據
            const stockData = await this.api.getStockData(symbol);
            
            // 設置數據來源標識
            this.dataSource = stockData.dataSource || 'mock';
            this.symbol = stockData.symbol;
            this.price = stockData.price.toFixed(2);
            this.change = stockData.change.toFixed(2);
            this.changePercent = stockData.changePercent.toFixed(2);
            this.vol = stockData.volume;
            
            // 生成 AI 分析結果
            this.generateAIAnalysis(symbol);
            
            // 生成相關新聞
            this.generateNews(symbol);
        } catch (error) {
            console.error('獲取股票數據時出錯:', error);
            // 回退到模擬數據
            const fallbackData = this.api.generateFallbackData(symbol);
            this.setStockData(fallbackData);
        } finally {
            this.chartLoader.style.display = 'none';
        }
    }
    
    setStockData(data) {
        this.dataSource = data.dataSource || 'mock';
        this.symbol = data.symbol;
        this.price = data.price.toFixed(2);
        this.change = data.change.toFixed(2);
        this.changePercent = data.changePercent.toFixed(2);
        this.vol = data.volume;
        
        // 生成 AI 分析結果
        this.generateAIAnalysis(this.symbol);
        
        // 生成模擬新聞
        this.generateNews(this.symbol);
    }
    
    generateAIAnalysis(symbol) {
        const analysisType = this.analysisType.value;
        const analysisTypes = {
            short: '短期趨勢',
            medium: '中期趨勢', 
            long: '長期趨勢'
        };
        
        // 生成隨機但合理的分析結果
        const sentiment = Math.floor(Math.random() * 41) + 30; // 30-70 分數
        this.sentiment = sentiment;
        
        // 根據情緒分數生成推薦
        let recommendation = '';
        if (sentiment > 65) {
            recommendation = '強力買入 🔼';
        } else if (sentiment > 50) {
            recommendation = '買入 ➕';
        } else if (sentiment > 40) {
            recommendation = '持有 ↔️';
        } else if (sentiment > 25) {
            recommendation = '賣出 ➖';
        } else {
            recommendation = '強力賣出 🔽';
        }
        
        this.recommendationText = recommendation;
        
        // 生成分析因素
        const factors = [
            `技術指標顯示 ${this.getRandomFactor('technical', analysisType)}`,
            `市場情緒評估 ${this.getRandomFactor('sentiment', analysisType)}`,
            `歷史數據比對 ${this.getRandomFactor('historical', analysisType)}`,
            `基本面分析 ${this.getRandomFactor('fundamental', analysisType)}`,
            `市場波動率 ${this.getRandomFactor('volatility', analysisType)}`
        ];
        
        this.factors = factors;
    }
    
    getRandomFactor(factorType, analysisType) {
        const factors = {
            technical: [
                'RSI 指標處於超賣區域，顯示買入機會',
                'MACD 出現黃金交叉，趨勢向上',
                '移動平均線呈現多頭排列',
                '成交量放大，資金積極進場',
                '突破關鍵阻力位，上漲空間打開',
                'KD 指標出現底部背離',
                '布林帶收口後開始擴張',
                '均線系統顯示強勁支撐'
            ],
            sentiment: [
                '機構投資者持股比例上升',
                '散戶情緒偏向樂觀',
                '新聞輿論普遍正面',
                '期貨市場多頭力量增強',
                '選擇權未平倉量顯示買方優勢',
                'ETF 資金持續流入',
                '券商研究報告調升目標價',
                '外資持續買超'
            ],
            historical: [
                '過去相似形態後平均上漲 15%',
                '季節性因素支持上漲',
                '回測顯示該策略勝率 70%',
                '歷史數據顯示此時段表現強勁',
                '周期性規律預示上漲',
                '同業比較表現優異',
                '估值處於歷史低位',
                '盈利增長趨勢穩定'
            ],
            fundamental: [
                '營收增長符合預期',
                '毛利率持續改善',
                '現金流狀況良好',
                '負債比率控制合理',
                'ROE 表現優異',
                '股息收益率吸引人',
                '市盈率低於行業平均',
                '新產品線前景看好'
            ],
            volatility: [
                '波動率降至年內最低',
                '風險參數顯示可控範圍',
                '夏普比率表現良好',
                '最大回撤控制在 10% 以內',
                'Beta 系數小於 1，相對穩健',
                '風險調整後收益優異',
                'VaR 模型顯示下行風險有限',
                '波動率微笑效應消失'
            ]
        };
        
        return factors[factorType][Math.floor(Math.random() * factors[factorType].length)];
    }
    
    generateNews(symbol) {
        const newsItems = [
            `${symbol} 宣布新產品發布，市場反應熱烈`,
            '經濟數據好於預期，提振市場信心',
            `${symbol} 獲得大額訂單，營收有望增長`,
            '監管政策變化影響相關板塊走勢',
            '全球供應鏈恢復正常，成本壓力減輕',
            `${symbol} 宣布回購股份計劃`,
            '央行利率決策影響市場流動性',
            `${symbol} 在新興市場擴張業務`
        ];
        
        // 隨機選擇 3-5 條新聞
        const selectedNews = [];
        const count = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * newsItems.length);
            selectedNews.push(newsItems[randomIndex]);
        }
        
        this.news = selectedNews;
    }
    
    updateUI() {
        // 更新股票資訊
        this.currentSymbol.textContent = this.symbol;
        this.currentPrice.textContent = `$${this.price}`;
        this.priceChange.textContent = `$${this.change}`;
        this.priceChangePercent.textContent = `${this.changePercent}%`;
        this.volume.textContent = this.vol;
        
        // 顯示數據來源標籤
        const dataSourceLabel = document.getElementById('dataSourceLabel');
        if (dataSourceLabel) {
            dataSourceLabel.textContent = this.dataSource === 'mock' ? '🎲 模擬數據' : `📊 來自 ${this.dataSource}`;
            dataSourceLabel.className = this.dataSource === 'mock' ? 'data-source-mock' : 'data-source-real';
        } else {
            // 如果不存在則創建
            const symbolElement = document.getElementById('currentSymbol');
            const dataSourceSpan = document.createElement('span');
            dataSourceSpan.id = 'dataSourceLabel';
            dataSourceSpan.textContent = this.dataSource === 'mock' ? '🎲 模擬數據' : `📊 來自 ${this.dataSource}`;
            dataSourceSpan.className = this.dataSource === 'mock' ? 'data-source-mock' : 'data-source-real';
            symbolElement.after(document.createTextNode(' ')); // 添加空格
            symbolElement.after(dataSourceSpan);
        }
        
        // 更新顏色根據漲跌
        const changeElements = [this.priceChange, this.priceChangePercent];
        changeElements.forEach(el => {
            el.classList.remove('positive', 'negative');
            if (parseFloat(this.change) >= 0) {
                el.classList.add('positive');
            } else {
                el.classList.add('negative');
            }
        });
        
        // 更新 AI 分析
        this.sentimentValue.textContent = this.sentiment;
        this.recommendation.textContent = this.recommendationText;
        
        // 更新分析因素
        this.analysisFactors.innerHTML = '';
        this.factors.forEach(factor => {
            const li = document.createElement('li');
            li.textContent = factor;
            this.analysisFactors.appendChild(li);
        });
        
        // 更新新聞
        this.newsContainer.innerHTML = '';
        this.news.forEach(item => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            newsItem.innerHTML = `
                <h4>${item}</h4>
                <p>發布時間：${this.getCurrentTime()}</p>
            `;
            this.newsContainer.appendChild(newsItem);
        });
    }
    
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new AIStockAnalyzer();
});

// 添加一些示例股票代號的自動補全功能
const exampleStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
document.getElementById('stockSymbol').addEventListener('focus', function() {
    if (!this.hasAttribute('list')) {
        const datalist = document.createElement('datalist');
        datalist.id = 'stockSuggestions';
        exampleStocks.forEach(stock => {
            const option = document.createElement('option');
            option.value = stock;
            datalist.appendChild(option);
        });
        this.parentNode.appendChild(datalist);
        this.setAttribute('list', 'stockSuggestions');
    }
});