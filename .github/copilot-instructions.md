<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Upstox Nifty 50 Real-time Candle Generator

This project connects to Upstox WebSocket Market Feed API to receive real-time tick data for Nifty 50 Index and generates 5-minute OHLC candlestick data.

## Code Guidelines

- Use modern JavaScript (ES6+) with Node.js best practices
- Implement proper error handling and reconnection logic for WebSocket connections
- Follow financial data processing standards for OHLC calculations
- Use environment variables for sensitive configuration like API tokens
- Implement graceful shutdown handling for production use
- Add comprehensive logging for debugging and monitoring
- Follow the existing code structure with classes and proper method binding
- Use consistent naming conventions for financial terms (OHLC, tick, candle, etc.)

## Key Components

- **WebSocket Connection**: Handle Upstox market feed with automatic reconnection
- **Tick Processing**: Real-time processing of market tick data
- **Candle Generation**: 5-minute interval OHLC calculation from tick data
- **Data Storage**: CSV file output with optional database integration
- **Error Handling**: Robust error handling and recovery mechanisms

## API Integration

- Use Upstox WebSocket API v3.0 with proper authentication headers
- Subscribe to NSE_INDEX|Nifty 50 instrument key
- Handle subscription responses and feed data appropriately
- Implement proper message parsing and validation
