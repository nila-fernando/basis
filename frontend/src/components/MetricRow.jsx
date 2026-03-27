import './MetricRow.css'

function colorIC(val) {
  if (Math.abs(val) > 0.05) return 'var(--green)'
  if (Math.abs(val) > 0.02) return 'var(--amber)'
  return 'var(--red)'
}

function colorTstat(val) {
  if (Math.abs(val) > 2.0) return 'var(--green)'
  if (Math.abs(val) > 1.65) return 'var(--amber)'
  return 'var(--red)'
}

function colorSharpe(val) {
  if (val > 0.5) return 'var(--green)'
  if (val > 0.2) return 'var(--amber)'
  return 'var(--red)'
}

function classifySignal(decay) {
  if (!decay || decay.length < 3) return 'unknown'
  const ic1 = Math.abs(decay[0]?.ic || 0)
  const ic5 = Math.abs(decay[2]?.ic || 0)
  return ic5 < ic1 * 0.5 ? 'fast signal' : 'slow signal'
}

function getSummary(ic_mean, ic_tstat) {
  if (ic_mean < 0 && ic_tstat < -1.65) {
    return 'this signal predicted the wrong direction \u2014 stocks it ranked highly tended to underperform.'
  }
  if (Math.abs(ic_mean) < 0.02 || Math.abs(ic_tstat) < 1.65) {
    return 'this signal showed no meaningful relationship with future returns over this period.'
  }
  if (ic_mean > 0.05 && ic_tstat > 2) {
    return 'this signal showed a statistically meaningful relationship with future stock returns.'
  }
  return 'this signal showed a weak but plausible relationship \u2014 not strong enough to trade, but worth investigating.'
}

const TOOLTIPS = {
  ic: 'correlation between signal ranking and actual returns. +1 = perfect, 0 = random, \u22121 = backwards.',
  tstat: 'how confident we are this isn\u2019t random. above 2.0 = meaningful.',
  sharpe: 'return per unit of risk. above 0.5 is decent. this ignores trading costs.',
  decay: 'how much the signal weakens after 10 days. high decay = signal fades fast.',
}

export default function MetricRow({ results }) {
  const { ic_mean, ic_tstat, ic_pvalue, sharpe, ic_decay_10d_pct, decay } = results
  const speed = classifySignal(decay)
  const summary = getSummary(ic_mean, ic_tstat)

  return (
    <div className="metric-section">
      <p className="metric-summary">{summary}</p>
      <div className="metric-row">
        <div className="metric-cell">
          <span className="metric-label metric-has-tooltip">
            ic (mean)
            <span className="metric-tooltip">{TOOLTIPS.ic}</span>
          </span>
          <span className="metric-value" style={{ color: colorIC(ic_mean) }}>
            {ic_mean.toFixed(3)}
          </span>
          <span className="metric-sub">rank correlation</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label metric-has-tooltip">
            t-stat
            <span className="metric-tooltip">{TOOLTIPS.tstat}</span>
          </span>
          <span className="metric-value" style={{ color: colorTstat(ic_tstat) }}>
            {ic_tstat.toFixed(2)}
          </span>
          <span className="metric-sub">p &asymp; {ic_pvalue.toFixed(3)}</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label metric-has-tooltip">
            sharpe (gross)
            <span className="metric-tooltip">{TOOLTIPS.sharpe}</span>
          </span>
          <span className="metric-value" style={{ color: colorSharpe(sharpe) }}>
            {sharpe.toFixed(2)}
          </span>
          <span className="metric-sub">long-short Q1\u2013Q5</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label metric-has-tooltip">
            ic decay 10d
            <span className="metric-tooltip">{TOOLTIPS.decay}</span>
          </span>
          <span className="metric-value" style={{ color: ic_decay_10d_pct > 30 ? 'var(--red)' : 'var(--green)' }}>
            &minus;{ic_decay_10d_pct.toFixed(0)}%
          </span>
          <span className="metric-sub">{speed}</span>
        </div>
      </div>
    </div>
  )
}
