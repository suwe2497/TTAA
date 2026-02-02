class StockChartGenerator {
    constructor(containerId) {
        this.containerId = containerId;
        this.canvas = null;
    }
    
    // 創建簡單的圖表（使用純 DOM 元素，避免依賴外部庫）
    generateSimpleChart(data, symbol) {
        const chartContainer = document.getElementById(this.containerId);
        if (!chartContainer) return;
        
        // 清除之前的圖表
        chartContainer.innerHTML = '';
        
        // 創建圖表容器
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        chartWrapper.innerHTML = `
            <div class="chart-header">
                <h3>${symbol} 近期走勢</h3>
                <div class="chart-controls">
                    <button class="chart-period-btn active" data-period="week">週</button>
                    <button class="chart-period-btn" data-period="month">月</button>
                    <button class="chart-period-btn" data-period="quarter">季</button>
                </div>
            </div>
            <div class="chart-area">
                <div class="y-axis-labels">
                    <div class="y-label">最高</div>
                    <div class="y-label">中位</div>
                    <div class="y-label">最低</div>
                </div>
                <div class="chart-grid">
                    <svg class="chart-svg" viewBox="0 0 600 300" preserveAspectRatio="none">
                        <!-- 圖表將在這裡繪製 -->
                    </svg>
                </div>
            </div>
            <div class="chart-x-axis">
                <div class="x-label">開始</div>
                <div class="x-label">中間</div>
                <div class="x-label">結束</div>
            </div>
        `;
        
        chartContainer.appendChild(chartWrapper);
        
        // 繪製圖表線條
        this.drawChart(data, symbol);
        
        // 添加圖表控制事件
        this.addChartControls();
    }
    
    drawChart(data, symbol) {
        // 如果沒有真實數據，生成模擬走勢數據
        let prices = [];
        if (data && data.prices) {
            prices = data.prices;
        } else {
            // 生成模擬價格數據
            const basePrice = parseFloat(document.getElementById('currentPrice').textContent.replace('$', '')) || 100;
            prices = this.generateSimulatedPrices(basePrice, 30);
        }
        
        const svg = document.querySelector('.chart-svg');
        if (!svg) return;
        
        // 清除之前的路徑
        const existingPath = svg.querySelector('.price-line');
        if (existingPath) existingPath.remove();
        
        // 計算坐標
        const padding = 40;
        const width = 600 - 2 * padding;
        const height = 300 - 2 * padding;
        const xStep = width / (prices.length - 1);
        
        // 找到價格範圍
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1; // 防止除零
        
        // 創建路徑數據
        let pathData = '';
        prices.forEach((price, i) => {
            const x = padding + i * xStep;
            // Y 坐標需要翻轉（SVG 的 Y 軸向下）
            const y = padding + height - ((price - minPrice) / priceRange) * height;
            
            if (i === 0) {
                pathData += `M ${x} ${y} `;
            } else {
                pathData += `L ${x} ${y} `;
            }
        });
        
        // 創建路徑元素
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'price-line');
        path.setAttribute('stroke', prices[prices.length-1] >= prices[0] ? '#28a745' : '#dc3545');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        
        // 添加漸變填充
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'chartGradient');
        gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', prices[prices.length-1] >= prices[0] ? '#28a745' : '#dc3545');
        stop1.setAttribute('stop-opacity', '0.3');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', prices[prices.length-1] >= prices[0] ? '#28a745' : '#dc3545');
        stop2.setAttribute('stop-opacity', '0.05');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);
        
        // 創建填充區域
        let areaPathData = pathData + ` L ${padding + width} ${padding + height} L ${padding} ${padding + height} Z`;
        const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        areaPath.setAttribute('d', areaPathData);
        areaPath.setAttribute('fill', 'url(#chartGradient)');
        
        svg.appendChild(areaPath);
        svg.appendChild(path);
    }
    
    generateSimulatedPrices(basePrice, days) {
        const prices = [basePrice];
        let currentPrice = basePrice;
        
        for (let i = 1; i < days; i++) {
            // 生成隨機波動 (-2% 到 +2%)
            const changePercent = (Math.random() - 0.5) * 0.04; // -2% to +2%
            currentPrice = currentPrice * (1 + changePercent);
            prices.push(parseFloat(currentPrice.toFixed(2)));
        }
        
        return prices;
    }
    
    addChartControls() {
        const buttons = document.querySelectorAll('.chart-period-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // 在實際應用中，這里會重新加載對應期間的數據
                // 為簡化起見，我們重新生成圖表
                const symbol = document.getElementById('currentSymbol').textContent.split(' ')[0];
                this.redrawChart(symbol);
            });
        });
    }
    
    redrawChart(symbol) {
        // 重新繪製圖表
        const basePrice = parseFloat(document.getElementById('currentPrice').textContent.replace('$', '')) || 100;
        let days = 30; // 默認為月度
        
        const period = document.querySelector('.chart-period-btn.active').dataset.period;
        if (period === 'week') days = 7;
        if (period === 'quarter') days = 90;
        
        const prices = this.generateSimulatedPrices(basePrice, days);
        this.drawChart({prices}, symbol);
    }
    
    // 從 API 獲取歷史數據
    async fetchHistoricalData(symbol, period = 'month') {
        try {
            // 嘗試從 Alpha Vantage 獲取歷史數據
            const apiKey = 'F55O74BJQLRQISLY';
            let functionType = 'TIME_SERIES_DAILY';
            if (period === 'week') {
                functionType = 'TIME_SERIES_INTRADAY';
            }
            
            let url;
            if (functionType === 'TIME_SERIES_INTRADAY') {
                url = `https://www.alphavantage.co/query?function=${functionType}&symbol=${symbol}&interval=60min&apikey=${apiKey}`;
            } else {
                url = `https://www.alphavantage.co/query?function=${functionType}&symbol=${symbol}&apikey=${apiKey}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data['Error Message']) {
                throw new Error('Failed to fetch historical data');
            }
            
            const timeSeriesKey = functionType === 'TIME_SERIES_INTRADAY' ? 'Time Series (60min)' : 'Time Series (Daily)';
            const timeSeries = data[timeSeriesKey];
            
            if (!timeSeries) {
                throw new Error('No historical data returned');
            }
            
            // 轉換數據格式
            const sortedDates = Object.keys(timeSeries).sort((a, b) => new Date(b) - new Date(a)).slice(0, 30);
            const prices = sortedDates.map(date => parseFloat(timeSeries[date]['4. close'])).reverse();
            
            return { prices, dates: sortedDates.reverse() };
        } catch (error) {
            console.warn('Failed to fetch historical data from Alpha Vantage:', error);
            
            // 嘗試使用 Finnhub 作為備用
            try {
                const apiKey = 'd60476hr01qihi8odml0d60476hr01qihi8odmlg';
                const resolution = period === 'week' ? '60' : 'D'; // 60分鐘或每日
                const days = period === 'week' ? 7 : 30;
                const to = Math.floor(Date.now() / 1000);
                const from = to - (days * 24 * 60 * 60);
                
                const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.s !== 'ok') {
                    throw new Error('Finnhub request failed');
                }
                
                return { prices: data.c, dates: data.t.map(t => new Date(t * 1000).toISOString().split('T')[0]) };
            } catch (error2) {
                console.warn('Failed to fetch historical data from Finnhub:', error2);
                // 返回 null 以使用模擬數據
                return null;
            }
        }
    }
}

// 導出圖表生成器
if (typeof window !== 'undefined') {
    window.StockChartGenerator = StockChartGenerator;
}