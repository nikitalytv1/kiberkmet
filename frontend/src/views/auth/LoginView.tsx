import styles from './auth.module.css';
import AuthLayout from './components/AuthLayout';
import FormField from './components/FormField';
import { useLoginForm } from '../../hooks/useLoginForm';

function LoginView() {
  const { fields, setters, error, loading, handleSubmit } = useLoginForm();
  const { email, password } = fields;
  const { setEmail, setPassword } = setters;

  return (
    <AuthLayout
      leftHeading={<>Veseli smo,<br />da si spet tu.</>}
      leftSubtext="Tvoja polja te čakajo. Preveri stanje tal, AI priporočila in podatke za vsako parcelo."
      heading="Dobrodošli nazaj"
      subheading="Prijavi se v svoj račun"
      prompt="Še nimaš računa?"
      promptLinkText="Ustvari račun"
      promptLinkHref="/register"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <FormField id="email" label="E-pošta" type="email" placeholder="janez@primer.si"
          value={email} onChange={e => setEmail(e.target.value)} />

        <FormField id="password" label="Geslo" type="password" placeholder="Vnesi geslo"
          value={password} onChange={e => setPassword(e.target.value)}>
          <a href="#" className={styles.forgotPassword}>Pozabljeno geslo?</a>
        </FormField>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Prijava...' : 'Prijavi se'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default LoginView;
