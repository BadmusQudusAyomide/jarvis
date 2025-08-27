-- Create embeddings table
CREATE TABLE IF NOT EXISTS public.embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embeddings have 1536 dimensions
    type TEXT NOT NULL CHECK (type IN ('message', 'context')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Create index for faster similarity search
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON public.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;
