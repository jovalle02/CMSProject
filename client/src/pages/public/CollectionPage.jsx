import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContentEntries } from '../../api';

function getExcerpt(entry, fields) {
  const textField = fields.find((f) => f.type === 'markdown' || f.type === 'text');
  if (textField && entry.data[textField.name]) {
    const text = entry.data[textField.name];
    // Strip markdown syntax for excerpt
    const plain = text.replace(/[#*`>\[\]|_~-]/g, '').replace(/\n+/g, ' ').trim();
    return plain.length > 150 ? plain.slice(0, 150) + '...' : plain;
  }
  return '';
}

function getTitle(entry, fields) {
  const titleField = fields.find(
    (f) => f.name === 'title' || f.name === 'name' || f.type === 'string'
  );
  return titleField ? entry.data[titleField.name] || `Entry #${entry.id}` : `Entry #${entry.id}`;
}

export default function CollectionPage() {
  const { slug } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getContentEntries(slug, { status: 'published' })
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!result) return null;

  const { collection, data, pagination } = result;

  return (
    <div className="collection-page">
      <div className="collection-page__header">
        <Link to="/" className="back-link">Home</Link>
        <h1>{collection.name}</h1>
        {collection.description && <p>{collection.description}</p>}
      </div>
      <div className="entry-list-public">
        {data.map((entry) => (
          <Link to={`/${slug}/${entry.id}`} key={entry.id} className="entry-card">
            <h2 className="entry-card__title">{getTitle(entry, collection.fields)}</h2>
            <p className="entry-card__excerpt">{getExcerpt(entry, collection.fields)}</p>
            <span className="entry-card__date">
              {new Date(entry.created_at).toLocaleDateString()}
            </span>
          </Link>
        ))}
      </div>
      {data.length === 0 && <p className="empty">No published entries yet.</p>}
      {pagination.total_pages > 1 && (
        <div className="pagination-info">
          Page {pagination.page} of {pagination.total_pages} ({pagination.total} entries)
        </div>
      )}
    </div>
  );
}
