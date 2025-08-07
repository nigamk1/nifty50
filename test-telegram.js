// test-telegram.js - Test Telegram bot connection and send test alert
const TelegramBot = require('./telegram-bot');
require('dotenv').config();

async function testTelegramBot() {
    console.log('🧪 Testing Telegram Bot Connection');
    console.log('='.repeat(50));

    // Check if credentials are provided
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || botToken === 'your_telegram_bot_token_here') {
        console.error('❌ TELEGRAM_BOT_TOKEN not set in .env file');
        console.log('💡 Please run: node setup-telegram.js for setup instructions');
        return;
    }

    if (!chatId || chatId === 'your_telegram_chat_id_here') {
        console.error('❌ TELEGRAM_CHAT_ID not set in .env file');
        console.log('💡 Please run: node setup-telegram.js for setup instructions');
        return;
    }

    console.log('🔧 Configuration:');
    console.log(`   Bot Token: ${botToken.substring(0, 20)}...`);
    console.log(`   Chat ID: ${chatId}`);

    try {
        const bot = new TelegramBot(botToken, chatId);
        
        console.log('\n🔄 Testing connection...');
        
        // Test basic connection
        const connected = await bot.testConnection();
        
        if (!connected) {
            console.error('❌ Failed to connect to Telegram');
            return;
        }

        console.log('✅ Basic connection successful!');

        // Test EMA alert format
        console.log('\n🧪 Testing EMA alert message...');
        
        const testAlertData = {
            candle: {
                open: 24400.50,
                high: 24450.75,
                low: 24420.25,
                close: 24445.00
            },
            ema5: 24415.30,
            timestamp: new Date(),
            consecutiveCandles: 2
        };

        await bot.sendAlert('EMA_BREAKOUT', testAlertData);
        
        console.log('✅ Test EMA alert sent!');

        // Test system status
        console.log('\n🧪 Testing system status message...');
        
        await bot.sendAlert('SYSTEM_STATUS', {
            status: 'TEST',
            message: 'Telegram bot test completed successfully! 🎉',
            timestamp: new Date()
        });

        console.log('✅ All tests passed! Your Telegram bot is ready.');
        
        console.log('\n🚀 Next steps:');
        console.log('   1. Check your Telegram chat for test messages');
        console.log('   2. Run: npm start (to start the full application)');
        console.log('   3. Monitor console for real-time alerts');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('401')) {
            console.log('💡 Invalid bot token. Please check TELEGRAM_BOT_TOKEN in .env');
        } else if (error.message.includes('400')) {
            console.log('💡 Invalid chat ID. Please check TELEGRAM_CHAT_ID in .env');
        } else {
            console.log('💡 Network or API error. Check your internet connection.');
        }
        
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Verify bot token from @BotFather');
        console.log('   2. Verify chat ID from @userinfobot');
        console.log('   3. Make sure you started a conversation with your bot');
        console.log('   4. Run: node setup-telegram.js for detailed instructions');
    }
}

testTelegramBot();
