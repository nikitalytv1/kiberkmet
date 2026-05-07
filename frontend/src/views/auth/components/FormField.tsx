import { ReactNode, ChangeEvent } from 'react';
import styles from '../auth.module.css';

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  children?: ReactNode;
}

function FormField({ id, label, type = 'text', placeholder, value, onChange, children }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} className={styles.input} />
      {children}
    </div>
  );
}

export default FormField;
