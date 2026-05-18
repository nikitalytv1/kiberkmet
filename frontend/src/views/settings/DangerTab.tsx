import styles from './settings.module.css';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function DangerTab() {
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
