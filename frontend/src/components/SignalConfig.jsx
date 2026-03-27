import './SignalConfig.css'

const SP100_TICKERS = [
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

const TICKER_NAMES = {
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

const WIKI_TITLES = {
  "AAPL": "Apple Inc.", "ABBV": "AbbVie", "ABT": "Abbott Laboratories",
  "AMZN": "Amazon (company)", "BA": "Boeing", "BAC": "Bank of America",
  "BRK-B": "Berkshire Hathaway", "DIS": "The Walt Disney Company",
  "GOOG": "Alphabet Inc.", "GS": "Goldman Sachs", "HD": "The Home Depot",
  "JNJ": "Johnson & Johnson", "JPM": "JPMorgan Chase", "KO": "The Coca-Cola Company",
  "META": "Meta Platforms", "MSFT": "Microsoft", "NFLX": "Netflix",
  "NVDA": "Nvidia", "PG": "Procter & Gamble", "TSLA": "Tesla, Inc.",
  "V": "Visa Inc.", "WMT": "Walmart",
}

export function getDefaultKeyword(ticker) {
  return `${TICKER_NAMES[ticker] || ticker} stock`
}

export function getDefaultWikiPage(ticker) {
  return WIKI_TITLES[ticker] || TICKER_NAMES[ticker] || ticker
}

export function getSignalLabel(signal) {
  const labels = {
    trends_7d: 'google trends 7d',
    trends_30d: 'google trends 30d',
    reddit_7d: 'reddit 7d',
    wiki_7d: 'wikipedia 7d',
  }
  return labels[signal] || signal
}

export { SP100_TICKERS, TICKER_NAMES }

export default function SignalConfig({ signal, config, onChange }) {
  const isTrends = signal === 'trends_7d' || signal === 'trends_30d'
  const isReddit = signal === 'reddit_7d'
  const isWiki = signal === 'wiki_7d'

  const handleTicker = (e) => {
    const newTicker = e.target.value
    const updates = { ticker: newTicker }
    if (isTrends) updates.keyword = getDefaultKeyword(newTicker)
    if (isWiki) updates.wikiPage = getDefaultWikiPage(newTicker)
    onChange({ ...config, ...updates })
  }

  const label = getSignalLabel(signal)

  return (
    <div className="signal-config-panel">
      <div className="config-rule">
        <span className="config-rule-dash">{'\u2500\u2500'}</span>
        <span>configure: {label}</span>
        <span className="config-rule-line"></span>
      </div>

      <div className="config-fields">
        <div className="config-field">
          <label>ticker:</label>
          <select value={config.ticker} onChange={handleTicker}>
            {SP100_TICKERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {isTrends && (
          <div className="config-field">
            <label>keyword:</label>
            <input
              type="text"
              value={config.keyword}
              onChange={(e) => onChange({ ...config, keyword: e.target.value })}
              spellCheck={false}
            />
          </div>
        )}

        {isReddit && (
          <div className="config-field">
            <label>subreddits:</label>
            <div className="subreddit-toggle">
              <button
                className={!config.includeWSB ? 'active' : ''}
                onClick={() => onChange({ ...config, includeWSB: false })}
              >
                [ r/stocks + r/investing ]
              </button>
              <button
                className={config.includeWSB ? 'active' : ''}
                onClick={() => onChange({ ...config, includeWSB: true })}
              >
                [ + r/wallstreetbets ]
              </button>
            </div>
          </div>
        )}

        {isWiki && (
          <div className="config-field">
            <label>page:</label>
            <input
              type="text"
              value={config.wikiPage}
              onChange={(e) => onChange({ ...config, wikiPage: e.target.value })}
              spellCheck={false}
            />
          </div>
        )}
      </div>

      <div className="config-hint">
        {isTrends && (
          <>
            <span className="hint-line">this exact phrase is searched on google trends</span>
            <span className="hint-line hint-tip">try the CEO's name instead — e.g. "Elon Musk" for TSLA</span>
          </>
        )}
        {isReddit && (
          <span className="hint-line">wallstreetbets is noisier and more sentiment-driven</span>
        )}
        {isWiki && (
          <span className="hint-line">try the CEO's Wikipedia page instead — e.g. "Reed Hastings"</span>
        )}
      </div>
    </div>
  )
}
