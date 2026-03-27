import { useNavigate } from 'react-router-dom'
import './Landing.css'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <div className="landing-content">
        <h1 className="wordmark">basis</h1>
        <p className="tagline">can the internet predict the stock market?</p>
        <p className="tagline-sub">
          a signal is any data source you think might predict stock returns. basis tests three.
        </p>

        <div className="feature-grid">
          <div className="feature">
            <span className="feature-name">google trends</span>
            <span className="feature-desc">
              when people google a stock more than usual — does the price follow?
            </span>
          </div>
          <div className="feature">
            <span className="feature-name">reddit sentiment</span>
            <span className="feature-desc">
              does reddit hype actually predict returns?
            </span>
          </div>
          <div className="feature">
            <span className="feature-name">wikipedia activity</span>
            <span className="feature-desc">
              do wikipedia spikes signal something the market cares about?
            </span>
          </div>
        </div>

        <button className="cta" onClick={() => navigate('/research')}>
          [ test a signal → ]
        </button>

        <p className="footer-note">built on S&P 100 · 2018–2022 · educational only</p>
      </div>
    </div>
  )
}
