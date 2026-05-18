import styles from './auth.module.css';
import AuthLayout from './components/AuthLayout';
import FormField from './components/FormField';
import { useRegistrationForm } from '../../hooks/useRegistrationForm';
import { useLanguage } from '../../context/LanguageContext';

function RegistrationView() {
  const { fields, setters, error, loading, handleSubmit } = useRegistrationForm();
  const { firstName, lastName, email, password, confirmPassword } = fields;
  const { setFirstName, setLastName, setEmail, setPassword, setConfirmPassword } = setters;
  const { t } = useLanguage();

  return (
    <AuthLayout
      leftHeading={<>{t('auth.register.leftHeading')}</>}
      leftSubtext={t('auth.register.leftSub')}
      heading={t('auth.register.heading')}
      subheading={t('auth.register.subheading')}
      prompt={t('auth.register.prompt')}
      promptLinkText={t('auth.register.promptLink')}
      promptLinkHref="/login"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <FormField id="firstName" label={t('auth.register.firstName')} placeholder={t('auth.register.firstNamePlaceholder')}
            value={firstName} onChange={e => setFirstName(e.target.value)} />
          <FormField id="lastName" label={t('auth.register.lastName')} placeholder={t('auth.register.lastNamePlaceholder')}
            value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>

        <FormField id="email" label={t('auth.register.email')} type="email" placeholder={t('auth.register.emailPlaceholder')}
          value={email} onChange={e => setEmail(e.target.value)} />
        <FormField id="password" label={t('auth.register.password')} type="password" placeholder={t('auth.register.passwordPlaceholder')}
          value={password} onChange={e => setPassword(e.target.value)} />
        <FormField id="confirmPassword" label={t('auth.register.confirmPassword')} type="password" placeholder={t('auth.register.confirmPasswordPlaceholder')}
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}

export default RegistrationView;
