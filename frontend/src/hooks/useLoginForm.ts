import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useLoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('E-pošta in geslo sta obvezna.');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Strežnik ni dosegljiv.');
    } finally {
      setLoading(false);
    }
  }

  return {
    fields: { email, password },
    setters: { setEmail, setPassword },
    error,
    loading,
    handleSubmit,
  };
}
