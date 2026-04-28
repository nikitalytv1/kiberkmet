import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api/parcele';

// Raba values from Slovenian land use classification
const RABA_OPTIONS = [
  { value: 1100, label: 'Njiva' },
  { value: 1160, label: 'Hmeljišče' },
  { value: 1180, label: 'Trajne rastline' },
  { value: 1190, label: 'Rastlinjak' },
  { value: 1211, label: 'Vinograd' },
  { value: 1212, label: 'Matičnjak' },
  { value: 1221, label: 'Intenzivni sadovnjak' },
  { value: 1222, label: 'Ekstenzivni sadovnjak' },
  { value: 1230, label: 'Oljčnik' },
  { value: 1240, label: 'Ostali trajni nasadi' },
  { value: 1300, label: 'Trajni travnik' },
  { value: 1321, label: 'Barjanski travnik' },
  { value: 1410, label: 'Zaraščajoče kmetijsko zemljišče' },
  { value: 1420, label: 'Plantaža gozdnega drevja' },
  { value: 1500, label: 'Drevesa in grmičevje' },
  { value: 1800, label: 'KMZGO: kmetijsko z drevjem' },
  { value: 2000, label: 'Gozd' },
  { value: 3000, label: 'Pozidano' },
  { value: 4100, label: 'Barje' },
  { value: 4210, label: 'Trstje' },
  { value: 4220, label: 'Ostalo zamočvirjeno' },
  { value: 5000, label: 'Suho odprto' },
  { value: 6000, label: 'Odprto' },
  { value: 7000, label: 'Voda' }
];

// Helper to get label from raba value
const getRabaLabel = (value) => {
  const opt = RABA_OPTIONS.find(o => o.value === Number(value));
  return opt ? `${opt.value} - ${opt.label}` : value;
};

// Sample GeoJSON polygon (a simple square)
const samplePolygon = {
  type: 'Polygon',
  coordinates: [[
    [14.0, 45.0],
    [14.1, 45.0],
    [14.1, 45.1],
    [14.0, 45.1],
    [14.0, 45.0]
  ]]
};

function ParceleTest() {
  const [parcele, setParcele] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    gerk_pid: '',
    typeOfUse: ''
  });
  const [updateData, setUpdateData] = useState({
    typeOfUse: ''
  });

  // GET all
  const fetchParcele = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setParcele(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // GET by id
  const fetchParcela = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      alert(`Fetched: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // POST
  const createParcela = async () => {
    if (!formData.gerk_pid || !formData.typeOfUse) {
      setError('Fill all fields: gerk_pid, typeOfUse');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gerk_pid: formData.gerk_pid,
          typeOfUse: formData.typeOfUse,
          coordinates: samplePolygon
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create');
      }
      const data = await res.json();
      alert(`Created: ${JSON.stringify(data, null, 2)}`);
      fetchParcele();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // PUT
  const updateParcela = async () => {
    if (!selectedId || !updateData.typeOfUse) {
      setError('Select a parcela and enter typeOfUse');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeOfUse: updateData.typeOfUse,
          coordinates: samplePolygon
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }
      const data = await res.json();
      alert(`Updated: ${JSON.stringify(data, null, 2)}`);
      fetchParcele();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const deleteParcela = async (id) => {
    if (!confirm('Delete this parcela?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      alert('Deleted successfully');
      setSelectedId(null);
      fetchParcele();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcele();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Parcele CRUD Test</h1>
      
      {error && (
        <div style={{ background: '#fee', color: '#c00', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
          Error: {error}
        </div>
      )}
      
      {loading && <p>Loading...</p>}

      {/* CREATE */}
      <section style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Create (POST)</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="gerk_pid (e.g. 12345678)"
            value={formData.gerk_pid}
            onChange={e => setFormData({ ...formData, gerk_pid: e.target.value })}
            style={{ padding: '8px' }}
          />
          <select
            value={formData.typeOfUse}
            onChange={e => setFormData({ ...formData, typeOfUse: e.target.value })}
            style={{ padding: '8px', minWidth: '200px' }}
          >
            <option value="">-- Izberi raba --</option>
            {RABA_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.value} - {opt.label}
              </option>
            ))}
          </select>
          <button onClick={createParcela} disabled={loading} style={{ padding: '8px 16px' }}>
            Create
          </button>
        </div>
      </section>

      {/* UPDATE */}
      <section style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Update (PUT)</h3>
        <p style={{ fontSize: '12px', color: '#666' }}>Select a parcela from the list below</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={updateData.typeOfUse}
            onChange={e => setUpdateData({ ...updateData, typeOfUse: e.target.value })}
            style={{ padding: '8px', minWidth: '200px' }}
          >
            <option value="">-- Izberi raba --</option>
            {RABA_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.value} - {opt.label}
              </option>
            ))}
          </select>
          <button onClick={updateParcela} disabled={loading || !selectedId} style={{ padding: '8px 16px' }}>
            Update Selected
          </button>
        </div>
      </section>

      {/* LIST */}
      <section style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3>All Parcele (GET)</h3>
          <button onClick={fetchParcele} disabled={loading}>Refresh</button>
        </div>
        
        {parcele.length === 0 ? (
          <p>No parcele found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Select</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>gerk_pid</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>typeOfUse</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parcele.map(p => (
                <tr key={p.id} style={{ background: selectedId === p.id ? '#e0f0ff' : 'transparent' }}>
                  <td style={{ padding: '8px' }}>
                    <input
                      type="radio"
                      name="selected"
                      checked={selectedId === p.id}
                      onChange={() => setSelectedId(p.id)}
                    />
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{p.id.slice(0, 8)}...</td>
                  <td style={{ padding: '8px' }}>{p.gerk_pid}</td>
                  <td style={{ padding: '8px' }}>{p.typeOfUse}</td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => fetchParcela(p.id)} style={{ marginRight: '5px' }}>View</button>
                    <button onClick={() => deleteParcela(p.id)} style={{ color: '#c00' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default ParceleTest;