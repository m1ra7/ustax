'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useI18n } from './language';
export type ThemeMode = 'light' | 'dark' | 'system';
const ThemeContext = createContext<{
    mode: ThemeMode;
    isDark:boolean;
    setMode: (mode: ThemeMode) => void;
}>({ mode: 'system', isDark:false, setMode: () => { } });
function storedMode(): ThemeMode {
    try {
        const v = localStorage.getItem('s360-theme');
        return v === 'light' || v === 'dark' ? v : 'system';
    }
    catch {
        return 'system';
    }
}
export function ThemeProvider({ children }: {
    children: ReactNode;
}) {
    const [mode, setTheme] = useState<ThemeMode>('system');
    const [ready, setReady] = useState(false);
    const [isDark,setIsDark]=useState(false);
    useEffect(() => {
        setTheme(storedMode());
        setReady(true);
        const sync = (e: StorageEvent) => {
            if (e.key === 's360-theme')
                setTheme(storedMode());
        };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);
    useEffect(() => {
        if (!ready)
            return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => { document.documentElement.dataset.theme = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode; document.documentElement.dataset.themeMode = mode;setIsDark(document.documentElement.dataset.theme==='dark'); };
        apply();
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [mode, ready]);
    function setMode(next: ThemeMode) {
        setTheme(next);
        try {
            localStorage.setItem('s360-theme', next);
        }
        catch { }
    }
    return <ThemeContext.Provider value={{ mode, isDark, setMode }}>{children}</ThemeContext.Provider>;
}
export function ThemeSwitch(){const {t}=useI18n();const {isDark,setMode}=useContext(ThemeContext);return <button type="button" className="theme-toggle" role="switch" aria-checked={isDark} aria-label={t('Koyu mod')} onClick={()=>setMode(isDark?'light':'dark')}><span>{t('Koyu mod')}</span><span className="theme-toggle-track" aria-hidden="true"><span/></span></button>}
