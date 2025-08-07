/**
 * Test Market Hours Functionality
 * This script tests the market hours utility to ensure it correctly identifies
 * whether the market is open or closed.
 */

const MarketHours = require('./market-hours');

function testMarketHours() {
    console.log('🧪 Testing Market Hours Functionality');
    console.log('='.repeat(50));

    const marketHours = new MarketHours();

    // Test current market status
    console.log('\n📅 Current Market Status:');
    console.log(marketHours.getMarketStatusMessage());

    // Test specific scenarios
    console.log('\n🔍 Market Status Details:');
    const status = marketHours.isMarketOpen('EQUITY', true);
    console.log('- Market Open:', status.isOpen);
    console.log('- Reason:', status.reason);
    console.log('- Session:', status.session || 'None');
    
    if (status.isOpen) {
        console.log('- Next Close:', status.nextClose);
    } else {
        console.log('- Next Open:', status.nextOpen);
    }

    // Test trading day check
    console.log('\n📆 Trading Day Check:');
    const isTradingDay = marketHours.isTradingDay();
    console.log('- Is Trading Day:', isTradingDay);

    // Test IST time
    console.log('\n🕐 Current Time (IST):');
    const istTime = marketHours.getCurrentISTTime();
    console.log('- IST Time:', istTime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }));

    // Test different session types
    console.log('\n📊 Different Market Sessions:');
    const equityStatus = marketHours.isMarketOpen('EQUITY', true);
    const currencyStatus = marketHours.isMarketOpen('CURRENCY');
    const commodityStatus = marketHours.isMarketOpen('COMMODITY');

    console.log('- Equity Market (with pre-market):', equityStatus.isOpen ? '🟢 OPEN' : '🔴 CLOSED');
    console.log('- Currency Market:', currencyStatus.isOpen ? '🟢 OPEN' : '🔴 CLOSED');
    console.log('- Commodity Market:', commodityStatus.isOpen ? '🟢 OPEN' : '🔴 CLOSED');

    // Market hours breakdown
    console.log('\n📋 NSE Trading Schedule:');
    console.log('- Pre-market: 09:00 - 09:15 IST');
    console.log('- Regular: 09:15 - 15:30 IST');
    console.log('- Post-market: 15:40 - 16:00 IST');
    console.log('- Trading Days: Monday to Friday (excluding holidays)');

    console.log('\n' + '='.repeat(50));
    console.log('✅ Market Hours Test Completed');
}

// Run the test
if (require.main === module) {
    testMarketHours();
}

module.exports = testMarketHours;
