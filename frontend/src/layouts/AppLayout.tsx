import { Outlet, NavLink } from 'react-router-dom';
import { Map, Layers, Link, Settings, ChevronRight } from 'lucide-react';
import styles from './AppLayout.module.css';

const navItems = [
  { label: 'Zemljevid', icon: Map, to: '/map' },
  { label: 'Moje parcele', icon: Layers, to: '/dashboard' },
  { label: 'Veriga blokov', icon: Link, to: '/blockchain' },
  { label: 'Nastavitve', icon: Settings, to: '/settings' },
];

function AppLayout() {
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
            <div className={styles.avatar}>JN</div>
            <div className={styles.accountInfo}>
              <p className={styles.accountName}>Janez Novak</p>
              <p className={styles.accountEmail}>janez@primer.si</p>
            </div>
            <ChevronRight size={13} className={styles.accountChevron} />
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
