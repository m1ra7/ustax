'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Languages } from 'lucide-react';
import { languages, languageNames, locales, isLanguage, translate, localizedDate, localizedMoney, systemEvent, type Language } from '../lib/i18n/core';
const LanguageContext = createContext<{
    language: Language;
    setLanguage: (v: Language) => void;
}>({ language: 'tr', setLanguage: () => { } });
export function LanguageProvider({ initialLanguage, children }: {
    initialLanguage: Language;
    children: ReactNode;
}) {
    const [language, setLanguage] = useState(initialLanguage);
    useEffect(() => { try {
        const saved = localStorage.getItem('s360-language');
        if (isLanguage(saved))
            setLanguage(saved);
    }
    catch { } }, []);
    useEffect(() => { document.documentElement.lang = language; document.title = 'UstaX | ' + translate(language, 'Servis yönetimi'); const sync = (e: StorageEvent) => { if (e.key === 's360-language' && isLanguage(e.newValue))
        setLanguage(e.newValue); }; window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, [language]);
    useEffect(() => {
        const invalid = (event: Event) => { const el = event.target; if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement))
            return; el.setCustomValidity(''); const v = el.validity; if (v.valid)
            return; let key = 'Geçerli bir değer girin.'; let params: Record<string, string | number> = {}; if (v.valueMissing)
            key = 'Bu alanı doldurun.';
        else if (v.typeMismatch && el instanceof HTMLInputElement && el.type === 'email')
            key = 'Geçerli bir e-posta adresi girin.';
        else if (v.patternMismatch)
            key = 'Bilgiyi istenen biçimde girin.';
        else if (v.tooShort && 'minLength' in el) {
            key = 'En az {count} karakter girin.';
            params = { count: el.minLength };
        }
        else if (v.tooLong && 'maxLength' in el) {
            key = 'En fazla {count} karakter girin.';
            params = { count: el.maxLength };
        }
        else if (v.rangeUnderflow && el instanceof HTMLInputElement) {
            key = 'Değer en az {value} olmalı.';
            params = { value: el.min };
        }
        else if (v.rangeOverflow && el instanceof HTMLInputElement) {
            key = 'Değer en fazla {value} olmalı.';
            params = { value: el.max };
        } el.setCustomValidity(translate(language, key, params)); el.dataset.localizedValidity = 'true'; };
        const clear = (event: Event) => { const el = event.target; if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
            if (el.dataset.localizedValidity) {
                el.setCustomValidity('');
                delete el.dataset.localizedValidity;
            }
        } };
        document.addEventListener('invalid', invalid, true);
        document.addEventListener('input', clear, true);
        document.addEventListener('change', clear, true);
        return () => { document.removeEventListener('invalid', invalid, true); document.removeEventListener('input', clear, true); document.removeEventListener('change', clear, true); document.querySelectorAll('[data-localized-validity]').forEach(node => { const el = node as unknown as HTMLInputElement; el.setCustomValidity(''); delete el.dataset.localizedValidity; }); };
    }, [language]);
    function select(next: Language) { setLanguage(next); document.documentElement.lang = next; try {
        localStorage.setItem('s360-language', next);
    }
    catch { } document.cookie = `s360-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`; }
    return <LanguageContext.Provider value={{ language, setLanguage: select }}>{children}</LanguageContext.Provider>;
}
export function useI18n() { const { language, setLanguage } = useContext(LanguageContext); return { language, setLanguage, locale: locales[language], t: (key: string, params?: Record<string, string | number>) => translate(language, key, params), date: (value: string, options?: Intl.DateTimeFormatOptions) => localizedDate(language, value, options), money: (value: number, currency?: string) => localizedMoney(language, value, currency), eventText: (text: string) => systemEvent(language, text) }; }
export function LanguageSelect() { const { language, setLanguage, t } = useI18n(); return <label className="language-select"><span className="sr-only">{t('Dil seçin')}</span><select aria-label={t('Dil seçin')} value={language} onChange={e => { if (isLanguage(e.target.value))
    setLanguage(e.target.value); }}>{languages.map(lang => <option value={lang} lang={lang} key={lang}>{languageNames[lang]}</option>)}</select></label>; }
