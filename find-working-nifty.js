// find-working-nifty.js - Find the correct working Nifty 50 instrument key
const https = require('https');
require('dotenv').config();

const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

async function findWorkingNifty() {
    console.log('🔍 Finding Working Nifty 50 Instrument Key');
    console.log('='.repeat(60));

    // Comprehensive list of possible Nifty 50 variations
    const niftyVariations = [
        // NSE INDEX variations
        'NSE_INDEX|Nifty 50',
        'NSE_INDEX|NIFTY 50',
        'NSE_INDEX|Nifty50',
        'NSE_INDEX|NIFTY50',
        'NSE_INDEX|NIFTY_50',
        'NSE_INDEX|Nifty_50',
        'NSE_INDEX|nifty 50',
        'NSE_INDEX|nifty50',
        'NSE_INDEX|CNX_NIFTY',
        'NSE_INDEX|CNXNIFTY',
        'NSE_INDEX|NIFTY',
        'NSE_INDEX|nifty',
        
        // Different exchange formats
        'NSE|NIFTY50',
        'NSE|Nifty 50',
        'NSE|NIFTY 50',
        'INDEX|NIFTY50',
        'INDEX|NIFTY 50',
        
        // Token based (common alternatives)
        'NSE_INDEX|26000',
        'NSE_INDEX|26009',
        'NSE_INDEX|99926000',
        'NSE_INDEX|99926009',
        
        // Different naming conventions
        'NSE_INDEX|NIFTY 50 INDEX',
        'NSE_INDEX|NIFTY50INDEX',
        'NSE_INDEX|NIFTY_50_INDEX',
        'NSE_INDEX|CNX NIFTY',
        'NSE_INDEX|S&P CNX NIFTY',
        
        // Alternative format attempts
        'NSE_INDEX:NIFTY50',
        'NSE_INDEX:NIFTY 50',
        'NSE_INDEX:NIFTY_50'
    ];

    let workingKeys = [];

    for (let i = 0; i < niftyVariations.length; i++) {
        const key = niftyVariations[i];
        console.log(`\n[${i + 1}/${niftyVariations.length}] 🧪 Testing: "${key}"`);
        
        try {
            const result = await testInstrumentKey(key);
            if (result.success) {
                console.log('✅ SUCCESS! Found working Nifty key!');
                console.log(`📊 Price: ₹${result.data.last_price}`);
                console.log(`📈 Change: ${result.data.net_change || 'N/A'}`);
                console.log(`🕐 Time: ${new Date()}`);
                workingKeys.push({
                    key: key,
                    data: result.data,
                    fullResponse: result.fullResponse
                });
                
                // Don't break - let's find all working variations
            } else {
                console.log('❌ No data');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return workingKeys;
}

async function testInstrumentKey(instrumentKey) {
    return new Promise((resolve, reject) => {
        const path = `/v2/market-quote/quotes?symbol=${encodeURIComponent(instrumentKey)}`;
        
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
                        
                        // Check if we have data
                        if (response.data && Object.keys(response.data).length > 0) {
                            const responseKey = Object.keys(response.data)[0];
                            const quote = response.data[responseKey];
                            
                            if (quote && quote.last_price) {
                                resolve({ 
                                    success: true, 
                                    data: quote,
                                    responseKey: responseKey,
                                    fullResponse: response
                                });
                                return;
                            }
                        }
                        
                        resolve({ success: false, fullResponse: response });
                    } catch (error) {
                        reject(new Error('Parse error: ' + error.message));
                    }
                } else {
                    // Still try to parse for better error info
                    try {
                        const errorResponse = JSON.parse(data);
                        reject(new Error(`HTTP ${res.statusCode}: ${errorResponse.errors?.[0]?.message || 'Unknown error'}`));
                    } catch {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
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

// Also try to get instrument master list from different sources
async function tryGetInstrumentMaster() {
    console.log('\n🔍 Searching for Nifty in available instruments...');
    
    // Try different endpoints that might have instrument lists
    const endpoints = [
        '/v2/option-chain?symbol=NIFTY',
        '/v2/option-chain?symbol=NSE_INDEX%7CNIFTY',
        '/v2/historical-candle/NSE_INDEX%7CNIFTY/1minute/2025-08-07/2025-08-07',
        '/v2/market-quote/ohlc?symbol=NSE_INDEX%7CNIFTY',
        '/v2/market-quote/ltp?symbol=NSE_INDEX%7CNIFTY'
    ];

    for (const endpoint of endpoints) {
        console.log(`\n🔗 Trying: ${endpoint}`);
        try {
            const response = await makeRequest(endpoint);
            console.log('✅ Success! Response keys:', Object.keys(response));
            
            if (response.data) {
                console.log('📋 Response preview:', JSON.stringify(response.data, null, 2).substring(0, 300));
            }
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
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
                    reject(new Error(`HTTP ${res.statusCode}`));
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
    console.log(`🕐 Current time: ${new Date().toISOString()} (Market should be open)`);
    console.log('');
    
    const workingKeys = await findWorkingNifty();
    await tryGetInstrumentMaster();
    
    console.log('\n🎯 RESULTS SUMMARY:');
    console.log('='.repeat(60));
    
    if (workingKeys.length > 0) {
        console.log(`✅ Found ${workingKeys.length} working Nifty key(s):`);
        
        workingKeys.forEach((item, index) => {
            console.log(`\n${index + 1}. "${item.key}"`);
            console.log(`   📊 Price: ₹${item.data.last_price}`);
            console.log(`   📈 Change: ${item.data.net_change || 'N/A'}`);
            console.log(`   🔑 Response Key: ${item.responseKey || 'N/A'}`);
        });
        
        console.log(`\n💡 RECOMMENDED: Use "${workingKeys[0].key}" in your application`);
        console.log('\n📝 To update your app:');
        console.log(`   Replace: 'BSE_INDEX|SENSEX'`);
        console.log(`   With: '${workingKeys[0].key}'`);
        
    } else {
        console.log('❌ No working Nifty 50 instrument keys found');
        console.log('\n💡 Possible reasons:');
        console.log('   1. Nifty 50 live data requires special subscription');
        console.log('   2. Instrument key format has changed');
        console.log('   3. Only index futures/options are available for live data');
        console.log('   4. BSE SENSEX might be the only available index for live quotes');
        
        console.log('\n🔄 Alternative solutions:');
        console.log('   1. Use Nifty 50 futures (NSE_FO) instead of index');
        console.log('   2. Continue with SENSEX (similar to Nifty 50)');
        console.log('   3. Contact Upstox support for correct Nifty 50 symbol');
    }
}

main().catch(console.error);
