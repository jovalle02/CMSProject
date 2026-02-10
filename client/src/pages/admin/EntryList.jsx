import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getContentEntries, deleteEntry } from '../../api';

export default function EntryList() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    getContentEntries(slug)
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [slug]);

  async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteEntry(slug, id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!result) return null;

  const { collection, data, pagination } = result;
  const titleField = collection.fields.find(
    (f) => f.name === 'title' || f.name === 'name' || f.type === 'string'
  );

  return (
    <div className="admin-entry-list">
      <div className="admin-entry-list__header">
        <div>
          <Link to="/admin" className="back-link">Dashboard</Link>
          <h1>{collection.name} Entries</h1>
        </div>
        <Link to={`/admin/${slug}/new`} className="btn btn--primary">
          + New Entry
        </Link>
      </div>

      {data.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{titleField ? titleField.label : 'Entry'}</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>
                  <strong>{titleField ? entry.data[titleField.name] : `Entry #${entry.id}`}</strong>
                </td>
                <td>
                  <span className={`badge badge--${entry.status}`}>{entry.status}</span>
                </td>
                <td>{new Date(entry.created_at).toLocaleDateString()}</td>
                <td className="data-table__actions">
                  <button className="btn btn--small" onClick={() => navigate(`/admin/${slug}/${entry.id}`)}>
                    Edit
                  </button>
                  <button className="btn btn--small btn--danger" onClick={() => handleDelete(entry.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">No entries yet. Create your first one!</p>
      )}

      {pagination.total_pages > 1 && (
        <div className="pagination-info">
          Page {pagination.page} of {pagination.total_pages}
        </div>
      )}
    </div>
  );
}
