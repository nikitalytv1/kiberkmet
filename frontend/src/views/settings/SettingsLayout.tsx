import { useState } from 'react';
import { User, Lock, Globe, Trash2 } from 'lucide-react';
import styles from './settings.module.css';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { updateProfile, changePassword } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

type Tab = 'profile' | 'security' | 'language' | 'danger';

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

function ProfileTab() {
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

function SecurityTab() {
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

function LanguageTab() {
  const { lang, setLang, t } = useLanguage();
  const [selected, setSelected] = useState(lang);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setLang(selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{t('language.section')}</p>
      <div className={styles.field}>
        <Label>{t('language.app')}</Label>
        <select
          className={styles.select}
          value={selected}
          onChange={e => { setSelected(e.target.value as 'sl' | 'en'); setSaved(false); }}
        >
          <option value="sl">🇸🇮 Slovenščina</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>
      {saved && <p className={styles.formSuccess}>{t('profile.saved')}</p>}
      <button className={styles.btnPrimary} onClick={handleSave} disabled={selected === lang}>
        {t('language.save')}
      </button>
    </div>
  );
}

function DangerTab() {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{t('danger.section.session')}</p>
      <div className={styles.dangerRow}>
        <div>
          <p className={styles.dangerRowTitle}>{t('danger.logout.title')}</p>
          <p className={styles.dangerRowSub}>{t('danger.logout.sub')}</p>
        </div>
        <button className={styles.btnOutline} onClick={handleLogout}>{t('danger.logout.btn')}</button>
      </div>
    </div>
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{t('danger.section.danger')}</p>
      <div className={styles.dangerRow}>
        <div>
          <p className={styles.dangerRowTitle}>{t('danger.deleteParcels.title')}</p>
          <p className={styles.dangerRowSub}>{t('danger.deleteParcels.sub')}</p>
        </div>
        <button className={styles.btnDangerOutline}>{t('danger.deleteParcels.btn')}</button>
      </div>
      <hr className={styles.divider} />
      <div className={styles.dangerRow}>
        <div>
          <p className={styles.dangerRowTitle}>{t('danger.deleteAccount.title')}</p>
          <p className={styles.dangerRowSub}>{t('danger.deleteAccount.sub')}</p>
        </div>
        <button className={styles.btnDangerFill}>{t('danger.deleteAccount.btn')}</button>
      </div>
    </div>
    </>
  );
}

const tabContent: Record<Tab, React.FC> = {
  profile: ProfileTab, security: SecurityTab, language: LanguageTab, danger: DangerTab,
};

function SettingsLayout() {
  const [active, setActive] = useState<Tab>('profile');
  const { t } = useLanguage();
  const Content = tabContent[active];

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile',  label: t('settings.tabs.profile'),   icon: User },
    { id: 'security', label: t('settings.tabs.security'),  icon: Lock },
    { id: 'language', label: t('settings.tabs.language'),  icon: Globe },
    { id: 'danger',   label: t('settings.tabs.danger'),    icon: Trash2 },
  ];

  return (
    <main className={styles.main}>
      <aside className={styles.aside}>
        <p className={styles.asideLabel}>{t('settings.title')}</p>
        {tabs.map(({ id, label, icon: Icon }) => {
          const isDanger = id === 'danger';
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={[
                styles.tabBtn,
                isActive ? styles.tabBtnActive : '',
                !isActive && isDanger ? styles.tabBtnDanger : '',
              ].join(' ')}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </aside>

      <div className={styles.content}>
        <div className={styles.inner}>
          <Content />
        </div>
      </div>
    </main>
  );
}

export default SettingsLayout;
