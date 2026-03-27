import './DecayChart.css'

function barColor(ic, maxIc) {
  const absIc = Math.abs(ic)
  if (absIc > 0.05) return 'var(--green)'
  if (absIc > 0.02) return 'var(--amber)'
  return 'var(--red)'
}

export default function DecayChart({ decay }) {
  if (!decay || decay.length === 0) return null

  const ROWS = 8
  const BAR_WIDTH = 5
  const GAP = 2
  const LABEL_W = 6

  const maxIc = Math.max(...decay.map((d) => Math.abs(d.ic)), 0.01)

  // Build the grid
  const lines = []

  // Header
  lines.push('  signal strength over holding period')
  lines.push('')

  for (let row = ROWS; row >= 1; row--) {
    const threshold = (row / ROWS) * maxIc
    const label = threshold.toFixed(3)
    let line = label.padStart(LABEL_W) + '|'

    for (let i = 0; i < decay.length; i++) {
      const barH = Math.round((Math.abs(decay[i].ic) / maxIc) * ROWS)
      if (i > 0) line += ' '.repeat(GAP)
      if (barH >= row) {
        line += '\u2588'.repeat(BAR_WIDTH)
      } else {
        line += ' '.repeat(BAR_WIDTH)
      }
    }

    lines.push(line)
  }

  // X-axis line
  let axisLine = ' '.repeat(LABEL_W) + '+'
  for (let i = 0; i < decay.length; i++) {
    if (i > 0) axisLine += '-'.repeat(GAP)
    axisLine += '-'.repeat(BAR_WIDTH)
  }
  lines.push(axisLine)

  // X-axis labels
  let labelLine = ' '.repeat(LABEL_W + 1)
  for (let i = 0; i < decay.length; i++) {
    const lbl = decay[i].period + 'd'
    if (i > 0) labelLine += ' '.repeat(GAP)
    labelLine += lbl.padStart(Math.floor(BAR_WIDTH / 2) + Math.floor(lbl.length / 2)).padEnd(BAR_WIDTH)
  }
  lines.push(labelLine)

  // Value labels below
  let valLine = ' '.repeat(LABEL_W + 1)
  for (let i = 0; i < decay.length; i++) {
    const val = decay[i].ic.toFixed(3)
    if (i > 0) valLine += ' '.repeat(GAP)
    valLine += val.padStart(Math.floor(BAR_WIDTH / 2) + Math.floor(val.length / 2)).padEnd(BAR_WIDTH)
  }
  lines.push(valLine)

  // Determine color class based on best IC
  const bestIc = Math.max(...decay.map((d) => Math.abs(d.ic)))
  const colorClass = bestIc > 0.05 ? 'decay-green' : bestIc > 0.02 ? 'decay-amber' : 'decay-red'

  return (
    <div className="decay-chart">
      <pre className={`ascii-chart ${colorClass}`}>{lines.join('\n')}</pre>
    </div>
  )
}
