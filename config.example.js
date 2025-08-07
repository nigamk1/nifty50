// Example configuration for different instruments and timeframes
// This file shows how to modify the application for different use cases

const INSTRUMENT_KEYS = {
    // Indices
    NIFTY_50: 'NSE_INDEX|Nifty 50',
    NIFTY_BANK: 'NSE_INDEX|Nifty Bank',
    SENSEX: 'BSE_INDEX|SENSEX',
    
    // Popular Stocks (Examples - verify actual keys from Upstox)
    RELIANCE: 'NSE_EQ|INE002A01018',
    TCS: 'NSE_EQ|INE467B01029',
    HDFC_BANK: 'NSE_EQ|INE040A01034',
    
    // Currency
    USDINR: 'NSE_FO|USDINR',
    
    // Commodities (if available)
    GOLD: 'MCX_FO|GOLD',
    CRUDE_OIL: 'MCX_FO|CRUDEOIL'
};

const TIMEFRAMES = {
    ONE_MINUTE: 1 * 60 * 1000,      // 1 minute
    FIVE_MINUTES: 5 * 60 * 1000,    // 5 minutes (default)
    FIFTEEN_MINUTES: 15 * 60 * 1000, // 15 minutes
    THIRTY_MINUTES: 30 * 60 * 1000,  // 30 minutes
    ONE_HOUR: 60 * 60 * 1000,        // 1 hour
    FOUR_HOURS: 4 * 60 * 60 * 1000,  // 4 hours
    ONE_DAY: 24 * 60 * 60 * 1000     // 1 day
};

const TRADING_SESSIONS = {
    EQUITY: {
        preMarket: { start: '09:00', end: '09:15' },
        regular: { start: '09:15', end: '15:30' },
        postMarket: { start: '15:40', end: '16:00' }
    },
    CURRENCY: {
        regular: { start: '09:00', end: '17:00' }
    },
    COMMODITY: {
        regular: { start: '09:00', end: '23:30' }
    }
};

// Example: How to modify the main application for different configurations

/* 
To use different instrument:
1. Change this.instrumentKey in the constructor:
   this.instrumentKey = INSTRUMENT_KEYS.NIFTY_BANK;

2. Change candle interval:
   this.candleInterval = TIMEFRAMES.ONE_MINUTE;

3. Multiple instrument tracking:
   this.instrumentKeys = [
       INSTRUMENT_KEYS.NIFTY_50,
       INSTRUMENT_KEYS.NIFTY_BANK,
       INSTRUMENT_KEYS.SENSEX
   ];
*/

module.exports = {
    INSTRUMENT_KEYS,
    TIMEFRAMES,
    TRADING_SESSIONS
};
