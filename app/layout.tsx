import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Investment Research Agent',
  description: 'A production-quality investment research assistant powered by AI and multi-source financial data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
