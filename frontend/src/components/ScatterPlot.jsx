import './ScatterPlot.css'

export default function ScatterPlot({ scatter, forwardDays }) {
  if (!scatter || scatter.length === 0) return null

  const COLS = 40
  const ROWS = 12
  const LABEL_W = 6

  const xVals = scatter.map((p) => p.x)
  const yVals = scatter.map((p) => p.y)

  const xMin = Math.min(...xVals)
  const xMax = Math.max(...xVals)
  const yMin = Math.min(...yVals)
  const yMax = Math.max(...yVals)

  const xRange = Math.max(xMax - xMin, 0.01)
  const yRange = Math.max(yMax - yMin, 0.01)

  // Build empty grid
  const grid = []
  for (let r = 0; r < ROWS; r++) {
    grid.push(new Array(COLS).fill(' '))
  }

  // Linear regression
  const n = scatter.length
  const meanX = xVals.reduce((a, b) => a + b, 0) / n
  const meanY = yVals.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xVals[i] - meanX) * (yVals[i] - meanY)
    den += (xVals[i] - meanX) * (xVals[i] - meanX)
  }
  const slope = den !== 0 ? num / den : 0
  const intercept = meanY - slope * meanX

  // Draw trend line first (so dots overlay)
  for (let c = 0; c < COLS; c++) {
    const xVal = xMin + (c / (COLS - 1)) * xRange
    const yVal = slope * xVal + intercept
    const r = Math.round((1 - (yVal - yMin) / yRange) * (ROWS - 1))
    if (r >= 0 && r < ROWS) {
      grid[r][c] = '\u2588'
    }
  }

  // Place data points
  const counts = {}
  for (const p of scatter) {
    const c = Math.round(((p.x - xMin) / xRange) * (COLS - 1))
    const r = Math.round((1 - (p.y - yMin) / yRange) * (ROWS - 1))
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      const key = `${r},${c}`
      counts[key] = (counts[key] || 0) + 1
      if (counts[key] > 1) {
        grid[r][c] = '+'
      } else if (Math.abs(p.y) < yRange * 0.05) {
        grid[r][c] = '\u00B7'
      } else {
        grid[r][c] = '*'
      }
    }
  }

  // Render lines
  const lines = []

  lines.push(`  each dot is one week. upward slope = signal worked.`)
  lines.push('')
  lines.push('  return (%)')

  for (let r = 0; r < ROWS; r++) {
    const yVal = yMax - (r / (ROWS - 1)) * yRange
    const label = (yVal >= 0 ? '+' : '') + yVal.toFixed(1) + '%'

    let line = label.padStart(LABEL_W)
    if (r === 0 || r === ROWS - 1 || Math.abs(yVal) < yRange / (ROWS * 2)) {
      line += '|'
    } else {
      line += '|'
    }
    line += grid[r].join('')
    lines.push(line)
  }

  // X-axis
  let axisLine = ' '.repeat(LABEL_W) + '+'
  axisLine += '-'.repeat(COLS)
  lines.push(axisLine)

  // X labels
  const xLabels = [xMin, (xMin + xMax) / 2, xMax]
  let xlLine = ' '.repeat(LABEL_W + 1)
  const positions = [0, Math.floor(COLS / 2), COLS - 1]
  let lastEnd = 0
  for (let i = 0; i < 3; i++) {
    const lbl = (xLabels[i] >= 0 ? '+' : '') + xLabels[i].toFixed(1)
    const pos = positions[i]
    if (pos > lastEnd) {
      xlLine += ' '.repeat(pos - lastEnd)
    }
    xlLine += lbl
    lastEnd = pos + lbl.length
  }
  lines.push(xlLine)

  lines.push(' '.repeat(LABEL_W + 1 + Math.floor(COLS / 2) - 8) + 'signal strength')

  return (
    <div className="scatter-plot">
      <pre className="ascii-chart scatter-ascii">{lines.join('\n')}</pre>
    </div>
  )
}
