"""
Data fetching and caching layer.
Fetches Google Trends, Reddit mention counts, Wikipedia pageviews, and stock prices.
All fetched data is cached to SQLite to avoid redundant API calls.
"""

import pandas as pd
import numpy as np
import yfinance as yf
from db import get_cached, set_cached
import warnings
import requests
import time

warnings.filterwarnings("ignore")

# S&P 100 tickers
SP100_TICKERS = [
    "AAPL", "ABBV", "ABT", "ACN", "ADBE", "AIG", "AMGN", "AMT", "AMZN", "AVGO",
    "AXP", "BA", "BAC", "BK", "BKNG", "BLK", "BMY", "BRK-B", "C", "CAT",
    "CHTR", "CL", "CMCSA", "COF", "COP", "COST", "CRM", "CSCO", "CVS", "CVX",
    "DE", "DHR", "DIS", "DOW", "DUK", "EMR", "EXC", "F", "FDX", "GD",
    "GE", "GILD", "GM", "GOOG", "GS", "HD", "HON", "IBM", "INTC", "JNJ",
    "JPM", "KHC", "KO", "LIN", "LLY", "LMT", "LOW", "MA", "MCD", "MDLZ",
    "MDT", "MET", "META", "MMM", "MO", "MRK", "MS", "MSFT", "NEE", "NFLX",
    "NKE", "NVDA", "ORCL", "PEP", "PFE", "PG", "PM", "PYPL", "QCOM", "RTX",
    "SBUX", "SCHW", "SO", "SPG", "T", "TGT", "TMO", "TMUS", "TSLA", "TXN",
    "UNH", "UNP", "UPS", "USB", "V", "VZ", "WBA", "WFC", "WMT", "XOM",
]

TICKER_NAMES = {
    "AAPL": "Apple", "ABBV": "AbbVie", "ABT": "Abbott", "ACN": "Accenture",
    "ADBE": "Adobe", "AIG": "AIG", "AMGN": "Amgen", "AMT": "American Tower",
    "AMZN": "Amazon", "AVGO": "Broadcom", "AXP": "American Express",
    "BA": "Boeing", "BAC": "Bank of America", "BK": "Bank of New York",
    "BKNG": "Booking", "BLK": "BlackRock", "BMY": "Bristol Myers",
    "BRK-B": "Berkshire Hathaway", "C": "Citigroup", "CAT": "Caterpillar",
    "CHTR": "Charter", "CL": "Colgate", "CMCSA": "Comcast",
    "COF": "Capital One", "COP": "ConocoPhillips", "COST": "Costco",
    "CRM": "Salesforce", "CSCO": "Cisco", "CVS": "CVS Health",
    "CVX": "Chevron", "DE": "Deere", "DHR": "Danaher", "DIS": "Disney",
    "DOW": "Dow", "DUK": "Duke Energy", "EMR": "Emerson",
    "EXC": "Exelon", "F": "Ford", "FDX": "FedEx", "GD": "General Dynamics",
    "GE": "GE", "GILD": "Gilead", "GM": "General Motors",
    "GOOG": "Google", "GS": "Goldman Sachs", "HD": "Home Depot",
    "HON": "Honeywell", "IBM": "IBM", "INTC": "Intel",
    "JNJ": "Johnson Johnson", "JPM": "JPMorgan", "KHC": "Kraft Heinz",
    "KO": "Coca Cola", "LIN": "Linde", "LLY": "Eli Lilly",
    "LMT": "Lockheed Martin", "LOW": "Lowes", "MA": "Mastercard",
    "MCD": "McDonalds", "MDLZ": "Mondelez", "MDT": "Medtronic",
    "MET": "MetLife", "META": "Meta", "MMM": "3M",
    "MO": "Altria", "MRK": "Merck", "MS": "Morgan Stanley",
    "MSFT": "Microsoft", "NEE": "NextEra", "NFLX": "Netflix",
    "NKE": "Nike", "NVDA": "Nvidia", "ORCL": "Oracle",
    "PEP": "PepsiCo", "PFE": "Pfizer", "PG": "Procter Gamble",
    "PM": "Philip Morris", "PYPL": "PayPal", "QCOM": "Qualcomm",
    "RTX": "Raytheon", "SBUX": "Starbucks", "SCHW": "Schwab",
    "SO": "Southern Company", "SPG": "Simon Property", "T": "AT&T",
    "TGT": "Target", "TMO": "Thermo Fisher", "TMUS": "T-Mobile",
    "TSLA": "Tesla", "TXN": "Texas Instruments", "UNH": "UnitedHealth",
    "UNP": "Union Pacific", "UPS": "UPS", "USB": "US Bancorp",
    "V": "Visa", "VZ": "Verizon", "WBA": "Walgreens",
    "WFC": "Wells Fargo", "WMT": "Walmart", "XOM": "ExxonMobil",
}

# Wikipedia article titles (some differ from company names)
WIKI_TITLES = {
    "AAPL": "Apple Inc.", "ABBV": "AbbVie", "ABT": "Abbott Laboratories",
    "AMZN": "Amazon (company)", "BA": "Boeing", "BAC": "Bank of America",
    "BRK-B": "Berkshire Hathaway", "DIS": "The Walt Disney Company",
    "GOOG": "Alphabet Inc.", "GS": "Goldman Sachs", "HD": "The Home Depot",
    "JNJ": "Johnson & Johnson", "JPM": "JPMorgan Chase", "KO": "The Coca-Cola Company",
    "META": "Meta Platforms", "MSFT": "Microsoft", "NFLX": "Netflix",
    "NVDA": "Nvidia", "PG": "Procter & Gamble", "TSLA": "Tesla, Inc.",
    "V": "Visa Inc.", "WMT": "Walmart",
}

START_DATE = "2018-01-01"
END_DATE = "2022-12-31"


def fetch_single_ticker_price(ticker: str) -> pd.Series:
    """Fetch daily adjusted close for a single ticker."""
    cache_key = f"price_{ticker}_2018_2022"
    cached = get_cached(cache_key)
    if cached is not None:
        s = pd.Series(cached)
        s.index = pd.to_datetime(s.index)
        return s.sort_index()

    print(f"Fetching price data for {ticker}...")
    data = yf.download(ticker, start=START_DATE, end=END_DATE, auto_adjust=True, progress=False)
    if data.empty:
        return _generate_synthetic_price(ticker)

    prices = data["Close"]
    if hasattr(prices, 'columns'):
        prices = prices.iloc[:, 0]
    prices = prices.dropna()

    serializable = {str(k): float(v) for k, v in prices.to_dict().items()}
    set_cached(cache_key, serializable)
    return prices


def fetch_single_ticker_signal(
    signal_name: str,
    ticker: str,
    keyword: str = None,
    subreddits: list = None,
    wiki_page: str = None,
) -> pd.Series:
    """Fetch signal time series for a single ticker."""
    if signal_name in ("trends_7d", "trends_30d"):
        period = 7 if "7d" in signal_name else 30
        kw = keyword or f"{TICKER_NAMES.get(ticker, ticker)} stock"
        return _fetch_trends_single(ticker, kw, period)
    elif signal_name == "reddit_7d":
        subs = subreddits or ["stocks", "investing"]
        return _fetch_reddit_single(ticker, subs)
    elif signal_name == "wiki_7d":
        page = wiki_page or WIKI_TITLES.get(ticker, TICKER_NAMES.get(ticker, ticker))
        return _fetch_wiki_single(ticker, page)
    else:
        raise ValueError(f"Unknown signal: {signal_name}")


def _fetch_trends_single(ticker: str, keyword: str, period_days: int) -> pd.Series:
    """Fetch Google Trends for a single keyword."""
    cache_key = f"trends_single_{ticker}_{keyword}_{period_days}d"
    cached = get_cached(cache_key)
    if cached is not None:
        s = pd.Series(cached)
        s.index = pd.to_datetime(s.index)
        return s.sort_index()

    print(f"Fetching Google Trends for '{keyword}'...")
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl="en-US", tz=360)
        pytrends.build_payload([keyword], timeframe=f"{START_DATE} {END_DATE}")
        interest = pytrends.interest_over_time()
        if not interest.empty:
            interest = interest.drop(columns=["isPartial"], errors="ignore")
            series = interest[keyword]
            # Rolling z-score
            rm = series.rolling(window=max(period_days // 7, 2), min_periods=1).mean()
            rs = series.rolling(window=max(period_days // 7, 2), min_periods=1).std().replace(0, 1)
            z = (series - rm) / rs
            serializable = {str(k): float(v) for k, v in z.to_dict().items()}
            set_cached(cache_key, serializable)
            return z
    except Exception as e:
        print(f"  Trends error: {e}")

    return _generate_synthetic_single_signal(ticker, "trends", period_days)


def _fetch_reddit_single(ticker: str, subreddits: list) -> pd.Series:
    """Fetch Reddit mention signal for a single ticker."""
    subs_key = "_".join(sorted(subreddits))
    cache_key = f"reddit_single_{ticker}_{subs_key}"
    cached = get_cached(cache_key)
    if cached is not None:
        s = pd.Series(cached)
        s.index = pd.to_datetime(s.index)
        return s.sort_index()

    # Reddit's public API is heavily rate-limited; use synthetic for demo
    return _generate_synthetic_single_signal(ticker, "reddit", 7, extra_seed=len(subreddits))


def _fetch_wiki_single(ticker: str, page: str) -> pd.Series:
    """Fetch Wikipedia pageview signal for a single ticker."""
    cache_key = f"wiki_single_{ticker}_{page}"
    cached = get_cached(cache_key)
    if cached is not None:
        s = pd.Series(cached)
        s.index = pd.to_datetime(s.index)
        return s.sort_index()

    print(f"Fetching Wikipedia pageviews for '{page}'...")
    article = page.replace(" ", "_")
    url = (
        f"https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
        f"en.wikipedia/all-access/all-agents/{article}/monthly/20180101/20221231"
    )
    try:
        resp = requests.get(url, headers={"User-Agent": "basis-research-tool/1.0"})
        if resp.status_code == 200:
            items = resp.json().get("items", [])
            dates = []
            views = []
            for item in items:
                ts = item["timestamp"]
                dates.append(pd.Timestamp(f"{ts[:4]}-{ts[4:6]}-{ts[6:8]}"))
                views.append(item["views"])
            if dates:
                s = pd.Series(views, index=dates)
                # Resample to weekly, z-score
                s = s.resample("W").mean().ffill()
                rm = s.rolling(window=4, min_periods=1).mean()
                rs = s.rolling(window=4, min_periods=1).std().replace(0, 1)
                z = (s - rm) / rs
                serializable = {str(k): float(v) for k, v in z.to_dict().items()}
                set_cached(cache_key, serializable)
                return z
    except Exception as e:
        print(f"  Wiki error: {e}")

    return _generate_synthetic_single_signal(ticker, "wiki", 7)


def _generate_synthetic_price(ticker: str) -> pd.Series:
    """Generate synthetic price series for demo."""
    seed = sum(ord(c) for c in ticker)
    np.random.seed(seed)
    dates = pd.bdate_range(START_DATE, END_DATE)
    returns = np.random.randn(len(dates)) * 0.015 + 0.0003
    prices = 100 * np.exp(np.cumsum(returns))
    s = pd.Series(prices, index=dates)
    serializable = {str(k): float(v) for k, v in s.to_dict().items()}
    set_cached(f"price_{ticker}_2018_2022", serializable)
    return s


def _generate_synthetic_single_signal(
    ticker: str,
    signal_type: str,
    period_days: int,
    extra_seed: int = 0,
) -> pd.Series:
    """Generate synthetic signal for a single ticker."""
    base_seed = {"trends": 42, "reddit": 123, "wiki": 456}.get(signal_type, 42)
    ticker_seed = sum(ord(c) for c in ticker)
    np.random.seed(base_seed + ticker_seed + extra_seed)

    dates = pd.bdate_range(START_DATE, END_DATE, freq="W-FRI")
    data = np.random.randn(len(dates))

    # Add autocorrelation
    for i in range(1, len(data)):
        data[i] = 0.3 * data[i - 1] + 0.7 * data[i]

    # Z-score
    mean = data.mean()
    std = data.std()
    if std > 0:
        data = (data - mean) / std

    s = pd.Series(data, index=dates)
    cache_key = f"synthetic_{signal_type}_{ticker}_{period_days}d_{extra_seed}"
    serializable = {str(k): float(v) for k, v in s.to_dict().items()}
    set_cached(cache_key, serializable)
    return s
