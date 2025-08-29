import pkg from '@whiskeysockets/baileys'
const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = pkg
import NodeCache from 'node-cache'
import { Boom } from '@hapi/boom'
import qrcode from 'qrcode-terminal'
import dotenv from 'dotenv'
import pino from 'pino'
import { ResponseGenerator } from './services/responseGenerator.js'

dotenv.config()

// Initialize response generator
const responseGenerator = new ResponseGenerator()

// Store user sessions
const userSessions = new Map()

// Global variable to track reconnection attempts
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10 // Increased for production

// Create a simple logger that's compatible with Baileys
const logger = {
  level: 'info',
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args),
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  fatal: (msg, ...args) => console.error(`[FATAL] ${msg}`, ...args),
  trace: (msg, ...args) => console.trace(`[TRACE] ${msg}`, ...args),
  child: () => ({
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
    fatal: logger.fatal,
    trace: logger.trace,
    child: logger.child,
  }),
}

// Basic in-memory store placeholder (not used but kept for compatibility)
const store = {}

// Health check endpoint for Render
import { createServer } from 'http'

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      botStatus: reconnectAttempts < MAX_RECONNECT_ATTEMPTS ? 'running' : 'error'
    }))
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('JARVIS WhatsApp Bot is running!')
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 Health check server running on port ${PORT}`)
})

async function startWhatsAppBot() {
  logger.info('🚀 Starting JARVIS WhatsApp Bot...')

  try {
    // Clear auth state if we've had too many reconnection attempts
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.warn('🔄 Too many reconnection attempts, clearing auth state...')
      try {
        await useMultiFileAuthState('auth_info_baileys', { clearAuth: true })
      } catch (e) {
        logger.error('Error clearing auth state:', e)
      }
      reconnectAttempts = 0
    }

    // Get the latest WhatsApp Web version
    const { version, isLatest } = await fetchLatestBaileysVersion()
    logger.info(
      `Using WhatsApp Web v${version.join('.')}, is latest: ${isLatest}`
    )

    // Use multi-file auth state for session persistence
    const { state, saveCreds } =
      await useMultiFileAuthState('auth_info_baileys')

    // Generate a unique browser ID for this session
    const browserId = `JARVIS-${Math.random().toString(36).substring(2, 8)}`

    // Get the latest credentials
    const authState = {
      creds: state.creds,
      keys: state.keys,
    }

    console.log('🔑 Authentication state:', {
      clientId: authState.creds?.me?.id?.substring(0, 8) + '...',
      isRegistered: authState.creds.registered,
    })

    // Create the socket connection
    const sock = makeWASocket({
      version,
      // We'll handle QR code display in connection.update event
      auth: state,
      logger: logger,
      // Correct cache for retry counters as expected by Baileys
      msgRetryCounterCache: new NodeCache(),
      browser: [browserId, 'Chrome', '1.0.0'],
      markOnlineOnConnect: true,
    })

    // Save credentials when updated
    sock.ev.on('creds.update', () => {
      logger.info('Credentials updated')
      saveCreds()
    })

    // Handle connection updates
    sock.ev.on('connection.update', update => {
      const { connection, lastDisconnect, qr, isNewLogin, isOnline } =
        update || {}

      // Log the update for debugging
      if (connection) {
        logger.info(`Connection update: ${connection}`)
      }

      // Handle QR code generation
      if (qr) {
        console.log('\n📱 SCAN THIS QR CODE WITH YOUR WHATSAPP:')
        qrcode.generate(qr, { small: true })
        console.log('\n💡 After scanning, wait for the confirmation message...')
        return // Don't proceed further until QR is scanned
      }

      // Handle successful connection
      if (connection === 'open') {
        logger.info('✅ Successfully connected to WhatsApp')
        console.log('\n✅ JARVIS WhatsApp Bot is now connected and ready!\n')
        reconnectAttempts = 0 // Reset counter on successful connection
      }

      if (connection === 'close') {
        const error = lastDisconnect?.error
        const statusCode = error?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        console.log('\n⚠️  Connection closed:', {
          statusCode,
          error: error?.message || 'No error message',
          shouldReconnect,
          reconnectAttempt: reconnectAttempts + 1,
        })

        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000) // Exponential backoff, max 60s
          console.log(
            `🔄 Attempting to reconnect in ${delay / 1000} seconds (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
          )
          setTimeout(() => startWhatsAppBot(), delay)
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error(
            '❌ Max reconnection attempts reached. Please restart the bot.'
          )
        }
      }

      if (connection === 'open') {
        console.log('\n✅ JARVIS WhatsApp Bot connected successfully!')
        console.log('🤖 Bot is now ready to receive messages')
      }

      if (isNewLogin) {
        console.log('🔑 New login detected, please check your WhatsApp')
      }

      if (isOnline !== undefined) {
        console.log(isOnline ? '🟢 Online' : '🔴 Offline')
      }
    })

    // Handle incoming messages
    sock.ev.on('messages.upsert', async m => {
      const message = m.messages[0]

      if (!message.message || message.key.fromMe) return

      const messageText =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        ''

      if (!messageText) return

      const remoteJid = message.key.remoteJid
      const senderName = message.pushName || 'Unknown'

      console.log(
        `📱 Message from ${senderName} (${remoteJid}): ${messageText}`
      )

      try {
        // Generate response using JARVIS
        const userId = `whatsapp_${remoteJid.replace('@s.whatsapp.net', '')}`
        const response = await responseGenerator.generateResponse(
          messageText,
          userId
        )

        // Send response back
        await sock.sendMessage(remoteJid, { text: response })
        console.log('✅ Response sent to', senderName)
      } catch (error) {
        console.error('❌ Error processing message:', error)

        // Send error message to user
        try {
          await sock.sendMessage(remoteJid, {
            text: 'I encountered an error processing your message. Please try again.',
          })
        } catch (sendError) {
          console.error('❌ Failed to send error message:', sendError)
        }
      }
    })

    // Handle group messages (optional - you can disable this)
    sock.ev.on('messages.upsert', async m => {
      const message = m.messages[0]

      if (!message.message || message.key.fromMe) return

      // Only respond to direct mentions in groups
      if (message.key.remoteJid?.endsWith('@g.us')) {
        const messageText =
          message.message.conversation ||
          message.message.extendedTextMessage?.text ||
          ''

        // Check if bot is mentioned (you can customize this logic)
        if (
          messageText.toLowerCase().includes('jarvis') ||
          messageText.toLowerCase().includes('@jarvis')
        ) {
          const remoteJid = message.key.remoteJid
          const senderName = message.pushName || 'Unknown'

          console.log(`👥 Group mention from ${senderName}: ${messageText}`)

          try {
            const userId = `whatsapp_group_${remoteJid.replace('@g.us', '')}`
            const response = await responseGenerator.generateResponse(
              messageText,
              userId
            )

            await sock.sendMessage(remoteJid, { text: response })
            console.log('✅ Group response sent')
          } catch (error) {
            console.error('❌ Error processing group message:', error)
          }
        }
      }
    })

    return sock
  } catch (error) {
    console.error('❌ Failed to start WhatsApp bot:', error)

    // Retry after 5 seconds
    setTimeout(() => {
      console.log('🔄 Retrying WhatsApp bot connection...')
      startWhatsAppBot()
    }, 5000)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down JARVIS WhatsApp Bot...')
  server.close(() => {
    console.log('✅ Health check server closed')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...')
  server.close(() => {
    console.log('✅ Health check server closed')
    process.exit(0)
  })
})

// Start the bot
startWhatsAppBot()
