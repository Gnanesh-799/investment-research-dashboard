export async function fetchYahooQuote(symbol: string) {
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Yahoo Finance quote fetch failed.');
  }
  const json = await response.json();
  const quote = json.quoteResponse?.result?.[0];
  if (!quote) {
    throw new Error('No Yahoo Finance quote data found.');
  }
  return quote;
}

export async function fetchYahooCompanyProfile(symbol: string) {
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile%2Cprice%2CsummaryProfile%2CfinancialData%2CdefaultKeyStatistics`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Yahoo Finance profile fetch failed.');
    }
    const json = await response.json();
    const result = json.quoteSummary?.result?.[0];
    if (!result) {
      throw new Error('No Yahoo Finance profile data found.');
    }

    const profile = result.assetProfile || {};
    const price = result.price || {};
    return {
      name: price.longName || price.shortName || symbol,
      industry: profile.industry || 'Unknown',
      ceo: profile.ceo || 'Unknown',
      headquarters: [profile.city, profile.state, profile.country].filter(Boolean).join(', ') || 'Unknown',
      employees: profile.fullTimeEmployees ? String(profile.fullTimeEmployees) : 'Unknown',
      ipoDate: profile.ipoDate || 'Unknown',
      marketCap: price.marketCap?.fmt || null,
    };
  } catch (error) {
    console.warn('fetchYahooCompanyProfile quoteSummary failed, falling back to quote v7:', error);
    const quote = await fetchYahooQuote(symbol);
    
    const rawMarketCap = quote.marketCap;
    let formattedMarketCap = 'Unknown';
    if (typeof rawMarketCap === 'number' && !isNaN(rawMarketCap)) {
      if (rawMarketCap >= 1e12) {
        formattedMarketCap = `$${(rawMarketCap / 1e12).toFixed(2)}T`;
      } else if (rawMarketCap >= 1e9) {
        formattedMarketCap = `$${(rawMarketCap / 1e9).toFixed(2)}B`;
      } else if (rawMarketCap >= 1e6) {
        formattedMarketCap = `$${(rawMarketCap / 1e6).toFixed(2)}M`;
      } else {
        formattedMarketCap = `$${rawMarketCap.toLocaleString()}`;
      }
    }

    return {
      name: quote.longName || quote.shortName || symbol,
      industry: 'Unknown',
      ceo: 'Unknown',
      headquarters: 'Unknown',
      employees: 'Unknown',
      ipoDate: 'Unknown',
      marketCap: formattedMarketCap,
    };
  }
}

export async function fetchYahooFinancials(symbol: string) {
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=financialData%2CdefaultKeyStatistics%2Cprice`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Yahoo Finance metrics fetch failed.');
    }
    const json = await response.json();
    const result = json.quoteSummary?.result?.[0];
    if (!result) {
      throw new Error('No Yahoo Finance metrics data found.');
    }

    const financialData = result.financialData || {};
    const statistics = result.defaultKeyStatistics || {};
    const price = result.price || {};

    return {
      revenue: statistics.revenue?.fmt || 'Unknown',
      netIncome: statistics.netIncomeToCommon?.fmt || 'Unknown',
      eps: financialData.currentEps?.fmt || 'Unknown',
      peRatio: financialData.trailingPE?.fmt || 'Unknown',
      debt: financialData.totalDebt?.fmt || 'Unknown',
      cash: financialData.totalCash?.fmt || 'Unknown',
      profitMargin: financialData.profitMargins?.fmt || 'Unknown',
      roe: financialData.returnOnEquity?.fmt || 'Unknown',
      revenueGrowth: financialData.revenueGrowth?.fmt || 'Unknown',
    };
  } catch (error) {
    console.warn('fetchYahooFinancials quoteSummary failed, falling back to quote v7:', error);
    const quote = await fetchYahooQuote(symbol);

    return {
      revenue: 'Unknown',
      netIncome: 'Unknown',
      eps: quote.epsTrailingTwelveMonths != null ? String(quote.epsTrailingTwelveMonths) : 'Unknown',
      peRatio: quote.trailingPE != null ? String(quote.trailingPE) : 'Unknown',
      debt: 'Unknown',
      cash: 'Unknown',
      profitMargin: 'Unknown',
      roe: 'Unknown',
      revenueGrowth: 'Unknown',
    };
  }
}
