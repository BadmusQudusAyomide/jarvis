# 🚀 Render Deployment Checklist

## ✅ **Pre-Deployment Checklist**

- [ ] All code committed to GitHub
- [ ] `.env` file has correct API keys
- [ ] Bot runs locally with `npm run dev`
- [ ] Health endpoint works at `/health`

## 🌐 **Render Deployment Steps**

1. **Go to [Render.com](https://render.com)**
2. **Sign up/Login with GitHub**
3. **Click "New +" → "Web Service"**
4. **Connect GitHub account**
5. **Select jarvis repository**
6. **Choose whatsapp-bot folder**

## ⚙️ **Service Configuration**

- **Name**: `jarvis-whatsapp-bot`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

## 🔑 **Environment Variables**

Add these in Render dashboard:

```
VITE_GEMINI_API_KEY=ak ah=gain
VITE_SUPABASE_URL=ask again
VITE_SUPABASE_ANON_KEY=your_complete_supabase_key
```

## 🎯 **After Deployment**

- [ ] Check logs for QR code
- [ ] Scan QR code with WhatsApp
- [ ] Test bot with a message
- [ ] Verify health endpoint works

## 📱 **Your Bot URL**

`https://jarvis-whatsapp-bot.onrender.com`

## 🆘 **If Issues**

1. Check Render logs
2. Verify environment variables
3. Restart the service
4. Check WhatsApp connection

---

**Ready to deploy?** 🚀
