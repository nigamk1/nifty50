# 🔐 Upstox Access Token Setup Guide

## Step-by-Step Instructions to Get Your Access Token

### 1. Create Upstox Developer App

1. Go to [Upstox Developer Console](https://developer.upstox.com/)
2. Login with your Upstox account
3. Click **"Create App"**
4. Fill in the details:
   - **App Name**: `Nifty 50 Candle Generator` (or any name)
   - **App Type**: `Web Application`
   - **Redirect URL**: `http://localhost:3000/callback`
   - **Description**: `Real-time Nifty 50 OHLC data tracker`

### 2. Get Your App Credentials

After creating the app, you'll get:
- **Client ID** (something like: `abc123-def456-ghi789`)
- **Client Secret** (something like: `xyz789-uvw456-rst123`)

### 3. Configure OAuth Helper

1. Open the file `oauth-helper.js`
2. Replace these lines with your actual credentials:
   ```javascript
   const CLIENT_ID = 'your_actual_client_id_here';
   const CLIENT_SECRET = 'your_actual_client_secret_here';
   ```

### 4. Generate Access Token

Run the OAuth helper script:
```bash
npm run get-token
```

This will:
- ✅ Open your browser automatically
- 🔐 Navigate to Upstox login page
- 📝 Ask you to authorize the app
- 🔑 Generate an access token
- 💾 Save it to your `.env` file automatically

### 5. Test Your Setup

After getting the token, run:
```bash
npm run diagnose
```

This will verify:
- ✅ Token validity
- 🔐 API permissions
- 📡 WebSocket connectivity

### 6. Start the Application

If everything looks good:
```bash
npm start
```

## Alternative: Manual Token Generation

If the automated method doesn't work, you can manually generate a token:

### Using Postman OAuth:

1. In Upstox Developer Console, set redirect URL to:
   ```
   https://oauth.pstmn.io/v1/callback
   ```

2. Visit this URL in your browser (replace YOUR_CLIENT_ID):
   ```
   https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=https://oauth.pstmn.io/v1/callback
   ```

3. Login and authorize
4. Copy the `code` from the callback URL
5. Use curl or Postman to exchange code for token:
   ```bash
   curl -X POST https://api.upstox.com/v2/login/authorization/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "code=YOUR_CODE&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=https://oauth.pstmn.io/v1/callback&grant_type=authorization_code"
   ```

## Common Issues

### Issue: "Invalid redirect URI"
**Solution**: Make sure the redirect URL in your app settings exactly matches what you're using

### Issue: "Client authentication failed"
**Solution**: Double-check your client ID and secret

### Issue: "Invalid authorization code"
**Solution**: Authorization codes expire quickly (usually 10 minutes), generate a new one

### Issue: "Insufficient scope"
**Solution**: Ensure your app has "Market Data" permissions enabled

## Token Validity

- 🕐 Access tokens typically expire in 24 hours
- 🔄 You'll need to regenerate them daily
- ⚡ The app will show "401 Unauthorized" when expired

## Security Notes

- 🔒 Never commit your `.env` file to version control
- 🔐 Keep your client secret secure
- 🔑 Regenerate tokens regularly
- 🚫 Don't share tokens with others

## Need Help?

- 📚 [Upstox API Documentation](https://upstox.com/developer/api/)
- 💬 [Upstox Developer Community](https://upstox.com/developer/)
- 📧 Contact Upstox Support if you have API-related issues
