// alert-manager.js - Alert Management System
const TelegramBot = require('./telegram-bot');
const EMACalculator = require('./ema-calculator');

class AlertManager {
    constructor(telegramConfig) {
        this.telegramBot = new TelegramBot(telegramConfig.botToken, telegramConfig.chatId);
        this.ema5 = new EMACalculator(5);
        
        // Alert state management
        this.isAboveEMA = false;
        this.consecutiveAboveEMA = 0;
        this.lastAlertTime = null;
        this.alertCooldown = 5 * 60 * 1000; // 5 minutes cooldown between similar alerts
        
        // Settings
        this.settings = {
            enableAlerts: true,
            minConsecutiveCandles: 1, // Minimum consecutive candles above EMA before alert
            alertCooldownMinutes: 5,
            debugMode: true
        };

        console.log('🚨 Alert Manager initialized');
        console.log(`   📱 Telegram Bot: ${telegramConfig.botToken ? 'Configured' : 'Not configured'}`);
        console.log(`   📊 EMA Period: 5`);
        console.log(`   ⏰ Alert Cooldown: ${this.settings.alertCooldownMinutes} minutes`);
    }

    async initialize() {
        console.log('🔄 Initializing Alert Manager...');
        
        // Test Telegram connection
        if (this.telegramBot.botToken && this.telegramBot.chatId) {
            const connected = await this.telegramBot.testConnection();
            if (connected) {
                await this.telegramBot.sendAlert('SYSTEM_STATUS', {
                    status: 'ONLINE',
                    message: 'Nifty 50 EMA Alert System started successfully! 🚀',
                    timestamp: new Date()
                });
            }
        } else {
            console.log('⚠️ Telegram bot not configured. Alerts will be logged only.');
        }

        return true;
    }

    // Load historical candle data to calculate initial EMA
    async loadHistoricalData(candles) {
        console.log('📚 Loading historical candle data for EMA calculation...');
        
        if (!candles || candles.length === 0) {
            console.log('⚠️ No historical data available. Starting EMA calculation from live data.');
            return;
        }

        // Sort candles by timestamp
        const sortedCandles = candles.sort((a, b) => {
            const timeA = new Date(a.timestamp || a.endTime).getTime();
            const timeB = new Date(b.timestamp || b.endTime).getTime();
            return timeA - timeB;
        });

        this.ema5.loadFromCandles(sortedCandles);
        
        console.log(`✅ Historical data loaded. EMA-5 ready: ₹${this.ema5.getCurrentEMA()?.toFixed(2) || 'Not available'}`);
    }

    // Process new candle and check for alerts
    async processCandle(candle) {
        if (!candle || !candle.close) {
            console.log('⚠️ Invalid candle data received');
            return;
        }

        const closePrice = parseFloat(candle.close);
        const high = parseFloat(candle.high);
        const low = parseFloat(candle.low);
        const timestamp = new Date(candle.endTime || candle.timestamp);

        // Update EMA with new closing price
        const newEMA = this.ema5.addPrice(closePrice, timestamp);
        
        if (!this.ema5.isReady()) {
            console.log('📊 EMA still calculating... Need more data points.');
            return;
        }

        console.log(`\n📊 [${timestamp.toISOString()}] Candle Analysis:`);
        console.log(`   💰 OHLC: ${candle.open} | ${high} | ${low} | ${closePrice}`);
        console.log(`   📈 5-EMA: ₹${newEMA.toFixed(2)}`);
        console.log(`   📏 Distance: Low-EMA = ₹${(low - newEMA).toFixed(2)}, High-EMA = ₹${(high - newEMA).toFixed(2)}`);

        // Check if candle is completely above EMA (doesn't touch EMA line)
        const isCandleAboveEMA = low > newEMA && high > newEMA;
        
        if (this.settings.debugMode) {
            console.log(`   🔍 Analysis: Candle ${isCandleAboveEMA ? 'COMPLETELY ABOVE' : 'touches/below'} EMA`);
            console.log(`   📊 Low (${low}) > EMA (${newEMA.toFixed(2)}): ${low > newEMA}`);
            console.log(`   📊 High (${high}) > EMA (${newEMA.toFixed(2)}): ${high > newEMA}`);
        }

        // Update state tracking
        if (isCandleAboveEMA) {
            if (!this.isAboveEMA) {
                // First candle above EMA
                this.isAboveEMA = true;
                this.consecutiveAboveEMA = 1;
                console.log(`🚀 First candle completely above EMA detected!`);
            } else {
                // Consecutive candle above EMA
                this.consecutiveAboveEMA++;
                console.log(`📈 Consecutive candles above EMA: ${this.consecutiveAboveEMA}`);
            }

            // Check if we should send an alert
            await this.checkAndSendAlert(candle, newEMA, timestamp);

        } else {
            // Candle touched or went below EMA
            if (this.isAboveEMA) {
                console.log(`📉 Candle touched/below EMA. Signal ended. (Was above for ${this.consecutiveAboveEMA} candles)`);
                
                // Send signal end notification if we had a previous signal
                if (this.consecutiveAboveEMA >= this.settings.minConsecutiveCandles) {
                    await this.sendSignalEndAlert(candle, newEMA, timestamp);
                }
            }
            
            // Reset tracking
            this.isAboveEMA = false;
            this.consecutiveAboveEMA = 0;
        }
    }

    async checkAndSendAlert(candle, ema5, timestamp) {
        // Check if we meet minimum criteria for alert
        if (this.consecutiveAboveEMA < this.settings.minConsecutiveCandles) {
            console.log(`   ⏳ Waiting for ${this.settings.minConsecutiveCandles - this.consecutiveAboveEMA} more consecutive candle(s) above EMA`);
            return;
        }

        // Check cooldown period
        if (this.lastAlertTime) {
            const timeSinceLastAlert = timestamp.getTime() - this.lastAlertTime.getTime();
            if (timeSinceLastAlert < this.alertCooldown) {
                const remainingCooldown = Math.ceil((this.alertCooldown - timeSinceLastAlert) / 1000 / 60);
                console.log(`   ⏰ Alert cooldown active. ${remainingCooldown} minutes remaining.`);
                return;
            }
        }

        // Send the alert!
        console.log('\n🚨 SENDING EMA BREAKOUT ALERT! 🚨');
        
        const alertData = {
            candle: {
                open: parseFloat(candle.open),
                high: parseFloat(candle.high),
                low: parseFloat(candle.low),
                close: parseFloat(candle.close)
            },
            ema5: ema5,
            timestamp: timestamp,
            consecutiveCandles: this.consecutiveAboveEMA
        };

        if (this.settings.enableAlerts) {
            const success = await this.telegramBot.sendAlert('EMA_BREAKOUT', alertData);
            if (success) {
                this.lastAlertTime = timestamp;
                console.log('✅ Alert sent successfully!');
            } else {
                console.log('❌ Failed to send alert');
            }
        } else {
            console.log('📝 Alert would be sent (alerts disabled)');
        }
    }

    async sendSignalEndAlert(candle, ema5, timestamp) {
        if (!this.settings.enableAlerts) return;

        const alertData = {
            candle: {
                open: parseFloat(candle.open),
                high: parseFloat(candle.high),
                low: parseFloat(candle.low),
                close: parseFloat(candle.close)
            },
            ema5: ema5,
            timestamp: timestamp
        };

        await this.telegramBot.sendAlert('EMA_BREAKDOWN', alertData);
        console.log('📩 Signal end notification sent');
    }

    // Configuration methods
    setAlertSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        this.alertCooldown = this.settings.alertCooldownMinutes * 60 * 1000;
        console.log('⚙️ Alert settings updated:', this.settings);
    }

    enableAlerts() {
        this.settings.enableAlerts = true;
        console.log('🔔 Alerts enabled');
    }

    disableAlerts() {
        this.settings.enableAlerts = false;
        console.log('🔕 Alerts disabled');
    }

    getStatus() {
        return {
            emaReady: this.ema5.isReady(),
            currentEMA: this.ema5.getCurrentEMA(),
            isAboveEMA: this.isAboveEMA,
            consecutiveAboveEMA: this.consecutiveAboveEMA,
            lastAlertTime: this.lastAlertTime,
            settings: this.settings
        };
    }

    async shutdown() {
        console.log('🛑 Alert Manager shutting down...');
        
        if (this.settings.enableAlerts) {
            await this.telegramBot.sendAlert('SYSTEM_STATUS', {
                status: 'OFFLINE',
                message: 'Nifty 50 EMA Alert System stopped.',
                timestamp: new Date()
            });
        }
    }
}

module.exports = AlertManager;
