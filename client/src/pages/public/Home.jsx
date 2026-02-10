import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCollections } from '../../api';

export default function Home() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCollections()
      .then((res) => setCollections(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home">
      <div className="home__hero">
        <h1>Dynamic CMS</h1>
        <p>Browse our content collections</p>
      </div>
      <div className="card-grid">
        {collections.map((col) => (
          <Link to={`/${col.slug}`} key={col.id} className="card">
            <h2 className="card__title">{col.name}</h2>
            {col.description && <p className="card__desc">{col.description}</p>}
            <span className="card__count">
              {col.entry_count} {col.entry_count === 1 ? 'entry' : 'entries'}
            </span>
          </Link>
        ))}
      </div>
      {collections.length === 0 && (
        <p className="empty">No collections yet. <Link to="/admin">Create one in the admin panel</Link>.</p>
      )}
    </div>
  );
}
