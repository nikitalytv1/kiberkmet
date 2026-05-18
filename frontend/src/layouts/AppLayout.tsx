import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Map, Layers, Settings, ChartNoAxesCombined } from 'lucide-react';
import styles from './AppLayout.module.css';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { prefetchRegionParcele, prefetchStatisticalRegions } from '../api/regions';

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navItems = [
    { label: t('nav.map'), icon: Map, to: '/map' },
    { label: t('nav.parcels'), icon: Layers, to: '/dashboard' },
    { label: t('nav.regions'), icon: ChartNoAxesCombined, to: '/regions' },
    { label: t('nav.settings'), icon: Settings, to: '/settings' },
  ];

  useEffect(() => {
    prefetchStatisticalRegions();
    prefetchRegionParcele('08');
  }, []);

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <img src="/logo.svg" alt="kiberkmet" className={styles.logoImg} />
          <span className={styles.logoText}>kiberkmet</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={label}
              to={to}
              onMouseEnter={() => {
                if (to === '/regions') {
                  prefetchStatisticalRegions();
                  prefetchRegionParcele('08');
                }
              }}
              onFocus={() => {
                if (to === '/regions') {
                  prefetchStatisticalRegions();
                  prefetchRegionParcele('08');
                }
              }}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} className={isActive ? styles.navIconActive : styles.navIcon} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.account}>
          <div className={styles.accountInner} onClick={() => navigate('/settings/profile')} style={{ cursor: 'pointer' }}>
            <div className={styles.avatar}>{user ? initials(user.name) : '?'}</div>
            <div className={styles.accountInfo}>
              <p className={styles.accountName}>{user?.name ?? ''}</p>
              <p className={styles.accountEmail}>{user?.email ?? ''}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export default AppLayout;
