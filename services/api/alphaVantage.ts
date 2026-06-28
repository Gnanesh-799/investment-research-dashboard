const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

export async function fetchEarningsOverview(symbol: string, apiKey: string) {
  const url = `${ALPHA_VANTAGE_BASE}?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Alpha Vantage overview fetch failed.');
  }
  const json = await response.json();
  return {
    revenue: json.RevenueTTM || 'Unknown',
    netIncome: json.NetIncomeTTM || 'Unknown',
    eps: json.EPS || 'Unknown',
    peRatio: json.PERatio || 'Unknown',
    debt: json.TotalDebt || 'Unknown',
    cash: json.CashAndShortTermInvestments || 'Unknown',
    profitMargin: json.ProfitMargin || 'Unknown',
    roe: json.ReturnOnEquityTTM || 'Unknown',
    revenueGrowth: json.RevenuePerShareTTM || 'Unknown',
    marketCap: json.MarketCapitalization || null,
  };
}

export async function fetchSymbolSearch(keywords: string, apiKey: string) {
  const url = `${ALPHA_VANTAGE_BASE}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Alpha Vantage symbol search failed.');
  }
  const json = await response.json();
  return json.bestMatches || [];
}
