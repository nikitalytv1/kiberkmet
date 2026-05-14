import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Map, Layers, Settings, LogOut, ChartNoAxesCombined } from 'lucide-react';
import styles from './AppLayout.module.css';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Zemljevid', icon: Map, to: '/map' },
  { label: 'Moje parcele', icon: Layers, to: '/dashboard' },
  { label: 'Regije', icon: ChartNoAxesCombined, to: '/regions' },
  { label: 'Nastavitve', icon: Settings, to: '/settings' },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

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
          <div className={styles.accountInner}>
            <div className={styles.avatar}>{user ? initials(user.name) : '?'}</div>
            <div className={styles.accountInfo}>
              <p className={styles.accountName}>{user?.name ?? ''}</p>
              <p className={styles.accountEmail}>{user?.email ?? ''}</p>
            </div>
            <button
              className={styles.accountChevron}
              onClick={handleLogout}
              title="Odjava"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <LogOut size={13} />
            </button>
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
