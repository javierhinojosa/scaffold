import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

dotenv.config();

// Initialize Supabase client with proper configuration
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

// Ollama API URL (running locally)
const OLLAMA_API_URL = 'http://localhost:11434/api/embeddings';

/**
 * Clean MDX content by removing frontmatter and normalizing whitespace
 * @param {string} content - Raw MDX content
 * @returns {string} - Cleaned content
 */
function cleanMdxContent(content) {
  // Remove frontmatter
  const cleanContent = content.replace(/^---[\s\S]*?---/, '').trim();

  // Remove markdown headers
  const noHeaders = cleanContent.replace(/#{1,6}\s+/g, '');

  // Normalize whitespace
  return noHeaders.replace(/\s+/g, ' ').trim();
}

/**
 * Split content into chunks of roughly equal size
 * @param {string} content - Content to split
 * @param {number} maxChunkSize - Maximum chunk size in characters
 * @returns {Array<string>} - Array of content chunks
 */
function splitIntoChunks(content, maxChunkSize = 1000) {
  const chunks = [];
  const sentences = content.split(/[.!?]+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += sentence + '. ';
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Recursively finds all MDX files in a directory
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} - Array of file paths
 */
async function findMdxFiles(dir) {
  const files = await fs.readdir(dir);
  const mdxFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      const nestedFiles = await findMdxFiles(filePath);
      mdxFiles.push(...nestedFiles);
    } else if (file.endsWith('.mdx')) {
      mdxFiles.push(filePath);
    }
  }

  return mdxFiles;
}

/**
 * Processes an MDX file and stores its content with embeddings
 * @param {string} filePath - Path to the MDX file
 */
async function processMdxFile(filePath) {
  try {
    console.log('Processing file:', filePath);
    const content = await fs.readFile(filePath, 'utf-8');

    // Clean and chunk the content
    const cleanContent = cleanMdxContent(content);
    const chunks = splitIntoChunks(cleanContent);

    // Extract relative path from the docs directory
    const docsDir = 'apps/docs/src/content/docs';
    const relativePath = filePath.substring(filePath.indexOf(docsDir) + docsDir.length);

    // Store each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkPath = chunks.length > 1 ? `${relativePath}#chunk${i + 1}` : relativePath;
      await storeDocument(chunks[i], chunkPath, content);
    }
  } catch (error) {
    console.error('Error processing file:', filePath, error);
  }
}

/**
 * Generates an embedding for a given text using local Ollama LLM
 * @param {string} text - The text content to generate an embedding for
 * @returns {Promise<number[]>} - The embedding vector
 */
async function generateEmbedding(text) {
  try {
    console.log('Generating embedding for document...');

    const response = await axios.post(
      OLLAMA_API_URL,
      {
        model: 'nomic-embed-text', // Specific model for embeddings
        prompt: text,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Ensure the embedding is an array of numbers with proper precision
    const embedding = response.data.embedding;
    if (!Array.isArray(embedding)) {
      throw new Error('Invalid embedding format received');
    }

    // Format numbers to ensure consistent precision
    const formattedEmbedding = embedding.map((num) => parseFloat(num.toFixed(6)));
    console.log('Embedding dimension:', formattedEmbedding.length);

    return formattedEmbedding;
  } catch (error) {
    console.error('Error fetching embedding from Ollama:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Checks if the documents table exists with correct schema
 */
async function checkSchema() {
  try {
    console.log('Setting up database schema...');

    // Create vector extension
    const { error: extensionError } = await supabase
      .from('_extensions')
      .select('*')
      .eq('name', 'vector')
      .maybeSingle();

    if (extensionError) {
      console.warn('Vector extension check:', extensionError.message);
    }

    // Drop and recreate the documents table
    const { error: tableError } = await supabase.from('documents').delete().neq('id', 0); // Delete all records

    if (tableError && tableError.code !== '42P01') {
      // Ignore if table doesn't exist
      console.warn('Dropping documents:', tableError.message);
    }

    // Create table with new schema using raw SQL
    const createTableSQL = `
      create table if not exists documents (
        id bigint primary key generated always as identity,
        content text,
        path text,
        full_content text,
        embedding vector(768),
        created_at timestamp with time zone default timezone('utc'::text, now())
      );

      create index if not exists documents_embedding_idx 
      on documents 
      using ivfflat (embedding vector_cosine_ops)
      with (lists = 100);
    `;

    const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });

    if (createError) {
      throw createError;
    }

    console.log('Table created with new schema');
  } catch (err) {
    console.error('Error setting up schema:', err);
    process.exit(1);
  }
}

/**
 * Stores a document with its embedding into the database
 * @param {string} content - The content chunk to store
 * @param {string} path - The relative path of the document
 * @param {string} fullContent - The complete document content
 */
async function storeDocument(content, path, fullContent) {
  try {
    const embedding = await generateEmbedding(content);
    if (!embedding) {
      console.error('Failed to generate embedding.');
      return;
    }

    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          content,
          path,
          full_content: fullContent,
          embedding,
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    console.log('Successfully stored document:', path, 'with ID:', data.id);
  } catch (err) {
    console.error('Error:', err);
  }
}

/**
 * Finds similar documents based on content
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of similar documents
 */
async function findSimilarDocuments(query, limit = 5) {
  try {
    const embedding = await generateEmbedding(query);
    if (!embedding) {
      throw new Error('Failed to generate embedding for query');
    }

    const { data, error } = await supabase
      .from('documents')
      .select('id, content, path, full_content')
      .order('embedding <=> $1::vector', { ascending: true })
      .limit(limit)
      .filter('1 - (embedding <=> $1::vector)', 'gt', 0.4);

    if (error) throw error;
    return data.map((doc) => ({
      ...doc,
      similarity: 1 - (doc.embedding ? doc.embedding.distance(embedding) : 0),
    }));
  } catch (err) {
    console.error('Error finding similar documents:', err);
    return [];
  }
}

// First check schema, then process all MDX files
async function main() {
  try {
    await checkSchema();

    const docsDir = path.join(process.cwd(), 'apps/docs/src/content/docs');
    console.log('Searching for MDX files in:', docsDir);

    const mdxFiles = await findMdxFiles(docsDir);
    console.log(`Found ${mdxFiles.length} MDX files`);

    for (const file of mdxFiles) {
      await processMdxFile(file);
    }

    // Test similarity search with specific queries
    console.log('\nTesting similarity search:');
    const queries = [
      'How do I set up authentication?',
      'What is CrewAI and how do I use it?',
      'How to deploy the application?',
    ];

    for (const query of queries) {
      console.log(`\nQuery: "${query}"`);
      const similarDocs = await findSimilarDocuments(query, 3);
      console.log('Matching documents:');
      for (const doc of similarDocs) {
        console.log(`- ${doc.path} (similarity: ${(doc.similarity * 100).toFixed(1)}%)`);
        console.log(`  Relevant excerpt: ${doc.content.substring(0, 200)}...`);
      }
    }
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

main();
