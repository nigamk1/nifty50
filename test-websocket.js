const WebSocket = require('ws');
require('dotenv').config();

const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

console.log('🔍 WebSocket Connection Test');
console.log('='.repeat(50));

if (!accessToken) {
    console.log('❌ No access token found');
    process.exit(1);
}

// Test different WebSocket endpoints and methods
const testConfigurations = [
    {
        name: 'Method 1: v3 with Authorization header',
        url: 'wss://ws-api.upstox.com/v3/feed/market-data-feed',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Api-Version': '3.0'
        }
    },
    {
        name: 'Method 2: v3 with token in URL',
        url: `wss://ws-api.upstox.com/v3/feed/market-data-feed?token=${accessToken}`,
        headers: {
            'Api-Version': '3.0'
        }
    },
    {
        name: 'Method 3: v2 endpoint with Authorization',
        url: 'wss://ws-api.upstox.com/v2/feed/market-data-feed',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Api-Version': '2.0'
        }
    },
    {
        name: 'Method 4: v2 with token in URL',
        url: `wss://ws-api.upstox.com/v2/feed/market-data-feed?token=${accessToken}`,
        headers: {
            'Api-Version': '2.0'
        }
    },
    {
        name: 'Method 5: Alternative endpoint',
        url: 'wss://api.upstox.com/v2/feed/market-data-feed',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Api-Version': '2.0'
        }
    }
];

async function testConnection(config, index) {
    return new Promise((resolve) => {
        console.log(`\n🧪 Testing ${config.name}...`);
        console.log(`🔗 URL: ${config.url.replace(accessToken, 'TOKEN_HIDDEN')}`);
        
        const ws = new WebSocket(config.url, {
            headers: config.headers
        });
        
        const timeout = setTimeout(() => {
            console.log('⏰ Connection timeout (10s)');
            ws.terminate();
            resolve({ success: false, error: 'timeout' });
        }, 10000);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            console.log('✅ Connection successful!');
            
            // Try to send a subscription message
            const subscriptionMessage = {
                guid: 'test-123',
                method: 'sub',
                data: {
                    mode: 'full',
                    instrumentKeys: ['NSE_INDEX|Nifty 50']
                }
            };
            
            try {
                ws.send(JSON.stringify(subscriptionMessage));
                console.log('📡 Subscription message sent');
            } catch (error) {
                console.log('⚠️ Could not send subscription:', error.message);
            }
            
            // Wait for response
            setTimeout(() => {
                ws.close();
                resolve({ success: true, config: config });
            }, 3000);
        });
        
        ws.on('message', (data) => {
            console.log('📨 Received message:', data.toString());
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.log('❌ Connection failed:', error.message);
            if (error.message.includes('530')) {
                console.log('💡 530 error suggests authentication issue');
            }
            resolve({ success: false, error: error.message });
        });
        
        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log(`🔌 Connection closed: ${code} - ${reason || 'No reason'}`);
        });
    });
}

async function runTests() {
    console.log('🚀 Starting WebSocket connection tests...');
    
    let successfulConfig = null;
    
    for (let i = 0; i < testConfigurations.length; i++) {
        const result = await testConnection(testConfigurations[i], i);
        
        if (result.success) {
            successfulConfig = result.config;
            console.log('🎉 Found working configuration!');
            break;
        }
        
        // Wait between tests
        if (i < testConfigurations.length - 1) {
            console.log('⏳ Waiting 2 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n📋 Test Results Summary:');
    console.log('='.repeat(50));
    
    if (successfulConfig) {
        console.log('✅ Working configuration found:');
        console.log('📝 Update your main application with:');
        console.log(`   URL: ${successfulConfig.url.replace(accessToken, 'YOUR_TOKEN')}`);
        console.log(`   Headers:`, successfulConfig.headers);
    } else {
        console.log('❌ No working configuration found');
        console.log('💡 Possible solutions:');
        console.log('   1. Check if Upstox WebSocket API is temporarily down');
        console.log('   2. Verify your app has WebSocket permissions enabled');
        console.log('   3. Contact Upstox support for latest WebSocket endpoint');
        console.log('   4. Check if your account has market data access');
    }
}

runTests().catch(console.error);
