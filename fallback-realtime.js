// fallback-realtime.js - REST API based real-time simulation
const https = require('https');
require('dotenv').config();

class UpstoxRestClient {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.isRunning = false;
        this.pollInterval = 5000; // 5 seconds
        this.instrumentKey = 'NSE_INDEX|Nifty 50';
        
        // Candle tracking
        this.currentCandle = null;
        this.candleInterval = 5 * 60 * 1000; // 5 minutes
        this.lastPrice = null;
        this.priceHistory = [];
        
        this.initializeCandleTracking();
    }

    async fetchQuote() {
        return new Promise((resolve, reject) => {
            const path = `/v2/market-quote/quotes?symbol=${encodeURIComponent(this.instrumentKey)}`;
            
            const options = {
                hostname: 'api.upstox.com',
                port: 443,
                path: path,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Api-Version': '2.0',
                    'Accept': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const response = JSON.parse(data);
                            resolve(response);
                        } catch (error) {
                            reject(new Error('Failed to parse response: ' + error.message));
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    async start() {
        console.log('🚀 Starting Upstox REST API Real-time Data Fetcher');
        console.log('📊 Fetching Nifty 50 data every 5 seconds...');
        console.log('🕯️ Generating 5-minute candles...');
        console.log('='.repeat(60));

        this.isRunning = true;
        this.pollData();
    }

    async pollData() {
        if (!this.isRunning) return;

        try {
            const quoteData = await this.fetchQuote();
            this.processQuoteData(quoteData);
        } catch (error) {
            console.error('❌ Error fetching quote:', error.message);
            
            if (error.message.includes('401')) {
                console.log('🔑 Token expired - please generate a new one');
                this.stop();
                return;
            }
        }

        // Schedule next poll
        setTimeout(() => this.pollData(), this.pollInterval);
    }

    processQuoteData(response) {
        if (!response.data || !response.data[this.instrumentKey]) {
            console.log('⚠️ No data received for Nifty 50');
            return;
        }

        const quote = response.data[this.instrumentKey];
        const currentPrice = quote.last_price;
        const timestamp = new Date();

        if (!currentPrice) {
            console.log('⚠️ No price data available');
            return;
        }

        // Create tick-like data
        const tick = {
            price: parseFloat(currentPrice),
            timestamp: timestamp,
            volume: quote.volume || 0,
            change: quote.net_change || 0,
            changePercent: quote.change_percentage || 0
        };

        console.log(`📊 [${timestamp.toISOString()}] Nifty 50: ₹${tick.price} (${tick.change >= 0 ? '+' : ''}${tick.change}, ${tick.changePercent >= 0 ? '+' : ''}${tick.changePercent.toFixed(2)}%)`);

        // Process for candle generation
        this.processTick(tick);
        
        // Store in history
        this.priceHistory.push(tick);
        
        // Keep only last 100 data points
        if (this.priceHistory.length > 100) {
            this.priceHistory.shift();
        }
    }

    initializeCandleTracking() {
        const now = new Date();
        const currentMinute = now.getMinutes();
        const nextCandleMinute = Math.ceil(currentMinute / 5) * 5;
        
        // Calculate next 5-minute boundary
        const nextCandleTime = new Date(now);
        nextCandleTime.setMinutes(nextCandleMinute, 0, 0);
        
        if (nextCandleTime <= now) {
            nextCandleTime.setTime(nextCandleTime.getTime() + this.candleInterval);
        }

        console.log(`⏰ Next candle will complete at: ${nextCandleTime.toISOString()}`);
        
        this.currentCandle = {
            startTime: new Date(nextCandleTime.getTime() - this.candleInterval),
            endTime: nextCandleTime,
            open: null,
            high: null,
            low: null,
            close: null,
            tickCount: 0,
            volume: 0
        };

        // Set up interval to generate candles
        this.setCandleTimer();
    }

    setCandleTimer() {
        const now = new Date();
        const timeToNextCandle = this.currentCandle.endTime.getTime() - now.getTime();
        
        setTimeout(() => {
            this.generateCandle();
            this.initializeNextCandle();
            this.setCandleTimer();
        }, timeToNextCandle);
    }

    processTick(tick) {
        if (!this.currentCandle) {
            return;
        }

        const tickTime = tick.timestamp;
        
        // Check if tick falls within current candle timeframe
        if (tickTime >= this.currentCandle.startTime && tickTime < this.currentCandle.endTime) {
            // First tick of the candle
            if (this.currentCandle.open === null) {
                this.currentCandle.open = tick.price;
                this.currentCandle.high = tick.price;
                this.currentCandle.low = tick.price;
            } else {
                // Update high and low
                this.currentCandle.high = Math.max(this.currentCandle.high, tick.price);
                this.currentCandle.low = Math.min(this.currentCandle.low, tick.price);
            }
            
            // Always update close with latest price
            this.currentCandle.close = tick.price;
            this.currentCandle.tickCount++;
            this.currentCandle.volume += tick.volume || 0;
        }
    }

    generateCandle() {
        if (!this.currentCandle || this.currentCandle.open === null) {
            console.log('⚠️ No data received for this candle period');
            return;
        }

        const candle = {
            symbol: 'NIFTY50',
            timeframe: '5m',
            startTime: this.currentCandle.startTime.toISOString(),
            endTime: this.currentCandle.endTime.toISOString(),
            open: this.currentCandle.open,
            high: this.currentCandle.high,
            low: this.currentCandle.low,
            close: this.currentCandle.close,
            tickCount: this.currentCandle.tickCount,
            volume: this.currentCandle.volume
        };

        console.log('\n🕯️ ===== 5-MINUTE CANDLE GENERATED =====');
        console.log(`📅 Time: ${candle.startTime} to ${candle.endTime}`);
        console.log(`📊 OHLC: O=${candle.open} H=${candle.high} L=${candle.low} C=${candle.close}`);
        console.log(`📈 Change: ${(candle.close - candle.open).toFixed(2)} (${((candle.close - candle.open) / candle.open * 100).toFixed(2)}%)`);
        console.log(`🔢 Data points: ${candle.tickCount}`);
        console.log('=====================================\n');

        // Save to file
        this.saveCandle(candle);
    }

    initializeNextCandle() {
        const nextStartTime = new Date(this.currentCandle.endTime);
        const nextEndTime = new Date(nextStartTime.getTime() + this.candleInterval);

        this.currentCandle = {
            startTime: nextStartTime,
            endTime: nextEndTime,
            open: null,
            high: null,
            low: null,
            close: null,
            tickCount: 0,
            volume: 0
        };

        console.log(`⏰ Next candle period: ${nextStartTime.toISOString()} to ${nextEndTime.toISOString()}`);
    }

    saveCandle(candle) {
        const fs = require('fs');
        const candleLog = `${new Date().toISOString()},${candle.open},${candle.high},${candle.low},${candle.close},${candle.tickCount}\n`;
        
        try {
            fs.appendFileSync('nifty50_candles_rest.csv', candleLog);
        } catch (error) {
            console.error('❌ Error saving candle to file:', error.message);
        }
    }

    stop() {
        console.log('🛑 Stopping data fetcher...');
        this.isRunning = false;
    }
}

// Main execution
function main() {
    const accessToken = process.env.UPSTOX_ACCESS_TOKEN;
    
    if (!accessToken) {
        console.error('❌ UPSTOX_ACCESS_TOKEN not found in environment variables');
        process.exit(1);
    }

    // Create CSV header if file doesn't exist
    const fs = require('fs');
    if (!fs.existsSync('nifty50_candles_rest.csv')) {
        fs.writeFileSync('nifty50_candles_rest.csv', 'timestamp,open,high,low,close,tick_count\n');
        console.log('📄 Created candle data file: nifty50_candles_rest.csv');
    }

    const client = new UpstoxRestClient(accessToken);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n⚠️ Received SIGINT. Shutting down gracefully...');
        client.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n⚠️ Received SIGTERM. Shutting down gracefully...');
        client.stop();
        process.exit(0);
    });

    // Start the client
    client.start();
}

if (require.main === module) {
    main();
}

module.exports = UpstoxRestClient;
