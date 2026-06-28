# AI Investment Research Agent & Dashboard

An advanced, AI-powered investment research agent and dashboard built with **Next.js**, **TypeScript**, **Tailwind CSS**, **LangGraph**, and financial APIs (**Alpha Vantage** and **SerpAPI**). 

This agent automatically conducts comprehensive research on public corporations, analyzing financials, identifying market competitors, assessing sector-specific risks, scoring strategic viability, and listing corporate leadership & locations.

---

## Features
- **Smart Ticker Resolution**: Resolves arbitrary company names (e.g., "TCS", "Tesla") to official tickers and names.
- **Dynamic Company Profiles**: Fetches real-time corporate metadata (CEO names, headquarters locations, employee counts, industry categorizations) using fallback Google Searches via SerpAPI.
- **Real-Time Financial Analysis**: Pulls and formats market cap, P/E ratio, EPS, revenue, net income, cash reserves, and debt levels with zero rate-limit blocks.
- **SWOT and Competitor Analysis**: Displays strategic matrix layouts alongside direct market peers (competitors' advantages vs. weaknesses).
- **Premium Glassmorphic Design**: Curated slate/indigo aesthetic with responsive layouts, visual indicators (scores, green/red investment metrics), and micro-animations.

---

## Getting Started

### 1. Clone the Project
```bash
git clone https://github.com/Gnanesh-799/investment-research-dashboard.git
cd investment-research-dashboard
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (copy from `.env.example`) and add your API keys:

```env
# Alpha Vantage (Used for financial stats and overview data)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# SerpAPI (Used for CEO, location lookup, and recent company news)
SERPAPI_API_KEY=your_serpapi_key

# OpenAI (Optional - used for full AI analysis workflow)
OPENAI_API_KEY=
```

### 3. Run Locally
```bash
# Install dependencies
npm install

# Run Next.js in development mode
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Project Structure
- `/app`: Next.js page routing and API endpoint controllers.
- `/components`: Frontend dashboard view layers.
- `/lib`: LangGraph agent nodes and environment config.
- `/services`: Interface wrappers for external APIs (SerpAPI, Alpha Vantage, Yahoo Finance).
