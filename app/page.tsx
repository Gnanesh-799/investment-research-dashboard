import ResearchDashboard from '@/components/ResearchDashboard';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-10 sm:px-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-glow backdrop-blur">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-sky-400/80">AI Investment Research</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Turn company names into confident investment decisions.
            </h1>
            <p className="max-w-2xl text-slate-300 sm:text-lg">
              Research financial metrics, news sentiment, market position, and risk to answer the question: Invest or Pass?
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950 p-8 shadow-xl shadow-slate-950/30">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Ready to start</p>
            <p className="mt-4 text-2xl font-semibold text-white">Search a company and get a full AI research report.</p>
          </div>
        </div>
      </section>

      <ResearchDashboard />
    </main>
  );
}
