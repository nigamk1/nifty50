// ema-calculator.js - Exponential Moving Average Calculator
class EMACalculator {
    constructor(period = 5) {
        this.period = period;
        this.multiplier = 2 / (period + 1);
        this.ema = null;
        this.prices = [];
        this.history = []; // Store EMA history
    }

    addPrice(price, timestamp = new Date()) {
        this.prices.push({ price, timestamp });
        
        if (this.ema === null) {
            // For the first calculation, use SMA if we have enough data
            if (this.prices.length >= this.period) {
                const smaSum = this.prices.slice(-this.period).reduce((sum, item) => sum + item.price, 0);
                this.ema = smaSum / this.period;
            }
        } else {
            // Calculate EMA: EMA = (Close × Multiplier) + (Previous EMA × (1 - Multiplier))
            this.ema = (price * this.multiplier) + (this.ema * (1 - this.multiplier));
        }

        // Store in history
        if (this.ema !== null) {
            this.history.push({
                timestamp,
                price,
                ema: this.ema
            });
        }

        // Keep only recent data (last 100 points)
        if (this.prices.length > 100) {
            this.prices = this.prices.slice(-100);
        }
        if (this.history.length > 100) {
            this.history = this.history.slice(-100);
        }

        return this.ema;
    }

    getCurrentEMA() {
        return this.ema;
    }

    isReady() {
        return this.ema !== null;
    }

    getHistory() {
        return [...this.history]; // Return copy
    }

    getLastNValues(n = 10) {
        return this.history.slice(-n);
    }

    reset() {
        this.ema = null;
        this.prices = [];
        this.history = [];
    }

    // Load from historical candle data
    loadFromCandles(candles) {
        this.reset();
        
        console.log(`📊 Loading ${candles.length} historical candles for EMA calculation...`);
        
        candles.forEach((candle, index) => {
            // Use closing price for EMA calculation
            const closePrice = parseFloat(candle.close);
            const timestamp = new Date(candle.timestamp || candle.endTime);
            
            this.addPrice(closePrice, timestamp);
            
            if (index < 5 || index % 10 === 0) {
                console.log(`   [${index + 1}] Price: ₹${closePrice}, EMA: ${this.ema ? '₹' + this.ema.toFixed(2) : 'Calculating...'}`);
            }
        });
        
        console.log(`✅ EMA calculator ready. Current 5-EMA: ₹${this.ema ? this.ema.toFixed(2) : 'Not available'}`);
        return this.ema;
    }
}

module.exports = EMACalculator;
