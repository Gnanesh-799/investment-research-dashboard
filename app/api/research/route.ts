import { NextRequest, NextResponse } from 'next/server';
import { buildResearchWorkflow } from '@/lib/langgraph/workflow';
import { ResearchResult } from '@/types/research';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const company = typeof body.company === 'string' ? body.company.trim() : '';

  if (!company) {
    return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });
  }

  try {
    const result = await buildResearchWorkflow(company);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate research report.';
    console.error('Research workflow error:', message, error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? 'Unable to generate research report.' : message },
      { status: 500 },
    );
  }
}
