// test-setup.js - Simple test to verify the application setup
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Upstox Nifty 50 Application Setup');
console.log('='.repeat(50));

// Check Node.js version
console.log(`📋 Node.js version: ${process.version}`);

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
    
    // Load environment variables
    require('dotenv').config();
    
    if (process.env.UPSTOX_ACCESS_TOKEN) {
        if (process.env.UPSTOX_ACCESS_TOKEN === 'your_upstox_access_token_here') {
            console.log('⚠️  Please update UPSTOX_ACCESS_TOKEN in .env file');
        } else {
            console.log('✅ UPSTOX_ACCESS_TOKEN configured');
        }
    } else {
        console.log('❌ UPSTOX_ACCESS_TOKEN not found in .env');
    }
} else {
    console.log('❌ .env file not found - please create one');
}

// Check required packages
const requiredPackages = ['ws', 'dotenv', 'uuid'];
console.log('\n📦 Checking required packages:');

requiredPackages.forEach(pkg => {
    try {
        require(pkg);
        console.log(`✅ ${pkg} - installed`);
    } catch (error) {
        console.log(`❌ ${pkg} - missing`);
    }
});

// Check if main application file exists
const mainFile = path.join(__dirname, 'index.js');
if (fs.existsSync(mainFile)) {
    console.log('✅ Main application file (index.js) exists');
} else {
    console.log('❌ Main application file (index.js) not found');
}

console.log('\n🏁 Setup verification complete!');
console.log('\n📝 Next steps:');
console.log('1. Update your Upstox access token in .env file');
console.log('2. Run: npm start');
console.log('3. Monitor console output for real-time data');

console.log('\n💡 Tips:');
console.log('- Ensure market is open for live data');
console.log('- Check Upstox API documentation for latest endpoints');
console.log('- Monitor nifty50_candles.csv for historical data');
