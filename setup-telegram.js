// setup-telegram.js - Helper script to set up Telegram bot
console.log('🤖 Telegram Bot Setup Guide for Nifty 50 Alert System');
console.log('='.repeat(60));

console.log('\n📱 Step 1: Create a Telegram Bot');
console.log('   1. Open Telegram and search for @BotFather');
console.log('   2. Send /start to BotFather');
console.log('   3. Send /newbot to create a new bot');
console.log('   4. Choose a name for your bot (e.g., "Nifty 50 Alert Bot")');
console.log('   5. Choose a username for your bot (e.g., "nifty50_alert_bot")');
console.log('   6. Copy the bot token (looks like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)');

console.log('\n🆔 Step 2: Get Your Chat ID');
console.log('   1. Search for @userinfobot in Telegram');
console.log('   2. Send /start to @userinfobot');
console.log('   3. Copy your Chat ID (a number like: 123456789)');

console.log('\n⚙️ Step 3: Update Your .env File');
console.log('   Open your .env file and update these lines:');
console.log('   TELEGRAM_BOT_TOKEN=your_bot_token_from_step_1');
console.log('   TELEGRAM_CHAT_ID=your_chat_id_from_step_2');

console.log('\n🧪 Step 4: Test Your Setup');
console.log('   Run: node test-telegram.js');

console.log('\n✅ Step 5: Start the Application');
console.log('   Run: npm start');

console.log('\n📋 Example .env configuration:');
console.log('   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz');
console.log('   TELEGRAM_CHAT_ID=987654321');

console.log('\n🔔 Alert Conditions:');
console.log('   📊 5-minute Nifty 50 candles');
console.log('   📈 5-period Exponential Moving Average (EMA)');
console.log('   🚀 Alert when candle is COMPLETELY above EMA (no touch)');
console.log('   ⏰ 5-minute cooldown between similar alerts');

console.log('\n🎯 What you\'ll receive:');
console.log('   • Real-time EMA breakout alerts');
console.log('   • Detailed candle information (OHLC)');
console.log('   • Distance from EMA line');
console.log('   • Consecutive candles count');
console.log('   • System status notifications');

console.log('\n' + '='.repeat(60));
console.log('💡 Tip: Start with a small test and verify alerts work correctly!');
console.log('🔧 You can modify alert settings in alert-manager.js');
