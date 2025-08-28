# 🚀 JARVIS WhatsApp Bot Deployment Guide

## 🌟 **Why Not Vercel?**

WhatsApp bots need **persistent connections** and can't use webhooks like Telegram bots. Vercel is designed for serverless functions that timeout quickly.

## 🎯 **Recommended Deployment Options**

### 1. **Render (Best Free Option) ⭐**

- ✅ Free tier available (750 hours/month)
- ✅ Persistent connections
- ✅ Easy deployment
- ✅ Auto-restart on failure
- ✅ Custom domains

### 2. **Railway (Good Alternative)**

- ✅ Free tier available (500 hours/month)
- ✅ Persistent connections
- ✅ Easy deployment

### 3. **DigitalOcean Droplet (Most Reliable)**

- 💰 $5/month
- ✅ Full control
- ✅ Most stable for WhatsApp

---

## 🚀 **Deploy to Render (Step-by-Step)**

### Step 1: Prepare Your Code

```bash
# Make sure all files are committed
git add .
git commit -m "Prepare for deployment"
git push
```

### Step 2: Deploy to Render

1. **Go to [Render.com](https://render.com)**
2. **Sign up/Login** with GitHub
3. **Click "New +"**
4. **Choose "Web Service"**
5. **Connect your GitHub account**
6. **Select your jarvis repository**
7. **Choose the whatsapp-bot folder**

### Step 3: Configure the Service

- **Name**: `jarvis-whatsapp-bot`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

### Step 4: Add Environment Variables

In Render dashboard, add these environment variables:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 5: Deploy

- Click "Create Web Service"
- Render will automatically detect it's a Node.js app
- It will use the `render.yaml` configuration
- The bot will start automatically

---

## 🐳 **Deploy with Docker (Alternative)**

### Option A: Render with Docker

Render will automatically use the Dockerfile if present.

### Option B: Manual Docker Deployment

```bash
# Build the image
docker build -t jarvis-whatsapp-bot .

# Run the container
docker run -d \
  --name jarvis-whatsapp \
  -p 3000:3000 \
  -e VITE_GEMINI_API_KEY=your_key \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  jarvis-whatsapp-bot
```

---

## 🔧 **Deployment Features**

### ✅ **Health Check Endpoint**

- **URL**: `https://your-app.onrender.com/health`
- **Purpose**: Monitor bot status
- **Response**: JSON with uptime, memory usage, status

### ✅ **Auto-Restart**

- Bot automatically restarts on failure
- Exponential backoff for reconnections
- Max 5 reconnection attempts

### ✅ **Persistent Storage**

- WhatsApp session data preserved
- No need to scan QR code again after restart

---

## 📱 **After Deployment**

### 1. **First Run**

- Bot will start and show QR code in logs
- Scan QR code with your WhatsApp
- Bot will connect and stay online

### 2. **Monitor Status**

- Check Render dashboard for logs
- Use health endpoint: `/health`
- Monitor memory usage

### 3. **Test the Bot**

- Send a message to the bot
- Check if it responds
- Verify Supabase integration

---

## 🚨 **Important Notes**

### ⚠️ **WhatsApp Limitations**

- **One session per phone number**
- **Can't run multiple instances**
- **Session expires after 14 days of inactivity**

### 🔄 **Maintenance**

- **Restart bot weekly** to refresh connection
- **Monitor memory usage** (should stay under 512MB)
- **Check logs** for any errors

### 💰 **Costs**

- **Render Free**: 750 hours/month
- **Render Pro**: $7/month (unlimited)
- **Railway Free**: 500 hours/month

---

## 🆘 **Troubleshooting**

### **Bot Won't Start**

1. Check environment variables
2. Verify API keys are valid
3. Check Render logs for errors

### **Bot Disconnects Frequently**

1. Check internet stability
2. Verify WhatsApp Web isn't used elsewhere
3. Restart the bot

### **High Memory Usage**

1. Restart bot weekly
2. Check for memory leaks in logs
3. Consider upgrading to paid plan

---

## 🎉 **Success!**

Your WhatsApp bot is now running independently on Render! It will:

- ✅ Stay online 24/7
- ✅ Auto-restart on failures
- ✅ Handle messages automatically
- ✅ Maintain WhatsApp session

**Next**: Test it by sending a message to your bot! 🚀
