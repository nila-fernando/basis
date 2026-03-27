import { useState } from 'react'
import './SignalTransparency.css'

const SIGNAL_INFO = {
  trends_7d: {
    rows: [
      { label: 'keywords searched', value: '"Apple stock", "Microsoft stock", "Tesla stock" ... (20 tickers)' },
      { label: 'source', value: 'Google Trends (trends.google.com)' },
      { label: 'what we measure', value: 'weekly search interest score, 0\u2013100, normalised across tickers' },
    ],
    intuition: 'if people suddenly google a stock more than usual, does the price move in the following week?',
  },
  trends_30d: {
    rows: [
      { label: 'keywords searched', value: '"Apple stock", "Microsoft stock", "Tesla stock" ... (20 tickers)' },
      { label: 'source', value: 'Google Trends (trends.google.com)' },
      { label: 'what we measure', value: 'weekly search interest score, 0\u2013100, normalised with a 30-day rolling window' },
    ],
    intuition: 'same as the 7-day signal, but smoothed over a longer window \u2014 does a slower attention shift predict returns better?',
  },
  reddit_7d: {
    rows: [
      { label: 'subreddits watched', value: 'r/stocks, r/investing, r/wallstreetbets' },
      { label: 'what we measure', value: 'number of times each ticker symbol is mentioned per week' },
    ],
    intuition: 'if a stock gets talked about more on reddit, does that predict a price move?',
  },
  wiki_7d: {
    rows: [
      { label: 'pages tracked', value: 'Wikipedia pages for each S&P 100 company' },
      { label: 'what we measure', value: 'weekly pageview count per company page' },
    ],
    intuition: 'when people research a company on Wikipedia more than usual, does something happen to the stock?',
  },
}

export default function SignalTransparency({ signal }) {
  const [collapsed, setCollapsed] = useState(false)
  const info = SIGNAL_INFO[signal]
  if (!info) return null

  return (
    <div className="signal-transparency">
      <button
        className="transparency-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="toggle-rule">\u2500\u2500</span>
        <span>what this signal actually does</span>
        <span className="toggle-rule-after"></span>
        <span className="toggle-arrow">{collapsed ? '\u25B6' : '\u25BC'}</span>
      </button>

      {!collapsed && (
        <div className="transparency-body">
          {info.rows.map((row, i) => (
            <div key={i} className="transparency-row">
              <span className="transparency-label">{row.label}:</span>
              <span className="transparency-value">{row.value}</span>
            </div>
          ))}
          <div className="transparency-row transparency-intuition">
            <span className="transparency-label">intuition:</span>
            <span className="transparency-value transparency-value-italic">{info.intuition}</span>
          </div>
        </div>
      )}
    </div>
  )
}
