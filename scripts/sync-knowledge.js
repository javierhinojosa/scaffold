import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import strip from "strip-markdown";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const ASTRO_DOCS_DIR = path.resolve(process.env.ASTRO_DOCS_DIR);
const KNOWLEDGE_BASE_ID = process.env.DIFY_KNOWLEDGE_BASE_ID;
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_BASE_URL;

async function processMarkdown(filePath) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(rawContent);
  const processedContent = await remark().use(strip).process(content);
  return processedContent.toString();
}

async function uploadKnowledge(text, fileName) {
  const response = await fetch(
    `${DIFY_API_URL}/v1/knowledge-bases/${KNOWLEDGE_BASE_ID}/documents`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: [
          {
            text,
            metadata: { source: fileName }
          }
        ]
      })
    }
  );
  const result = await response.json();
  if (!response.ok) {
    console.error(`Error uploading ${fileName}:`, result);
  } else {
    console.log(`Uploaded ${fileName} successfully.`);
  }
}

async function syncMarkdownFiles() {
  if (!fs.existsSync(ASTRO_DOCS_DIR)) {
    console.error("Error: Astro docs directory does not exist.");
    process.exit(1);
  }
  const files = fs.readdirSync(ASTRO_DOCS_DIR).filter(file => file.endsWith(".md"));
  if (files.length === 0) {
    console.log("No Markdown files found to process.");
    return;
  }
  console.log(`Found ${files.length} Markdown files. Processing and uploading...`);
  for (const file of files) {
    const filePath = path.join(ASTRO_DOCS_DIR, file);
    const text = await processMarkdown(filePath);
    await uploadKnowledge(text, file);
  }
  console.log("Knowledge sync completed.");
}

syncMarkdownFiles().catch(error => {
  console.error("An error occurred during the knowledge sync:", error);
});
