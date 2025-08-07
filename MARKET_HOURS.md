# Market Hours Implementation

## Overview
The application now includes comprehensive market hours checking to ensure data collection only happens during NSE trading hours. This prevents unnecessary API calls and candle generation when the market is closed.

## Key Features

### 1. Market Hours Utility (`market-hours.js`)
- **Trading Sessions**: Supports Equity, Currency, and Commodity market hours
- **Holiday Management**: Includes NSE trading holidays for 2025
- **IST Time Handling**: Correctly handles Indian Standard Time (UTC+5:30)
- **Session Detection**: Identifies pre-market, regular, and post-market sessions

### 2. Trading Schedule
```
Equity Market (NSE):
- Pre-market: 09:00 - 09:15 IST
- Regular: 09:15 - 15:30 IST  
- Post-market: 15:40 - 16:00 IST
- Trading Days: Monday to Friday (excluding holidays)

Currency Market:
- Regular: 09:00 - 17:00 IST

Commodity Market:
- Regular: 09:00 - 23:30 IST
```

### 3. Application Behavior

#### When Market is Closed:
- ✅ Shows clear "Market is CLOSED" status
- ✅ Displays current IST time
- ✅ Shows next market opening time
- ✅ No WebSocket connections attempted
- ✅ No REST API polling
- ✅ No candle generation
- ✅ Periodic status checks every minute

#### When Market Opens:
- ✅ Automatically detects market opening
- ✅ Starts data collection (WebSocket/REST)
- ✅ Initializes candle tracking
- ✅ Resumes normal operations

#### When Market Closes:
- ✅ Automatically detects market closure
- ✅ Stops data collection
- ✅ Closes WebSocket connections
- ✅ Stops candle generation

## Implementation Details

### Core Methods

1. **`checkMarketStatus()`**
   - Checks if market is open for equity trading
   - Includes pre-market session option
   - Updates internal market status
   - Triggers start/stop of data collection

2. **`startMarketMonitoring()`**
   - Performs immediate market status check
   - Sets up periodic checking every minute
   - Starts when application launches

3. **`startDataCollection()`**
   - Only runs when market is open
   - Initializes candle tracking
   - Starts WebSocket or REST polling

4. **`stopDataCollection()`**
   - Stops all data collection activities
   - Closes connections
   - Prevents further candle generation

### Market Hours Utility Features

1. **Time Zone Handling**
   ```javascript
   getCurrentISTTime() // Returns current time in IST
   ```

2. **Trading Day Validation**
   ```javascript
   isTradingDay() // Checks weekday + holidays
   ```

3. **Session Detection**
   ```javascript
   isMarketOpen('EQUITY', true) // includePreMarket = true
   ```

4. **Status Messages**
   ```javascript
   getMarketStatusMessage() // Human-readable status
   ```

## Testing

### Test Market Hours Functionality
```bash
node test-market-hours.js
```

This test shows:
- Current market status
- Trading day validation
- Different market sessions
- IST time conversion
- Next opening/closing times

### Sample Output
```
🔴 Market is CLOSED (Market is closed (outside trading hours)) 
Current time: 21:18:14 IST 
Next open: Friday, 8/8/2025 at 09:15 IST
```

## Benefits

1. **API Efficiency**: No unnecessary API calls during market closure
2. **Resource Conservation**: Reduced server load and bandwidth usage
3. **Accurate Data**: Only generates candles with real market data
4. **User Experience**: Clear status messages about market state
5. **Automatic Operation**: Seamlessly starts/stops with market hours

## Configuration

### Adding Holidays
Edit `market-hours.js` to add new NSE holidays:
```javascript
this.holidays = [
    '2025-01-26', // Republic Day
    '2025-03-14', // Holi
    // Add more holidays here
];
```

### Changing Check Frequency
Modify the interval in `startMarketMonitoring()`:
```javascript
// Check every 30 seconds instead of 1 minute
this.marketCheckInterval = setInterval(() => {
    this.checkMarketStatus();
}, 30 * 1000);
```

## Error Handling

The application gracefully handles:
- Network issues during market hours check
- Time zone conversion errors
- Invalid market session types
- Missing environment variables

## Monitoring

The application provides clear logs for:
- Market status changes
- Data collection start/stop
- Connection attempts during closure
- Candle generation restrictions

This implementation ensures the application respects market hours and only operates when meaningful data is available, preventing the generation of empty or artificial candles during market closure periods.
