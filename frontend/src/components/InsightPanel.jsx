import { useState } from 'react'
import InlineExplainer from './InlineExplainer'
import './InsightPanel.css'

const EXPLAINERS = {
  correlation: {
    title: 'what is correlation?',
    body: 'Correlation measures whether two things move together. A correlation of +1 means they move in perfect lockstep. 0 means no relationship at all. -1 means they move in opposite directions. In this tool, we measure the correlation between a signal value and the stock\'s actual return afterward.',
  },
  decay: {
    title: 'what is signal decay?',
    body: 'Signal decay means the signal stops working over time. A signal that predicts tomorrow\'s returns but not next week\'s is "fast-decaying." This matters because real trading takes time \u2014 if the signal fades before you can act on it, it\'s not useful. Slow-decaying signals are rarer but more practical.',
  },
  overfitting: {
    title: 'what is overfitting?',
    body: 'Overfitting happens when you test many signals and only keep the best-looking one. If you flip a coin 20 times and pick the best streak, it looks like skill \u2014 but it\'s luck. The same thing happens with signals: test enough of them and one will look good by chance. This is why professional quants adjust their confidence thresholds when testing multiple signals.',
  },
}

function getBestDecayPeriod(decay) {
  if (!decay || decay.length === 0) return { period: 1, ic: 0 }
  return decay.reduce((best, d) => Math.abs(d.ic) > Math.abs(best.ic) ? d : best, decay[0])
}

function generateInsights(results) {
  const insights = []
  const { ic_mean, ic_tstat, ic_decay_10d_pct, decay, scatter, runCount } = results

  // Correlation insight
  if (ic_mean > 0.05) {
    insights.push({
      symbol: '\u25CF',
      color: 'var(--green)',
      text: 'this signal has a real (if small) correlation with future returns.',
    })
  } else if (ic_mean >= 0) {
    insights.push({
      symbol: '\u25CB',
      color: 'var(--muted)',
      text: 'weak correlation \u2014 this signal barely outperforms a coin flip.',
    })
  } else {
    insights.push({
      symbol: '\u25BC',
      color: 'var(--red)',
      text: 'negative correlation \u2014 the signal pointed the wrong direction on average.',
    })
  }

  // Statistical significance insight
  if (Math.abs(ic_tstat) > 2) {
    insights.push({
      symbol: '\u25CF',
      color: 'var(--green)',
      text: 'statistically significant. unlikely to be random noise.',
    })
  } else if (Math.abs(ic_tstat) >= 1.65) {
    insights.push({
      symbol: '\u25CB',
      color: 'var(--amber)',
      text: 'borderline. could be real, could be luck. needs more data.',
    })
  } else {
    insights.push({
      symbol: '\u25BC',
      color: 'var(--red)',
      text: 'not statistically significant. we can\u2019t rule out this being random.',
    })
  }

  // Decay insight
  const best = getBestDecayPeriod(decay)
  const decayLine = `the signal was strongest at ${best.period}d and lost ${ic_decay_10d_pct.toFixed(0)}% of its strength by day 10.`

  if (ic_decay_10d_pct > 50) {
    insights.push({
      symbol: '\u25BC',
      color: 'var(--red)',
      text: `${decayLine} this signal fades fast \u2014 by the time you could act on it, it\u2019s mostly gone.`,
    })
  } else if (ic_decay_10d_pct >= 20) {
    insights.push({
      symbol: '\u25CB',
      color: 'var(--amber)',
      text: `${decayLine} moderate fade. a short holding period (1\u20135 days) would suit this signal.`,
    })
  } else {
    insights.push({
      symbol: '\u25CF',
      color: 'var(--green)',
      text: `${decayLine} the signal holds its strength over time \u2014 a slower strategy could use this.`,
    })
  }

  // Scatter slope insight (replaces quintile)
  if (scatter && scatter.length > 10) {
    const n = scatter.length
    const meanX = scatter.reduce((a, p) => a + p.x, 0) / n
    const meanY = scatter.reduce((a, p) => a + p.y, 0) / n
    let num = 0, den = 0
    for (const p of scatter) {
      num += (p.x - meanX) * (p.y - meanY)
      den += (p.x - meanX) * (p.x - meanX)
    }
    const slope = den !== 0 ? num / den : 0

    if (Math.abs(slope) > 0.3) {
      insights.push({
        symbol: '\u25CF',
        color: 'var(--green)',
        text: 'the scatter plot shows a visible trend \u2014 higher signal values tend to lead to higher returns. the signal appears to work.',
      })
    } else if (Math.abs(slope) > 0.1) {
      insights.push({
        symbol: '\u25CB',
        color: 'var(--amber)',
        text: 'the scatter plot shows a slight trend, but it\u2019s not strong. the relationship between signal and returns is weak.',
      })
    } else {
      insights.push({
        symbol: '\u25CB',
        color: 'var(--muted)',
        text: 'the scatter plot looks like a cloud with no clear direction. the signal doesn\u2019t appear to predict returns visually.',
      })
    }
  }

  // Session warning
  if (runCount >= 3) {
    insights.push({
      symbol: '\u25CB',
      color: 'var(--amber)',
      text: `you\u2019ve tested ${runCount} signals. the more you test and keep only the best, the more likely you\u2019re seeing luck, not skill. this is called overfitting.`,
    })
  }

  return insights
}

export default function InsightPanel({ results }) {
  const [openExplainer, setOpenExplainer] = useState(null)
  const insights = generateInsights(results)

  const toggleExplainer = (key) => {
    setOpenExplainer(openExplainer === key ? null : key)
  }

  return (
    <div className="insight-panel">
      <div className="insight-list">
        {insights.map((insight, i) => (
          <div key={i} className="insight-line">
            <span className="insight-symbol" style={{ color: insight.color }}>
              {insight.symbol}
            </span>
            <span className="insight-text">{insight.text}</span>
          </div>
        ))}
      </div>

      <div className="explainer-links">
        <button className="explainer-link" onClick={() => toggleExplainer('correlation')}>
          [ ? what is correlation ]
        </button>
        <button className="explainer-link" onClick={() => toggleExplainer('decay')}>
          [ ? what is signal decay ]
        </button>
        <button className="explainer-link" onClick={() => toggleExplainer('overfitting')}>
          [ ? what is overfitting ]
        </button>
      </div>

      {openExplainer && EXPLAINERS[openExplainer] && (
        <InlineExplainer
          title={EXPLAINERS[openExplainer].title}
          body={EXPLAINERS[openExplainer].body}
        />
      )}
    </div>
  )
}
