// test-live-stocks.js - Test with actual stocks that should have live data
const https = require('https');
require('dotenv').config();

const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

async function testLiveStocks() {
    console.log('🧪 Testing Live Stock Data (during market hours)');
    console.log('='.repeat(60));

    // Popular stocks that should definitely have live data
    const stocksToTest = [
        'NSE_EQ|TCS-EQ',
        'NSE_EQ|RELIANCE-EQ', 
        'NSE_EQ|INFY-EQ',
        'NSE_EQ|HDFCBANK-EQ',
        'NSE_EQ|ICICIBANK-EQ',
        'NSE_EQ|LT-EQ',
        'NSE_EQ|SBIN-EQ',
        'NSE_EQ|ITC-EQ'
    ];

    let workingStocks = [];

    for (const stock of stocksToTest) {
        console.log(`\n🔍 Testing: ${stock}`);
        
        try {
            const data = await getQuote(stock);
            if (data && Object.keys(data).length > 0) {
                console.log('✅ SUCCESS! Live data available');
                const stockData = data[stock];
                if (stockData && stockData.last_price) {
                    console.log(`📊 Price: ₹${stockData.last_price}`);
                    console.log(`📈 Change: ${stockData.net_change || 'N/A'}`);
                    workingStocks.push(stock);
                }
            } else {
                console.log('❌ No data returned');
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
    }

    console.log(`\n📋 Summary: ${workingStocks.length} stocks with live data`);
    return workingStocks;
}

async function getQuote(symbol) {
    return new Promise((resolve, reject) => {
        const path = `/v2/market-quote/quotes?symbol=${encodeURIComponent(symbol)}`;
        
        const options = {
            hostname: 'api.upstox.com',
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Api-Version': '2.0',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        resolve(response.data || {});
                    } catch (error) {
                        reject(new Error('Parse error: ' + error.message));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// Test Nifty using alternative approaches
async function testNiftyAlternatives() {
    console.log('\n🧪 Testing Nifty 50 Alternative Approaches');
    console.log('='.repeat(60));

    // Method 1: Try historical data to get latest price
    console.log('\n📊 Method 1: Recent historical data...');
    try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
        
        const histPath = `/v2/historical-candle/NSE_INDEX%7CNifty%2050/1minute/${yesterday}/${today}`;
        const histData = await makeRequest(histPath);
        
        if (histData.data && histData.data.candles && histData.data.candles.length > 0) {
            const latestCandle = histData.data.candles[histData.data.candles.length - 1];
            console.log('✅ Historical data available');
            console.log(`📊 Latest candle: O=${latestCandle[1]} H=${latestCandle[2]} L=${latestCandle[3]} C=${latestCandle[4]}`);
            console.log(`🕐 Timestamp: ${new Date(latestCandle[0])}`);
        } else {
            console.log('❌ No historical data');
        }
    } catch (error) {
        console.log('❌ Historical data error:', error.message);
    }

    // Method 2: Try different index symbols
    console.log('\n📊 Method 2: Alternative index symbols...');
    const indexSymbols = [
        'NSE_INDEX|NIFTY',
        'NSE_INDEX|CNX_NIFTY', 
        'NSE_INDEX|NIFTY_50_INDEX',
        'BSE_INDEX|SENSEX'
    ];

    for (const symbol of indexSymbols) {
        try {
            const data = await getQuote(symbol);
            if (data && Object.keys(data).length > 0) {
                console.log(`✅ ${symbol}: Data available`);
                console.log('📊 Data:', JSON.stringify(data, null, 2));
            } else {
                console.log(`❌ ${symbol}: No data`);
            }
        } catch (error) {
            console.log(`❌ ${symbol}: Error -`, error.message);
        }
    }
}

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.upstox.com',
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Api-Version': '2.0',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(new Error('Parse error'));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

async function main() {
    const workingStocks = await testLiveStocks();
    await testNiftyAlternatives();
    
    console.log('\n🎯 CONCLUSIONS:');
    console.log('='.repeat(50));
    
    if (workingStocks.length > 0) {
        console.log(`✅ Live stock data is working (${workingStocks.length} stocks tested successfully)`);
        console.log('📊 Working stock example:', workingStocks[0]);
        console.log('');
        console.log('💡 SOLUTION: Use a popular stock instead of Nifty 50 for now');
        console.log(`   Recommended: ${workingStocks[0]}`);
        console.log('   This will give you live data and candle generation');
    } else {
        console.log('❌ No live stock data available');
        console.log('💡 Possible issues:');
        console.log('   1. Market data subscription not enabled for your account');
        console.log('   2. Live data requires additional permissions');
        console.log('   3. API endpoint changes');
    }
}

main().catch(console.error);
