import { useState } from 'react';
import styles from './settings.module.css';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { deleteAllParcele } from '../../api/parcele';

export default function DangerTab() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<'parcels' | 'account' | null>(null);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleDeleteParcels() {
    if (!window.confirm(t('danger.deleteParcels.confirm') || 'Ste prepričani, da želite izbrisati vse parcele?')) return;
    setLoading('parcels');
    try {
      await deleteAllParcele();
      alert(t('danger.deleteParcels.success') || 'Vse parcele so bile izbrisane.');
    } catch {
      alert(t('danger.deleteParcels.error') || 'Napaka pri brisanju parcel.');
    } finally {
      setLoading(null);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm(t('danger.deleteAccount.confirm') || 'Ste prepričani, da želite izbrisati račun? Tega dejanja ni mogoče razveljaviti.')) return;
    if (!user) return;
    setLoading('account');
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await logout();
      navigate('/login');
    } catch {
      alert(t('danger.deleteAccount.error') || 'Napaka pri brisanju računa.');
      setLoading(null);
    }
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
          <button className={styles.btnDangerOutline} onClick={handleDeleteParcels} disabled={loading === 'parcels'}>
            {loading === 'parcels' ? '...' : t('danger.deleteParcels.btn')}
          </button>
        </div>
        <hr className={styles.divider} />
        <div className={styles.dangerRow}>
          <div>
            <p className={styles.dangerRowTitle}>{t('danger.deleteAccount.title')}</p>
            <p className={styles.dangerRowSub}>{t('danger.deleteAccount.sub')}</p>
          </div>
          <button className={styles.btnDangerFill} onClick={handleDeleteAccount} disabled={loading === 'account'}>
            {loading === 'account' ? '...' : t('danger.deleteAccount.btn')}
          </button>
        </div>
      </div>
    </>
  );
}
