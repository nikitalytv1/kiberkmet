import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/parcele';

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

const getRabaLabel = (value) => {
  const opt = RABA_OPTIONS.find(o => o.value === Number(value));
  return opt ? `${opt.value} - ${opt.label}` : value;
};

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
    const navigate = useNavigate();
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

  // INITIAL FETCH (fixed)
  useEffect(() => {
    let isMounted = true;

    const fetchParcele = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        if (isMounted) setParcele(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchParcele();

    return () => {
      isMounted = false;
    };
  }, []);

  // reusable fetch
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


  const createParcela = async () => {
    if (!formData.gerk_pid || !formData.typeOfUse) {
      setError('Fill all fields');
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

      setFormData({ gerk_pid: '', typeOfUse: '' });
      await fetchParcele();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateParcela = async () => {
    if (!selectedId || !updateData.typeOfUse) {
      setError('Select parcela + type');
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

      setUpdateData({ typeOfUse: '' });
      await fetchParcele();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteParcela = async (id) => {
  console.log("DELETE CLICKED", id);

  if (!window.confirm('Delete this parcela?')) {
    console.log("USER CANCELLED");
    return;
  }

  console.log("CONFIRMED");

  setLoading(true);
  setError(null);

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    console.log("RESPONSE STATUS:", res.status);

    setSelectedId(null);
    await fetchParcele();

  } catch (err) {
    console.error("DELETE ERROR:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Parcele CRUD Test</h1>

      {error && <div style={{ color: 'red' }}>{error}</div>}
      {loading && <p>Loading...</p>}

      {/* CREATE */}
      <h3>Create</h3>
      <input
        placeholder="gerk_pid"
        value={formData.gerk_pid}
        onChange={e => setFormData({ ...formData, gerk_pid: e.target.value })}
      />
      <select
        value={formData.typeOfUse}
        onChange={e => setFormData({ ...formData, typeOfUse: e.target.value })}
      >
        <option value="">Select raba</option>
        {RABA_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.value} - {opt.label}
          </option>
        ))}
      </select>
      <button onClick={createParcela}>Create</button>

      {/* UPDATE */}
      <h3>Update</h3>
      <select
        value={updateData.typeOfUse}
        onChange={e => setUpdateData({ ...updateData, typeOfUse: e.target.value })}
      >
        <option value="">Select raba</option>
        {RABA_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.value} - {opt.label}
          </option>
        ))}
      </select>
      <button onClick={updateParcela} disabled={!selectedId}>
        Update Selected
      </button>

      {/* LIST */}
      <h3>Parcele</h3>
      <button onClick={fetchParcele}>Refresh</button>

      {parcele.map(p => (
        <div key={p.id} style={{ borderBottom: '1px solid #ccc', padding: 8 }}>
          <input
            type="radio"
            checked={selectedId === p.id}
            onChange={() => setSelectedId(p.id)}
          />
          {p.gerk_pid} - {getRabaLabel(p.typeOfUse)}

          <button onClick={() => navigate(`/parcela/${p.id}`)}>View</button>
          <button onClick={() => deleteParcela(p.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default ParceleTest;