import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCollection, createCollection, updateCollection } from '../../api';

const FIELD_TYPES = ['string', 'text', 'number', 'boolean', 'select', 'date', 'markdown'];

const emptyField = () => ({
  name: '',
  label: '',
  type: 'string',
  required: false,
  maxLength: '',
  min: '',
  max: '',
  options: '',
  default: '',
});

export default function CollectionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([emptyField()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    getCollection(id)
      .then((res) => {
        const col = res.data;
        setName(col.name);
        setDescription(col.description || '');
        setFields(
          col.fields.length > 0
            ? col.fields.map((f) => ({
                ...emptyField(),
                ...f,
                options: f.options ? f.options.join(', ') : '',
                maxLength: f.maxLength || '',
                min: f.min !== undefined ? f.min : '',
                max: f.max !== undefined ? f.max : '',
                default: f.default !== undefined ? String(f.default) : '',
              }))
            : [emptyField()]
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function updateField(index, key, value) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [key]: value } : f))
    );
  }

  function addField() {
    setFields((prev) => [...prev, emptyField()]);
  }

  function removeField(index) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const cleanedFields = fields
        .filter((f) => f.name.trim())
        .map((f) => {
          const field = {
            name: f.name.trim(),
            label: f.label.trim() || f.name.trim(),
            type: f.type,
            required: f.required,
          };
          if (f.type === 'string' && f.maxLength) field.maxLength = Number(f.maxLength);
          if (f.type === 'number' && f.min !== '') field.min = Number(f.min);
          if (f.type === 'number' && f.max !== '') field.max = Number(f.max);
          if (f.type === 'select') {
            field.options = f.options.split(',').map((o) => o.trim()).filter(Boolean);
          }
          if (f.type === 'boolean' && f.default) field.default = f.default === 'true';
          return field;
        });

      if (isEdit) {
        await updateCollection(id, { name, description, fields: cleanedFields });
      } else {
        await createCollection({ name, description, fields: cleanedFields });
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="collection-form">
      <h1>{isEdit ? 'Edit Collection' : 'New Collection'}</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Blog Posts"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
          />
        </div>

        <div className="field-builder">
          <h2>Fields</h2>
          {fields.map((field, i) => (
            <div key={i} className="field-builder__field">
              <div className="field-builder__row">
                <div className="form-group form-group--inline">
                  <label>Name</label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(i, 'name', e.target.value)}
                    placeholder="field_name"
                  />
                </div>
                <div className="form-group form-group--inline">
                  <label>Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(i, 'label', e.target.value)}
                    placeholder="Display Label"
                  />
                </div>
                <div className="form-group form-group--inline">
                  <label>Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(i, 'type', e.target.value)}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group form-group--inline form-group--checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(i, 'required', e.target.checked)}
                    />
                    Required
                  </label>
                </div>
                <button type="button" className="btn btn--small btn--danger" onClick={() => removeField(i)}>
                  Remove
                </button>
              </div>

              {/* Type-specific options */}
              {field.type === 'string' && (
                <div className="field-builder__options">
                  <div className="form-group form-group--inline">
                    <label>Max Length</label>
                    <input
                      type="number"
                      value={field.maxLength}
                      onChange={(e) => updateField(i, 'maxLength', e.target.value)}
                      placeholder="200"
                    />
                  </div>
                </div>
              )}
              {field.type === 'number' && (
                <div className="field-builder__options">
                  <div className="form-group form-group--inline">
                    <label>Min</label>
                    <input
                      type="number"
                      value={field.min}
                      onChange={(e) => updateField(i, 'min', e.target.value)}
                    />
                  </div>
                  <div className="form-group form-group--inline">
                    <label>Max</label>
                    <input
                      type="number"
                      value={field.max}
                      onChange={(e) => updateField(i, 'max', e.target.value)}
                    />
                  </div>
                </div>
              )}
              {field.type === 'select' && (
                <div className="field-builder__options">
                  <div className="form-group form-group--inline">
                    <label>Options (comma-separated)</label>
                    <input
                      type="text"
                      value={field.options}
                      onChange={(e) => updateField(i, 'options', e.target.value)}
                      placeholder="option1, option2, option3"
                    />
                  </div>
                </div>
              )}
              {field.type === 'boolean' && (
                <div className="field-builder__options">
                  <div className="form-group form-group--inline">
                    <label>Default</label>
                    <select
                      value={field.default}
                      onChange={(e) => updateField(i, 'default', e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button type="button" className="btn btn--secondary" onClick={addField}>
            + Add Field
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Collection' : 'Create Collection'}
          </button>
          <button type="button" className="btn" onClick={() => navigate('/admin')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
