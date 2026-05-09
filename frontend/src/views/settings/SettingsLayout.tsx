import { useState } from 'react';
import { User, Lock, Globe, Trash2 } from 'lucide-react';
import styles from './settings.module.css';

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

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={styles.toggle}
      style={{ backgroundColor: value ? '#1A4D3A' : '#e5e7eb' }}
    >
      <span
        className={styles.toggleDot}
        style={{ transform: value ? 'translateX(18px)' : 'translateX(4px)' }}
      />
    </button>
  );
}

function ProfileTab() {
  return (
    <>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Avatar</p>
        <div className={styles.avatarRow}>
          <div className={styles.avatar}>JN</div>
          <div>
            <button className={styles.btnOutline}>Naloži sliko</button>
            <p className={styles.avatarUploadHint}>JPG, PNG, max 2 MB</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Osebni podatki</p>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <Label>Ime</Label>
            <input className={styles.input} defaultValue="Janez" />
          </div>
          <div className={styles.field}>
            <Label>Priimek</Label>
            <input className={styles.input} defaultValue="Novak" />
          </div>
        </div>
        <div className={styles.field}>
          <Label hint="Uporablja se za prijavo in obvestila">E-pošta</Label>
          <input className={styles.input} defaultValue="janez@primer.si" />
        </div>
        <button className={styles.btnPrimary}>Shrani</button>
      </div>
    </>
  );
}

function SecurityTab() {
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Geslo</p>
        <div className={styles.field}>
          <Label>Trenutno geslo</Label>
          <input className={styles.input} type="password" placeholder="••••••••" />
        </div>
        <div className={styles.field}>
          <Label>Novo geslo</Label>
          <input className={styles.input} type="password" placeholder="••••••••" />
        </div>
        <div className={styles.field}>
          <Label>Potrdi novo geslo</Label>
          <input className={styles.input} type="password" placeholder="••••••••" />
        </div>
        <button className={styles.btnPrimary}>Posodobi geslo</button>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Dvostopenjska avtentikacija</p>
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <p className={styles.toggleLabel}>Omogoči 2FA</p>
            <p className={styles.toggleHint}>Zahteva kodo ob vsaki prijavi</p>
          </div>
          <Toggle value={twoFactor} onChange={setTwoFactor} />
        </div>
      </div>
    </>
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
  return (
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