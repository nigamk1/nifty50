// test-upstox-api.js - Test various Upstox API endpoints to understand the data format
const https = require('https');
require('dotenv').config();

const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

async function testBasicAPIAccess() {
    console.log('🧪 Testing Upstox API Access');
    console.log('='.repeat(50));

    // Test different API endpoints
    const endpoints = [
        {
            name: 'User Profile',
            path: '/v2/user/profile',
            description: 'Basic user info to verify token'
        },
        {
            name: 'Funds and Margin',
            path: '/v2/user/get-funds-and-margin',
            description: 'Account information'
        },
        {
            name: 'Market Quote - Simple Format',
            path: '/v2/market-quote/quotes?symbol=NSE_EQ%7CRELIANCE',
            description: 'Simple stock quote format'
        },
        {
            name: 'Market Quote - Alternative Format',
            path: '/v2/market-quote/quotes?symbol=NSE_EQ%7CRELIANCE-EQ',
            description: 'Alternative stock quote format'
        },
        {
            name: 'Market Quote - LTP Only',
            path: '/v2/market-quote/ltp?symbol=NSE_EQ%7CRELIANCE',
            description: 'Last traded price only'
        }
    ];

    for (const endpoint of endpoints) {
        console.log(`\n🔍 Testing: ${endpoint.name}`);
        console.log(`📝 ${endpoint.description}`);
        console.log(`🔗 ${endpoint.path}`);
        
        try {
            const response = await makeAPIRequest(endpoint.path);
            console.log('✅ SUCCESS!');
            
            if (response.data) {
                console.log('📊 Response structure:');
                if (typeof response.data === 'object') {
                    const keys = Object.keys(response.data);
                    console.log(`   - Keys: ${keys.join(', ')}`);
                    
                    // If it looks like market data, show more details
                    if (keys.some(key => key.includes('NSE') || key.includes('BSE'))) {
                        console.log('📈 Market data found:');
                        keys.forEach(key => {
                            if (response.data[key] && response.data[key].last_price) {
                                console.log(`   - ${key}: ₹${response.data[key].last_price}`);
                            }
                        });
                    }
                } else {
                    console.log(`   - Type: ${typeof response.data}`);
                }
                
                // Show sample of response (first 300 chars)
                const sample = JSON.stringify(response.data, null, 2).substring(0, 300);
                console.log(`📋 Sample: ${sample}${sample.length >= 300 ? '...' : ''}`);
            }
            
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}`);
        }
    }
}

function makeAPIRequest(path) {
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
                try {
                    const response = JSON.parse(data);
                    if (res.statusCode === 200) {
                        resolve(response);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
                    }
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}. Raw: ${data.substring(0, 200)}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Try to find instrument master or symbol list
async function tryInstrumentMaster() {
    console.log('\n🧪 Searching for instrument master/symbol list...');
    
    const instrumentEndpoints = [
        '/v2/market-quote/instruments',
        '/v2/instruments',
        '/v2/instruments/NSE',
        '/v2/option-chain?symbol=NSE_INDEX%7CNIFTY',
        '/v2/historical-candle/NSE_INDEX%7CNifty%2050/1minute/2025-08-07/2025-08-07'
    ];

    for (const endpoint of instrumentEndpoints) {
        console.log(`\n🔗 Trying: ${endpoint}`);
        try {
            const response = await makeAPIRequest(endpoint);
            console.log('✅ SUCCESS!');
            console.log('📊 Response preview:', JSON.stringify(response, null, 2).substring(0, 500));
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
}

async function main() {
    await testBasicAPIAccess();
    await tryInstrumentMaster();
    
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('='.repeat(50));
    console.log('1. Check which endpoints returned data successfully');
    console.log('2. Look for correct instrument key format in successful responses');
    console.log('3. If no market data endpoints work, there might be an API issue');
    console.log('4. Contact Upstox support if market data access is consistently failing');
}

main().catch(console.error);
