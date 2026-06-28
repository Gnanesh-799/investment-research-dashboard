import { ResearchResult } from '@/types/research';

export async function companySearch(company: string): Promise<ResearchResult> {
  // Placeholder integration layer. Backend API handles the core research flow.
  throw new Error('companySearch should not be called directly from services in the frontend. Use /api/research instead.');
}
