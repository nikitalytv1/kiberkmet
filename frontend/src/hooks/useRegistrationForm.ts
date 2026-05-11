import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth';

export function useRegistrationForm() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ime in priimek sta obvezna.');
      return;
    }
    if (!email.trim()) {
      setError('E-pošta je obvezna.');
      return;
    }
    if (password.length < 8) {
      setError('Geslo mora imeti vsaj 8 znakov.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Gesli se ne ujemata.');
      return;
    }
    setLoading(true);
    try {
      await register({ name: `${firstName} ${lastName}`, email, password });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Strežnik ni dosegljiv.');
    } finally {
      setLoading(false);
    }
  }

  return {
    fields: { firstName, lastName, email, password, confirmPassword },
    setters: { setFirstName, setLastName, setEmail, setPassword, setConfirmPassword },
    error,
    loading,
    handleSubmit,
  };
}
