# 🚀 Nifty 50 Real-time Alert System

A comprehensive Node.js application that connects to Upstox API to monitor Nifty 50 index in real-time and sends instant Telegram alerts when 5-minute candles break above the 5-period Exponential Moving Average (EMA) without touching it.

## 🎯 Features

### 📊 **Real-time Data Processing**
- 🔄 Real-time WebSocket connection to Upstox Market Feed API
- 📊 Live Nifty 50 Index tick data processing  
- 🕯️ Automatic 5-minute OHLC candle generation
- 💾 CSV file output for historical data storage

### 📈 **Advanced Technical Analysis**
- 📊 5-Period EMA Calculation from real-time candles
- 🎯 Precise breakout detection when candles are completely above EMA
- 📚 Historical data loading for accurate EMA initialization
- 🔍 No-touch condition monitoring (candle doesn't touch EMA line)

### 🚨 **Intelligent Alert System**
- 📱 Instant Telegram notifications with rich formatting
- 🎯 Smart alert conditions (5-EMA breakout detection)
- ⏰ 5-minute cooldown between similar alerts
- 📊 Detailed candle information (OHLC, EMA values, distances)
- 🔥 Signal strength tracking (consecutive candles above EMA)
### 🛡️ **Robust Architecture**
- 🔁 Automatic reconnection with exponential backoff
- ⚡ Graceful error handling and shutdown  
- 🔒 Secure configuration using environment variables
- 🔄 WebSocket → REST API fallback for reliability

## 📱 Alert System Preview

### 🎯 **Alert Conditions**
The system triggers alerts when:
- ✅ **Low > 5-EMA** (bottom doesn't touch EMA)
- ✅ **High > 5-EMA** (top doesn't touch EMA)  
- ✅ **Complete separation** from EMA line
- ✅ **5-minute cooldown** between similar alerts

### 📲 **Sample Alert Message**
```
🚀 NIFTY 50 EMA BREAKOUT ALERT!

📊 Candle Details:
🕐 Time: 07/08/2025, 1:25:00 pm
💰 OHLC: 24400.50 | 24450.75 | 24420.25 | 24445.00
📈 5-EMA: ₹24415.30

✅ Condition Met:
• Candle completely ABOVE 5-EMA
• Low: ₹24420.25 > EMA: ₹24415.30
• High: ₹24450.75 > EMA: ₹24415.30

🔥 Signal Strength:
📊 Consecutive candles above EMA: 2
📈 Distance from EMA: +₹4.95 (0.20%)

⚡ Action: Strong bullish momentum detected!
```

## Prerequisites

- Node.js (>=16.0.0)
- Upstox Developer Account and API Access Token
- Telegram Account for receiving alerts
- Active internet connection for WebSocket connectivity

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/nigamk1/alert-system.git
cd alert-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env` and configure:
```bash
copy .env.example .env
```

Edit `.env` file:
```env
# Upstox API Configuration
UPSTOX_ACCESS_TOKEN=your_upstox_access_token_here

# Telegram Bot Configuration  
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info
```

### 4. Set Up Telegram Bot
```bash
npm run setup-telegram
```

### 5. Test Your Setup
```bash
npm run test-telegram
```

### 6. Start Application
```bash
npm start
```

## 📱 Telegram Bot Setup

### **Step 1: Create Bot**
1. Message `@BotFather` on Telegram
2. Send `/newbot` 
3. Choose name: "Nifty 50 Alert Bot"
4. Choose username: "nifty50_alert_bot"
5. Copy the bot token

### **Step 2: Get Chat ID**
1. Message `@userinfobot` on Telegram
2. Send `/start`
3. Copy your Chat ID number

### **Step 3: Update .env**
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321
```

## Getting Upstox Access Token

1. Sign up at [Upstox Developer Console](https://developer.upstox.com/)
2. Create a new app and get your API credentials
3. Use the OAuth flow to generate an access token
4. Add the access token to your `.env` file

## Usage

### Running the Application

```bash
# Start the application
npm start

# Or run directly
node index.js
```

### Expected Output

The application will:

1. Connect to Upstox WebSocket API
2. Subscribe to Nifty 50 Index data
3. Process incoming tick data in real-time
4. Generate 5-minute OHLC candles
5. Log candle data to console and save to CSV file

### Sample Console Output

```
🚀 Starting Upstox Nifty 50 Real-time Candle Generator
============================================================
🔄 Connecting to Upstox WebSocket...
✅ Connected to Upstox WebSocket
📡 Subscribing to NSE_INDEX|Nifty 50...
✅ Subscription successful
📊 Tick: 19450.25 at 2025-08-07T09:15:30.123Z
📊 Tick: 19451.75 at 2025-08-07T09:15:35.456Z
⏰ Next candle will complete at: 2025-08-07T09:20:00.000Z

🕯️ ===== 5-MINUTE CANDLE GENERATED =====
📅 Time: 2025-08-07T09:15:00.000Z to 2025-08-07T09:20:00.000Z
📊 OHLC: O=19450.25 H=19455.50 L=19448.75 C=19452.00
🔢 Ticks processed: 145
=====================================
```

## Data Output

### CSV File Format

The application creates a `nifty50_candles.csv` file with the following columns:

```
timestamp,open,high,low,close,tick_count
2025-08-07T09:20:00.000Z,19450.25,19455.50,19448.75,19452.00,145
```

### Candle Data Structure

Each 5-minute candle contains:

- **Open**: First tick price in the 5-minute window
- **High**: Highest price during the window
- **Low**: Lowest price during the window
- **Close**: Last tick price before window ends
- **Tick Count**: Number of ticks processed

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UPSTOX_ACCESS_TOKEN` | Your Upstox API access token | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `LOG_LEVEL` | Logging level | No |

### Application Settings

You can modify these settings in `index.js`:

- `candleInterval`: Change from 5 minutes to other intervals
- `maxReconnectAttempts`: Maximum reconnection attempts
- `reconnectInterval`: Time between reconnection attempts
- `instrumentKey`: Subscribe to different instruments

## Error Handling

The application handles:

- ❌ WebSocket connection failures
- 🔄 Automatic reconnection with retry limits
- ⚠️ Invalid message parsing
- 🛡️ Missing environment variables
- 💾 File system errors

## Troubleshooting

### Common Issues

1. **"UPSTOX_ACCESS_TOKEN not found"**
   - Ensure your `.env` file contains the correct access token
   - Verify the token hasn't expired

2. **WebSocket connection errors**
   - Check your internet connection
   - Verify Upstox API is accessible
   - Ensure your access token is valid

3. **No tick data received**
   - Verify market is open (NSE trading hours)
   - Check if Nifty 50 is actively trading
   - Ensure subscription was successful

### Debugging

Enable detailed logging by setting:
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

## Market Hours

The application works best during NSE trading hours:
- **Equity**: 9:15 AM to 3:30 PM IST (Monday to Friday)
- **Pre-market**: 9:00 AM to 9:15 AM IST

## Architecture

```
┌─────────────────┐    WebSocket    ┌──────────────────┐
│   Upstox API    │◄──────────────►│  Node.js App     │
│  Market Feed    │    Real-time    │                  │
└─────────────────┘    Tick Data    └──────────────────┘
                                           │
                                           ▼
                                    ┌──────────────────┐
                                    │  5-min Candle    │
                                    │   Generator      │
                                    └──────────────────┘
                                           │
                                           ▼
                                    ┌──────────────────┐
                                    │   CSV Output     │
                                    │ (nifty50_candles │
                                    │     .csv)        │
                                    └──────────────────┘
```

## Future Enhancements

- 🔄 Multiple timeframe support (1m, 15m, 1h, 1d)
- 📊 Additional technical indicators
- 🗄️ Database storage (MongoDB, PostgreSQL)
- 📈 Real-time charting dashboard
- 🔔 Price alerts and notifications
- 📱 REST API for candle data access
- 🔍 Historical data backfilling

## Dependencies

- **ws**: WebSocket client for Node.js
- **dotenv**: Environment variable loader
- **uuid**: UUID generator for message identification

## License

MIT License - see LICENSE file for details

## Support

For issues related to:
- **Upstox API**: Contact [Upstox Support](https://upstox.com/support)
- **Application bugs**: Create an issue in this repository

## Disclaimer

This application is for educational and development purposes. Always test thoroughly before using in production trading systems. Market data processing should be validated against official sources.
