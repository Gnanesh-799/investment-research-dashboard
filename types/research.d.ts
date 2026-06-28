export type CompanyProfile = {
  companyName: string;
  industry: string;
  ceo: string;
  headquarters: string;
  employees: string;
  ipoDate: string;
  marketCap: string | null;
};

export type FinancialMetrics = {
  revenue: string;
  netIncome: string;
  eps: string;
  peRatio: string;
  debt: string;
  cash: string;
  profitMargin: string;
  roe: string;
  revenueGrowth: string;
};

export type NewsSummary = {
  positive: string;
  negative: string;
  risks: string;
};

export type CompetitorAnalysis = {
  summary: string;
  topCompetitors: Array<{ name: string; advantage: string; weakness: string }>;
};

export type ResearchResult = {
  companyName: string;
  decision: 'INVEST' | 'PASS';
  score: number;
  confidence: 'High' | 'Medium' | 'Low';
  summary: string;
  profile: CompanyProfile;
  financials: FinancialMetrics;
  news: NewsSummary;
  competitors: CompetitorAnalysis;
  risks: string[];
  swot: Record<'Strengths' | 'Weaknesses' | 'Opportunities' | 'Threats', string>;
};

export type ResearchRequest = {
  company: string;
};
