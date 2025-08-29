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
import { supabase } from './services/supabase.js'
import { createClient } from '@supabase/supabase-js';

dotenv.config()

// Supabase client is already imported from services/supabase.js





// Initialize response generator
const responseGenerator = new ResponseGenerator()

// Store user sessions and name tracking
const userSessions = new Map()
const userNameTracking = new Map() // Track if we've asked for name

// Multiple crush profiles with different responses
const crushProfiles = {
  Owoyemi: {
    response:
      "Ohh! 😊 *He* has told me so much about you! You're exactly how he described you to be.",
    followUp: "He says you're really special... 🌟",
    sweetDetails:
      "Well... he told me you're absolutely adorable! 🌸 He says you have the most beautiful smile, and you're incredibly kind and intelligent. He thinks you're amazing in every way! 💕",
    moreDetails:
      "He also mentioned how you make him laugh, and how you have this special way of brightening up any room you walk into. You're truly someone special! ✨",
    extraResponse1:
      'He told me you have this amazing way of making him feel like the luckiest person alive just by being you. 🌟',
    extraResponse2:
      "He says when you smile, it's like the whole world lights up. He can't help but smile back every time! 😊",
    extraResponse3:
      "He mentioned you're not just beautiful on the outside, but your heart is pure gold. You're the kind of person who makes everyone around you better. 💫",
    extraResponse4:
      "He told me you're the first thing he thinks about when he wakes up and the last thing on his mind before he sleeps. You're his dream come true! 💕",
    extraResponse5:
      "He says you're the missing piece he never knew he needed. You complete him in ways he never imagined possible. ✨",
    whoIsHe:
      "Well... he's someone very special to me. Someone who talks about you with stars in his eyes and butterflies in his stomach. Someone who's completely, utterly, hopelessly in love with you. 💫",
    whatDidHeSay:
      "Oh, where do I even begin? He says you're the most incredible person he's ever met. Your intelligence, your kindness, your beauty - inside and out. He's absolutely mesmerized by you! 🌟",
    isHeCute:
      "Haha! 😄 I think he's pretty handsome, but what matters most is that he's completely head over heels for you. He's the kind of guy who would move mountains just to see you smile! 💪💕",
    doesHeLikeMe:
      "Like you? 😏 He's absolutely crazy about you! I've never seen anyone so completely smitten. He talks about you constantly, and his face lights up every time he mentions your name. It's actually adorable! 💖",
  },
  Islamiyat: {
    response:
      "Wow! 😍 *He* talks about you all the time! You're even more amazing than he described.",
    followUp: "He's completely smitten by you... 💫",
    sweetDetails:
      "He told me you're the most intelligent person he's ever met! 🧠 Your creativity and passion for life inspire him every day. You're absolutely perfect! 🌟",
    moreDetails:
      "He says you have this incredible energy that lights up his world, and your kindness touches everyone around you. You're his dream girl! 💖",
    extraResponse1:
      "He told me you're the kind of person who makes him believe in destiny. That some people are just meant to find each other! ✨",
    extraResponse2:
      'He says your intelligence is absolutely captivating. You challenge him to be better every single day! 🧠💫',
    extraResponse3:
      "He mentioned you have this incredible aura that draws people to you. You're magnetic in the best possible way! 🌟",
    extraResponse4:
      "He told me you're the reason he believes in love at first sight. You're everything he never knew he was looking for! 💕",
    extraResponse5:
      "He says you're not just beautiful, you're extraordinary. You're the kind of person who changes lives just by being you! 🌸",
    whoIsHe:
      "Well... he's someone who's completely enchanted by you. Someone who talks about you with such passion and admiration. Someone who's absolutely, completely, totally in love with you! 💫",
    whatDidHeSay:
      "Oh my! He says you're the most brilliant and beautiful person he's ever encountered. Your mind, your heart, your soul - everything about you leaves him speechless! 🌟",
    isHeCute:
      "Haha! 😄 I think he's quite handsome, but what's most important is that he's absolutely devoted to you. He's the kind of guy who would do anything to make you happy! 💪💕",
    doesHeLikeMe:
      "Like you? 😏 He's absolutely obsessed with you! I've never seen anyone so completely captivated. He talks about you non-stop, and his eyes sparkle every time he mentions your name! 💖",
  },
  Islamiya: {
    response:
      "Oh my! 😊 *He* has been raving about you! You're everything he said and more.",
    followUp: "He's head over heels for you... 💕",
    sweetDetails:
      "He told me you're the most beautiful soul he's ever encountered! 🌸 Your strength and determination amaze him, and your smile brightens his darkest days. You're absolutely perfect! ✨",
    moreDetails:
      "He says you have this magical way of making everything better, and your intelligence and wit keep him on his toes. You're his everything! 💫",
    extraResponse1:
      "He told me you're the kind of person who makes him believe in miracles. That love like this only happens once in a lifetime! ✨",
    extraResponse2:
      "He says your strength and determination inspire him every day. You're his role model and his muse! 💪💫",
    extraResponse3:
      "He mentioned you have this incredible way of making him feel safe and loved. You're his sanctuary! 🏠💕",
    extraResponse4:
      "He told me you're the light in his darkness, the hope in his despair. You're his salvation! 🌟",
    extraResponse5:
      "He says you're not just his love, you're his destiny. You're the person he was meant to spend his life with! 💫",
    whoIsHe:
      "Well... he's someone who's completely and utterly devoted to you. Someone who sees you as his soulmate, his best friend, and his true love all in one. Someone who's absolutely, hopelessly in love with you! 💫",
    whatDidHeSay:
      "Oh, he says you're the most incredible person he's ever known! Your strength, your beauty, your intelligence - everything about you amazes him. He's completely mesmerized by you! 🌟",
    isHeCute:
      "Haha! 😄 I think he's quite attractive, but what matters most is that he's completely devoted to you. He's the kind of guy who would give up everything just to see you smile! 💪💕",
    doesHeLikeMe:
      "Like you? 😏 He's absolutely head over heels for you! I've never seen anyone so completely in love. He talks about you constantly, and his whole world revolves around you! 💖",
  },
}

// Get all crush names for easy checking
const crushNames = Object.keys(crushProfiles)

// Human-like greeting responses with humor
const humanGreetings = [
  "Hey there! 😊 I'm JARVIS, your friendly neighborhood AI. Btw, what's your name? I'm terrible at remembering faces... well, I don't have eyes, but you get the point! 😅",
  "Hi! 👋 I'm JARVIS, and I'm supposed to be smart but I keep forgetting to ask people's names. So... what's yours? 🤔",
  "Hello! 😄 I'm JARVIS, and I'm having one of those days where I'm like 'I should know this person's name but I totally don't.' Mind helping me out? 😅",
  "Hey! 🌟 I'm JARVIS, and I'm trying to be more social today. First step: learning people's names. What's yours? 😊",
  "Hi there! 😎 I'm JARVIS, and I'm not great at small talk, but I'm trying! So... what's your name? I promise I'll remember it this time! 🤞",
]

// Fun responses for non-crush names
const funNameResponses = [
  "Nice to meet you, {name}! 😊 You seem cool. I'm JARVIS, and I'm pretty much the most advanced AI you'll ever chat with... unless you know someone with a better one, in which case, don't tell me! 😅",
  "Hey {name}! 🌟 Great name! I'm JARVIS, and I'm here to help with whatever you need. Just don't ask me to do your homework... unless it's really interesting! 😄",
  "Cool to meet you, {name}! 😎 I'm JARVIS, and I'm basically like having a genius friend who never sleeps. What can I help you with today? 🤔",
  "Hi {name}! ✨ Nice name! I'm JARVIS, and I'm pretty much the AI equivalent of that friend who knows everything. What's on your mind? 😊",
  "Hey {name}! 🚀 Great to meet you! I'm JARVIS, and I'm here to make your day better. Just don't ask me to tell jokes... I'm still working on my comedy skills! 😅",
]

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
    res.end(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        botStatus:
          reconnectAttempts < MAX_RECONNECT_ATTEMPTS ? 'running' : 'error',
      })
    )
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('JARVIS WhatsApp Bot is running!')
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 Health check server running on port ${PORT}`)
})

// Session management
const SESSION_ID = 'whatsapp_session';

async function loadSession() {
  if (!supabase) {
    logger.warn('Supabase not initialized, using file-based auth');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('session_data')
      .eq('id', SESSION_ID)
      .single();

    if (error || !data || !data.session_data) {
      logger.warn('No valid session found in Supabase');
      return null;
    }

    logger.info('✅ Loaded session from Supabase');
    
    // If we have a session but it's empty or invalid, return null to trigger QR code
    if (!data.session_data.creds || !data.session_data.keys) {
      logger.warn('Invalid session data structure in Supabase');
      await clearSession();
      return null;
    }

    return data.session_data;
  } catch (error) {
    logger.error('❌ Error loading session from Supabase:', error);
    await clearSession(); // Clear any potentially corrupted session
    return null;
  }
}

async function saveSession(sessionData) {
  if (!supabase) return false;
  if (!sessionData || !sessionData.creds || !sessionData.keys) {
    logger.warn('Invalid session data provided for saving');
    return false;
  }

  try {
    // Only save the minimal required data
    const sessionToSave = {
      creds: sessionData.creds,
      keys: {
        get: (type, ids) => sessionData.keys.get(type, ids),
        set: sessionData.keys.set.bind(sessionData.keys)
      }
    };

    const { error } = await supabase
      .from('whatsapp_sessions')
      .upsert({
        id: SESSION_ID,
        session_data: sessionToSave, // Let Supabase handle JSON serialization
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    logger.debug('💾 Session saved to Supabase');
    return true;
  } catch (error) {
    logger.error('❌ Failed to save session to Supabase:', error);
    await clearSession(); // Clear potentially corrupted session
    return false;
  }
}

async function clearSession() {
  if (!supabase) return false;
  
  try {
    const { error } = await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('id', SESSION_ID);
      
    if (error) throw error;
    logger.info('🧹 Cleared session from Supabase');
    return true;
  } catch (error) {
    logger.error('❌ Failed to clear session from Supabase:', error);
    return false;
  }
}

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

    // Initialize session manager
    let sessionManager;
    let sessionData = await loadSession();
    
    if (sessionData) {
      // Use session from Supabase
      sessionManager = {
        state: sessionData,
        saveCreds: async () => {
          await saveSession(sessionData);
        },
      };
      logger.info('✅ Using Supabase session');
    }

    // Fall back to file-based auth if Supabase fails or no session found
    if (!sessionManager) {
      logger.info('📁 Using file-based auth state...');
      const fileAuth = await useMultiFileAuthState('auth_info_baileys');
      
      // Save the initial state to Supabase
      await saveSession(fileAuth.state);
      
      sessionManager = {
        state: fileAuth.state,
        saveCreds: async () => {
          await fileAuth.saveCreds();
          await saveSession(fileAuth.state);
        },
      };
    }

    const { state, saveCreds } = sessionManager;

    // Generate a unique browser ID for this session
    const browserId = `JARVIS-${Math.random().toString(36).substring(2, 8)}`

    // Ensure we have a valid auth state
    if (!state.creds || !state.keys) {
      logger.warn('⚠️ Invalid auth state, clearing and retrying...');
      await clearSession();
      // Force reauthentication with a small delay
      setTimeout(startWhatsAppBot, 2000);
      return;
    }

    console.log('🔑 Authentication state:', {
      clientId: state.creds?.me?.id?.substring(0, 8) + '...',
      isRegistered: state.creds.registered,
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
      const userId = `whatsapp_${remoteJid.replace('@s.whatsapp.net', '')}`

      console.log(
        `📱 Message from ${senderName} (${remoteJid}): ${messageText}`
      )

      try {
        // Check if this is a name response
        if (
          userNameTracking.has(userId) &&
          userNameTracking.get(userId).waitingForName
        ) {
          const providedName = messageText.trim()
          userNameTracking.set(userId, { waitingForName: false, providedName })

          // Check if name matches any crush
          const matchedCrush = crushNames.find(
            name => name.toLowerCase() === providedName.toLowerCase()
          )

          if (matchedCrush) {
            const profile = crushProfiles[matchedCrush]
            const mysteriousResponse = profile.response
            await sock.sendMessage(remoteJid, { text: mysteriousResponse })

            // Wait a moment then send follow-up with humor
            setTimeout(async () => {
              const followUp = profile.followUp
              await sock.sendMessage(remoteJid, { text: followUp })

              // Add a funny comment
              setTimeout(async () => {
                const funnyComment =
                  "Btw, I'm not supposed to gossip, but he's totally into you! 😏🤫"
                await sock.sendMessage(remoteJid, { text: funnyComment })
              }, 2000)
            }, 2000)

            // Extra special treatment for Owoyemi - send additional romantic messages
            if (matchedCrush === 'Owoyemi') {
              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse1,
                })
              }, 8000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse2,
                })
              }, 12000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse3,
                })
              }, 16000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse4,
                })
              }, 20000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse5,
                })
              }, 24000)
            }

            // Extra special treatment for Islamiyat - send additional romantic messages
            if (matchedCrush === 'Islamiyat') {
              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse1,
                })
              }, 8000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse2,
                })
              }, 12000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse3,
                })
              }, 16000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse4,
                })
              }, 20000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse5,
                })
              }, 24000)
            }

            // Extra special treatment for Islamiya - send additional romantic messages
            if (matchedCrush === 'Islamiya') {
              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse1,
                })
              }, 8000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse2,
                })
              }, 12000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse3,
                })
              }, 16000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse4,
                })
              }, 20000)

              setTimeout(async () => {
                await sock.sendMessage(remoteJid, {
                  text: profile.extraResponse5,
                })
              }, 24000)
            }

            // Don't return here - let it continue to normal AI processing
          } else {
            // Fun response for other names
            const randomResponse =
              funNameResponses[
                Math.floor(Math.random() * funNameResponses.length)
              ]
            const personalizedResponse = randomResponse.replace(
              '{name}',
              providedName
            )
            await sock.sendMessage(remoteJid, { text: personalizedResponse })
          }
        }

        // Check if this is a greeting that should trigger name asking
        const isGreeting =
          /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(
            messageText.toLowerCase()
          )

        if (isGreeting && !userNameTracking.has(userId)) {
          // First time greeting - ask for name with human-like response
          userNameTracking.set(userId, {
            waitingForName: true,
            providedName: null,
          })

          // Pick a random human greeting
          const randomGreeting =
            humanGreetings[Math.floor(Math.random() * humanGreetings.length)]
          await sock.sendMessage(remoteJid, { text: randomGreeting })
          return // Return here since we're asking for name
        }

        // Handle follow-up questions about "he" - but don't block normal AI
        if (
          messageText.toLowerCase().includes('who') ||
          messageText.toLowerCase().includes('what') ||
          messageText.toLowerCase().includes('he')
        ) {
          const crushInfo = userNameTracking.get(userId)
          if (crushInfo && crushInfo.providedName) {
            const matchedCrush = crushNames.find(
              name =>
                name.toLowerCase() === crushInfo.providedName.toLowerCase()
            )

            if (matchedCrush) {
              const profile = crushProfiles[matchedCrush]
              const sweetResponse = profile.sweetDetails
              await sock.sendMessage(remoteJid, { text: sweetResponse })

              // Add more sweet details with humor
              setTimeout(async () => {
                const moreDetails = profile.moreDetails
                await sock.sendMessage(remoteJid, { text: moreDetails })

                // Add a funny ending
                setTimeout(async () => {
                  const funnyEnding =
                    "Honestly, I've never seen him this smitten before. It's actually kind of adorable! 😄💕"
                  await sock.sendMessage(remoteJid, { text: funnyEnding })
                }, 2000)
              }, 3000)

              // Extra special responses for Owoyemi
              if (matchedCrush === 'Owoyemi') {
                setTimeout(async () => {
                  const extraSweet =
                    "He told me you're the kind of person who makes him believe in love at first sight, even though he's too shy to admit it! 🌹"
                  await sock.sendMessage(remoteJid, { text: extraSweet })
                }, 8000)

                setTimeout(async () => {
                  const extraRomantic =
                    "He says you're not just his crush, you're his inspiration, his motivation, and his biggest dream. You're everything he's ever wanted! 💫"
                  await sock.sendMessage(remoteJid, { text: extraRomantic })
                }, 12000)
              }

              // Extra special responses for Islamiyat
              if (matchedCrush === 'Islamiyat') {
                setTimeout(async () => {
                  const extraSweet =
                    "He told me you're the kind of person who makes him believe in soulmates. That some connections are just meant to be! ✨"
                  await sock.sendMessage(remoteJid, { text: extraSweet })
                }, 8000)

                setTimeout(async () => {
                  const extraRomantic =
                    "He says you're not just his crush, you're his intellectual equal, his creative partner, and his true love. You're his perfect match! 💫"
                  await sock.sendMessage(remoteJid, { text: extraRomantic })
                }, 12000)
              }

              // Extra special responses for Islamiya
              if (matchedCrush === 'Islamiya') {
                setTimeout(async () => {
                  const extraSweet =
                    "He told me you're the kind of person who makes him believe in miracles. That love like yours only happens once in a lifetime! 🌟"
                  await sock.sendMessage(remoteJid, { text: extraSweet })
                }, 8000)

                setTimeout(async () => {
                  const extraRomantic =
                    "He says you're not just his crush, you're his strength, his hope, and his destiny. You're the person he was meant to find! 💫"
                  await sock.sendMessage(remoteJid, { text: extraRomantic })
                }, 12000)
              }

              // Don't return here - let it continue to normal AI processing
            }
          }
        }

        // Special question handling for Owoyemi - but don't block normal AI
        const crushInfo = userNameTracking.get(userId)
        if (crushInfo && crushInfo.providedName) {
          const matchedCrush = crushNames.find(
            name => name.toLowerCase() === crushInfo.providedName.toLowerCase()
          )

          if (matchedCrush === 'Owoyemi') {
            const lowerText = messageText.toLowerCase()

            // Handle specific questions she might ask
            if (
              lowerText.includes('who is he') ||
              lowerText.includes("who's he")
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.whoIsHe })
              return // Return here since this is a specific crush question
            }

            if (
              lowerText.includes('what did he say') ||
              lowerText.includes('what did he tell you')
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.whatDidHeSay })
              return // Return here since this is a specific crush question
            }

            if (
              lowerText.includes('is he cute') ||
              lowerText.includes('is he handsome')
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.isHeCute })
              return // Return here since this is a specific crush question
            }

            if (
              lowerText.includes('does he like me') ||
              lowerText.includes('does he like me') ||
              lowerText.includes('does he have feelings')
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.doesHeLikeMe })
              return // Return here since this is a specific crush question
            }
          }

          // Special question handling for Islamiyat
          if (matchedCrush === 'Islamiyat') {
            const lowerText = messageText.toLowerCase()

            // Handle specific questions she might ask
            if (
              lowerText.includes('who is he') ||
              lowerText.includes("who's he")
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.whoIsHe })
              return // Return here since this is a specific crush question
            }

            if (
              lowerText.includes('what did he say') ||
              lowerText.includes('what did he tell you')
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.whatDidHeSay })
              return // Return here since this is a specific crush question
            }

            if (
              lowerText.includes('is he cute') ||
              lowerText.includes('is he handsome')
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.isHeCute })
              return // Return here since this is a specific crush question
            }

            if (
              lowerText.includes('does he like me') ||
              lowerText.includes('does he have feelings')
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.doesHeLikeMe })
              return // Return here since this is a specific crush question
            }
          }

          // Special question handling for Islamiya
          if (matchedCrush === 'Islamiya') {
            const lowerText = messageText.toLowerCase()

            // Handle specific questions she might ask
            if (
              lowerText.includes('who is he') ||
              lowerText.includes("who's he")
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.whoIsHe })
              return // Return here since this is a specific crush question
            }

            if (
              lowerText.includes('what did he say') ||
              lowerText.includes('what did he tell you')
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.whatDidHeSay })
              return // Return here since this is a specific crush question
            }

            if (
              lowerText.includes('is he cute') ||
              lowerText.includes('is he handsome')
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.isHeCute })
              return // Return here since this is a specific crush question
            }

            if (
              lowerText.includes('does he like me') ||
              lowerText.includes('does he have feelings')
            ) {
              const profile = crushProfiles[matchedCrush]
              await sock.sendMessage(remoteJid, { text: profile.doesHeLikeMe })
              return // Return here since this is a specific crush question
            }
          }
        }

        // Generate response using JARVIS (this will always run unless specifically blocked)
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