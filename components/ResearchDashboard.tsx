'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { companySearch } from '@/services/financial';
import { ResearchResult, ResearchRequest } from '@/types/research';

const fetcher = async ([url, company]: [string, string]) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Unable to generate research report.');
  }

  return result;
};

export default function ResearchDashboard() {
  const [company, setCompany] = useState('');
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { data, error, isLoading } = useSWR(submitted ? ['/api/research', query] : null, fetcher);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company.trim()) {
      return;
    }
    setQuery(company.trim());
    setSubmitted(true);
  };

  function formatError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Missing environment variable')) {
      const parts = message.split(':');
      const varName = parts[1]?.trim() || 'required API key';
      return `${varName} is not configured. Add ${varName} to your project root .env file (see .env.example) and restart the dev server.`;
    }
    return message;
  }

  return (
    <section className="grid gap-8">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-glow backdrop-blur sm:flex sm:items-center sm:justify-between">
        <div className="space-y-3 sm:flex-1 sm:pr-4">
          <label className="block text-sm font-medium text-slate-300" htmlFor="company">
            Company name
          </label>
          <input
            id="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="e.g. Apple"
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        <button type="submit" className="mt-4 inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 sm:mt-0">
          Research company
          <ArrowRightIcon className="ml-2 h-5 w-5" />
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_0.7fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-glow backdrop-blur">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Research companion</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Invest or Pass analysis</h2>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm text-slate-300">GPT-4.1 + Multi-Source</div>
          </div>

          {error ? (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200">
              <p className="font-semibold">Something went wrong.</p>
              <p className="mt-2 text-sm">{formatError(error)}</p>
              <p className="mt-2 text-xs text-rose-100/80">Tip: create a .env file at the project root using .env.example and add your API keys.</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4 py-12 text-center text-slate-400">
              <SparklesIcon className="mx-auto h-12 w-12 text-sky-400/80" />
              <p className="text-base font-medium">Crunching data from finance, news, and risk models...</p>
            </div>
          ) : data ? (
            <ResearchReport report={data as ResearchResult} />
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-slate-400">
              <p className="font-medium">Start with a company name to generate the investment research report.</p>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-glow backdrop-blur">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">How it works</p>
            <ol className="mt-4 space-y-3 text-sm text-slate-300">
              <li>1. Validate company and fetch profile</li>
              <li>2. Collect financial metrics from multiple APIs</li>
              <li>3. Analyze recent news, competitors, and risks</li>
              <li>4. Score investment attractiveness and decide</li>
            </ol>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-glow backdrop-blur">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Best for</p>
            <p className="mt-4 text-lg font-semibold text-white">Growth & value investors</p>
            <p className="mt-2 text-sm text-slate-300">Quickly compare financial health, news sentiment, and competitive strength.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ResearchReport({ report }: { report: ResearchResult }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-sky-400/80">Report</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{report.companyName} Investment Decision</h3>
          </div>
          <div className="rounded-3xl bg-slate-900 px-4 py-3 text-sm text-slate-300">
            Confidence: {report.confidence}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Decision" value={report.decision} accent={report.decision === 'INVEST' ? 'text-emerald-400' : 'text-rose-400'} />
          <MetricCard label="Score" value={`${report.score}/100`} />
          <MetricCard label="Market Cap" value={report.profile.marketCap ?? 'Unknown'} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_0.7fr]">
        <div className="space-y-6">
          <SectionCard title="Executive summary">
            <p className="text-slate-300">{report.summary}</p>
          </SectionCard>

          <SectionCard title="Financial health">
            <dl className="grid gap-4 sm:grid-cols-2">
              {Object.entries(report.financials).map(([key, value]) => (
                <div key={key} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                  <dt className="text-sm text-slate-400">{key}</dt>
                  <dd className="mt-2 text-lg font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          <SectionCard title="SWOT summary">
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(report.swot).map(([key, value]) => (
                <div key={key} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{key}</p>
                  <p className="mt-2 text-slate-300">{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Company profile & leadership">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <span className="text-sm text-slate-400">Chief Executive Officer</span>
                <span className="font-semibold text-white text-right ml-2">{report.profile.ceo}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <span className="text-sm text-slate-400">Headquarters</span>
                <span className="font-semibold text-white text-right ml-2">{report.profile.headquarters}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <span className="text-sm text-slate-400">Industry</span>
                <span className="font-semibold text-white text-right ml-2">{report.profile.industry}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Employees</span>
                <span className="font-semibold text-white text-right ml-2">{report.profile.employees}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="News sentiment">
            <p className="text-slate-300">Positive: {report.news.positive}</p>
            <p className="mt-3 text-slate-300">Negative: {report.news.negative}</p>
            <p className="mt-3 text-slate-300">Risks: {report.news.risks}</p>
          </SectionCard>

          <SectionCard title="Risks">
            <ul className="space-y-3 text-slate-300">
              {report.risks.map((risk, index) => (
                <li key={index} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                  {risk}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Competitor snapshot">
            <p className="text-slate-300">{report.competitors.summary}</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <div className="mt-4 text-sm leading-6 text-slate-300">{children}</div>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${accent ?? 'text-white'}`}>{value}</p>
    </div>
  );
}
