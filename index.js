const WebSocket = require('ws');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const AlertManager = require('./alert-manager');
const MarketHours = require('./market-hours');
require('dotenv').config();

class UpstoxDataClient {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3; // Reduced attempts before fallback
        this.reconnectInterval = 5000; // 5 seconds
        this.useRestFallback = false;
        this.pollInterval = 5000; // 5 seconds for REST API
        this.isRunning = false;
        
        // Market hours utility
        this.marketHours = new MarketHours();
        this.marketCheckInterval = null;
        this.isMarketOpen = false;
        
        // Nifty 50 instrument key (working format confirmed)
        this.instrumentKey = 'NSE_INDEX|Nifty 50';
        
        // Tick data storage
        this.tickData = [];
        this.currentCandle = null;
        this.candleInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.completedCandles = []; // Store completed candles for EMA calculation
        
        // Alert system
        this.alertManager = null;
        this.alertSystemReady = false;
        
        // Bind methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.onOpen = this.onOpen.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onError = this.onError.bind(this);
        this.onClose = this.onClose.bind(this);
        this.initializeAlertSystem = this.initializeAlertSystem.bind(this);
    }

    async initializeAlertSystem() {
        try {
            const telegramConfig = {
                botToken: process.env.TELEGRAM_BOT_TOKEN,
                chatId: process.env.TELEGRAM_CHAT_ID
            };

            this.alertManager = new AlertManager(telegramConfig);
            
            // Load historical candles if available
            await this.loadHistoricalCandles();
            
            // Initialize the alert manager
            await this.alertManager.initialize();
            
            console.log('🚨 Alert system initialized successfully');
            this.alertSystemReady = true;
        } catch (error) {
            console.error('❌ Failed to initialize alert system:', error.message);
            console.log('📝 Continuing without alerts...');
            this.alertSystemReady = true; // Continue even without alerts
        }
    }

    async loadHistoricalCandles() {
        try {
            const fs = require('fs');
            const path = 'nifty50_candles.csv';
            
            if (fs.existsSync(path)) {
                const csvData = fs.readFileSync(path, 'utf8');
                const lines = csvData.split('\n').filter(line => line.trim() && !line.startsWith('timestamp'));
                
                const historicalCandles = lines.map(line => {
                    const [timestamp, open, high, low, close, tickCount] = line.split(',');
                    return {
                        timestamp,
                        endTime: timestamp,
                        open: parseFloat(open),
                        high: parseFloat(high),
                        low: parseFloat(low),
                        close: parseFloat(close),
                        tickCount: parseInt(tickCount)
                    };
                }).filter(candle => !isNaN(candle.close));

                if (historicalCandles.length > 0) {
                    console.log(`📚 Loading ${historicalCandles.length} historical candles for EMA calculation...`);
                    this.completedCandles = historicalCandles;
                    await this.alertManager.loadHistoricalData(historicalCandles);
                } else {
                    console.log('📊 No valid historical candles found. Starting fresh EMA calculation.');
                }
            } else {
                console.log('📊 No historical candle file found. Starting fresh EMA calculation.');
            }
        } catch (error) {
            console.error('❌ Error loading historical candles:', error.message);
        }
    }

    /**
     * Check if market is currently open and update status
     */
    checkMarketStatus() {
        console.log('🔍 Checking market status...');
        const status = this.marketHours.isMarketOpen('EQUITY', true);
        const previousStatus = this.isMarketOpen;
        this.isMarketOpen = status.isOpen;

        // Log status change
        if (previousStatus !== this.isMarketOpen) {
            console.log('\n' + '='.repeat(60));
            console.log(this.marketHours.getMarketStatusMessage());
            console.log('='.repeat(60) + '\n');

            if (this.isMarketOpen) {
                console.log('🟢 Market opened - Starting data collection...');
                this.startDataCollection();
            } else {
                console.log('🔴 Market closed - Stopping data collection...');
                this.stopDataCollection();
            }
        } else {
            // Always show status on first check or periodically
            console.log(this.marketHours.getMarketStatusMessage());
        }

        return status;
    }

    /**
     * Start data collection (WebSocket or REST polling)
     */
    startDataCollection() {
        if (!this.isRunning) {
            this.isRunning = true;
            
            // Initialize candle tracking when starting data collection
            if (!this.currentCandle) {
                this.initializeCandleTracking();
            }
            
            this.connect();
        }
    }

    /**
     * Stop data collection
     */
    stopDataCollection() {
        if (this.isRunning) {
            this.isRunning = false;
            if (this.ws && this.isConnected) {
                this.ws.close(1000, 'Market closed');
            }
            if (this.pollInterval) {
                clearInterval(this.pollInterval);
            }
        }
    }

    /**
     * Start periodic market hours checking
     */
    startMarketMonitoring() {
        // Check market status immediately
        this.checkMarketStatus();

        // Check every minute
        this.marketCheckInterval = setInterval(() => {
            this.checkMarketStatus();
        }, 60 * 1000); // 1 minute

        console.log('⏰ Market hours monitoring started (checking every minute)');
    }

    /**
     * Stop market hours monitoring
     */
    stopMarketMonitoring() {
        if (this.marketCheckInterval) {
            clearInterval(this.marketCheckInterval);
            this.marketCheckInterval = null;
        }
    }

    connect() {
        // Only connect if market is open
        if (!this.isMarketOpen) {
            console.log('⚠️ Skipping connection - Market is closed');
            return;
        }

        if (this.useRestFallback) {
            this.startRestPolling();
            return;
        }

        try {
            console.log('🔄 Connecting to Upstox WebSocket...');
            
            // Try the market data feed endpoint with Authorization header
            const wsUrl = 'wss://ws-api.upstox.com/v3/feed/market-data-feed';
            
            this.ws = new WebSocket(wsUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Api-Version': '3.0',
                    'Accept': 'application/json'
                }
            });

            this.ws.on('open', this.onOpen);
            this.ws.on('message', this.onMessage);
            this.ws.on('error', this.onError);
            this.ws.on('close', this.onClose);
            
        } catch (error) {
            console.error('❌ Error creating WebSocket connection:', error.message);
            this.scheduleReconnect();
        }
    }

    onOpen() {
        console.log('✅ Connected to Upstox WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to Nifty 50 Index
        this.subscribeToInstrument();
        
        // Initialize candle tracking
        this.initializeCandleTracking();
    }

    subscribeToInstrument() {
        const subscriptionMessage = {
            guid: uuidv4(),
            method: 'sub',
            data: {
                mode: 'full',
                instrumentKeys: [this.instrumentKey]
            }
        };

        console.log(`📡 Subscribing to ${this.instrumentKey}...`);
        this.ws.send(JSON.stringify(subscriptionMessage));
    }

    onMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'feed') {
                this.processFeedData(message.feeds);
            } else if (message.type === 'success') {
                console.log('✅ Subscription successful:', message.data);
            } else if (message.type === 'error') {
                console.error('❌ Subscription error:', message.data);
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error.message);
        }
    }

    processFeedData(feeds) {
        if (!feeds || !feeds[this.instrumentKey]) {
            return;
        }

        const feedData = feeds[this.instrumentKey];
        const { ltp: lastTradedPrice, ts: timestamp } = feedData;

        if (lastTradedPrice && timestamp) {
            const tickTime = new Date(timestamp);
            const tick = {
                price: parseFloat(lastTradedPrice),
                timestamp: tickTime,
                rawTimestamp: timestamp
            };

            console.log(`📊 Tick: ${tick.price} at ${tickTime.toISOString()}`);
            
            // Process tick for candle generation
            this.processTick(tick);
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
            tickCount: 0
        };

        // Set up interval to generate candles
        this.setCandleTimer();
    }

    setCandleTimer() {
        const now = new Date();
        const timeToNextCandle = this.currentCandle.endTime.getTime() - now.getTime();
        
        setTimeout(() => {
            // Only generate candle if market is open
            if (this.isMarketOpen) {
                this.generateCandle();
                this.initializeNextCandle();
                this.setCandleTimer();
            } else {
                console.log('⚠️ Skipping candle timer - Market is closed');
            }
        }, timeToNextCandle);
    }

    processTick(tick) {
        // Only process ticks during market hours
        if (!this.isMarketOpen) {
            console.log('⚠️ Ignoring tick - Market is closed');
            return;
        }

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
            
            // Store tick data
            this.tickData.push(tick);
        }
    }

    generateCandle() {
        // Only generate candles during market hours
        if (!this.isMarketOpen) {
            console.log('⚠️ Skipping candle generation - Market is closed');
            return;
        }

        if (!this.currentCandle || this.currentCandle.open === null) {
            console.log('⚠️ No ticks received for this candle period');
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
            tickCount: this.currentCandle.tickCount
        };

        console.log('\n🕯️ ===== 5-MINUTE CANDLE GENERATED =====');
        console.log(`📅 Time: ${candle.startTime} to ${candle.endTime}`);
        console.log(`📊 OHLC: O=${candle.open} H=${candle.high} L=${candle.low} C=${candle.close}`);
        console.log(`🔢 Ticks processed: ${candle.tickCount}`);
        console.log('=====================================\n');

        // Save completed candle
        this.completedCandles.push(candle);
        
        // Keep only last 100 candles in memory
        if (this.completedCandles.length > 100) {
            this.completedCandles = this.completedCandles.slice(-100);
        }

        // Process candle for alerts
        if (this.alertManager) {
            this.alertManager.processCandle(candle).catch(error => {
                console.error('❌ Error processing candle for alerts:', error.message);
            });
        }

        // Optional: Save to file or database
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
            tickCount: 0
        };

        console.log(`⏰ Next candle period: ${nextStartTime.toISOString()} to ${nextEndTime.toISOString()}`);
    }

    saveCandle(candle) {
        // Optional: Implement file or database storage
        // For now, just keep in memory
        const fs = require('fs');
        const candleLog = `${new Date().toISOString()},${candle.open},${candle.high},${candle.low},${candle.close},${candle.tickCount}\n`;
        
        try {
            fs.appendFileSync('nifty50_candles.csv', candleLog);
        } catch (error) {
            console.error('❌ Error saving candle to file:', error.message);
        }
    }

    onError(error) {
        console.error('❌ WebSocket error:', error.message);
        this.isConnected = false;
    }

    onClose(code, reason) {
        console.log(`🔌 WebSocket connection closed. Code: ${code}, Reason: ${reason || 'Unknown'}`);
        this.isConnected = false;
        
        if (code !== 1000) { // Not a normal closure
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ WebSocket connection failed multiple times. Switching to REST API fallback...');
            this.useRestFallback = true;
            this.startRestPolling();
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Attempting to reconnect in ${this.reconnectInterval / 1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectInterval);
    }

    // REST API fallback methods
    async startRestPolling() {
        console.log('\n🔄 Starting REST API fallback mode...');
        console.log('📊 Fetching Nifty 50 data every 5 seconds...');
        console.log('🕯️ Generating 5-minute candles...');
        console.log('='.repeat(60));

        this.isRunning = true;
        
        // Only initialize candle tracking if not already done
        if (!this.currentCandle) {
            this.initializeCandleTracking();
        }
        
        this.pollData();
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

    async pollData() {
        if (!this.isRunning) return;

        // Check if market is open before polling
        if (!this.isMarketOpen) {
            console.log('⚠️ Skipping data poll - Market is closed');
            // Schedule next poll check (still need to check periodically if market opens)
            setTimeout(() => this.pollData(), this.pollInterval);
            return;
        }

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
        // Note: BSE SENSEX uses a different key format in response
        const responseKey = Object.keys(response.data)[0]; // Get the actual key from response
        const quote = response.data[responseKey];
        
        if (!quote) {
            console.log('⚠️ No data received for Nifty 50');
            return;
        }

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
            changePercent: ((quote.net_change || 0) / (currentPrice - (quote.net_change || 0)) * 100) || 0
        };

        console.log(`📊 [${timestamp.toISOString()}] NIFTY 50: ₹${tick.price} (${tick.change >= 0 ? '+' : ''}${tick.change.toFixed(2)}, ${tick.changePercent >= 0 ? '+' : ''}${tick.changePercent.toFixed(2)}%)`);

        // Process for candle generation
        this.processTick(tick);
        
        // Store tick data
        this.tickData.push(tick);
    }

    stop() {
        console.log('🛑 Stopping data client...');
        this.isRunning = false;
        if (this.ws) {
            this.ws.close();
        }
        
        // Stop market monitoring
        this.stopMarketMonitoring();
        
        // Shutdown alert system
        if (this.alertManager) {
            this.alertManager.shutdown().catch(error => {
                console.error('❌ Error shutting down alert system:', error.message);
            });
        }
    }

    disconnect() {
        if (this.ws) {
            console.log('🔌 Disconnecting from WebSocket...');
            this.ws.close(1000, 'Manual disconnect');
        }
        this.stop();
    }
}

// Main application
async function main() {
    console.log('🚀 Starting Upstox Nifty 50 Real-time Candle Generator');
    console.log('='.repeat(60));

    // Check for access token
    const accessToken = process.env.UPSTOX_ACCESS_TOKEN;
    
    if (!accessToken) {
        console.error('❌ UPSTOX_ACCESS_TOKEN not found in environment variables');
        console.log('💡 Please set your Upstox access token in the .env file');
        process.exit(1);
    }

    // Create CSV header if file doesn't exist
    const fs = require('fs');
    if (!fs.existsSync('nifty50_candles.csv')) {
        fs.writeFileSync('nifty50_candles.csv', 'timestamp,open,high,low,close,tick_count\n');
        console.log('📄 Created candle data file: nifty50_candles.csv');
    }

    // Initialize client
    const client = new UpstoxDataClient(accessToken);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n⚠️ Received SIGINT. Shutting down gracefully...');
        client.disconnect();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n⚠️ Received SIGTERM. Shutting down gracefully...');
        client.disconnect();
        process.exit(0);
    });

    // Initialize alert system first, then start market monitoring
    console.log('🔄 Initializing alert system...');
    await client.initializeAlertSystem();
    
    // Start market monitoring (will connect automatically when market opens)
    console.log('⏰ Starting market hours monitoring...');
    client.startMarketMonitoring();
}

// Run the application
if (require.main === module) {
    main();
}

module.exports = UpstoxDataClient;
