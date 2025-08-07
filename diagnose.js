const https = require('https');
require('dotenv').config();

console.log('🔍 Upstox API Diagnostics');
console.log('='.repeat(50));

const accessToken = process.env.UPSTOX_ACCESS_TOKEN;

if (!accessToken) {
    console.log('❌ No access token found');
    process.exit(1);
}

console.log('✅ Access token found (length:', accessToken.length, ')');

// Test 1: Check token validity by calling profile API
function testTokenValidity() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.upstox.com',
            port: 443,
            path: '/v2/user/profile',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Api-Version': '2.0',
                'Accept': 'application/json'
            }
        };

        console.log('\n🧪 Testing token validity with profile API...');
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 HTTP Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const profile = JSON.parse(data);
                        console.log('✅ Token is valid!');
                        console.log('👤 User:', profile.data?.user_name || 'Unknown');
                        console.log('📧 Email:', profile.data?.email || 'Unknown');
                    } catch (e) {
                        console.log('⚠️ Valid response but couldn\'t parse JSON');
                    }
                } else if (res.statusCode === 401) {
                    console.log('❌ Token is invalid or expired');
                    console.log('💡 Please generate a new access token');
                } else {
                    console.log('⚠️ Unexpected response:', data);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log('❌ Network error:', error.message);
            resolve();
        });

        req.setTimeout(10000, () => {
            console.log('⏰ Request timeout');
            req.destroy();
            resolve();
        });

        req.end();
    });
}

// Test 2: Check market data feed permissions
function testMarketDataAccess() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.upstox.com',
            port: 443,
            path: '/v2/market-quote/quotes?symbol=NSE_EQ%7CINE002A01018', // Reliance as test
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Api-Version': '2.0',
                'Accept': 'application/json'
            }
        };

        console.log('\n🧪 Testing market data access...');
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 Market Data HTTP Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    console.log('✅ Market data access is working');
                } else if (res.statusCode === 403) {
                    console.log('❌ No permission for market data');
                    console.log('💡 Check your Upstox app permissions');
                } else {
                    console.log('⚠️ Market data response:', res.statusCode, data.substring(0, 200));
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log('❌ Market data test error:', error.message);
            resolve();
        });

        req.setTimeout(10000, () => {
            console.log('⏰ Market data test timeout');
            req.destroy();
            resolve();
        });

        req.end();
    });
}

// Test 3: Check WebSocket endpoint
function testWebSocketEndpoint() {
    console.log('\n🧪 Testing WebSocket endpoint...');
    
    // Try to resolve the hostname
    const dns = require('dns');
    
    dns.lookup('ws-api.upstox.com', (err, address) => {
        if (err) {
            console.log('❌ Cannot resolve ws-api.upstox.com:', err.message);
        } else {
            console.log('✅ WebSocket hostname resolved to:', address);
        }
    });
}

// Token analysis
function analyzeToken() {
    console.log('\n🔍 Token Analysis:');
    
    try {
        // JWT tokens have 3 parts separated by dots
        const parts = accessToken.split('.');
        if (parts.length === 3) {
            console.log('✅ Token format looks like JWT (3 parts)');
            
            // Decode header and payload (they're base64 encoded)
            try {
                const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
                const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
                
                console.log('📋 Token Header:', JSON.stringify(header, null, 2));
                console.log('📋 Token Payload:');
                console.log('   - Subject (user):', payload.sub);
                console.log('   - Issued at:', new Date(payload.iat * 1000).toISOString());
                console.log('   - Expires at:', new Date(payload.exp * 1000).toISOString());
                console.log('   - Is expired:', Date.now() > payload.exp * 1000 ? '❌ YES' : '✅ NO');
                
            } catch (decodeError) {
                console.log('⚠️ Could not decode JWT parts (might use different encoding)');
            }
        } else {
            console.log('⚠️ Token doesn\'t look like standard JWT format');
        }
    } catch (error) {
        console.log('⚠️ Error analyzing token:', error.message);
    }
}

// Run all tests
async function runDiagnostics() {
    analyzeToken();
    await testTokenValidity();
    await testMarketDataAccess();
    testWebSocketEndpoint();
    
    console.log('\n📝 Recommendations:');
    console.log('1. If token is expired, generate a new one from Upstox Developer Console');
    console.log('2. Ensure your app has "Market Data" permissions enabled');
    console.log('3. Check if Upstox WebSocket API endpoint has changed');
    console.log('4. Verify you\'re using the correct API version (v3.0 for WebSocket)');
    console.log('\n🔗 Useful links:');
    console.log('- Upstox Developer Console: https://developer.upstox.com/');
    console.log('- WebSocket API Docs: https://upstox.com/developer/api/v2/websocket/');
}

runDiagnostics().catch(console.error);
