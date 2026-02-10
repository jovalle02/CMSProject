import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getContentEntries, getContentEntry, createEntry, updateEntry } from '../../api';
import MarkdownPreview from '../../components/MarkdownPreview';

export default function EntryForm() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [collection, setCollection] = useState(null);
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Get collection info (with fields)
        const listRes = await getContentEntries(slug, { per_page: 1 });
        setCollection(listRes.collection);

        if (isEdit) {
          const entryRes = await getContentEntry(slug, id);
          setFormData(entryRes.data.data);
          setStatus(entryRes.data.status);
        } else {
          // Set defaults
          const defaults = {};
          listRes.collection.fields.forEach((f) => {
            if (f.default !== undefined) defaults[f.name] = f.default;
            else if (f.type === 'boolean') defaults[f.name] = false;
            else defaults[f.name] = '';
          });
          setFormData(defaults);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, id, isEdit]);

  function updateValue(name, value) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await updateEntry(slug, id, { data: formData, status });
      } else {
        await createEntry(slug, { data: formData, status });
      }
      navigate(`/admin/${slug}`);
    } catch (err) {
      setError(err.message);
      if (err.details) {
        setError(err.details.map((d) => `${d.field}: ${d.message}`).join(', '));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (error && !collection) return <div className="error-message">{error}</div>;
  if (!collection) return null;

  return (
    <div className="entry-form">
      <Link to={`/admin/${slug}`} className="back-link">{collection.name} Entries</Link>
      <h1>{isEdit ? 'Edit Entry' : 'New Entry'}</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {collection.fields.map((field) => (
          <div key={field.name} className="form-group">
            {field.type === 'markdown' ? (
              <MarkdownPreview
                label={`${field.label}${field.required ? ' *' : ''}`}
                value={formData[field.name] || ''}
                onChange={(val) => updateValue(field.name, val)}
              />
            ) : field.type === 'text' ? (
              <>
                <label>{field.label}{field.required && ' *'}</label>
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => updateValue(field.name, e.target.value)}
                  rows={4}
                  required={field.required}
                />
              </>
            ) : field.type === 'boolean' ? (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(formData[field.name])}
                  onChange={(e) => updateValue(field.name, e.target.checked)}
                />
                {field.label}
              </label>
            ) : field.type === 'select' ? (
              <>
                <label>{field.label}{field.required && ' *'}</label>
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => updateValue(field.name, e.target.value)}
                  required={field.required}
                >
                  <option value="">Select...</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </>
            ) : field.type === 'number' ? (
              <>
                <label>{field.label}{field.required && ' *'}</label>
                <input
                  type="number"
                  value={formData[field.name] ?? ''}
                  onChange={(e) => updateValue(field.name, e.target.value === '' ? '' : Number(e.target.value))}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step="any"
                />
              </>
            ) : field.type === 'date' ? (
              <>
                <label>{field.label}{field.required && ' *'}</label>
                <input
                  type="date"
                  value={formData[field.name] || ''}
                  onChange={(e) => updateValue(field.name, e.target.value)}
                  required={field.required}
                />
              </>
            ) : (
              <>
                <label>{field.label}{field.required && ' *'}</label>
                <input
                  type="text"
                  value={formData[field.name] || ''}
                  onChange={(e) => updateValue(field.name, e.target.value)}
                  required={field.required}
                  maxLength={field.maxLength || undefined}
                />
              </>
            )}
          </div>
        ))}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Entry' : 'Create Entry'}
          </button>
          <button type="button" className="btn" onClick={() => navigate(`/admin/${slug}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
