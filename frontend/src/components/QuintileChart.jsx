import './QuintileChart.css'

function quintileColor(q) {
  if (q <= 2) return 'var(--red)'
  if (q === 3) return 'var(--muted)'
  return 'var(--green)'
}

export default function QuintileChart({ quintiles }) {
  if (!quintiles || quintiles.length === 0) return null

  const chartW = 400
  const chartH = 160
  const padLeft = 56
  const padBottom = 28
  const padTop = 20
  const barW = 40
  const gap = 20

  const values = quintiles.map((q) => q.mean_return)
  const maxAbs = Math.max(...values.map(Math.abs), 0.01)
  const drawH = chartH - padTop - padBottom
  const yScale = (drawH / 2) / maxAbs
  const zeroY = padTop + drawH / 2

  const totalBarsWidth = quintiles.length * barW + (quintiles.length - 1) * gap
  const startX = padLeft + ((chartW - padLeft - totalBarsWidth) / 2)

  return (
    <div className="quintile-chart">
      <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}>
        {/* Zero line */}
        <line x1={padLeft} y1={zeroY} x2={chartW} y2={zeroY} stroke="var(--rule)" strokeWidth="1" />

        {/* Y-axis labels */}
        <text x={padLeft - 8} y={zeroY + 4} textAnchor="end" className="chart-label">0.00%</text>
        <text x={padLeft - 8} y={padTop + 4} textAnchor="end" className="chart-label">
          {maxAbs.toFixed(2)}%
        </text>
        <text x={padLeft - 8} y={chartH - padBottom + 4} textAnchor="end" className="chart-label">
          -{maxAbs.toFixed(2)}%
        </text>

        {/* Bars */}
        {quintiles.map((q, i) => {
          const x = startX + i * (barW + gap)
          const val = q.mean_return
          const h = Math.abs(val) * yScale
          const y = val >= 0 ? zeroY - h : zeroY

          return (
            <g key={q.q}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill={quintileColor(q.q)}
              />
              <text
                x={x + barW / 2}
                y={val >= 0 ? y - 4 : y + h + 12}
                textAnchor="middle"
                className="chart-value"
              >
                {val.toFixed(2)}%
              </text>
              <text x={x + barW / 2} y={chartH - 8} textAnchor="middle" className="chart-label">
                Q{q.q}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="quintile-note">monotonic spread = signal has directional consistency</p>
    </div>
  )
}
