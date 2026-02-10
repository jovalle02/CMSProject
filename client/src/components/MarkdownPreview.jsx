import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownPreview({ value, onChange, label }) {
  return (
    <div className="markdown-editor">
      {label && <label className="markdown-editor__label">{label}</label>}
      <div className="markdown-editor__split">
        <div className="markdown-editor__pane">
          <div className="markdown-editor__pane-header">Markdown</div>
          <textarea
            className="markdown-editor__textarea"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your markdown here..."
          />
        </div>
        <div className="markdown-editor__pane">
          <div className="markdown-editor__pane-header">Preview</div>
          <div className="markdown-editor__preview markdown-body">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="markdown-editor__placeholder">Preview will appear here...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
