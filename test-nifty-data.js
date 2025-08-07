// test-nifty-data.js - Quick test to check if we can get Nifty 50 data
const https = require('https');
require('dotenv').config();

const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

async function testNiftyData() {
    console.log('🧪 Testing Nifty 50 Data Retrieval');
    console.log('='.repeat(50));

    // Test different instrument key formats
    const instrumentKeys = [
        'NSE_INDEX|Nifty 50',
        'NSE_INDEX|NIFTY 50',
        'NSE_INDEX|Nifty50',
        'NSE_INDEX|NIFTY50',
        'NSE_INDEX|26000'  // Alternative Nifty token
    ];

    for (const instrumentKey of instrumentKeys) {
        console.log(`\n🔍 Testing: ${instrumentKey}`);
        
        try {
            const data = await fetchQuote(instrumentKey);
            if (data && data.data && data.data[instrumentKey]) {
                console.log('✅ SUCCESS! Data found:');
                const quote = data.data[instrumentKey];
                console.log(`📊 Price: ₹${quote.last_price}`);
                console.log(`📈 Change: ${quote.net_change} (${quote.change_percentage}%)`);
                console.log(`🕐 Time: ${new Date()}`);
                console.log(`📋 Full data:`, JSON.stringify(quote, null, 2));
                return instrumentKey; // Return working key
            } else {
                console.log('❌ No data in response');
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
    }
    
    console.log('\n❌ No working instrument key found');
    return null;
}

function fetchQuote(instrumentKey) {
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

        console.log(`🔗 URL: https://api.upstox.com${path}`);

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 HTTP Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Failed to parse response: ' + error.message));
                    }
                } else {
                    console.log(`❌ Response: ${data}`);
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

        req.end();
    });
}

// Also test getting instruments list
async function testInstrumentsList() {
    console.log('\n🧪 Testing instruments list...');
    
    try {
        const data = await fetchInstruments();
        console.log('✅ Instruments API working');
        
        // Look for Nifty in the response
        if (data && data.data) {
            const niftyInstruments = data.data.filter(inst => 
                inst.name && inst.name.toLowerCase().includes('nifty')
            );
            
            if (niftyInstruments.length > 0) {
                console.log(`📋 Found ${niftyInstruments.length} Nifty instruments:`);
                niftyInstruments.forEach(inst => {
                    console.log(`   - ${inst.instrument_key}: ${inst.name}`);
                });
            }
        }
    } catch (error) {
        console.log('❌ Instruments list error:', error.message);
    }
}

function fetchInstruments() {
    return new Promise((resolve, reject) => {
        const path = '/v2/market-quote/instruments';
        
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
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Failed to parse response'));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function runTest() {
    const workingKey = await testNiftyData();
    await testInstrumentsList();
    
    console.log('\n📋 Summary:');
    if (workingKey) {
        console.log(`✅ Working instrument key: ${workingKey}`);
        console.log('💡 Update your main application with this key');
    } else {
        console.log('❌ No data available - likely market is closed');
        console.log('⏰ Try again during market hours: 9:15 AM - 3:30 PM IST');
    }
}

runTest().catch(console.error);
