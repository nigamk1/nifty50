// find-nifty-key.js - Find the correct Nifty 50 instrument key
const https = require('https');
require('dotenv').config();

const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

async function findNiftyKey() {
    console.log('🔍 Finding the correct Nifty 50 instrument key...');
    console.log('='.repeat(60));

    // Extended list of possible Nifty 50 instrument keys
    const possibleKeys = [
        'NSE_INDEX|Nifty 50',
        'NSE_INDEX|NIFTY 50', 
        'NSE_INDEX|Nifty50',
        'NSE_INDEX|NIFTY50',
        'NSE_INDEX|26000',
        'NSE_INDEX|26009',  // Alternative token
        'NSE_INDEX|99926000',  // Different format
        'NSE_INDEX|NIFTY_50',
        'NSE_INDEX|Nifty_50',
        'NSE_INDEX|nifty 50',
        'NSE_INDEX|nifty50',
        'NSE_FO|NIFTY50',
        'NSE|Nifty 50',
        'NSE|NIFTY50',
        'INDEX|NIFTY50',
        'NSE_INDEX|CNX_NIFTY',
        'NSE_INDEX|CNXNIFTY'
    ];

    let workingKey = null;

    for (const key of possibleKeys) {
        console.log(`\n🧪 Testing: "${key}"`);
        
        try {
            const result = await testInstrumentKey(key);
            if (result.hasData) {
                console.log('✅ SUCCESS! Found working key:', key);
                console.log('📊 Sample data:', JSON.stringify(result.data, null, 2));
                workingKey = key;
                break;
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
    }

    if (!workingKey) {
        console.log('\n🔍 Trying alternative approach - getting all available instruments...');
        await tryGetInstruments();
    }

    return workingKey;
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
                        const hasData = response.data && response.data[instrumentKey] && response.data[instrumentKey].last_price;
                        resolve({ 
                            hasData: !!hasData, 
                            data: hasData ? response.data[instrumentKey] : null,
                            fullResponse: response
                        });
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

async function tryGetInstruments() {
    console.log('\n🧪 Trying to get instruments from different endpoints...');
    
    const endpoints = [
        '/v2/market-quote/instruments',
        '/v2/option-chain',
        '/v2/market-quote/ltp?symbol=NSE_EQ|INE002A01018', // Reliance as test
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n🔗 Trying: ${endpoint}`);
            const response = await makeRequest(endpoint);
            console.log('✅ Success! Response structure:');
            
            if (response.data) {
                if (Array.isArray(response.data)) {
                    console.log(`📊 Array with ${response.data.length} items`);
                    if (response.data.length > 0) {
                        console.log('📋 Sample item:', JSON.stringify(response.data[0], null, 2));
                    }
                } else {
                    console.log('📊 Object keys:', Object.keys(response.data));
                    console.log('📋 Sample data:', JSON.stringify(response.data, null, 2).substring(0, 500));
                }
            }
            
        } catch (error) {
            console.log('❌ Failed:', error.message);
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
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// Test with a known working stock to verify API is working
async function testKnownStock() {
    console.log('\n🧪 Testing with a known stock (Reliance) to verify API...');
    
    const relianceKeys = [
        'NSE_EQ|INE002A01018',  // Reliance ISIN
        'NSE_EQ|RELIANCE',
        'NSE_EQ|RELIANCE-EQ'
    ];

    for (const key of relianceKeys) {
        try {
            const result = await testInstrumentKey(key);
            if (result.hasData) {
                console.log(`✅ SUCCESS with ${key}:`, result.data);
                return true;
            }
        } catch (error) {
            console.log(`❌ ${key} failed:`, error.message);
        }
    }
    
    return false;
}

async function main() {
    const apiWorking = await testKnownStock();
    
    if (!apiWorking) {
        console.log('❌ API seems to have issues - no stock data available');
        return;
    }

    const workingKey = await findNiftyKey();
    
    console.log('\n📋 SUMMARY:');
    console.log('='.repeat(50));
    
    if (workingKey) {
        console.log(`✅ Working Nifty 50 key found: "${workingKey}"`);
        console.log('💡 Update your main application with this key');
    } else {
        console.log('❌ No working Nifty 50 instrument key found');
        console.log('💡 Possible solutions:');
        console.log('   1. Contact Upstox support for the correct Nifty 50 instrument key');
        console.log('   2. Check Upstox documentation for updated instrument keys');
        console.log('   3. Use a different index or stock for testing');
    }
}

main().catch(console.error);
