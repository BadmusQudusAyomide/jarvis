# 🚀 Deploy JARVIS WhatsApp Bot to Render

This guide will help you deploy your WhatsApp bot to Render so it runs independently without needing your browser open.

## 📋 Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **API Keys Ready** - Make sure you have all your API keys

## 🔧 Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
cd C:\Users\DELL\Desktop\jarvis\whatsapp-bot
git init
git add .
git commit -m "Initial commit: WhatsApp bot ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 1.2 Create .env.example
Create a `.env.example` file with your API keys (replace with actual values):
```bash
# Required for AI responses
VITE_GEMINI_API_KEY=your_actual_gemini_api_key

# Required for conversation memory  
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Weather API
VITE_WEATHER_API_KEY=your_openweathermap_api_key

# Optional: News API
VITE_NEWS_API_KEY=your_news_api_key

# Optional: Google Search API
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_CSE_ID=your_google_cse_id
```

## 🌐 Step 2: Deploy to Render

### 2.1 Connect GitHub Repository
1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account
4. Select your WhatsApp bot repository

### 2.2 Configure the Service
- **Name**: `jarvis-whatsapp-bot`
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 2.3 Add Environment Variables
Click **"Environment"** and add these variables:
```
NODE_ENV=production
VITE_GEMINI_API_KEY=your_actual_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_CSE_ID=your_google_cse_id
```

### 2.4 Deploy
Click **"Create Web Service"** and wait for deployment.

## 🔍 Step 3: Monitor and Test

### 3.1 Check Health
Your bot will be available at: `https://your-app-name.onrender.com/health`

### 3.2 View Logs
- Go to your Render dashboard
- Click on your service
- Go to **"Logs"** tab to see real-time logs

### 3.3 Scan QR Code
1. Check the logs for the QR code
2. Scan it with your WhatsApp
3. The bot will stay connected 24/7

## 🚨 Important Notes

### Connection Stability
- **Free Plan**: May have some connection drops, but bot will auto-reconnect
- **Paid Plan**: More stable connections
- **Auto-restart**: Bot automatically restarts if disconnected

### WhatsApp Web Limitations
- **Single Session**: Only one device can use WhatsApp Web at a time
- **Phone Required**: Your phone must stay connected to internet
- **Session Expiry**: Sessions may expire after 30 days

### Troubleshooting
- **Connection Issues**: Check logs for error messages
- **QR Code**: If bot disconnects, check logs for new QR code
- **API Limits**: Monitor Gemini API usage to avoid rate limits

## 🔄 Auto-Deploy

Every time you push to GitHub:
1. Render automatically detects changes
2. Rebuilds and redeploys your bot
3. Maintains your WhatsApp session

## 💡 Pro Tips

1. **Monitor Logs**: Check Render logs regularly for any issues
2. **Backup Auth**: Your `auth_info_baileys` folder contains session data
3. **Scale Up**: Upgrade to paid plan for better performance
4. **Custom Domain**: Add your own domain for professional appearance

## 🎯 What You Get

✅ **24/7 Bot Operation** - No need to keep your computer on  
✅ **Auto-Restart** - Bot recovers from crashes automatically  
✅ **Easy Updates** - Push to GitHub, auto-deploy  
✅ **Professional URL** - `https://your-bot.onrender.com`  
✅ **Health Monitoring** - Check bot status anytime  
✅ **Log Access** - View real-time bot activity  

## 🚀 Next Steps

1. Deploy your bot following this guide
2. Test the health endpoint
3. Scan the QR code from logs
4. Send a test message
5. Monitor logs for any issues

Your WhatsApp bot will now run independently on Render! 🎉
