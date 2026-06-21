import { useState } from 'react';
import styles from './settings.module.css';
import { useLanguage } from '../../context/LanguageContext';
import { changePassword } from '../../api/auth';

function Label({ children }: { children: React.ReactNode }) {
  return <p className={styles.labelText}>{children}</p>;
}

export default function SecurityTab() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);
    if (next !== confirm) { setError(t('security.error.mismatch')); return; }
    if (next.length < 8) { setError(t('security.error.short')); return; }
    setSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('security.error.generic'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{t('security.section.password')}</p>
      <div className={styles.field}>
        <Label>{t('security.currentPassword')}</Label>
        <input className={styles.input} type="password" placeholder="••••••••" value={current} onChange={e => setCurrent(e.target.value)} />
      </div>
      <div className={styles.field}>
        <Label>{t('security.newPassword')}</Label>
        <input className={styles.input} type="password" placeholder="••••••••" value={next} onChange={e => setNext(e.target.value)} />
      </div>
      <div className={styles.field}>
        <Label>{t('security.confirmPassword')}</Label>
        <input className={styles.input} type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
      </div>
      {error && <p className={styles.formError}>{error}</p>}
      {success && <p className={styles.formSuccess}>{t('security.success')}</p>}
      <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
        {saving ? t('security.updating') : t('security.update')}
      </button>
    </div>
  );
}
