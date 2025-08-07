// oauth-helper.js - Helper script to get access token from Upstox
const http = require('http');
const url = require('url');
const { exec } = require('child_process');

// Your Upstox app credentials
const CLIENT_ID = 'your_client_id_here'; // Replace with your actual client ID
const CLIENT_SECRET = 'your_client_secret_here'; // Replace with your actual client secret
const REDIRECT_URI = 'http://localhost:3000/callback';

console.log('🔐 Upstox OAuth Token Generator');
console.log('='.repeat(50));

if (CLIENT_ID === 'your_client_id_here' || CLIENT_SECRET === 'your_client_secret_here') {
    console.log('❌ Please update CLIENT_ID and CLIENT_SECRET in this file first');
    console.log('📋 Get them from: https://developer.upstox.com/');
    process.exit(1);
}

// Step 1: Generate authorization URL
const authUrl = `https://api.upstox.com/v2/login/authorization/dialog` +
    `?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

console.log('🌐 Opening browser for Upstox login...');
console.log('🔗 Auth URL:', authUrl);

// Create a temporary server to handle the callback
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/callback') {
        const authCode = parsedUrl.query.code;
        const error = parsedUrl.query.error;
        
        if (error) {
            console.log('❌ Authorization error:', error);
            res.writeHead(400, {'Content-Type': 'text/html'});
            res.end(`<h1>Authorization Failed</h1><p>Error: ${error}</p>`);
            server.close();
            return;
        }
        
        if (authCode) {
            console.log('✅ Authorization code received:', authCode);
            
            // Step 2: Exchange code for access token
            exchangeCodeForToken(authCode, (token) => {
                if (token) {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(`
                        <h1>✅ Success!</h1>
                        <p>Access token generated successfully.</p>
                        <p>Check your terminal for the token details.</p>
                        <p>You can close this window now.</p>
                    `);
                } else {
                    res.writeHead(500, {'Content-Type': 'text/html'});
                    res.end(`<h1>❌ Token Exchange Failed</h1><p>Check terminal for details.</p>`);
                }
                server.close();
            });
        } else {
            res.writeHead(400, {'Content-Type': 'text/html'});
            res.end('<h1>❌ No authorization code received</h1>');
            server.close();
        }
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('<h1>404 - Not Found</h1>');
    }
});

// Start server on port 3000
server.listen(3000, () => {
    console.log('🚀 Local server started on http://localhost:3000');
    console.log('⏳ Waiting for authorization callback...');
    
    // Auto-open browser (works on Windows, macOS, Linux)
    const platform = process.platform;
    const openCommand = platform === 'win32' ? 'start' : 
                       platform === 'darwin' ? 'open' : 'xdg-open';
    
    exec(`${openCommand} "${authUrl}"`, (error) => {
        if (error) {
            console.log('⚠️ Could not auto-open browser. Please manually visit:');
            console.log(authUrl);
        }
    });
});

// Function to exchange authorization code for access token
function exchangeCodeForToken(authCode, callback) {
    const https = require('https');
    const querystring = require('querystring');
    
    const postData = querystring.stringify({
        code: authCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
    });
    
    const options = {
        hostname: 'api.upstox.com',
        port: 443,
        path: '/v2/login/authorization/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    console.log('🔄 Exchanging authorization code for access token...');
    
    const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                
                if (res.statusCode === 200 && response.access_token) {
                    console.log('\n🎉 SUCCESS! Access token generated:');
                    console.log('='.repeat(50));
                    console.log('🔑 Access Token:', response.access_token);
                    console.log('⏰ Expires in:', response.expires_in, 'seconds');
                    console.log('📅 Valid until:', new Date(Date.now() + response.expires_in * 1000).toISOString());
                    
                    // Update .env file
                    updateEnvFile(response.access_token);
                    
                    callback(response.access_token);
                } else {
                    console.log('❌ Token exchange failed:', response);
                    callback(null);
                }
            } catch (error) {
                console.log('❌ Error parsing token response:', error.message);
                console.log('Raw response:', data);
                callback(null);
            }
        });
    });
    
    req.on('error', (error) => {
        console.log('❌ Token exchange error:', error.message);
        callback(null);
    });
    
    req.write(postData);
    req.end();
}

// Function to update .env file with new token
function updateEnvFile(accessToken) {
    const fs = require('fs');
    const path = require('path');
    
    try {
        const envPath = path.join(__dirname, '.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
            
            // Replace existing token or add new one
            if (envContent.includes('UPSTOX_ACCESS_TOKEN=')) {
                envContent = envContent.replace(
                    /UPSTOX_ACCESS_TOKEN=.*/,
                    `UPSTOX_ACCESS_TOKEN=${accessToken}`
                );
            } else {
                envContent += `\nUPSTOX_ACCESS_TOKEN=${accessToken}\n`;
            }
        } else {
            envContent = `UPSTOX_ACCESS_TOKEN=${accessToken}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Updated .env file with new access token');
        
    } catch (error) {
        console.log('⚠️ Could not update .env file:', error.message);
        console.log('💡 Please manually add this token to your .env file:');
        console.log(`UPSTOX_ACCESS_TOKEN=${accessToken}`);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n⚠️ Process interrupted. Cleaning up...');
    server.close();
    process.exit(0);
});

console.log('\n📋 Instructions:');
console.log('1. Browser will open automatically for Upstox login');
console.log('2. Login with your Upstox credentials');
console.log('3. Authorize the application');
console.log('4. Access token will be generated and saved to .env file');
console.log('5. You can then run "npm start" to start the main application');
