import styles from './auth.module.css';
import AuthLayout from './components/AuthLayout';
import FormField from './components/FormField';
import { useLoginForm } from '../../hooks/useLoginForm';
import { useLanguage } from '../../context/LanguageContext';

function LoginView() {
  const { fields, setters, error, loading, handleSubmit } = useLoginForm();
  const { email, password } = fields;
  const { setEmail, setPassword } = setters;
  const { t } = useLanguage();

  return (
    <AuthLayout
      leftHeading={<>{t('auth.login.leftHeading')}</>}
      leftSubtext={t('auth.login.leftSub')}
      heading={t('auth.login.heading')}
      subheading={t('auth.login.subheading')}
      prompt={t('auth.login.prompt')}
      promptLinkText={t('auth.login.promptLink')}
      promptLinkHref="/register"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <FormField id="email" label={t('auth.login.email')} type="email" placeholder={t('auth.login.emailPlaceholder')}
          value={email} onChange={e => setEmail(e.target.value)} />

        <FormField id="password" label={t('auth.login.password')} type="password" placeholder={t('auth.login.passwordPlaceholder')}
          value={password} onChange={e => setPassword(e.target.value)}>
          <a href="#" className={styles.forgotPassword}>{t('auth.login.forgot')}</a>
        </FormField>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}

export default LoginView;
