# JARVIS WhatsApp Bot

WhatsApp integration for JARVIS AI assistant using WhiskeySockets/Baileys.

## Features

- **Same JARVIS Brain**: Uses identical AI services as web app and Telegram bot
- **Memory Integration**: Remembers conversations via Supabase
- **Custom Personality**: Identifies as created by Badmus Qudus Ayomide
- **QR Code Authentication**: Easy setup with WhatsApp Web
- **Group Support**: Responds to mentions in WhatsApp groups
- **Built-in Commands**: Time, date, calculations, and more

## Quick Setup

1. **Install Dependencies:**
   ```bash
   cd whatsapp-bot
   npm install
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env` and add your API keys (same as other bots)

3. **Start Bot:**
   ```bash
   npm run dev
   ```

4. **Scan QR Code:**
   Open WhatsApp on your phone and scan the QR code displayed in terminal

## How It Works

- **Authentication**: Uses WhatsApp Web protocol via QR code
- **Session Persistence**: Saves login session in `auth_info_baileys/` folder
- **Message Processing**: Same response generator as web app and Telegram bot
- **Memory System**: Shares conversation history with other JARVIS interfaces

## Commands

- **Greetings**: "Hello", "Hi", "Good morning"
- **About**: "Who are you?", "Who created you?"
- **Time/Date**: "What time is it?", "What's the date?"
- **Math**: "25 + 15", "100 / 4"
- **AI Questions**: Any complex query uses Gemini API

## Group Usage

Bot responds to messages containing "jarvis" or "@jarvis" in groups.

## Security

- Session data is gitignored
- Environment variables protected
- Same security model as other JARVIS bots

## Deployment

Currently designed for local/VPS deployment. WhatsApp Web protocol requires persistent connection.

---

**Created by Badmus Qudus Ayomide**
