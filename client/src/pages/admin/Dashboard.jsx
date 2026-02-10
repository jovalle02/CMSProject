import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCollections, deleteCollection } from '../../api';

export default function Dashboard() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    getCollections()
      .then((res) => setCollections(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, name) {
    if (!confirm(`Delete collection "${name}" and all its entries?`)) return;
    try {
      await deleteCollection(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>Collections</h1>
        <Link to="/admin/collections/new" className="btn btn--primary">
          + New Collection
        </Link>
      </div>
      {collections.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Fields</th>
              <th>Entries</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((col) => (
              <tr key={col.id}>
                <td><strong>{col.name}</strong></td>
                <td><code>{col.slug}</code></td>
                <td>{col.fields.length}</td>
                <td>{col.entry_count}</td>
                <td className="data-table__actions">
                  <button className="btn btn--small" onClick={() => navigate(`/admin/${col.slug}`)}>
                    Entries
                  </button>
                  <button className="btn btn--small" onClick={() => navigate(`/admin/collections/${col.id}`)}>
                    Edit
                  </button>
                  <button className="btn btn--small btn--danger" onClick={() => handleDelete(col.id, col.name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">No collections yet. Create your first one!</p>
      )}
    </div>
  );
}
