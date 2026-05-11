import styles from './auth.module.css';
import AuthLayout from './components/AuthLayout';
import FormField from './components/FormField';
import { useRegistrationForm } from '../../hooks/useRegistrationForm';

function RegistrationView() {
  const { fields, setters, error, loading, handleSubmit } = useRegistrationForm();
  const { firstName, lastName, email, password, confirmPassword } = fields;
  const { setFirstName, setLastName, setEmail, setPassword, setConfirmPassword } = setters;

  return (
    <AuthLayout
      leftHeading={<>Pametno kmetovanje<br />se začne tu.</>}
      leftSubtext="Digitalna analiza tal za modernega kmeta. AI priporočila in natančni podatki za vsako parcelo."
      heading="Ustvari račun"
      subheading="Pridruži se nam in začni svojo zeleno pot"
      prompt="Že imaš račun?"
      promptLinkText="Prijavi se"
      promptLinkHref="/login"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <FormField id="firstName" label="Ime" placeholder="Janez"
            value={firstName} onChange={e => setFirstName(e.target.value)} />
          <FormField id="lastName" label="Priimek" placeholder="Novak"
            value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>

        <FormField id="email" label="E-pošta" type="email" placeholder="janez@primer.si"
          value={email} onChange={e => setEmail(e.target.value)} />
        <FormField id="password" label="Geslo" type="password" placeholder="Vsaj 8 znakov"
          value={password} onChange={e => setPassword(e.target.value)} />
        <FormField id="confirmPassword" label="Potrdi geslo" type="password" placeholder="Ponovi geslo"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

{error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Registracija...' : 'Ustvari račun'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default RegistrationView;
