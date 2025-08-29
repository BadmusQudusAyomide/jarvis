import TelegramBot from 'node-telegram-bot-api'
import express from 'express'
import dotenv from 'dotenv'
import { ResponseGenerator } from './services/responseGenerator.js'

dotenv.config()

// Validate required environment variables
const token = process.env.TELEGRAM_BOT_TOKEN
const webhookUrl = process.env.WEBHOOK_URL
const port = process.env.PORT || 3000

// Check if we're running on Vercel
const isVercel = process.env.VERCEL === '1'

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required')
  if (isVercel) {
    console.error(
      '❌ Please set TELEGRAM_BOT_TOKEN in Vercel environment variables'
    )
  }
  // Don't exit on Vercel, just log the error
  if (!isVercel) {
    process.exit(1)
  }
}

// Initialize bot only if token is available
let bot
let responseGenerator

try {
  if (token) {
    bot = new TelegramBot(token)
    responseGenerator = new ResponseGenerator()
    console.log('✅ Telegram bot initialized successfully')
  } else {
    console.warn('⚠️ Bot not initialized - missing token')
  }
} catch (error) {
  console.error('❌ Failed to initialize bot:', error)
}

// Store user sessions and name tracking
const userSessions = new Map()
const userNameTracking = new Map() // Track if we've asked for name
const crushName = 'Owoyemi' // Replace with actual name

// Express app for webhook
const app = express()
app.use(express.json())

// Health check endpoint
app.get('/', (req, res) => {
  try {
    res.json({
      status: 'JARVIS Telegram Bot is running!',
      bot: '@BadmusQudusbot',
      timestamp: new Date().toISOString(),
      environment: isVercel ? 'Vercel' : 'Local',
      botStatus: bot ? 'Initialized' : 'Not Initialized (Missing Token)',
    })
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({ error: 'Health check failed' })
  }
})

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    if (!bot) {
      console.warn('⚠️ Webhook received but bot not initialized')
      return res.status(503).json({ error: 'Bot not initialized' })
    }

    const update = req.body

    if (update.message) {
      await handleMessage(update.message)
    }

    res.sendStatus(200)
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// Handle incoming messages
async function handleMessage(message) {
  if (!bot || !responseGenerator) {
    console.error('❌ Bot or response generator not available')
    return
  }

  const chatId = message.chat.id
  const userId = message.from.id
  const text = message.text
  const userName = message.from.first_name || 'User'

  console.log(`📱 Message from ${userName} (${userId}): ${text}`)

  try {
    // Check if this is a name response
    if (
      userNameTracking.has(userId) &&
      userNameTracking.get(userId).waitingForName
    ) {
      const providedName = text.trim()
      userNameTracking.set(userId, { waitingForName: false, providedName })

      // Check if name matches crush
      if (providedName.toLowerCase() === crushName.toLowerCase()) {
        const mysteriousResponse = `Ohh! 😊 *He* has told me a lot about you! You're exactly how he described you to be.`
        await bot.sendMessage(chatId, mysteriousResponse, {
          parse_mode: 'Markdown',
        })

        // Wait a moment then send follow-up
        setTimeout(async () => {
          const followUp = `He says you're really special... 🌟`
          await bot.sendMessage(chatId, followUp, { parse_mode: 'Markdown' })
        }, 2000)

        return // Don't process further
      } else {
        // Normal response for other names
        await bot.sendMessage(chatId, `Nice to meet you, ${providedName}! 😊`)
      }
    }

    // Check if this is a greeting that should trigger name asking
    const isGreeting =
      /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(
        text.toLowerCase()
      )

    if (isGreeting && !userNameTracking.has(userId)) {
      // First time greeting - ask for name
      userNameTracking.set(userId, { waitingForName: true, providedName: null })

      const greetingResponse = `Hello! 😊 I'm JARVIS, an AI assistant. What's your name?`
      await bot.sendMessage(chatId, greetingResponse, {
        parse_mode: 'Markdown',
      })
      return
    }

    // Handle follow-up questions about "he"
    if (
      text.toLowerCase().includes('who') ||
      text.toLowerCase().includes('what') ||
      text.toLowerCase().includes('he')
    ) {
      const crushInfo = userNameTracking.get(userId)
      if (
        crushInfo &&
        crushInfo.providedName &&
        crushInfo.providedName.toLowerCase() === crushName.toLowerCase()
      ) {
        const sweetResponse = `Well... he told me you're absolutely adorable! 🌸 He says you have the most beautiful smile, and you're incredibly kind and intelligent. He thinks you're amazing in every way! 💕`
        await bot.sendMessage(chatId, sweetResponse, { parse_mode: 'Markdown' })

        // Add more sweet details
        setTimeout(async () => {
          const moreDetails = `He also mentioned how you make him laugh, and how you have this special way of brightening up any room you walk into. You're truly someone special! ✨`
          await bot.sendMessage(chatId, moreDetails, { parse_mode: 'Markdown' })
        }, 3000)

        return
      }
    }

    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing')

    // Get or create user session
    if (!userSessions.has(userId)) {
      userSessions.set(userId, new ResponseGenerator())
    }

    const userResponseGenerator = userSessions.get(userId)

    // Generate response
    const response = await userResponseGenerator.generateResponse(text, userId)

    // Send response
    await bot.sendMessage(chatId, response, {
      parse_mode: 'Markdown',
      reply_to_message_id: message.message_id,
    })

    console.log(`✅ Response sent to ${userName}`)
  } catch (error) {
    console.error('Message handling error:', error)

    // Send error message to user
    try {
      await bot.sendMessage(
        chatId,
        "I'm sorry, I encountered an error processing your message. Please try again.",
        { reply_to_message_id: message.message_id }
      )
    } catch (sendError) {
      console.error('Failed to send error message:', sendError)
    }
  }
}

// Handle bot commands
bot.onText(/\/start/, async msg => {
  const chatId = msg.chat.id
  const userName = msg.from.first_name || 'User'

  const welcomeMessage = `
🤖 *Welcome to JARVIS, ${userName}!*

I'm your intelligent AI assistant, ready to help with:

• ❓ *Questions & Conversations* - Ask me anything!
• 🧮 *Calculations* - Simple math operations
• 🕐 *Time & Date* - Current time and date
• 🌤️ *Weather* - Weather information (coming soon)
• 📰 *News* - Latest news updates (coming soon)

Just send me a message and I'll do my best to help!

*Examples:*
• "What is quantum computing?"
• "Calculate 15 + 27"
• "What time is it?"
• "Hi JARVIS!"
`

  try {
    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Start command error:', error)
  }
})

bot.onText(/\/help/, async msg => {
  const chatId = msg.chat.id

  const helpMessage = `
🆘 *JARVIS Help*

*Available Commands:*
• /start - Welcome message
• /help - This help message
• /status - Bot status

*How to use:*
Just send me any message and I'll respond! I can handle:
• Complex questions using AI
• Simple calculations
• Time and date queries
• General conversations

*Examples:*
• "Explain artificial intelligence"
• "What's 25 * 4?"
• "What time is it?"

Need more help? Just ask me anything!
`

  try {
    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Help command error:', error)
  }
})

bot.onText(/\/status/, async msg => {
  const chatId = msg.chat.id

  const statusMessage = `
📊 *JARVIS Status*

🤖 Bot: Online ✅
🧠 AI: ${process.env.VITE_GEMINI_API_KEY ? 'Configured ✅' : 'Not configured ❌'}
👥 Active users: ${userSessions.size}
⏰ Uptime: ${Math.floor(process.uptime())} seconds

*Version:* 1.0.0
*Last updated:* ${new Date().toLocaleString()}
`

  try {
    await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Status command error:', error)
  }
})

// Error handling
bot.on('error', error => {
  console.error('Bot error:', error)
})

bot.on('polling_error', error => {
  console.error('Polling error:', error)
})

// Set webhook endpoint
app.get('/api/set-webhook', async (req, res) => {
  try {
    const webhookUrl = `https://${req.headers.host}/webhook`
    await bot.setWebHook(webhookUrl)
    res.json({ success: true, webhookUrl })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Check if running on Vercel or other serverless platform
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  console.log('🌐 Running in serverless mode (Vercel)...')
} else {
  // For development, use polling mode
  console.log('✅ JARVIS Bot is running in polling mode')
  console.log('🤖 Bot available at: t.me/BadmusQudusbot')
  console.log('📱 Test the bot now - it should respond to messages!')

  // Start polling for local development
  bot.startPolling()

  app.listen(port, () => {
    console.log(`🌐 Server running on port ${port}`)
  })
}

// Handle all text messages (not just commands)
bot.on('message', async msg => {
  // Skip if it's a command (already handled by onText handlers)
  if (msg.text && msg.text.startsWith('/')) {
    return
  }

  // Handle regular text messages
  if (msg.text) {
    await handleMessage(msg)
  }
})

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down JARVIS Bot...')
  try {
    await bot.stopPolling()
    process.exit(0)
  } catch (error) {
    console.error('Shutdown error:', error)
    process.exit(1)
  }
})

// Export for Vercel
export default app
