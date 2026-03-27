# basis

An interactive research tool for exploring whether alternative data signals have predictive power in equity markets.

Instead of treating quant finance as a black box, Basis walks you through the full workflow: construct a signal, test it against forward returns, evaluate statistical significance, and understand why it works (or doesn't).

---

## Getting started

**Backend** (FastAPI + Python)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend** (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Signals

| Signal | Source | What it captures |
| --- | --- | --- |
| Google Trends (7d) | pytrends | Short-term spikes in retail attention |
| Google Trends (30d) | pytrends | Slower-moving attention trends |
| Reddit Mentions (7d) | r/stocks, r/investing, r/wallstreetbets | Crowd sentiment and hype cycles |
| Wikipedia Pageviews (7d) | Wikimedia API | Information-seeking behavior |

---

## How the backtest works

1. Fetch raw signal values per ticker per week
2. Z-score normalize cross-sectionally (across tickers, per date)
3. Apply a configurable lag (shift signal forward N trading days) to prevent look-ahead bias
4. Compute Spearman rank IC between lagged signal and forward returns, per date
5. Aggregate: IC mean, t-stat, p-value, IC decay across holding periods
6. Sort tickers into quintiles by signal; compute mean forward return per bucket
7. Compute long-short Sharpe: annualized Q5 − Q1 return series

---

## Limitations

- **Not investment advice** — educational and research use only
- Universe: S&P 100 (~100 large-cap US stocks)
- Backtest period: 2018–2022, no out-of-sample validation
- Gross returns only — no transaction costs, slippage, or market impact
- Some signals use synthetic data when live API access is rate-limited
- No automatic multiple-testing correction
