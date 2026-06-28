import type { CompanyProfile, CompetitorAnalysis, FinancialMetrics, NewsSummary, ResearchResult } from '@/types/research';

export type LangGraphNode<Input, Output> = {
  name: string;
  description: string;
  run: (input: Input) => Promise<Output>;
};

export type ResearchContext = {
  company: string;
  symbol?: string;
  profile?: CompanyProfile;
  financials?: FinancialMetrics;
  news?: NewsSummary;
  competitors?: CompetitorAnalysis;
  risks?: string[];
  swot?: ResearchResult['swot'];
  decision?: ResearchResult;
  logs: string[];
};

export type WorkflowManifest = {
  nodes: Array<LangGraphNode<ResearchContext, ResearchContext>>;
};
