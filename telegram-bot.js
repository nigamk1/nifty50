// telegram-bot.js - Telegram Bot for sending alerts
const https = require('https');

class TelegramBot {
    constructor(botToken, chatId) {
        this.botToken = botToken;
        this.chatId = chatId;
        this.baseUrl = `https://api.telegram.org/bot${botToken}`;
    }

    async sendMessage(message, options = {}) {
        const messageData = {
            chat_id: this.chatId,
            text: message,
            parse_mode: options.parseMode || 'HTML',
            disable_web_page_preview: options.disablePreview !== false
        };

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(messageData);
            
            const requestOptions = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${this.botToken}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const response = JSON.parse(data);
                            if (response.ok) {
                                resolve(response.result);
                            } else {
                                reject(new Error(`Telegram API Error: ${response.description}`));
                            }
                        } catch (error) {
                            reject(new Error(`Parse Error: ${error.message}`));
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

            req.write(postData);
            req.end();
        });
    }

    async sendAlert(alertType, data) {
        let message = '';
        
        switch (alertType) {
            case 'EMA_BREAKOUT':
                message = this.formatEMABreakoutAlert(data);
                break;
            case 'EMA_BREAKDOWN':
                message = this.formatEMABreakdownAlert(data);
                break;
            case 'SYSTEM_STATUS':
                message = this.formatSystemStatusAlert(data);
                break;
            default:
                message = `🔔 <b>Nifty 50 Alert</b>\n\n${JSON.stringify(data, null, 2)}`;
        }

        try {
            await this.sendMessage(message);
            console.log('✅ Telegram alert sent successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to send Telegram alert:', error.message);
            return false;
        }
    }

    formatEMABreakoutAlert(data) {
        const { candle, ema5, timestamp, consecutiveCandles } = data;
        
        return `🚀 <b>NIFTY 50 EMA BREAKOUT ALERT!</b>

📊 <b>Candle Details:</b>
🕐 Time: ${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
💰 OHLC: ${candle.open} | ${candle.high} | ${candle.low} | ${candle.close}
📈 5-EMA: ₹${ema5.toFixed(2)}

✅ <b>Condition Met:</b>
• Candle completely ABOVE 5-EMA
• Low: ₹${candle.low} > EMA: ₹${ema5.toFixed(2)}
• High: ₹${candle.high} > EMA: ₹${ema5.toFixed(2)}
• No touch with EMA line

🔥 <b>Signal Strength:</b>
📊 Consecutive candles above EMA: ${consecutiveCandles}
📈 Distance from EMA: +₹${(candle.low - ema5).toFixed(2)} (${(((candle.low - ema5) / ema5) * 100).toFixed(2)}%)

⚡ <b>Action:</b> Strong bullish momentum detected!

#Nifty50 #EMABreakout #BullishAlert`;
    }

    formatEMABreakdownAlert(data) {
        const { candle, ema5, timestamp } = data;
        
        return `📉 <b>NIFTY 50 EMA SIGNAL ENDED</b>

🕐 Time: ${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
💰 OHLC: ${candle.open} | ${candle.high} | ${candle.low} | ${candle.close}
📈 5-EMA: ₹${ema5.toFixed(2)}

⚠️ <b>Signal Status:</b>
Candle touched or went below 5-EMA
Previous bullish momentum interrupted

#Nifty50 #EMATouch #SignalEnd`;
    }

    formatSystemStatusAlert(data) {
        const { status, message, timestamp } = data;
        
        return `🤖 <b>Nifty 50 Alert System</b>

🕐 ${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
📊 Status: ${status}
💬 ${message}

#SystemAlert #Nifty50Bot`;
    }

    async testConnection() {
        try {
            const response = await this.sendMessage('🧪 <b>Test Message</b>\n\nNifty 50 Alert System is connected and working!');
            console.log('✅ Telegram bot connection successful');
            return true;
        } catch (error) {
            console.error('❌ Telegram bot connection failed:', error.message);
            return false;
        }
    }
}

module.exports = TelegramBot;
