import './InlineExplainer.css'

export default function InlineExplainer({ title, body }) {
  return (
    <div className="inline-explainer">
      <span className="explainer-title">{title}</span>
      <p className="explainer-body">{body}</p>
    </div>
  )
}
