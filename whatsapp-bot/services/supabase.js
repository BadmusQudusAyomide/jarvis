// Supabase client for WhatsApp bot - mirrors the web app functionality
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Use environment variables with fallback to VITE_ prefixed ones for compatibility
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Create a singleton Supabase client
let supabase = null

const initializeSupabase = () => {
  if (!supabase && supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false, // We'll handle session persistence manually
        },
      })
      console.log('✅ Supabase connected for WhatsApp bot')
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error.message)
    }
  } else if (!supabase) {
    console.error('❌ Supabase not configured - missing URL or key')
  }
  return supabase
}

// Initialize immediately
initializeSupabase()

// Save message to Supabase (same as web app)
export async function saveMessage(role, text, userId = 'whatsapp_user') {
  if (!supabase) return false
  
  try {
    console.log('💾 Saving message to Supabase:', text.substring(0, 50) + '...')
    
    const { error } = await supabase
      .from('messages')
      .insert([
        {
          role: role,
          text: text,
          user_id: userId,
          created_at: new Date().toISOString()
        }
      ])

    if (error) {
      console.error('💾 Supabase save error:', error)
      return false
    }
    
    console.log('💾 Message saved successfully')
    return true
  } catch (error) {
    console.error('💾 Supabase save error:', error)
    return false
  }
}

// Semantic search for memories (same as web app)
export async function semanticRecall(query, limit = 8) {
  if (!supabase) return []
  
  try {
    console.log('🔍 Searching memories for:', query)
    
    // Simple text search for now (can be enhanced with embeddings later)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .textSearch('text', query)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('🔍 Memory search error:', error)
      return []
    }

    console.log(`🔍 Found ${data?.length || 0} memories`)
    return data || []
  } catch (error) {
    console.error('🔍 Memory search error:', error)
    return []
  }
}

// Check if query is asking for remembered information
export function isMemoryQuery(text) {
  const memoryKeywords = [
    'my birthday', 'when was i born', 'my name', 'who am i',
    'my favorite', 'what do i like', 'remember', 'told you',
    'my age', 'how old', 'what did i say', 'mentioned'
  ]
  
  const lower = text.toLowerCase()
  return memoryKeywords.some(keyword => lower.includes(keyword))
}

export { supabase }
