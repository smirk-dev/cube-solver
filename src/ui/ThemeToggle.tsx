import { useState } from 'react';
import { effectiveTheme, setTheme, type Theme } from './theme';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>(() => effectiveTheme());

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setLocal(next);
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title="Toggle light/dark"
    >
      <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
    </button>
  );
}
