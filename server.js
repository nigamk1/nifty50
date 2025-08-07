const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Nifty 50 Alert System',
        version: '1.0.0'
    });
});

// Basic info endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Nifty 50 Real-time Alert System',
        description: 'WebSocket-based market data processor with EMA alerts',
        status: 'running',
        features: [
            'Real-time Nifty 50 data processing',
            '5-minute OHLC candle generation',
            '5-EMA breakout detection',
            'Telegram alert notifications'
        ]
    });
});

// Start the HTTP server for Render
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 Health server running on port ${PORT}`);
        
        // Start the main application
        require('./index.js');
    });
}

module.exports = app;
