import { ReactNode } from 'react';
import styles from '../auth.module.css';

interface AuthLayoutProps {
  leftHeading: ReactNode;
  leftSubtext: string;
  heading: string;
  subheading: string;
  prompt: string;
  promptLinkText: string;
  promptLinkHref: string;
  children: ReactNode;
}

function AuthLayout({
  leftHeading,
  leftSubtext,
  heading,
  subheading,
  prompt,
  promptLinkText,
  promptLinkHref,
  children,
}: AuthLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.leftPanel}>
        <div className={styles.logo}>
          <img src="/logo.svg" alt="kiberkmet" className={styles.logoImg} />
          <span className={styles.logoText}>kiberkmet</span>
        </div>

        <div className={styles.leftContent}>
          <div className={styles.leftInner}>
            <h2 className={styles.leftHeading}>{leftHeading}</h2>
            <p className={styles.leftSubtext}>{leftSubtext}</p>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <h1 className={styles.heading}>{heading}</h1>
          <p className={styles.subheading}>{subheading}</p>

          {children}

          <p className={styles.prompt}>
            {prompt}{' '}
            <a href={promptLinkHref} className={styles.promptLink}>{promptLinkText}</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
