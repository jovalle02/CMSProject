import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getContentEntry } from '../../api';

function renderField(field, value) {
  if (value === undefined || value === null || value === '') return null;

  switch (field.type) {
    case 'markdown':
      return (
        <div key={field.name} className="entry-field entry-field--markdown">
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          </div>
        </div>
      );
    case 'boolean':
      return (
        <div key={field.name} className="entry-field">
          <span className="entry-field__label">{field.label}: </span>
          <span className={`badge badge--${value ? 'yes' : 'no'}`}>{value ? 'Yes' : 'No'}</span>
        </div>
      );
    case 'date':
      return (
        <div key={field.name} className="entry-field">
          <span className="entry-field__label">{field.label}: </span>
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
      );
    case 'number':
      return (
        <div key={field.name} className="entry-field">
          <span className="entry-field__label">{field.label}: </span>
          <span>{typeof value === 'number' && field.name.includes('price') ? `$${value.toFixed(2)}` : value}</span>
        </div>
      );
    default:
      return (
        <div key={field.name} className="entry-field">
          <span className="entry-field__label">{field.label}: </span>
          <span>{String(value)}</span>
        </div>
      );
  }
}

export default function EntryPage() {
  const { slug, id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getContentEntry(slug, id)
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!result) return null;

  const { collection, data: entry } = result;
  const titleField = collection.fields.find(
    (f) => f.name === 'title' || f.name === 'name' || f.type === 'string'
  );
  const title = titleField ? entry.data[titleField.name] : `Entry #${entry.id}`;

  return (
    <div className="entry-page">
      <Link to={`/${slug}`} className="back-link">{collection.name}</Link>
      <article className="entry-page__article">
        <h1 className="entry-page__title">{title}</h1>
        <div className="entry-page__meta">
          <span>{new Date(entry.created_at).toLocaleDateString()}</span>
        </div>
        <div className="entry-page__fields">
          {collection.fields
            .filter((f) => f !== titleField)
            .map((field) => renderField(field, entry.data[field.name]))}
        </div>
      </article>
    </div>
  );
}
