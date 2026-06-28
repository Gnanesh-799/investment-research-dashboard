const SERPAPI_BASE = 'https://serpapi.com/search.json';

export async function fetchSearchNews(query: string, apiKey: string) {
  const url = `${SERPAPI_BASE}?q=${encodeURIComponent(query)}&tbm=nws&num=5&api_key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('SerpAPI news fetch failed.');
  }
  const json = await response.json();
  return json.news_results || [];
}

export async function fetchSearchGeneral(query: string, apiKey: string) {
  const url = `${SERPAPI_BASE}?q=${encodeURIComponent(query)}&num=5&api_key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('SerpAPI general search failed.');
  }
  return response.json();
}
