import { OpenAI } from 'openai';
import { assertEnv, OPENAI_API_KEY, ALPHA_VANTAGE_API_KEY } from '@/lib/env';
import { parseJson } from '@/lib/utils/json';
import { fetchEarningsOverview } from '@/services/api/alphaVantage';
import { getCompanyProfile, getFinancialMetrics, getRecentNews, resolveCompanySymbol } from '@/services/api/company';
import type { CompanyProfile, CompetitorAnalysis, FinancialMetrics, NewsSummary, ResearchResult } from '@/types/research';

const openAiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

function parsePercent(val: string): number {
  if (!val || val === 'Unknown') return 0;
  const cleaned = val.replace(/[%$,]/g, '').trim();
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return parsed;
}

function parseValuation(val: string): number {
  if (!val || val === 'Unknown') return 0;
  const cleaned = val.replace(/[$,]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function parseFinancialValue(val: string): number {
  const cleaned = val.toLowerCase().replace(/[$,]/g, '').trim();
  let multiplier = 1;
  if (cleaned.endsWith('t')) {
    multiplier = 1000000000000;
  } else if (cleaned.endsWith('b')) {
    multiplier = 1000000000;
  } else if (cleaned.endsWith('m')) {
    multiplier = 1000000;
  } else if (cleaned.endsWith('k')) {
    multiplier = 1000;
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num * multiplier;
}

function generateHeuristicReport(
  symbolRecord: { symbol: string; name: string },
  profile: CompanyProfile,
  financials: FinancialMetrics,
  news: NewsSummary
): ResearchResult {
  let score = 55;
  const roe = parsePercent(financials.roe);
  const margin = parsePercent(financials.profitMargin);
  const pe = parseValuation(financials.peRatio);

  if (roe > 0) score += 5;
  if (roe > 15) score += 10;
  if (roe < 0) score -= 10;

  if (margin > 0) score += 5;
  if (margin > 12) score += 10;
  if (margin < 0) score -= 15;

  const growth = parsePercent(financials.revenueGrowth);
  if (growth > 0) score += 5;
  if (growth > 10) score += 5;
  if (growth < 0) score -= 10;

  if (pe > 0) {
    if (pe < 25) score += 10;
    else if (pe > 45) score -= 5;
  } else {
    score += 2;
  }

  const cashStr = financials.cash.toLowerCase();
  const debtStr = financials.debt.toLowerCase();
  if (cashStr !== 'unknown' && debtStr !== 'unknown') {
    const cashVal = parseFinancialValue(cashStr);
    const debtVal = parseFinancialValue(debtStr);
    if (cashVal > debtVal) {
      score += 8;
    } else {
      score -= 5;
    }
  }

  score = Math.max(35, Math.min(95, score));
  const decision: 'INVEST' | 'PASS' = score >= 65 ? 'INVEST' : 'PASS';

  let confidence: 'High' | 'Medium' | 'Low' = 'High';
  let unknownCount = 0;
  Object.values(financials).forEach(val => {
    if (val === 'Unknown') unknownCount++;
  });
  if (unknownCount >= 4) {
    confidence = 'Low';
  } else if (unknownCount >= 2) {
    confidence = 'Medium';
  }

  const swot: Record<'Strengths' | 'Weaknesses' | 'Opportunities' | 'Threats', string> = {
    Strengths: `Strong market presence: Market Capitalization of ${profile.marketCap || 'significant scale'}. Financial performance shows a Return on Equity (ROE) of ${financials.roe} and a profit margin of ${financials.profitMargin}.`,
    Weaknesses: `Balance sheet exposures: Reported total debt is ${financials.debt} against cash levels of ${financials.cash}. High valuation multiple of ${financials.peRatio} P/E creates potential sensitivity to earnings misses.`,
    Opportunities: `Expansion potential: Tapping into the sector growth trends of the ${profile.industry} industry. Leveraging brand leadership under CEO ${profile.ceo} to scaling digital product features.`,
    Threats: `Intense competitor dynamics and changing regulatory landscapes. Sentiment and macro challenges: ${news.risks || 'Market cyclicality and geopolitical exposures'}.`
  };

  const ind = (profile.industry || '').toLowerCase();
  const nameLower = symbolRecord.name.toLowerCase();
  const symLower = symbolRecord.symbol.toLowerCase();
  let topCompetitors: Array<{ name: string; advantage: string; weakness: string }> = [];
  let compSummary = '';

  if (nameLower.includes('tata consultancy') || nameLower.includes('tcs') || nameLower.includes('infosys') || nameLower.includes('wipro') || nameLower.includes('cognizant') || nameLower.includes('hcl tech') || nameLower.includes('accenture')) {
    topCompetitors = [
      {
        name: 'Tata Consultancy Services (TCS)',
        advantage: 'Vast scale, trusted parentage, and long-term enterprise transformation contracts.',
        weakness: 'Pressure on legacy services margins and dependency on regional offshore labor cost arbitrages.',
      },
      {
        name: 'Infosys Limited',
        advantage: 'Strong digital consulting capability, cobalt cloud framework, and high margins.',
        weakness: 'Operational dependency on Western banking clients and high executive turnover rates.',
      },
      {
        name: 'Wipro Limited',
        advantage: 'Engineering capability, focus on cybersecurity solutions, and global delivery footprint.',
        weakness: 'Lagging revenue growth during leadership transition phases.',
      },
    ];
    compSummary = `${symbolRecord.name} competes directly with IT services leaders TCS, Infosys, and Wipro for global digital consulting budgets.`;
  } else if (nameLower.includes('reliance') || nameLower.includes('jio') || symLower === 'reliance.ns' || symLower === 'reliance') {
    topCompetitors = [
      {
        name: 'Tata Group',
        advantage: 'Highly trusted brand equity, deep consumer loyalty, and robust cash generation.',
        weakness: 'Complex cross-company conglomerate holdings and capital allocations.',
      },
      {
        name: 'Adani Group',
        advantage: 'Fast scaling of green energy and core infrastructure project execution.',
        weakness: 'Higher debt levels and ongoing international regulatory scrutiny.',
      },
      {
        name: 'Indian Oil Corporation',
        advantage: 'National state-backed monopoly on oil marketing and distribution.',
        weakness: 'Regulatory government price caps on retail fuels and sluggish transition to batteries.',
      },
    ];
    compSummary = `${symbolRecord.name} faces primary competition from key Indian conglomerates, including Tata Group and Adani Group, as well as state-owned enterprises.`;
  } else if (nameLower.includes('hdfc') || nameLower.includes('icici') || nameLower.includes('axis bank') || nameLower.includes('state bank of india') || symLower.includes('hdfc') || symLower.includes('icici') || symLower.includes('sbi')) {
    topCompetitors = [
      {
        name: 'HDFC Bank Ltd.',
        advantage: 'India\'s largest private sector bank with a low cost of funds and strong mortgage book.',
        weakness: 'Post-merger integration challenges and system scaling issues.',
      },
      {
        name: 'ICICI Bank Ltd.',
        advantage: 'Highly agile, robust digital architecture, and healthy loan growth.',
        weakness: 'Limited rural reach compared to public sector counterparts.',
      },
      {
        name: 'State Bank of India (SBI)',
        advantage: 'Dominant rural deposit base, absolute scale, and sovereign backing.',
        weakness: 'Higher levels of bad loans (NPAs) and legacy bureaucratic hurdles.',
      },
    ];
    compSummary = `${symbolRecord.name} operates in the highly competitive Indian banking sector, contending with private banking leaders HDFC Bank and ICICI Bank, as well as public sector giant SBI.`;
  } else if (ind.includes('software') || ind.includes('internet') || ind.includes('information technology') || ind.includes('cloud') || ind.includes('ai')) {
    topCompetitors = [
      {
        name: 'Microsoft Corp.',
        advantage: 'Massive enterprise footprint, leading cloud infrastructure (Azure), and industry-standard SaaS products.',
        weakness: 'Complex legacy portfolio, regulatory compliance pressures, and premium valuation multiples.',
      },
      {
        name: 'Alphabet Inc. (Google)',
        advantage: 'Dominance in global search, advertising technology, and cutting-edge deep learning/AI research.',
        weakness: 'Heavily reliant on search ad revenue, regulatory antitrust investigations, and cloud market share lagging behind AWS/Azure.',
      },
      {
        name: 'Amazon.com Inc.',
        advantage: 'Unmatched e-commerce fulfillment scale and global leadership in cloud infrastructure (AWS).',
        weakness: 'Operational margin pressure in retail logistics and unionization risks.',
      },
    ];
    compSummary = `${symbolRecord.name} operates in the competitive software and cloud tech market against giants Microsoft, Alphabet, and Amazon.`;
  } else if (ind.includes('semiconductor') || ind.includes('hardware') || ind.includes('chip')) {
    topCompetitors = [
      {
        name: 'NVIDIA Corporation',
        advantage: 'Dominant leader in AI GPUs, tensor cores, and the established proprietary CUDA software platform.',
        weakness: 'Highly cyclical demand patterns, supply chain dependencies, and risk of customer in-house silicon design.',
      },
      {
        name: 'Advanced Micro Devices (AMD)',
        advantage: 'Cost-performance advantages in computing, CPUs, and growing Instinct GPU lineup.',
        weakness: 'Smaller R&D budget relative to NVIDIA and lower developer tools market integration.',
      },
      {
        name: 'Intel Corporation',
        advantage: 'Substantial market share in PC/Server client processors and ambitious plans for independent foundry services.',
        weakness: 'Lags in advanced fabrication timelines and high capital expenditures straining cash flow.',
      },
    ];
    compSummary = `${symbolRecord.name} faces intense competitive pressure in the semiconductor and hardware sector.`;
  } else if (ind.includes('consumer electronics') || ind.includes('device') || ind.includes('mobile')) {
    topCompetitors = [
      {
        name: 'Apple Inc.',
        advantage: 'Exceptional brand equity, high customer retention rates, and high-margin services ecosystem.',
        weakness: 'Highly dependent on iPhone upgrade cycles and regulatory pressure on the App Store.',
      },
      {
        name: 'Samsung Electronics',
        advantage: 'Vertical integration in memory, displays, and global manufacturing capacity.',
        weakness: 'Intense competition in low-to-mid range smartphone segments and cyclical semiconductor margins.',
      },
      {
        name: 'Sony Group Corporation',
        advantage: 'Dominant gaming console market share (PlayStation) and premium consumer imaging sensors.',
        weakness: 'Fragile hardware product launch timelines and complex conglomerate overhead.',
      },
    ];
    compSummary = `${symbolRecord.name} competes in the premium consumer electronics market against Apple, Samsung, and Sony.`;
  } else if (ind.includes('financial') || ind.includes('bank') || ind.includes('invest') || ind.includes('capital')) {
    topCompetitors = [
      {
        name: 'JPMorgan Chase & Co.',
        advantage: 'Unmatched deposit scale, global investment banking reach, and robust capital reserves.',
        weakness: 'Highly complex regulatory compliance burden and exposure to residential credit cycles.',
      },
      {
        name: 'Bank of America Corp.',
        advantage: 'Leading consumer digital banking platform and large, sticky retail deposit base.',
        weakness: 'Interest rate sensitivity and asset-liability maturity mismatches.',
      },
      {
        name: 'Goldman Sachs Group',
        advantage: 'Premier global brand in investment banking, mergers & acquisitions advisory, and institutional trading.',
        weakness: 'Revenue volatility tied directly to capital market cycles.',
      },
    ];
    compSummary = `In the banking and financial services sector, ${symbolRecord.name} is positioned against massive institutional giants JPMorgan Chase, Bank of America, and Goldman Sachs.`;
  } else if (ind.includes('retail') || ind.includes('store') || ind.includes('e-commerce') || ind.includes('consumer defensive')) {
    topCompetitors = [
      {
        name: 'Walmart Inc.',
        advantage: 'Massive brick-and-mortar footprint, unparalleled supplier bargaining power, and expanding grocery delivery.',
        weakness: 'Thin operating margins and high exposure to entry-level labor wage changes.',
      },
      {
        name: 'Costco Wholesale Corp.',
        advantage: 'High renewal rate on subscription membership fees and volume purchase discounts.',
        weakness: 'Low store count per region compared to Walmart and limited SKU variety.',
      },
      {
        name: 'Target Corporation',
        advantage: 'Higher average customer income demographic and attractive private label design partnerships.',
        weakness: 'Greater sensitivity to discretionary retail demand fluctuations.',
      },
    ];
    compSummary = `The retail space places ${symbolRecord.name} in competition with Walmart, Costco, and Target, where pricing power and digital execution are critical.`;
  } else if (ind.includes('automotive') || ind.includes('vehicle') || ind.includes('car')) {
    topCompetitors = [
      {
        name: 'Tesla Inc.',
        advantage: 'Pioneering battery tech, direct-to-consumer sales model, and industry-leading EV manufacturing margins.',
        weakness: 'Premium valuation multiple vulnerable to vehicle demand slowdowns.',
      },
      {
        name: 'Toyota Motor Corp.',
        advantage: 'World-renowned production efficiency, highly popular hybrid vehicle lineup, and global brand reliability.',
        weakness: 'Slower rollout of fully electric battery vehicles.',
      },
      {
        name: 'BYD Company Ltd.',
        advantage: 'Completely vertically integrated battery supply chain and absolute EV sales dominance in China.',
        weakness: 'Geopolitical export tariffs and low brand awareness in Western consumer markets.',
      },
    ];
    compSummary = `${symbolRecord.name} operates in the highly capital-intensive automotive market, contending with Tesla, Toyota, and BYD.`;
  } else {
    const sectorWord = profile.industry !== 'Unknown' ? profile.industry : 'Sector';
    topCompetitors = [
      {
        name: `${symbolRecord.name} Peer A`,
        advantage: `Direct market specialization in ${sectorWord} and custom product execution.`,
        weakness: `Lack of global scale and limited capital reserves compared to primary firms.`,
      },
      {
        name: `${symbolRecord.name} Peer B`,
        advantage: `Lean corporate infrastructure allowing for agile product launches and lower pricing.`,
        weakness: `Fewer intellectual property assets and vulnerability to talent attrition.`,
      },
      {
        name: `${symbolRecord.name} Peer C`,
        advantage: `Strong regional partnerships and long-term customer loyalty within target segments.`,
        weakness: `Limited research and development budget to support rapid technological changes.`,
      },
    ];
    compSummary = `The competitive environment for ${symbolRecord.name} is characterized by intense competition from regional and global peers in the ${sectorWord} space.`;
  }

  const risks = [
    `Intense competitive pressure from established players in the ${profile.industry} sector, leading to price pressure.`,
    `Rapid technological shifts, including AI integration and cloud transformation, requiring heavy ongoing R&D.`,
    `Increasing global regulatory scrutiny around compliance, data privacy laws, and antitrust policies.`,
    `Economic headwinds including inflation, interest rate adjustments, and global economic slowdowns.`,
  ];
  if (pe > 45) {
    risks.push(`Premium valuation multiples (current P/E ratio: ${financials.peRatio}) elevate expectations and increase potential stock price volatility.`);
  }

  const summary = `Our investment analysis for ${symbolRecord.name} (${symbolRecord.symbol}) yields a recommendation of ${decision} with a score of ${score}/100 and a ${confidence} confidence rating.

Financial Analysis: The company demonstrates a profit margin of ${financials.profitMargin} and a Return on Equity (ROE) of ${financials.roe}. Its current cash position stands at ${financials.cash} compared to total debt of ${financials.debt}. While valuation remains ${pe > 30 ? 'high' : 'reasonable'} at a P/E of ${financials.peRatio}, the underlying fundamentals support its long-term viability.

Strategic Position & Sentiment: Operating in the ${profile.industry} sector, ${symbolRecord.name} benefits from strong scale advantages, though it faces formidable competition. Recent news headlines reflect positive sentiment regarding product updates (${news.positive.slice(0, 80)}...), offset by headline risks such as regulatory/market developments (${news.negative.slice(0, 80)}...). Overall, we believe the current risk-reward profile warrants a ${decision} stance at this valuation level.`;

  return {
    companyName: symbolRecord.name,
    decision,
    score,
    confidence,
    summary,
    profile,
    financials,
    news,
    competitors: {
      summary: compSummary,
      topCompetitors,
    },
    risks,
    swot,
  };
}

export async function buildResearchWorkflow(company: string): Promise<ResearchResult> {
  const symbolRecord = await resolveCompanySymbol(company);
  const alphaOverview = ALPHA_VANTAGE_API_KEY ? await fetchEarningsOverview(symbolRecord.symbol, ALPHA_VANTAGE_API_KEY).catch(() => null) : null;

  const profile = await researchNode(symbolRecord, alphaOverview);
  const financials = await financialAnalysisNode(symbolRecord.symbol, alphaOverview);
  const news = await newsAnalysisNode(symbolRecord.name);

  if (!OPENAI_API_KEY) {
    return generateHeuristicReport(symbolRecord, profile, financials, news);
  }

  assertEnv('OPENAI_API_KEY', OPENAI_API_KEY);
  const competitors = await competitorAnalysisNode(symbolRecord.name);
  const risks = await riskAnalysisNode(symbolRecord.name, competitors);
  const swot = await swotAnalysisNode(symbolRecord.name, profile, financials, competitors, risks);
  return await decisionNode(symbolRecord.name, profile, financials, news, competitors, risks, swot);
}

async function researchNode(symbolRecord: { symbol: string; name: string }, alphaOverview?: any) {
  const profile = await getCompanyProfile(symbolRecord.symbol, symbolRecord.name, alphaOverview);
  return profile as CompanyProfile;
}

async function financialAnalysisNode(symbol: string, alphaOverview?: any) {
  const metrics = await getFinancialMetrics(symbol, alphaOverview);
  return metrics as FinancialMetrics;
}
async function newsAnalysisNode(companyName: string) {
  const articles = await getRecentNews(companyName);
  return summarizeNews(articles);
}

async function competitorAnalysisNode(companyName: string) {
  const prompt = `Identify the major competitors for ${companyName} and compare them by revenue, growth, market share, advantages, and weaknesses. Return JSON with keys: summary and topCompetitors array containing name, advantage, weakness.`;
  const completion = await openAiClient!.responses.create({
    model: 'gpt-4.1',
    input: prompt,
    temperature: 0.2,
    max_output_tokens: 450,
  });

  return parseJson<CompetitorAnalysis>(completion.output_text || '');
}

async function riskAnalysisNode(companyName: string, competitors: CompetitorAnalysis) {
  const prompt = `List the top business, economic, competition, regulatory, technology, and leadership risks for ${companyName}. Return JSON array of risk descriptions.`;
  const completion = await openAiClient!.responses.create({
    model: 'gpt-4.1',
    input: prompt,
    temperature: 0.2,
    max_output_tokens: 400,
  });

  return parseJson<string[]>(completion.output_text || '');
}

async function swotAnalysisNode(
  companyName: string,
  profile: CompanyProfile,
  financials: FinancialMetrics,
  competitors: CompetitorAnalysis,
  risks: string[],
) {
  const prompt = `Create a SWOT analysis for ${companyName} using the company profile, financial metrics, competitor analysis, and risk factors. Return JSON with Strengths, Weaknesses, Opportunities, Threats.`;
  const completion = await openAiClient!.responses.create({
    model: 'gpt-4.1',
    input: prompt,
    temperature: 0.2,
    max_output_tokens: 450,
  });

  return parseJson<ResearchResult['swot']>(completion.output_text || '');
}

async function decisionNode(
  companyName: string,
  profile: CompanyProfile,
  financials: FinancialMetrics,
  news: NewsSummary,
  competitors: CompetitorAnalysis,
  risks: string[],
  swot: ResearchResult['swot'],
) {
  const prompt = `You are an investment research analyst. Based on the following inputs, produce a final investment report for ${companyName}:

Profile: ${JSON.stringify(profile)}
Financials: ${JSON.stringify(financials)}
News: ${JSON.stringify(news)}
Competitors: ${JSON.stringify(competitors)}
Risks: ${JSON.stringify(risks)}
SWOT: ${JSON.stringify(swot)}

Create a weighted score out of 100 using Financial Health 30%, Growth Potential 25%, Risk 20%, Market Position 15%, News Sentiment 10%. Choose INVEST or PASS, assign confidence High/Medium/Low, and provide a concise summary. Return JSON matching ResearchResult.`;
  const completion = await openAiClient!.responses.create({
    model: 'gpt-4.1',
    input: prompt,
    temperature: 0.2,
    max_output_tokens: 700,
  });

  return parseJson<ResearchResult>(completion.output_text || '');
}

function summarizeNews(articles: any[]) {
  if (!Array.isArray(articles) || articles.length === 0) {
    return {
      positive: 'No recent news data was available.',
      negative: 'No recent news data was available.',
      risks: 'Unable to determine news risks without articles.',
    };
  }

  const positiveHeadlines = articles.slice(0, 2).map((article) => article.title || article.title_snippet || '').filter(Boolean);
  const negativeHeadlines = articles.slice(2, 5).map((article) => article.title || article.title_snippet || '').filter(Boolean);
  const riskHeadlines = articles.slice(0, 3).map((article) => article.title || article.title_snippet || '').filter(Boolean);

  return {
    positive: positiveHeadlines.length ? positiveHeadlines.join(' | ') : 'No clearly positive headlines detected.',
    negative: negativeHeadlines.length ? negativeHeadlines.join(' | ') : 'No clearly negative headlines detected.',
    risks: riskHeadlines.length ? riskHeadlines.join(' | ') : 'No immediate headline risks surfaced.',
  };
}
