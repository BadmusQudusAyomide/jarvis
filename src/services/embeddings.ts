import { getSupabase } from '../lib/supabaseClient'
const supabase = getSupabase()
import { llmService } from './llm'

// Interface for the embedding record in the database
interface EmbeddingRecord {
  id?: string
  text: string
  embedding?: number[]
  type: 'message' | 'context'
  created_at?: string
  metadata?: Record<string, any>
}

class EmbeddingService {
  private cache = new Map<string, number[]>()
  private maxCacheSize = 100

  async upsertEmbedding(text: string, type: 'message' | 'context'): Promise<void> {
    try {
      if (!text?.trim()) return

      // Check if we already have this exact text in cache
      if (this.cache.has(text)) {
        return
      }

      // Generate embedding using the LLM service
      const embedding = await llmService.generateEmbedding(text)
      
      // Add to cache
      if (this.cache.size >= this.maxCacheSize) {
        // Remove oldest entry if cache is full
        const firstKey = Array.from(this.cache.keys())[0]
        if (firstKey) {
          this.cache.delete(firstKey)
        }
      }
      this.cache.set(text, embedding)

      // Temporarily disable Supabase embedding storage due to schema mismatch
      // TODO: Fix embeddings table schema and re-enable
      console.log('Embedding generated and cached (Supabase storage disabled)')
    } catch (error) {
      console.error('Error in upsertEmbedding:', error)
      // Don't throw, as we want to continue even if embedding fails
    }
  }

  async searchSimilar(query: string, limit = 5): Promise<string[]> {
    try {
      if (!supabase) return []
      if (!query?.trim()) return []

      // Get embedding for the query
      const queryEmbedding = await llmService.generateEmbedding(query)
      if (!queryEmbedding?.length) return []
      
      // First try vector search if the function exists
      try {
        const { data: vectorResults, error: vectorError } = await supabase.rpc('match_embeddings', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: limit
        })

        if (!vectorError && vectorResults?.length) {
          return vectorResults
            .filter((item: any) => item?.text)
            .map((item: any) => item.text)
        }
      } catch (e) {
        console.warn('Vector search failed, falling back to text search:', e)
      }

      // Fallback to text search if vector search fails or returns no results
      try {
        const { data: textResults, error: textError } = await supabase
          .from('embeddings')
          .select('text')
          .textSearch('text', query.split(' ').join(' | '))
          .limit(limit)

        if (!textError && textResults?.length) {
          return textResults
            .filter((item: any) => item?.text)
            .map((item: any) => item.text)
        }
      } catch (textError) {
        console.error('Text search failed:', textError)
      }

      return []
    } catch (error) {
      console.error('Error in searchSimilar:', error)
      return []
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const embeddingService = new EmbeddingService()

// Legacy export for backward compatibility
export async function upsertEmbedding(text: string, type: 'message' | 'context') {
  return embeddingService.upsertEmbedding(text, type)
}
