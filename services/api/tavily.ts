const TAVILY_BASE = 'https://api.tavily.com/v1';

export async function fetchCompanyNews(query: string, apiKey: string) {
  const url = `${TAVILY_BASE}/news/search?query=${encodeURIComponent(query)}&limit=5`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Tavily news fetch failed.');
  }

  const json = await response.json();
  return json.articles || [];
}
