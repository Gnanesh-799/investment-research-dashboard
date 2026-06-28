import fs from 'fs';
import path from 'path';

function readLocalEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const parts = trimmed.split('=');
          const key = parts[0]?.trim();
          const val = parts.slice(1).join('=').trim();
          if (key) {
            env[key] = val;
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to read .env dynamically:', error);
  }
  return env;
}

const localEnv = readLocalEnv();

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || localEnv.OPENAI_API_KEY || '';
export const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || localEnv.ALPHA_VANTAGE_API_KEY || '';
export const TAVILY_API_KEY = process.env.TAVILY_API_KEY || localEnv.TAVILY_API_KEY || '';
export const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY || localEnv.SERPAPI_API_KEY || '';

export function assertEnv(key: string, value: string) {
  if (!value || value.length === 0) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}
