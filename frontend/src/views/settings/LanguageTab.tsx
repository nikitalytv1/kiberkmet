import { useState } from 'react';
import styles from './settings.module.css';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageTab() {
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
        <p className={styles.labelText}>{t('language.app')}</p>
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
