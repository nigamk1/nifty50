# 🚀 Deployment Guide for Render

This guide walks you through deploying the Nifty 50 Alert System to Render.

## 📋 Prerequisites

- GitHub repository: `https://github.com/nigamk1/nifty50.git`
- Render account (free tier available)
- Upstox API access token
- Telegram bot token and chat ID

## 🌐 Deploy to Render

### Method 1: Direct GitHub Integration (Recommended)

1. **Login to Render**
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select repository: `nigamk1/nifty50`
   - Click "Connect"

3. **Configure Service Settings**
   ```
   Name: nifty50-alert-system
   Environment: Node
   Branch: main
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   LOG_LEVEL=info
   UPSTOX_ACCESS_TOKEN=your_upstox_token_here
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   TELEGRAM_CHAT_ID=your_telegram_chat_id_here
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Method 2: Using render.yaml (Infrastructure as Code)

1. **Automatic Deployment**
   - Render will detect the `render.yaml` file
   - Automatically configure the service
   - You only need to set environment variables

## 🔧 Configuration

### Environment Variables (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `UPSTOX_ACCESS_TOKEN` | Your Upstox API access token | `eyJ0eXAiOiJKV1Q...` |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | `123456789:ABC...` |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID | `123456789` |
| `NODE_ENV` | Environment mode | `production` |
| `LOG_LEVEL` | Logging level | `info` |

### Health Check

- Health endpoint: `https://your-app.onrender.com/health`
- Status endpoint: `https://your-app.onrender.com/`

## 🔄 Automatic Deployments

- **Auto-deploy on push**: Enabled by default for main branch
- **Build time**: ~2-3 minutes
- **Zero-downtime deployments**: Automatic

## 📊 Monitoring

### Logs
- View logs in Render dashboard
- Real-time log streaming available
- Error tracking and alerts

### Performance
- Free tier: 512MB RAM, shared CPU
- Paid tiers: More resources available
- Automatic scaling options

## 🛠️ Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check Node.js version in logs
   # Ensure all dependencies are in package.json
   ```

2. **Health Check Fails**
   ```bash
   # Verify port 10000 is used
   # Check /health endpoint responds
   ```

3. **WebSocket Connection Issues**
   ```bash
   # Verify Upstox token is valid
   # Check market hours (9:15 AM - 3:30 PM IST)
   ```

## 🔒 Security

- Environment variables are encrypted
- HTTPS enabled by default
- Automatic SSL certificates

## 💰 Pricing

- **Free Tier**: 750 hours/month, auto-sleep after 15 min
- **Starter**: $7/month, no auto-sleep
- **Standard**: $25/month, more resources

## 📱 Post-Deployment

1. **Test the deployment**:
   ```bash
   curl https://your-app.onrender.com/health
   ```

2. **Monitor alerts**:
   - Check Telegram for test messages
   - Verify market data processing

3. **Set up monitoring**:
   - Enable Render monitoring
   - Set up alert notifications

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node-js)
- [Environment Variables](https://render.com/docs/environment-variables)

---

### 🎯 Expected Deployment URL
`https://nifty50-alert-system.onrender.com`

Your Nifty 50 Alert System will be live and processing real-time market data! 🚀
