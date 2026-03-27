"""
Basis — FastAPI backend.
Serves signal backtest results and signal metadata.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional
from signals import run_backtest
from data import SP100_TICKERS, TICKER_NAMES

app = FastAPI(title="Basis", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class BacktestRequest(BaseModel):
    signal: Literal["trends_7d", "trends_30d", "reddit_7d", "wiki_7d"]
    ticker: str = "AAPL"
    keyword: Optional[str] = None
    subreddits: Optional[list[str]] = None
    wiki_page: Optional[str] = None
    forward_days: Literal[5, 10, 21] = 5
    lag: Literal[1, 2, 5] = 1


@app.post("/api/backtest")
def backtest(req: BacktestRequest):
    if req.ticker not in SP100_TICKERS:
        raise HTTPException(status_code=400, detail=f"Unknown ticker: {req.ticker}")
    try:
        result = run_backtest(
            signal_name=req.signal,
            ticker=req.ticker,
            keyword=req.keyword,
            subreddits=req.subreddits,
            wiki_page=req.wiki_page,
            forward_days=req.forward_days,
            lag=req.lag,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/signals")
def list_signals():
    return [
        {"id": "trends_7d", "label": "Google Trends 7d", "description": "Weekly search interest, 7-day z-score window"},
        {"id": "trends_30d", "label": "Google Trends 30d", "description": "Weekly search interest, 30-day z-score window"},
        {"id": "reddit_7d", "label": "Reddit 7d", "description": "Mention volume from r/stocks and r/investing, 7-day window"},
        {"id": "wiki_7d", "label": "Wikipedia 7d", "description": "Weekly pageview activity for company Wikipedia pages"},
    ]


@app.get("/api/tickers")
def list_tickers():
    return [
        {"ticker": t, "name": TICKER_NAMES.get(t, t)}
        for t in SP100_TICKERS
    ]
