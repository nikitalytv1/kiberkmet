import { useState } from 'react';
import { User, Lock, Globe, Trash2 } from 'lucide-react';
import styles from './settings.module.css';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

type Tab = 'profile' | 'security' | 'language' | 'danger';

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile',  label: 'Profil',          icon: User },
  { id: 'security', label: 'Varnost',          icon: Lock },
  { id: 'language', label: 'Jezik',            icon: Globe },
  { id: 'danger',   label: 'Nevarno območje',  icon: Trash2 },
];

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
      setError(err instanceof Error ? err.message : 'Napaka pri shranjevanju.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Avatar</p>
        <div className={styles.avatarRow}>
          <div className={styles.avatar}>{user ? initials(user.name) : '?'}</div>
          <div>
            <p className={styles.avatarName}>{user?.name ?? ''}</p>
            <p className={styles.avatarEmail}>{user?.email ?? ''}</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Osebni podatki</p>
        <div className={styles.field}>
          <Label hint="Ime in priimek">Ime</Label>
          <input className={styles.input} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className={styles.field}>
          <Label hint="Uporablja se za prijavo in obvestila">E-pošta</Label>
          <input className={styles.input} value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {error && <p className={styles.formError}>{error}</p>}
        {success && <p className={styles.formSuccess}>Shranjeno.</p>}
        <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
          {saving ? 'Shranjujem ...' : 'Shrani'}
        </button>
      </div>
    </>
  );
}

function SecurityTab() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);
    if (next !== confirm) { setError('Novi gesli se ne ujemata.'); return; }
    if (next.length < 8) { setError('Novo geslo mora imeti vsaj 8 znakov.'); return; }
    setSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Napaka pri spremembi gesla.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>Geslo</p>
      <div className={styles.field}>
        <Label>Trenutno geslo</Label>
        <input className={styles.input} type="password" placeholder="••••••••" value={current} onChange={e => setCurrent(e.target.value)} />
      </div>
      <div className={styles.field}>
        <Label>Novo geslo</Label>
        <input className={styles.input} type="password" placeholder="••••••••" value={next} onChange={e => setNext(e.target.value)} />
      </div>
      <div className={styles.field}>
        <Label>Potrdi novo geslo</Label>
        <input className={styles.input} type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
      </div>
      {error && <p className={styles.formError}>{error}</p>}
      {success && <p className={styles.formSuccess}>Geslo uspešno posodobljeno.</p>}
      <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
        {saving ? 'Posodabljam ...' : 'Posodobi geslo'}
      </button>
    </div>
  );
}

function LanguageTab() {
  const [lang, setLang] = useState('sl');

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>Jezik</p>
      <div className={styles.field}>
        <Label>Jezik aplikacije</Label>
        <select
          className={styles.select}
          value={lang}
          onChange={e => setLang(e.target.value)}
        >
          <option value="sl">🇸🇮 Slovenščina</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>
      <button className={styles.btnPrimary}>Shrani</button>
    </div>
  );
}

function DangerTab() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
    <div className={styles.section}>
      <p className={styles.sectionTitle}>Seja</p>
      <div className={styles.dangerRow}>
        <div>
          <p className={styles.dangerRowTitle}>Odjava</p>
          <p className={styles.dangerRowSub}>Zapri trenutno sejo</p>
        </div>
        <button className={styles.btnOutline} onClick={handleLogout}>Odjava</button>
      </div>
    </div>
    <div className={styles.section}>
      <p className={styles.sectionTitle}>Nevarno območje</p>
      <div className={styles.dangerRow}>
        <div>
          <p className={styles.dangerRowTitle}>Izbriši vse parcele</p>
          <p className={styles.dangerRowSub}>Trajno odstrani vse parcele in analize</p>
        </div>
        <button className={styles.btnDangerOutline}>Izbriši</button>
      </div>
      <hr className={styles.divider} />
      <div className={styles.dangerRow}>
        <div>
          <p className={styles.dangerRowTitle}>Izbriši račun</p>
          <p className={styles.dangerRowSub}>Trajno izbriše vaš račun in vse podatke</p>
        </div>
        <button className={styles.btnDangerFill}>Izbriši račun</button>
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
  const Content = tabContent[active];

  return (
    <main className={styles.main}>
      <aside className={styles.aside}>
        <p className={styles.asideLabel}>Nastavitve</p>
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