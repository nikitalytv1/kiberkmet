import { useState } from 'react';
import styles from './settings.module.css';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { updateProfile } from '../../api/auth';

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <p className={styles.labelText}>{children}</p>
      {hint && <p className={styles.labelHint}>{hint}</p>}
    </div>
  );
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateProfile({ name: name.trim(), email: email.trim() });
      refreshUser(updated);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('profile.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t('profile.section.avatar')}</p>
        <div className={styles.avatarRow}>
          <div className={styles.avatar}>{user ? initials(user.name) : '?'}</div>
          <div>
            <p className={styles.avatarName}>{user?.name ?? ''}</p>
            <p className={styles.avatarEmail}>{user?.email ?? ''}</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>{t('profile.section.personal')}</p>
        <div className={styles.field}>
          <Label hint={t('profile.field.name.hint')}>{t('profile.field.name')}</Label>
          <input className={styles.input} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className={styles.field}>
          <Label hint={t('profile.field.email.hint')}>{t('profile.field.email')}</Label>
          <input className={styles.input} value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {error && <p className={styles.formError}>{error}</p>}
        {success && <p className={styles.formSuccess}>{t('profile.saved')}</p>}
        <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
          {saving ? t('profile.saving') : t('profile.save')}
        </button>
      </div>
    </>
  );
}
