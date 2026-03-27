"""
Signal construction and IC computation — single-ticker mode.
Computes rolling correlation between signal and forward returns for one ticker.
"""

import numpy as np
import pandas as pd
from scipy import stats
from data import (
    fetch_single_ticker_price,
    fetch_single_ticker_signal,
)


def run_backtest(
    signal_name: str,
    ticker: str,
    keyword: str = None,
    subreddits: list = None,
    wiki_page: str = None,
    forward_days: int = 5,
    lag: int = 1,
) -> dict:
    """
    Single-ticker backtest.

    1. Fetch signal time series for ticker
    2. Fetch price series for ticker
    3. Align, apply lag
    4. Compute rolling 52-week Spearman correlation as IC proxy
    5. IC mean, std, t-stat across rolling windows
    6. IC decay for each holding period
    7. Return scatter data (signal vs forward return per week)
    """
    # Fetch data
    signal_series = fetch_single_ticker_signal(
        signal_name, ticker, keyword=keyword,
        subreddits=subreddits, wiki_page=wiki_page,
    )
    prices = fetch_single_ticker_price(ticker)

    if signal_series is None or len(signal_series) < 30:
        raise ValueError(f"Insufficient signal data for {ticker}")
    if prices is None or len(prices) < 30:
        raise ValueError(f"Insufficient price data for {ticker}")

    # Resample signal to business days (forward fill weekly data)
    signal_daily = signal_series.resample("B").ffill()

    # Apply lag
    signal_lagged = signal_daily.shift(lag)

    # Compute forward returns for primary period
    fwd_returns = prices.pct_change(forward_days).shift(-forward_days)

    # Align dates
    common_idx = signal_lagged.dropna().index.intersection(fwd_returns.dropna().index)
    if len(common_idx) < 30:
        raise ValueError(f"Insufficient overlapping dates: {len(common_idx)}")

    sig = signal_lagged.loc[common_idx].values
    ret = fwd_returns.loc[common_idx].values

    # Rolling 52-week (52 data points) Spearman correlation
    window = min(52, len(common_idx) // 3)
    if window < 12:
        window = 12

    ic_series = []
    for i in range(window, len(sig)):
        s_win = sig[i - window:i]
        r_win = ret[i - window:i]
        valid = ~(np.isnan(s_win) | np.isnan(r_win))
        if valid.sum() < 10:
            continue
        corr, _ = stats.spearmanr(s_win[valid], r_win[valid])
        if not np.isnan(corr):
            ic_series.append(corr)

    if len(ic_series) < 10:
        raise ValueError(f"Insufficient data for rolling IC: {len(ic_series)} windows")

    ic_array = np.array(ic_series)
    n_windows = len(ic_array)

    ic_mean = float(np.mean(ic_array))
    ic_std = float(np.std(ic_array, ddof=1))
    ic_tstat = ic_mean / (ic_std / np.sqrt(n_windows)) if ic_std > 0 else 0.0
    ic_pvalue = float(2 * (1 - stats.t.cdf(abs(ic_tstat), df=n_windows - 1)))

    # Overall Spearman correlation for Sharpe-like metric
    valid_all = ~(np.isnan(sig) | np.isnan(ret))
    overall_corr, _ = stats.spearmanr(sig[valid_all], ret[valid_all])
    # Simple Sharpe proxy: mean(ret where signal > median) - mean(ret where signal <= median)
    sig_valid = sig[valid_all]
    ret_valid = ret[valid_all]
    median_sig = np.median(sig_valid)
    high_ret = ret_valid[sig_valid > median_sig]
    low_ret = ret_valid[sig_valid <= median_sig]
    ls_mean = float(np.mean(high_ret) - np.mean(low_ret)) if len(high_ret) > 0 and len(low_ret) > 0 else 0.0
    ls_std = float(np.std(np.concatenate([high_ret, -low_ret]), ddof=1)) if len(high_ret) > 1 else 1.0
    sharpe = (ls_mean / ls_std) * np.sqrt(252 / max(forward_days, 1)) if ls_std > 0 else 0.0

    # IC decay
    decay_periods = [1, 3, 5, 10, 21]
    decay = []
    for period in decay_periods:
        period_ret = prices.pct_change(period).shift(-period)
        ci = period_ret.loc[common_idx].values
        valid_d = ~(np.isnan(sig) | np.isnan(ci))
        if valid_d.sum() >= 10:
            corr_d, _ = stats.spearmanr(sig[valid_d], ci[valid_d])
            decay.append({"period": period, "ic": round(float(corr_d), 4)})
        else:
            decay.append({"period": period, "ic": 0.0})

    # IC decay percentage
    max_ic = max(abs(d["ic"]) for d in decay) if decay else 1.0
    ic_10d = abs(next((d["ic"] for d in decay if d["period"] == 10), 0))
    ic_decay_pct = ((max_ic - ic_10d) / max_ic * 100) if max_ic > 0 else 0

    # Scatter data: signal value vs forward return for each week
    # Downsample to weekly for cleaner scatter
    weekly_idx = common_idx[::5]  # Every 5th business day ≈ weekly
    scatter = []
    for dt in weekly_idx:
        s_val = float(signal_lagged.loc[dt])
        r_val = float(fwd_returns.loc[dt])
        if not (np.isnan(s_val) or np.isnan(r_val)):
            scatter.append({
                "x": round(s_val, 3),
                "y": round(r_val * 100, 3),
            })

    return {
        "ic_mean": round(ic_mean, 4),
        "ic_tstat": round(ic_tstat, 2),
        "ic_pvalue": round(ic_pvalue, 4),
        "sharpe": round(float(sharpe), 2),
        "decay": decay,
        "scatter": scatter,
        "n_obs": len(scatter),
        "ic_decay_10d_pct": round(ic_decay_pct, 1),
    }
