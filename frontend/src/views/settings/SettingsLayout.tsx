import { User, Lock, Globe, Trash2 } from 'lucide-react';
import styles from './settings.module.css';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

type Tab = 'profile' | 'security' | 'language' | 'danger';

export default function SettingsLayout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile',  label: t('settings.tabs.profile'),  icon: User },
    { id: 'security', label: t('settings.tabs.security'), icon: Lock },
    { id: 'language', label: t('settings.tabs.language'), icon: Globe },
    { id: 'danger',   label: t('settings.tabs.danger'),   icon: Trash2 },
  ];

  const activeTab = tabs.find(tab => location.pathname.endsWith(tab.id))?.id ?? 'profile';

  return (
    <main className={styles.main}>
      <aside className={styles.aside}>
        <p className={styles.asideLabel}>{t('settings.title')}</p>
        {tabs.map(({ id, label, icon: Icon }) => {
          const isDanger = id === 'danger';
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
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
          <Outlet />
        </div>
      </div>
    </main>
  );
}
