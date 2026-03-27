import { useState, useRef } from 'react'
import SignalTransparency from '../components/SignalTransparency'
import SignalConfig, { getDefaultKeyword, getDefaultWikiPage, getSignalLabel } from '../components/SignalConfig'
import MetricRow from '../components/MetricRow'
import DecayChart from '../components/DecayChart'
import ScatterPlot from '../components/ScatterPlot'
import InsightPanel from '../components/InsightPanel'
import './Research.css'

const SIGNALS = [
  { id: 'trends_7d', label: 'google trends 7d' },
  { id: 'trends_30d', label: 'google trends 30d' },
  { id: 'reddit_7d', label: 'reddit 7d' },
  { id: 'wiki_7d', label: 'wikipedia 7d' },
]

const FORWARD_OPTIONS = [
  { value: 5, label: '5-day' },
  { value: 10, label: '10-day' },
  { value: 21, label: '21-day' },
]

const LAG_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 2, label: '2 days' },
  { value: 5, label: '5 days' },
]

function getDefaultConfig(signal) {
  const defaults = {
    trends_7d: { ticker: 'AAPL', keyword: 'Apple stock', includeWSB: false, wikiPage: '' },
    trends_30d: { ticker: 'AAPL', keyword: 'Apple stock', includeWSB: false, wikiPage: '' },
    reddit_7d: { ticker: 'TSLA', keyword: '', includeWSB: false, wikiPage: '' },
    wiki_7d: { ticker: 'NFLX', keyword: '', includeWSB: false, wikiPage: 'Netflix' },
  }
  return defaults[signal] || defaults.trends_7d
}

export default function Research() {
  const [signal, setSignal] = useState('trends_7d')
  const [config, setConfig] = useState(getDefaultConfig('trends_7d'))
  const [forwardDays, setForwardDays] = useState(5)
  const [lag, setLag] = useState(1)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ranWith, setRanWith] = useState(null)
  const runCount = useRef(0)

  const handleSignalChange = (newSignal) => {
    setSignal(newSignal)
    setConfig(getDefaultConfig(newSignal))
  }

  const runBacktest = async () => {
    setLoading(true)
    setError(null)
    try {
      const isTrends = signal === 'trends_7d' || signal === 'trends_30d'
      const isReddit = signal === 'reddit_7d'
      const isWiki = signal === 'wiki_7d'

      const body = {
        signal,
        ticker: config.ticker,
        forward_days: forwardDays,
        lag,
      }
      if (isTrends) body.keyword = config.keyword
      if (isReddit) {
        body.subreddits = config.includeWSB
          ? ['stocks', 'investing', 'wallstreetbets']
          : ['stocks', 'investing']
      }
      if (isWiki) body.wiki_page = config.wikiPage

      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Backtest failed')
      }
      const data = await res.json()
      runCount.current += 1
      setResults({ ...data, runCount: runCount.current })

      // Build "ran with" summary
      const parts = [getSignalLabel(signal)]
      if (isTrends) parts.push(`"${config.keyword}"`)
      if (isReddit) parts.push(config.includeWSB ? 'r/stocks + r/investing + r/wsb' : 'r/stocks + r/investing')
      if (isWiki) parts.push(`"${config.wikiPage}"`)
      parts.push(config.ticker)
      parts.push(`${forwardDays}-day forward return`)
      parts.push(`lag ${lag}d`)
      setRanWith(parts.join(' \u00B7 '))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="research">
      <div className="research-header">
        <a href="/" className="back-link">basis</a>
      </div>

      <div className="section-rule">
        <span>signal</span>
      </div>

      <div className="signal-config-section">
        <div className="signal-buttons">
          {SIGNALS.map((s) => (
            <button
              key={s.id}
              className={signal === s.id ? 'active' : ''}
              onClick={() => handleSignalChange(s.id)}
            >
              [ {s.label} ]
            </button>
          ))}
        </div>

        <SignalTransparency signal={signal} />

        <SignalConfig signal={signal} config={config} onChange={setConfig} />

        <div className="config-dropdowns">
          <div className="dropdown-group">
            <label>forward return:</label>
            <select value={forwardDays} onChange={(e) => setForwardDays(Number(e.target.value))}>
              {FORWARD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="dropdown-group">
            <label>lag:</label>
            <select value={lag} onChange={(e) => setLag(Number(e.target.value))}>
              {LAG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="run-btn" onClick={runBacktest} disabled={loading}>
          {loading ? '[ running... ]' : '[ \u25B6 run backtest ]'}
        </button>

        <p className="lag-helper">
          lag of {lag} day{lag > 1 ? 's' : ''} enforced to prevent look-ahead bias
        </p>
      </div>

      <p className="data-grounding">
        testing {config.ticker} &middot; weekly data &middot; 2018&ndash;2022 &middot; ~260 weekly observations
      </p>

      {error && (
        <div className="error-msg">{error}</div>
      )}

      {results && !loading && (
        <>
          {ranWith && (
            <p className="ran-with">ran: {ranWith}</p>
          )}

          <div className="section-rule">
            <span>results</span>
          </div>
          <MetricRow results={results} />

          <div className="section-rule">
            <span>signal vs. return</span>
          </div>
          <ScatterPlot scatter={results.scatter} forwardDays={forwardDays} />

          <div className="section-rule">
            <span>signal strength over time</span>
          </div>
          <DecayChart decay={results.decay} />

          <div className="section-rule">
            <span>what this means</span>
          </div>
          <InsightPanel results={results} />
        </>
      )}
    </div>
  )
}
