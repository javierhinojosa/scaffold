#!/usr/bin/env node

import axios from 'axios';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

dotenv.config();

// Configure marked to use terminal renderer
marked.setOptions({
  renderer: new TerminalRenderer(),
});

// Initialize Postgres connection
const pool = new Pool({
  host: 'localhost',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
});

// Ollama API URL (running locally)
const OLLAMA_API_URL = 'http://localhost:11434/api/embeddings';

// Add new Ollama endpoint for chat
const OLLAMA_CHAT_URL = 'http://localhost:11434/api/chat';

/**
 * Generates an embedding for a given text using local Ollama LLM
 * @param {string} text - The text content to generate an embedding for
 * @returns {Promise<number[]>} - The embedding vector
 */
async function generateEmbedding(text) {
  try {
    const response = await axios.post(
      OLLAMA_API_URL,
      {
        model: 'nomic-embed-text',
        prompt: text,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const embedding = response.data.embedding;
    if (!Array.isArray(embedding)) {
      throw new Error('Invalid embedding format received');
    }

    return embedding.map((num) => parseFloat(num.toFixed(6)));
  } catch (error) {
    console.error(chalk.red('Error generating embedding:'), error.message);
    return null;
  }
}

/**
 * Finds similar documents based on content
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of similar documents
 */
async function findSimilarDocuments(query, limit = 5) {
  const client = await pool.connect();
  try {
    const embedding = await generateEmbedding(query);
    if (!embedding) {
      throw new Error('Failed to generate embedding for query');
    }

    const vectorStr = `[${embedding.join(',')}]`;
    const result = await client.query(
      `SELECT content, path, full_content, 1 - (embedding <=> $1::vector) as similarity
       FROM documents
       WHERE 1 - (embedding <=> $1::vector) > 0.4
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorStr, limit]
    );

    return result.rows;
  } catch (err) {
    console.error(chalk.red('Error finding similar documents:'), err.message);
    return [];
  } finally {
    client.release();
  }
}

/**
 * Formats the document path for display
 * @param {string} path - The document path
 * @returns {string} - Formatted path
 */
function formatPath(path) {
  // Remove the chunk identifier if present
  const basePath = path.split('#')[0];
  // Convert /dev/tools/vector-search to Development > Tools > Vector Search
  return basePath
    .split('/')
    .filter(Boolean)
    .map((part) =>
      part
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' > ');
}

/**
 * Extracts a relevant snippet around the matching content
 * @param {string} content - The full content
 * @param {string} matchingContent - The matching chunk
 * @returns {string} - A snippet with context
 */
function extractSnippet(content, matchingContent) {
  const snippetLength = 300;
  const index = content.indexOf(matchingContent);

  if (index === -1) return matchingContent;

  const start = Math.max(0, index - snippetLength / 2);
  const end = Math.min(content.length, index + matchingContent.length + snippetLength / 2);

  let snippet = content.slice(start, end);

  // Add ellipsis if we're not at the start/end
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Generates a summary from multiple document matches
 * @param {Array} documents - Array of matching documents
 * @param {string} query - The original query
 * @returns {Promise<string>} - Generated summary
 */
async function generateSummary(documents, query) {
  try {
    // Prepare context from documents
    const context = documents
      .map((doc) => {
        const location = formatPath(doc.path);
        return `From ${location}:\n${doc.content}`;
      })
      .join('\n\n');

    // Create prompt for summary
    const prompt = `You are a technical documentation assistant. Based on the following documentation excerpts, provide a clear and concise answer to this question: "${query}"

Documentation sections:
${context}

Provide a well-structured answer that:
1. Directly addresses the question
2. Includes specific technical details and code examples when available
3. References the relevant documentation sections

Answer:`;

    const response = await axios.post(
      OLLAMA_CHAT_URL,
      {
        model: 'llama2',
        messages: [
          {
            role: 'system',
            content:
              'You are a technical documentation assistant that provides clear, accurate, and concise answers based on the provided documentation.',
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.message.content;
  } catch (error) {
    console.error(chalk.red('Error generating summary:'), error.message);
    if (error.response) {
      console.error(chalk.red('Response data:'), error.response.data);
    }
    return "I found relevant documentation sections (shown below), but couldn't generate a summary. Please review the matching sections for your answer.";
  }
}

/**
 * Main CLI interface
 */
async function main() {
  console.log(chalk.blue.bold('\n📚 Documentation Search CLI\n'));

  while (true) {
    const { query } = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: 'What would you like to know about? (or type "exit" to quit)',
        validate: (input) => input.trim().length > 0 || 'Please enter a query',
      },
    ]);

    if (query.toLowerCase() === 'exit') {
      console.log(chalk.blue('\nThank you for using the Documentation Search CLI! 👋\n'));
      break;
    }

    console.log(chalk.dim('\nSearching documentation...\n'));

    const results = await findSimilarDocuments(query);

    if (results.length === 0) {
      console.log(chalk.yellow('No relevant documentation found for your query.\n'));
      continue;
    }

    // Generate and display summary
    console.log(chalk.blue.bold('📝 Summary:'));
    const summary = await generateSummary(results, query);
    if (summary) {
      console.log('\n' + marked(summary) + '\n');
    }

    // Display detailed matches
    console.log(chalk.blue.bold('🔍 Matching Sections:'));
    for (const [index, doc] of results.entries()) {
      const similarity = (doc.similarity * 100).toFixed(1);
      const location = formatPath(doc.path);

      console.log(chalk.green.bold(`\nMatch ${index + 1} (${similarity}% relevant)`));
      console.log(chalk.blue(`📍 Location: ${location}\n`));

      const snippet = extractSnippet(doc.full_content, doc.content);
      console.log(marked(snippet));

      console.log(chalk.dim('─'.repeat(process.stdout.columns || 80)));
    }

    console.log(); // Empty line for readability
  }

  await pool.end();
}

main().catch((error) => {
  console.error(chalk.red('Error:', error.message));
  process.exit(1);
});
