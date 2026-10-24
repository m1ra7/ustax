'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { LayoutDashboard, Wrench, Users, Smartphone, FileText, Settings, Search, Plus, ChevronDown, ChevronRight, ArrowUpRight, ArrowRight, Sun, Moon, Bell, SlidersHorizontal, MoreHorizontal, Check, Clock, Package, Activity, CheckCircle2, ArrowDown, Menu, X, Mail, Phone, Copy, QrCode, ExternalLink, Upload, ShieldCheck, LogOut, Monitor, Tablet, Grid2X2, List, AlertCircle, Loader2, Link as LinkIcon, RotateCw, Lock, Inbox, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';
import {preparePhoto,uploadFailure} from '../lib/photo-client';
import { ThemeSwitch } from './theme';
import { useI18n, LanguageSelect } from './language';
import { clientLanguage } from '../lib/i18n/core';
import { sampleRecords } from '../lib/sample';
import { statuses, activeQuote, canDeleteQuote, type RecordData, type Status } from '../lib/domain';
const icons: Record<string, typeof Smartphone> = { Telefon: Smartphone, Tablet: Tablet, Bilgisayar: Monitor };
const nav = [['Genel bakış', LayoutDashboard], ['Servis kayıtları', Wrench], ['Müşteriler', Users], ['Cihazlar', Smartphone], ['Fiyat teklifleri', FileText]] as const;
function Badge({ status }: {
    status: string;
}) { const { t } = useI18n(); return <span className={'badge status-' + statuses.indexOf(status as Status)}><i />{t(status)}</span>; }
function Device({ r }: {
    r: RecordData;
}) { const { t } = useI18n(); const Icon = icons[r.kind] || Smartphone; return <div className="devicecell"><span><b>{r.model}</b><small>{r.brand} · {t(r.kind)}</small></span></div>; }
async function api(path: string, method = 'GET', body?: unknown) {
    const r = await fetch('/api/v1/' + path, { method, headers: body instanceof FormData ? { 'Accept-Language': clientLanguage() } : { 'Accept-Language': clientLanguage(), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
    const d: any = await r.json();
    if (!r.ok)
        throw new Error(d.errorKey || d.error || 'İşlem tamamlanamadı.');
    return d;
}
export default function Dashboard() {
    const { t, language, locale, date, money, eventText } = useI18n();
    const content = (v: string) => demo ? t(v) : v;
    const [data, setData] = useState<RecordData[]>([]), [loading, setLoading] = useState(true), [demo, setDemo] = useState(false), [error, setError] = useState(''), [health, setHealth] = useState<any>({}), [me, setMe] = useState<any>(null);
    const [page, setPage] = useState('Genel bakış'), [query, setQuery] = useState(''), [filter, setFilter] = useState('Tümü'), [kind, setKind] = useState('Tüm cihazlar'), [sort, setSort] = useState('new'), [cards, setCards] = useState(false), [filters, setFilters] = useState(false), [mobile, setMobile] = useState(false), [modal, setModal] = useState(false), [selected, setSelected] = useState<RecordData | null>(null), [tab, setTab] = useState('Genel bilgiler'), [toast, setToast] = useState(''), [busy, setBusy] = useState(false), [tokens, setTokens] = useState<Record<string, string>>({}), [qr, setQr] = useState(''), [team, setTeam] = useState<any[]>([]);
    const searchRef = useRef<HTMLInputElement>(null);
    const linkBusyRef = useRef(false);
    const photoDeleteBusyRef = useRef(false);
    const quoteDeleteBusyRef = useRef(false);
    const selectedIdRef = useRef<string | null>(null);
    selectedIdRef.current = selected?.id ?? null;
    async function load() {
        setLoading(true);
        try {
            const h = await api('health');
            setHealth(h);
            if (!h.database) {
                setDemo(true);
                setData(sampleRecords);
            }
            else {
                setMe(await api('me'));
                setData(await api('records'));
                setDemo(false);
            }
            setError('');
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        load();
        const key = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                (searchRef.current?.offsetParent ? searchRef.current : document.querySelector<HTMLInputElement>('.record-search input'))?.focus();
            }
            if (e.key === 'Escape') {
                setSelected(null);
                setModal(false);
                setMobile(false);
            }
        };
        document.addEventListener('keydown', key);
        return () => document.removeEventListener('keydown', key);
    }, []);
    useEffect(() => {
        if (!modal && !selected)
            return;
        const previous = document.activeElement as HTMLElement;
        const dialog = document.querySelector('[role=dialog]') as HTMLElement;
        const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select,textarea') || []).filter(e => e.offsetParent !== null);
        focusable()[0]?.focus();
        function trap(e: KeyboardEvent) {
            if (e.key !== 'Tab')
                return;
            const nodes = focusable();
            const first = nodes[0], last = nodes.at(-1);
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        }
        document.addEventListener('keydown', trap);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', trap); document.body.style.overflow = overflow; previous?.focus(); };
    }, [modal, selected?.id]);
    useEffect(() => {
        if (!toast)
            return;
        const t = setTimeout(() => setToast(''), 4500);
        return () => clearTimeout(t);
    }, [toast]);
    useEffect(() => {
        if (page === 'Ekip ve yetkiler' && !demo && me?.role === 'admin')
            api('users').then(setTeam).catch(e => setToast(e.message));
    }, [page, demo, me]);
    useEffect(() => {
        if (selected) document.querySelector<HTMLElement>('.record-detail-screen .drawer')?.scrollTo({ top: 0 });
    }, [tab, selected?.id]);
    const view = useMemo(() => data.filter(r => (filter === 'Tümü' || r.status === filter) && (kind === 'Tüm cihazlar' || r.kind === kind) && `${r.name} ${r.phone} ${r.model} ${r.number} ${r.technician} ${r.createdAt}`.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale))).sort((a, b) => sort === 'old' ? a.createdAt.localeCompare(b.createdAt) : sort === 'name' ? a.name.localeCompare(b.name, locale) : b.createdAt.localeCompare(a.createdAt)), [data, filter, kind, query, sort, locale]);
    const count = (s: string) => data.filter(r => r.status === s).length;
    const active = data.filter(r => !['Teslim edildi', 'İptal edildi'].includes(r.status)).length;
    function go(p: string) { setPage(p); setFilter('Tümü'); setQuery(''); setMobile(false); }
    function open(r: RecordData) { setSelected(r); setTab('Genel bilgiler'); setQr(''); }
    async function change(action: string, body: unknown) {
        if (!selected)
            return;
        if (demo) {
            setToast('Örnek görünüm: değişiklik kaydetmek için PostgreSQL bağlantısını tamamlayın.');
            return;
        }
        setBusy(true);
        try {
            const r = await api('records/' + selected.id + '/' + action, 'PATCH', body);
            setData(d => d.map(x => x.id === r.id ? r : x));
            setSelected(r);
            setToast('Değişiklik kaydedildi.');
        }
        catch (e) {
            setToast((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function removeQuoteVersion(version: number) {
        if (!selected || busy || quoteDeleteBusyRef.current) return;
        if (demo) { setToast('Örnek görünüm: değişiklik kaydetmek için PostgreSQL bağlantısını tamamlayın.'); return; }
        if (!window.confirm(t('Bu teklif silinsin mi? Müşteri bu teklif için karar veremeyecek.'))) return;
        const recordId=selected.id;quoteDeleteBusyRef.current=true;setBusy(true);
        try {
            const updated:RecordData=await api('records/'+encodeURIComponent(recordId)+'/quotes/'+version,'DELETE');
            setData(previous=>previous.map(item=>item.id===recordId?updated:item));
            setSelected(previous=>previous?.id===recordId?updated:previous);setToast('Teklif silindi.');
        } catch(error){setToast((error as Error).message);} finally{quoteDeleteBusyRef.current=false;setBusy(false);}
    }
    async function removePhoto(photoId: string) {
        if (!selected || busy || photoDeleteBusyRef.current) return;
        if (demo) { setToast('Örnek görünüm: değişiklik kaydetmek için PostgreSQL bağlantısını tamamlayın.'); return; }
        if (!window.confirm(t('Bu fotoğraf silinsin mi? Müşteri takibinden de kaldırılacak.'))) return;
        const recordId = selected.id;
        photoDeleteBusyRef.current = true; setBusy(true);
        try {
            const updated = await api('records/' + encodeURIComponent(recordId) + '/photos/' + encodeURIComponent(photoId), 'DELETE');
            setData(previous => previous.map(item => item.id === recordId ? updated : item));
            setSelected(previous => previous?.id === recordId ? updated : previous);
            setToast(updated.warningKey || updated.warning || 'Fotoğraf silindi.');
        } catch (error) { setToast((error as Error).message); }
        finally { photoDeleteBusyRef.current = false; setBusy(false); }
    }
    async function removeHistory(eventId: string) {
        if (!selected || busy || me?.role !== 'admin') return;
        if (!window.confirm(t('Bu adım geçmişten kaldırılacak. Servis durumu değişmeyecek. Devam edilsin mi?'))) return;
        const id = selected.id;setBusy(true);
        try {
            const updated: RecordData = await api('records/' + id + '/events/' + eventId, 'DELETE');
            setData(previous => previous.map(item => item.id === id ? updated : item));
            setSelected(previous => previous?.id === id ? updated : previous);
            setToast('Geçmiş adımı kaldırıldı.');
        } catch(error) {setToast((error as Error).message);} finally {setBusy(false);}
    }
    const trackUrl = selected ? (demo ? '/takip/ornek' : tokens[selected.id] ? '/takip/' + tokens[selected.id] : '') : '';
    async function ensureTrackingLink(renew = false): Promise<string> {
        if (!selected || linkBusyRef.current) return '';
        if (demo) {
            if (renew) { setToast('Örnek kayıtların bağlantısı yenilenemez.'); return ''; }
            return '/takip/ornek';
        }
        if (trackUrl && !renew) return trackUrl;
        if (me?.role !== 'admin') {
            setToast('Takip bağlantısını yenilemek için yöneticinizle iletişime geçin.');
            return '';
        }
        if (!window.confirm(t('Yeni bağlantı oluşturulunca eski bağlantı iptal edilir. Devam edilsin mi?'))) return '';
        const recordId = selected.id;
        linkBusyRef.current = true; setBusy(true);
        try {
            const result = await api('records/' + recordId + '/rotate', 'POST');
            setTokens(previous => ({ ...previous, [recordId]: result.token }));
            if (selectedIdRef.current !== recordId) return '';
            setQr('');
            setToast('Yeni bağlantı oluşturuldu. Eski bağlantı iptal edildi.');
            return '/takip/' + result.token;
        } catch (error) {
            setToast((error as Error).message);
            return '';
        } finally {
            linkBusyRef.current = false; setBusy(false);
        }
    }
    async function copy() {
        const path = await ensureTrackingLink();
        if (!path) return;
        try {
            await navigator.clipboard.writeText(location.origin + path);
            setToast('Takip bağlantısı kopyalandı.');
        } catch {
            setToast('Bağlantı hazır. Aşağıdaki alandan kopyalayabilirsiniz.');
        }
    }
    async function showTrackingQR() {
        const id = selected?.id;
        const path = await ensureTrackingLink();
        if (!path || selectedIdRef.current !== id) return;
        try {
            const image = await QRCode.toDataURL(location.origin + path, { width: 220, margin: 2 });
            if (selectedIdRef.current === id) setQr(image);
        } catch { setToast('QR kod oluşturulamadı. Tekrar deneyin.'); }
    }

    return <div className="app-shell">
 {mobile && <button className="scrim" aria-label={t("Menüyü kapat")} onClick={() => setMobile(false)}/>}
 <aside className={'sidebar ' + (mobile ? 'is-open' : '')}><a className="brand" href="/" onClick={e => { e.preventDefault(); go('Genel bakış'); }}>UstaX</a>
 <div className="workspace"><div><b>{t('Teknik servis')}</b><small>{t('Servis çalışma alanı')}</small></div></div>
 <div className="nav-label">{t("ÇALIŞMA ALANI")}</div><nav>{nav.map(([p, Icon]) => <button key={p} className={page === p ? 'active' : ''} onClick={() => go(p)}><span>{t(p)}</span>{p === 'Servis kayıtları' && <em>{active}</em>}{p === 'Fiyat teklifleri' && count('Fiyat onayı bekliyor') > 0 && <i className="nav-dot"/>}</button>)}</nav>
 <div className="nav-label management">{t("YÖNETİM")}</div><nav>{(demo || me?.role === 'admin') && <button onClick={() => go('Ekip ve yetkiler')} className={page === 'Ekip ve yetkiler' ? 'active' : ''}>{t("Ekip ve yetkiler")}</button>}<button onClick={() => go('Ayarlar')} className={page === 'Ayarlar' ? 'active' : ''}>{t("Ayarlar")}</button></nav>
 <div className="sidebar-bottom"><button className="profile" onClick={() => go(me?.role === 'admin' || demo ? 'Ekip ve yetkiler' : 'Ayarlar')}><span><b>{me?.name || 'Miraç Suiçmez'}</b><small>{demo ? t('Örnek yönetici') : me?.role === 'admin' ? t('Yönetici') : t('Teknisyen')}</small></span></button></div></aside>
 <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="icon-btn mobile-menu" aria-label={t("Menüyü aç")} onClick={() => setMobile(true)}><Menu size={20} aria-hidden="true"/></button><span>{t("Çalışma alanı")}</span><b>{t(page)}</b></div><div className="top-actions"><div className="global-search"><input ref={searchRef} placeholder={t("Hızlı arama...")} value={query} onChange={e => {
            setQuery(e.target.value);
            if (!['Genel bakış', 'Servis kayıtları'].includes(page))
                setPage('Servis kayıtları');
        }} aria-label={t("Servis kaydı ara")}/><kbd>⌘ K</kbd></div><LanguageSelect /><button className="icon-btn notification" onClick={() => { go('Servis kayıtları'); setFilter('Fiyat onayı bekliyor'); }} aria-label={t("Onay bekleyen kayıtlar")}>{t("Onay bekliyor")} {count('Fiyat onayı bekliyor') > 0 && <i />}</button><span className="top-divider"/></div></header>
 <main className="content"><div className="page-heading"><div><h1>{t(page)}</h1><p>{page === 'Genel bakış' ? t('Servis kayıtlarınızın güncel durumu.') : page === 'Servis kayıtları' ? t('Servis kayıtlarını arayın ve güncelleyin.') : ''}</p></div><div className="heading-right"><span className="today"><span className="today-dot"/>{new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</span><button className="btn primary" onClick={() => setModal(true)}>{t("Yeni servis kaydı")}</button></div></div>
 {demo && <div className="demo-banner"><span><span className="demo-pill">{t("ÖRNEK ÇALIŞMA ALANI")}</span>{t("Örnek veriler gösteriliyor. Gerçek kayıtlar için kurulumu tamamlayın.")}</span><button onClick={() => go('Ayarlar')}>{t("Kurulum bilgileri")}</button></div>}
 {error && <div className="error-box"><span>{t(error)}</span><a href="/yonetim/giris">{t("Giriş yap")}</a><button onClick={load}>{t("Yeniden dene")}</button></div>}
 {loading ? <div className="loading-panel">{t("Çalışma alanınız hazırlanıyor...")}</div> : <>
 {page === 'Genel bakış' && <><section className="metrics">{[{ title: 'Aktif servisler', value: active, icon: Wrench, cls: 'teal', sub: 'İşlem devam ediyor', status: 'Tümü' }, { title: 'İncelenen cihazlar', value: count('İnceleniyor'), icon: Search, cls: 'blue', sub: 'Teknik inceleme aşamasında', status: 'İnceleniyor' }, { title: 'Onay bekleyenler', value: count('Fiyat onayı bekliyor'), icon: Clock, cls: 'amber', sub: 'Müşteri yanıtı bekleniyor', status: 'Fiyat onayı bekliyor' }, { title: 'Teslime hazır', value: count('Teslime hazır'), icon: CheckCircle2, cls: 'green', sub: 'Müşterisini bekliyor', status: 'Teslime hazır' }].map(m => <button className="metric" key={m.title} onClick={() => { go('Servis kayıtları'); setFilter(m.status); }}><div className="metric-top"><span>{t(m.title)}</span></div><div className="metric-value">{m.value}</div><small><i className={m.cls}/>{t(m.sub)}</small></button>)}</section>
 <section className="overview-grid"><div className="workflow-card panel"><div className="panel-title"><div><h2>{t("Durum dağılımı")}</h2><p>{t("Aktif servis kayıtları")}</p></div><span className="live"><i />{demo ? t('Örnek veriler') : t('Canlı görünüm')}</span></div><div className="flow-content"><div className="flow-total"><strong>{active}</strong><span>{t("aktif cihaz")}</span></div><div className="flow-bars"><div className="stacked-bar">{['İnceleniyor', 'Fiyat onayı bekliyor', 'Tamir ediliyor', 'Parça bekleniyor', 'Teslime hazır', 'Teslim alındı'].map((s, i) => <button key={s} title={`${t(s)}: ${count(s)}`} aria-label={t('{status}: {count} cihazı görüntüle', { status: t(s), count: count(s) })} style={{ flex: count(s) || 0.001, background: ['#7ba6df', '#e9b35e', '#339b91', '#94a3b8', '#80b8a0', '#c7d1d7'][i] }} onClick={() => { go('Servis kayıtları'); setFilter(s); }}/>)}</div><div className="bar-legend">{[['İnceleme', '#7ba6df', 'İnceleniyor'], ['Onay bekliyor', '#e9b35e', 'Fiyat onayı bekliyor'], ['Tamirde', '#339b91', 'Tamir ediliyor'], ['Parça bekliyor', '#94a3b8', 'Parça bekleniyor']].map(([label, c, s]) => <span key={label}><i style={{ background: c }}/>{t(label)}<b>{count(s)}</b></span>)}</div></div></div></div><section className="pending-summary panel"><div className="panel-title"><h2>{t('İşlem bekleyenler')}</h2></div><button onClick={() => { go('Servis kayıtları'); setFilter('Fiyat onayı bekliyor'); }}><span>{t('Fiyat onayı bekliyor')}</span><b>{count('Fiyat onayı bekliyor')}</b></button><button onClick={() => { go('Servis kayıtları'); setFilter('Teslime hazır'); }}><span>{t('Teslime hazır')}</span><b>{count('Teslime hazır')}</b></button></section></section></>}
 {['Genel bakış', 'Servis kayıtları'].includes(page) && <section className="panel records-panel" aria-label={t("Servis kayıtları")}><div className="panel-title"><div className="inline-title"><h2>{page === 'Genel bakış' ? t('Son servis kayıtları') : t('Tüm servis kayıtları')}</h2><span className="count-pill">{view.length}</span></div>{page === 'Genel bakış' && <button className="text-btn" onClick={() => go('Servis kayıtları')}>{t("Tüm kayıtlar")}</button>}</div><div className="list-search-row"><div className="record-search"><input aria-label={t("Servis, müşteri, telefon veya teknisyen ara")} placeholder={t("Servis no, müşteri, telefon veya teknisyen ara...")} value={query} onChange={e => setQuery(e.target.value)}/>{query && <button className="icon-btn" aria-label={t("Aramayı temizle")} onClick={() => setQuery('')}>{t("Temizle")}</button>}</div><select aria-label={t("Kayıtları sırala")} value={sort} onChange={e => setSort(e.target.value)}><option value="new">{t("En yeni kayıtlar")}</option><option value="old">{t("En eski kayıtlar")}</option><option value="name">{t("Müşteri adı")}</option></select></div><div className="table-toolbar"><div className="status-tabs">{['Tümü', 'İnceleniyor', 'Fiyat onayı bekliyor', 'Tamir ediliyor', 'Teslime hazır'].map(s => <button className={filter === s ? 'selected' : ''} onClick={() => setFilter(s)} key={s}>{s === 'Fiyat onayı bekliyor' ? t('Onay bekliyor') : t(s)}{s === 'Tümü' && <span>{data.length}</span>}</button>)}</div><div className="toolbar-right"><button className={'btn compact ' + (filters ? 'pressed' : '')} onClick={() => setFilters(!filters)}>{t("Filtrele")}{kind !== 'Tüm cihazlar' && <i className="nav-dot"/>}</button><button className="icon-btn desktop-only" aria-label={cards ? t('Tablo görünümü') : t('Kart görünümü')} onClick={() => setCards(!cards)}>{cards ? t('Tablo görünümü') : t('Kart görünümü')}</button></div></div>{filters && <div className="expanded-filters"><label>{t("Cihaz türü")}<select value={kind} onChange={e => setKind(e.target.value)}>{['Tüm cihazlar', 'Telefon', 'Tablet', 'Bilgisayar'].map(k => <option key={k} value={k}>{t(k)}</option>)}</select></label><label>{t("Durum")}<select value={filter} onChange={e => setFilter(e.target.value)}>{['Tümü', ...statuses].map(s => <option key={s} value={s}>{t(s)}</option>)}</select></label><label>{t("Sıralama")}<select value={sort} onChange={e => setSort(e.target.value)}><option value="new">{t("En yeni kayıtlar")}</option><option value="old">{t("En eski kayıtlar")}</option><option value="name">{t("Müşteri adı")}</option></select></label><button className="text-btn" onClick={() => { setKind('Tüm cihazlar'); setFilter('Tümü'); setQuery(''); }}>{t("Temizle")}</button></div>}
 {view.length === 0 ? <div className="empty"><h3>{t("Burada henüz bir kayıt yok.")}</h3><p>{t("Filtreleri değiştirin veya ilk servis kaydınızı oluşturun.")}</p><button className="btn" onClick={() => setModal(true)}>{t("Yeni kayıt oluştur")}</button></div> : <><div className={cards ? 'record-cards' : 'responsive-table'}><table><thead><tr><th>{t("Servis no")}</th><th>{t("Cihaz")}</th><th>{t("Müşteri")}</th><th>{t("Durum")}</th><th>{t("Teknisyen")}</th><th><button className="th-sort" onClick={() => setSort(sort === 'new' ? 'old' : 'new')}>{t("Kayıt tarihi")}</button></th><th /></tr></thead><tbody>{view.map(r => <tr key={r.id} onClick={() => open(r)}><td className="record-no"><button onClick={() => open(r)}>{r.number}</button></td><td><Device r={r}/></td><td className="customer-cell"><b>{r.name}</b><small>{r.phone}</small></td><td><Badge status={r.status}/></td><td><span className="tech">{r.technician}</span></td><td className="date-cell">{date(r.createdAt)}</td><td><button className="icon-btn" aria-label={t('{number} detayını aç', { number: r.number })} onClick={e => { e.stopPropagation(); open(r); }}>{t("Detay")}</button></td></tr>)}</tbody></table></div><div className="table-footer"><span>{t('{shown} kayıttan {total} kayıt gösteriliyor', { shown: view.length, total: data.length })}</span><span className="secure-caption">{t("Yetki kontrollü çalışma alanı")}</span></div></>}
 </section>}
 {page === 'Müşteriler' && <div className="panel"><div className="panel-title"><h2>{t("Müşteri rehberi")}</h2><span>{t('{count} müşteri', { count: new Set(data.map(r => r.customerId)).size })}</span></div><div className="people-grid">{Array.from(new Map(data.map(r => [r.customerId, r])).values()).map(r => <button className="person-card" key={r.customerId} onClick={() => { go('Servis kayıtları'); setQuery(r.phone); }}><h3>{r.name}</h3><p>{r.phone}</p><small>{t('{count} servis kaydı', { count: data.filter(x => x.customerId === r.customerId).length })}</small><span className="text-btn">{t("Servis geçmişi")}</span></button>)}</div></div>}
 {page === 'Cihazlar' && <div className="panel"><div className="panel-title"><h2>{t("Cihaz arşivi")}</h2><span>{t('{count} cihaz', { count: new Set(data.map(r => r.deviceId)).size })}</span></div><div className="people-grid">{Array.from(new Map(data.map(r => [r.deviceId, r])).values()).map(r => <button className="person-card" key={r.deviceId} onClick={() => { go('Servis kayıtları'); setQuery(r.serial || r.model); }}><Device r={r}/><p>{r.name}</p><small>{r.serial ? t('Seri / IMEI: {serial}', { serial: r.serial }) : t('Seri numarası eklenmemiş')}</small><span className="text-btn">{t("Cihaz geçmişi")}</span></button>)}</div></div>}
 {page === 'Fiyat teklifleri' && <div className="panel"><div className="panel-title"><h2>{t("Teklifler ve müşteri kararları")}</h2><span>{t('{count} teklif', { count: data.filter(r => activeQuote(r)).length })}</span></div><div className="quote-list">{data.filter(r => activeQuote(r)).map(r => { const q = activeQuote(r)!; return <button key={r.id} className="quote-row" onClick={() => { open(r); setTab('Fiyat teklifi'); }}><Device r={r}/><span>{r.name}<small>{r.number} · v{q.version}</small></span><Badge status={q.decision === 'pending' ? 'Fiyat onayı bekliyor' : q.decision === 'approved' ? 'Teslime hazır' : 'Teklif reddedildi'}/><strong>{money(q.total, r.currency)}</strong></button>; })}{!data.some(r => activeQuote(r)) && <div className="empty">{t("Henüz teklif oluşturulmadı.")}</div>}</div></div>}
 {page === 'Ekip ve yetkiler' && <div className="panel settings-panel"><h2>{t("Ekip ve yetkiler")}</h2><p className="muted">{t("Yöneticiler ekip üyelerini tanımlar. Teknisyenler servis sürecini yönetir.")}</p><div className="people-grid">{(demo ? [{ name: 'Miraç Suiçmez', role: 'admin', email: 'Örnek yönetici', active: true }, ...['Ayşe Yıldız', 'Mert Kaya', 'Ece Deniz'].map(name => ({ name, role: 'technician', email: 'Örnek teknisyen', active: true }))] : team).map((u, i) => <div className="person-card" key={u.id || i}><h3>{u.name}</h3><p>{demo ? t(u.email) : u.email}</p><span className="badge">{u.role === 'admin' ? t('Yönetici') : t('Teknisyen')} · {u.active ? t('Aktif') : t('Pasif')}</span>{!demo && me?.role === 'admin' && u.id !== me?.id && <select aria-label={t('{person} rolü', { person: u.name })} value={u.role} onChange={async (e) => {
                            try {
                                await api('users', 'PATCH', { id: u.id, role: e.target.value });
                                setTeam(await api('users'));
                                setToast('Rol güncellendi.');
                            }
                            catch (e) {
                                setToast((e as Error).message);
                            }
                        }}><option value="admin">{t("Yönetici")}</option><option value="technician">{t("Teknisyen")}</option></select>}{!demo && me?.role === 'admin' && u.id !== me?.id && <button className="text-btn" onClick={async () => {
                            try {
                                await api('users', 'PATCH', { id: u.id, active: !u.active });
                                setTeam(await api('users'));
                                setToast('Ekip üyesi güncellendi.');
                            }
                            catch (e) {
                                setToast((e as Error).message);
                            }
                        }}>{u.active ? t('Erişimi kapat') : t('Erişimi aç')}</button>}{!demo && me?.role === 'admin' && u.id !== me.id && <StaffPasswordForm staffId={u.id} onSaved={setToast}/>}</div>)}</div>{(demo || me?.role === 'admin') && <form className="inline-form" onSubmit={async (e) => {
                        e.preventDefault();
                        if (demo) {
                            setToast('Ekip yönetimi için veritabanını bağlayın.');
                            return;
                        }
                        const form = e.currentTarget;
                        const f = new FormData(form);
                        setBusy(true);
                        try {
                            await api('users', 'POST', Object.fromEntries(f));
                            setTeam(await api('users'));
                            form.reset();
                            setToast('Çalışan eklendi. Tanımlı e-posta hesabıyla giriş yapabilir.');
                        }
                        catch (e) {
                            setToast((e as Error).message);
                        } finally { setBusy(false); }
                    }}><h3>{t("Çalışan ekle")}</h3><input name="name" placeholder={t("Ad soyad")} aria-label={t("Çalışan adı")} required/><input name="email" type="email" placeholder={t("Giriş e-postası")} aria-label={t("Çalışan e-postası")} required/><input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={200} placeholder={t("Başlangıç parolası (en az 12 karakter)")} aria-label={t("Başlangıç parolası (en az 12 karakter)")} required/><select name="role" aria-label={t("Rol")}><option value="technician">{t("Teknisyen")}</option><option value="admin">{t("Yönetici")}</option></select><button disabled={busy} className="btn primary">{t("Ekle")}</button></form>}{!demo && me?.role !== 'admin' && <p>{t("Bu alanı yönetmek için yönetici yetkisi gerekiyor.")}</p>}</div>}
 {page === 'Ayarlar' && <div className="settings-grid"><section className="panel settings-panel"><h2>{t("Çalışma alanı ayarları")}</h2><p className="muted">{t("Bağlantıların durumu sunucudan kontrol edilir.")}</p>{[['PostgreSQL veritabanı', health.database, 'DATABASE_URL'], ['Korumalı fotoğraf depolama', health.photos, 'S3 / Cloudinary'], ['E-posta ile teklif doğrulama', health.email, 'RESEND_API_KEY, EMAIL_FROM']].map(([title, ready, key]) => <div className="connection" key={String(title)}><div><b>{t(title)}</b><small>{key}</small></div><span className={'badge ' + (ready ? 'status-5' : 'status-2')}>{ready ? t('Yapılandırıldı') : t('Bağlantı gerekli')}</span></div>)}<p className="callout">{t("Müşteriler, kayıtlı e-postalarına gelen 10 dakika geçerli tek kullanımlık kod ile teklif kararını doğrular. E-postası olmayan müşteriler için çalışan önce doğrulanacak adresi kaydetmelidir.")}</p><button className="btn" onClick={load}>{t("Bağlantıları kontrol et")}</button></section><section className="panel settings-panel"><h2>{t("Görünüm ve dil")}</h2><p className="muted">{t("Tema tercihiniz bu tarayıcıda saklanır.")}</p><div className="language-settings"><div><h3>{t("Uygulama dili")}</h3><p className="muted">{t("Dil tercihiniz bu tarayıcıda saklanır.")}</p></div><LanguageSelect /></div><hr /><h3>{t("Güvenli erişim")}</h3><p className="muted">{t("Çalışan hesapları sunucu tarafında yetkilendirilir. Mobil API erişimi süreli ve iptal edilebilir Bearer anahtarlarıyla hazırlanmıştır.")}</p><button className="btn" onClick={async()=>{if(me)await api('auth/logout','POST',{});window.location.href='/yonetim/giris';}}>{me ? t('Oturumu kapat') : t('Çalışan girişi')}</button></section></div>}
 </>}
 </main><footer className="app-footer"><ThemeSwitch/><span>© {new Date().getFullYear()} UstaX</span></footer></div>
 {toast && <div role="status" className="toast">{t(toast)}<button aria-label={t("Bildirimi kapat")} onClick={() => setToast('')}>{t("Kapat")}</button></div>}
 {modal && <Intake demo={demo} team={Array.from(new Set(data.map(r => r.technician)))} onClose={() => setModal(false)} onCreated={(r, token) => { setData([r, ...data]); setTokens({ ...tokens, [r.id]: token }); setModal(false); open(r); setToast('Servis kaydı oluşturuldu. Güvenli bağlantıyı müşterinizle paylaşın.'); }}/>}
 {selected && <div className="drawer-overlay record-detail-screen"><section className="drawer" role="dialog" aria-modal="true" aria-label={t("Servis detayı")} onClick={e => e.stopPropagation()}><div className="drawer-top"><span className="eyebrow">{t("SERVİS DETAYI")}</span><button autoFocus className="icon-btn" onClick={() => setSelected(null)} aria-label={t("Detayı kapat")}>{t("Kapat")}</button></div><div className="drawer-title"><div><h2>{selected.model}</h2><span>{selected.number} · {date(selected.createdAt)}</span></div><Badge status={selected.status}/></div><div className="drawer-links"><button disabled={busy} className="btn compact" onClick={copy}>{t("Takip bağlantısı")}</button><button disabled={busy} className="btn compact" onClick={showTrackingQR}>{t("QR kod")}</button>{trackUrl && <a className="btn compact" href={trackUrl} target="_blank" rel="noreferrer">{t("Müşteri görünümü")}</a>}</div>
 {!trackUrl && me?.role === 'admin' && <p className="callout">{t("Bağlantı bu oturumda mevcut değil. Takip bağlantısı veya QR kod düğmesiyle yeni bir bağlantı oluşturabilirsiniz.")}</p>}
 {trackUrl && <label className="detail-block">{t("Müşteri takip bağlantısı")}<input readOnly value={location.origin + trackUrl} aria-label={t("Müşteri takip bağlantısı")} onFocus={event => event.currentTarget.select()}/></label>}
 {qr && <div className="qr-preview"><img src={qr} alt={t("Güvenli müşteri takip bağlantısı QR kodu")}/><p>{t("Bu bağlantı yalnızca bu kayda erişim sağlar.")}</p></div>}
 <div className="detail-tabs" role="tablist" aria-label={t("Servis detayı")}>{['Genel bilgiler', 'İşlem geçmişi', 'Fiyat teklifi', 'Fotoğraflar'].map((label,index) => <button role="tab" id={"record-tab-"+index} aria-selected={tab === label} aria-controls="record-tabpanel" className={tab === label ? 'selected' : ''} onClick={() => setTab(label)} key={label}>{t(label)}</button>)}</div><div className="drawer-body" id="record-tabpanel" role="tabpanel" tabIndex={0} aria-label={t(tab)}>
 {tab === 'Genel bilgiler' && <><div className="detail-block"><h3>{t("Müşteri bilgileri")}</h3><div className="customer-detail"><div><b>{selected.name}</b><p>{selected.phone}</p><p>{selected.email || t('E-posta eklenmemiş')}</p></div></div><form className="inline-form" onSubmit={e => { e.preventDefault(); change('email', { email: new FormData(e.currentTarget).get('email') }); }}><input name="email" type="email" required placeholder={t("Doğrulama için e-posta adresi")} aria-label={t("Müşteri e-posta adresi")}/><button className="btn compact">{t("Kaydet")}</button></form></div><div className="detail-block"><h3>{t("Cihaz kabulü")}</h3><dl><dt>{t("Bildirilen arıza")}</dt><dd>{content(selected.fault)}</dd><dt>{t("Fiziksel durum")}</dt><dd>{selected.condition ? content(selected.condition) : t('Belirtilmedi')}</dd><dt>{t("Aksesuarlar")}</dt><dd>{selected.accessories ? content(selected.accessories) : t('Yok')}</dd><dt>{t("Seri numarası / IMEI")}</dt><dd>{selected.serial || t('Belirtilmedi')}</dd><dt>{t("Sorumlu teknisyen")}</dt><dd>{selected.technician}</dd></dl></div><div className="detail-block"><h3>{t("Süreci güncelle")}</h3><p className="muted">{t("Müşteri onayı, tamamlama ve teslim kuralları sunucuda denetlenir.")}</p><form className="inline-form" onSubmit={e => { e.preventDefault(); change('status', { status: new FormData(e.currentTarget).get('status') }); }}><select name="status" defaultValue={selected.status} aria-label={t("Yeni servis durumu")}>{statuses.map(s => <option key={s} value={s}>{t(s)}</option>)}</select><button disabled={busy} className="btn primary">{t("Güncelle")}</button></form></div>
 {selected.status === 'Tamir ediliyor' && <form className="detail-block form-grid" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); change('complete', { ...Object.fromEntries(f), fee: Math.round(Number(f.get('fee')) * 100) }); }}><h3 className="full">{t("Tamiri tamamla")}</h3><label className="full">{t("Yapılan işlemler")}<textarea name="work" required minLength={3}/></label><label className="full">{t("Değiştirilen parçalar")}<input name="parts"/></label><label>{t("Nihai ücret (₺)")}<input type="number" name="fee" min="0" step="0.01" defaultValue={(selected.quotes.at(-1)?.total || 0) / 100} required/></label><label>{t("Garanti süresi ve koşulları")}<input name="warranty"/></label><button className="btn primary" disabled={busy}>{t("Teslime hazır olarak kaydet")}</button></form>}
 {selected.completion && <div className="detail-block"><h3>{t("Tamamlanan işlemler")}</h3><p>{selected.completion.work}</p><p>{selected.completion.parts}</p><strong>{money(selected.completion.fee, selected.currency)}</strong><p>{t("Garanti:")}{' '}{selected.completion.warranty || t('Belirtilmedi')}</p></div>}
 {selected.status === 'Teslime hazır' && <form className="detail-block" onSubmit={e => { e.preventDefault(); change('deliver', { note: new FormData(e.currentTarget).get('note') }); }}><h3>{t("Teslim kaydı")}</h3><label>{t("Teslim açıklaması")}<textarea name="note" placeholder={t("Teslim alan kişi ve teslim bilgileri")}/></label><button className="btn primary" disabled={busy}>{t("Teslim edildi olarak kaydet")}</button></form>}
 {(demo || me?.role === 'admin') && <div className="detail-block"><h3>{t("Takip bağlantısını yenile")}</h3><p className="muted">{t("Eski bağlantı anında geçersiz olur. Yeni bağlantıyı müşteriyle paylaşmanız gerekir.")}</p><button className="btn" disabled={busy} onClick={() => { void ensureTrackingLink(true); }}>{t("Yeni güvenli bağlantı oluştur")}</button></div>}</>}
 {tab === 'İşlem geçmişi' && <><div className="timeline">{selected.events.filter(ev => !ev.deletedAt).slice().reverse().map(ev => <div className={'timeline-item ' + (ev.internal ? 'internal' : '')} key={ev.id}><small>{date(ev.at)} · {new Date(ev.at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</small><p>{demo ? t(ev.text) : eventText(ev.text)}</p><span>{ev.actor === 'Müşteri' ? t('Müşteri') : ev.actor}{ev.internal ? ' · ' + t('İç not') : ''}</span>{!demo && me?.role === 'admin' && <button className="text-btn history-remove" disabled={busy} onClick={() => removeHistory(ev.id)}>{t("Adımı sil")}</button>}</div>)}</div><form className="detail-block" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); change('notes', { text: f.get('text'), internal: f.get('internal') === 'on' }); e.currentTarget.reset(); }}><h3>{t("Yeni not ekle")}</h3><textarea name="text" required placeholder={t("Süreç hakkında bir açıklama yazın...")} aria-label={t("Not metni")}/><label className="checkbox"><input type="checkbox" name="internal" defaultChecked/>{t("Yalnızca servis çalışanları görsün")}</label><button disabled={busy} className="btn primary">{t("Notu kaydet")}</button></form></>}
 {tab === 'Fiyat teklifi' && <><div className="callout">{t("Tutar veya kapsam değişirse yeni teklif oluşturulur ve yeniden müşteri onayı alınır.")}</div>{selected.quotes.filter(q => !q.deletedAt).slice().reverse().map(q => <div className="detail-block" key={q.version}><div className="panel-title"><h3>{t('Teklif v{version}', { version: q.version })}</h3><span className="badge">{q.decision === 'approved' ? t('Onaylandı') : q.decision === 'rejected' ? t('Reddedildi') : t('Onay bekliyor')}</span></div><p>{content(q.diagnosis)}</p><p className="muted">{content(q.work)}</p>{q.parts.map((p, i) => <div className="price-line" key={i}><span>{content(p.name)}</span><b>{money(p.amount, selected.currency)}</b></div>)}<div className="price-line"><span>{t("İşçilik")}</span><b>{money(q.labor, selected.currency)}</b></div><div className="price-line total"><span>{t("Toplam")}</span><strong>{money(q.total, selected.currency)}</strong></div>{q.decidedAt && <small>{t("Karar:")}{' '}{new Date(q.decidedAt).toLocaleString(locale)}</small>}{canDeleteQuote(selected,q) ? <button type="button" className="btn service-photo-delete quote-delete" disabled={busy} onClick={() => removeQuoteVersion(q.version)}><Trash2 size={15} aria-hidden="true"/>{t("Teklifi sil")}</button> : <p className="muted">{t("Devam eden veya tamamlanan tamire ait güncel teklif silinemez.")}</p>}</div>)}<QuoteForm record={selected} busy={busy} submit={body => change('quote', body)}/></>}
 {tab === 'Fotoğraflar' && <><div className="photo-grid">{selected.photos.map(p => <article className="service-photo-card" key={p.id}><a target="_blank" href={'/api/v1/photos/' + selected.id + '/' + p.id} rel="noreferrer"><img src={'/api/v1/photos/' + selected.id + '/' + p.id} alt={t('{phase} fotoğrafı', { phase: t(p.phase) })}/></a><div className="service-photo-meta"><span>{t(p.phase)}</span><label className="checkbox"><input type="checkbox" checked={p.visible} disabled={busy} onChange={e => change('photos', { id: p.id, visible: e.target.checked })}/>{t("Müşteriye göster")}</label><button type="button" className="btn service-photo-delete" disabled={busy} onClick={() => removePhoto(p.id)} aria-label={t('{phase} fotoğrafını sil', { phase: t(p.phase) })}><Trash2 size={15} aria-hidden="true"/>{t("Fotoğrafı sil")}</button></div></article>)}</div>{!selected.photos.length && <div className="empty"><h3>{t("Henüz fotoğraf eklenmedi.")}</h3><p>{t("Kabul, tamir öncesi ve sonrası fotoğrafları ekleyin.")}</p></div>}<PhotoUpload demo={demo} id={selected.id} onSaved={r => { setSelected(previous => previous?.id === r.id ? r : previous); setData(previous => previous.map(x => x.id === r.id ? r : x)); }}/></>}
 </div><div className="drawer-footer">{t("Değişiklikler işlem geçmişine kaydedilir.")}</div></section></div>}
 </div>;
}
function Intake({ demo, team, onClose, onCreated }: {
    demo: boolean;
    team: string[];
    onClose: () => void;
    onCreated: (r: RecordData, t: string) => void;
}) {
    const { t, locale } = useI18n();
    const [step, setStep] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const form = useRef<HTMLFormElement>(null);
    const [existing, setExisting] = useState<any[]>([]);
    useEffect(() => {
        if (!demo)
            api('customers').then(setExisting).catch(() => { });
    }, [demo]);
    const next = () => {
        const inputs = form.current?.querySelectorAll('[data-step="' + step + '"] input,[data-step="' + step + '"] textarea,[data-step="' + step + '"] select');
        if (inputs && Array.from(inputs).some(x => !(x as HTMLInputElement).reportValidity()))
            return;
        setStep(step + 1);
    };
    return <div className="modal-overlay"><section className="intake-modal" role="dialog" aria-modal="true" aria-label={t("Yeni servis kaydı")}><div className="modal-heading"><div><h2>{t("Servis kaydı oluştur")}</h2></div><button autoFocus className="icon-btn" aria-label={t("Formu kapat")} onClick={onClose}>{t("Kapat")}</button></div><div className="steps">{['Müşteri', 'Cihaz ve arıza', 'Kabul bilgileri'].map((s, i) => <button key={s} className={step === i ? 'current' : step > i ? 'done' : ''} disabled={i > step} onClick={() => setStep(i)}><span>{i + 1}</span>{t(s)}</button>)}</div><form ref={form} onSubmit={async (e) => {
            e.preventDefault();
            if (step < 2) {
                next();
                return;
            }
            if (demo) {
                setError('Gerçek servis kaydı oluşturmak için PostgreSQL bağlantısının yapılandırılması gerekiyor. Bu örnek görünüm veri kaydetmez.');
                return;
            }
            setBusy(true);
            setError('');
            const f = Object.fromEntries(new FormData(e.currentTarget));
            try {
                const d = await api('records', 'POST', { ...f, receivedAt: new Date(String(f.receivedAt)).toISOString() });
                onCreated(d.data, d.token);
            }
            catch (e) {
                setError((e as Error).message);
            }
            finally {
                setBusy(false);
            }
        }}>
 <div hidden={step !== 0} data-step="0"><h3>{t("Müşteri bilgileri")}</h3><p className="muted">{t("Aynı telefon numarası, mevcut müşteriyle otomatik eşleştirilir.")}</p>{existing.length > 0 && <label>{t("Mevcut müşteriden seç")}<select onChange={e => {
                const c = existing.find(c => c.id === e.target.value);
                if (c)
                    for (const k of ['name', 'phone', 'email']) {
                        const input = form.current?.elements.namedItem(k) as HTMLInputElement;
                        input.value = c[k];
                    }
            }}><option value="">{t("Yeni müşteri / müşteri seçin")}</option>{existing.map(c => <option value={c.id} key={c.id}>{c.name} · {c.phone}</option>)}</select></label>}<div className="form-grid"><label className="full">{t("Ad soyad *")}<input name="name" required minLength={2} maxLength={120} placeholder={t("Örn. Elif Yılmaz")} autoComplete="name"/></label><label className="full">{t("Telefon numarası *")}<input name="phone" required minLength={10} type="tel" placeholder={t('05xx xxx xx xx')} autoComplete="tel"/></label><label className="full">{t("E-posta adresi")}<input name="email" type="email" placeholder={t('ornek@eposta.com')} autoComplete="email"/><small>{t("Teklif onayı için müşterinin erişebildiği bir e-posta gerekir.")}</small></label></div></div>
 <div hidden={step !== 1} data-step="1"><h3>{t("Cihaz bilgileri")}</h3><div className="form-grid"><label>{t("Cihaz türü *")}<select name="kind"><option value={"Telefon"}>{t("Telefon")}</option><option value={"Tablet"}>{t("Tablet")}</option><option value={"Bilgisayar"}>{t("Bilgisayar")}</option></select></label><label>{t("Marka *")}<input name="brand" required placeholder={t('Apple, Samsung...')}/></label><label>{t("Model *")}<input name="model" required placeholder="iPhone 14 Pro"/></label><label>{t("Seri no / IMEI")}<input name="serial" maxLength={100}/></label><label className="full">{t("Müşterinin bildirdiği arıza *")}<textarea name="fault" required minLength={5} maxLength={3000} placeholder={t("Sorunu müşterinizin anlattığı şekilde kaydedin.")}/></label></div></div>
 <div hidden={step !== 2} data-step="2"><label>{t("Para birimi")}<select name="currency" defaultValue="TRY"><option value="EUR">Euro (€)</option><option value="TRY">{t("Türk lirası (₺)")}</option><option value="USD">{t("ABD doları ($)")}</option></select></label><h3>{t("Kabul bilgileri")}</h3><div className="form-grid"><label className="full">{t("Teslim alındığındaki fiziksel durum")}<textarea name="condition" placeholder={t("Çizik, kırık, darbe izleri...")}/></label><label className="full">{t("Teslim alınan aksesuarlar")}<input name="accessories" placeholder={t("Şarj kablosu, adaptör, kılıf...")}/></label><label>{t("Teslim alma tarihi *")}<input name="receivedAt" type="datetime-local" required defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}/></label><label>{t("Sorumlu teknisyen *")}<input name="technician" list="technicians" required placeholder={t("Teknisyen adı")}/><datalist id="technicians">{team.map(label => <option key={label} value={label}>{t(label)}</option>)}</datalist></label></div><div className="callout">{t("Kayıt sonrası güvenli takip bağlantısı ve QR kod oluşturulur. Fotoğrafları servis detayından ekleyebilirsiniz.")}</div></div>
 {error && <p role="alert" className="error-text">{t(error)}</p>}<div className="modal-footer"><button type="button" className="btn" onClick={() => step ? setStep(step - 1) : onClose()}>{step ? t('Geri') : t('Vazgeç')}</button><span>{step + 1} / 3</span>{step < 2 ? <button type="button" className="btn primary" onClick={next}>{t("Devam et")}</button> : <button className="btn primary" disabled={busy}>{busy ? null : null}{t("Servis kaydını oluştur")}</button>}</div></form></section></div>;
}
function PhotoUpload({ id, demo, onSaved }: {
    id: string;
    demo: boolean;
    onSaved: (r: RecordData) => void;
}) {
    const { t } = useI18n();
    const [preparing, setPreparing] = useState(false);
    const [progress, setProgress] = useState(0), [error, setError] = useState(''), [busy, setBusy] = useState(false), [previews, setPreviews] = useState<string[]>([]);
    useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
    return <form className="detail-block" onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setError('');setProgress(0);
            if (demo) {
                setError('Fotoğraf yüklemek için veritabanı ve fotoğraf depolama bağlantısını yapılandırın.');
                return;
            }
            const form = e.currentTarget;
            const f = new FormData(form);
            const files = f.getAll('files').filter(x => x instanceof File && x.size > 0) as File[];
            if (!files.length) {
                setError('En az bir fotoğraf seçin.');
                return;
            }
            if(files.length>10){setError('Bir seferde en fazla 10 fotoğraf seçin.');return;}
            setBusy(true);
            try {
                for (let i = 0; i < files.length; i++) {
                    setPreparing(true);
                    const prepared = await preparePhoto(files[i]);
                    setPreparing(false);
                    const body = new FormData();
                    body.set('file', prepared);
                    body.set('phase', String(f.get('phase')));
                    body.set('visible', f.get('visible') === 'on' ? 'true' : 'false');
                    await new Promise<void>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', '/api/v1/records/' + id + '/photos');
                        xhr.setRequestHeader('Accept-Language', clientLanguage());
                        xhr.timeout=90000;
                        xhr.ontimeout=()=>reject(new Error('Yükleme zaman aşımına uğradı. Tekrar deneyin.'));
                        xhr.upload.onprogress = ev => {
                            if (ev.lengthComputable)
                                setProgress(Math.round((i + ev.loaded / ev.total) / files.length * 100));
                        };
                        xhr.onload = () => {
                            if(xhr.status<200 || xhr.status>=300){reject(new Error(uploadFailure(xhr.status,xhr.responseText)));return;}
                            try {onSaved(JSON.parse(xhr.responseText));resolve();}
                            catch {reject(new Error('Yükleme yanıtı alınamadı.'));}
                        };
                        xhr.onerror = () => reject(new Error('Bağlantı kesildi. Tekrar deneyin.'));
                        xhr.send(body);
                    });
                }
                setProgress(100);setPreviews([]);form.reset();
            }
            catch (e) {
                setError((e as Error).message);
            }
            finally {
                setBusy(false);setPreparing(false);
            }
        }}><h3>{t("Fotoğraf ekle")}</h3><label>{t("Fotoğraflar · en fazla 30 MB · büyük dosyalar otomatik küçültülür")}<input type="file" name="files" multiple disabled={busy} accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={e => {
            const files = Array.from(e.target.files || []);
            setPreviews(files.filter(f => f.size <= 30 * 1024 * 1024).slice(0,10).map(f => URL.createObjectURL(f)));
            if (files.some(f => f.size > 30 * 1024 * 1024))
                setError('Fotoğraf en fazla 30 MB olabilir.');
        }}/></label><div className="photo-grid">{previews.map(p => <img key={p} src={p} alt={t("Yükleme önizlemesi")}/>)}</div><label>{t("Aşama")}<select name="phase" disabled={busy}><option value={"Kabul"}>{t("Kabul")}</option><option value={"Tamir \u00F6ncesi"}>{t("Tamir öncesi")}</option><option value={"Tamir sonras\u0131"}>{t("Tamir sonrası")}</option></select></label><label className="checkbox"><input type="checkbox" name="visible" disabled={busy}/>{t("Müşteri takip sayfasında göster")}</label>{preparing && <p role="status">{t("Fotoğraf hazırlanıyor…")}</p>}{busy && <div><progress max={100} value={progress}/><span>{t('{progress}% yükleniyor', { progress })}</span></div>}{progress===100 && !busy && !error && <p role="status">{t("Fotoğraflar yüklendi.")}</p>}{error && <p className="error-text" role="alert">{t(error)}</p>}<button className="btn primary" disabled={busy}>{preparing ? t('Fotoğraf hazırlanıyor…') : busy ? t('Yükleniyor...') : t('Fotoğrafları yükle')}</button></form>;
}
function QuoteForm({ record, busy, submit }: {
    record: RecordData;
    busy: boolean;
    submit: (body: unknown) => void;
}) { const { t, money } = useI18n(); const [parts, setParts] = useState([{ id: crypto.randomUUID(), name: '', amount: '' }]), [labor, setLabor] = useState(''); const total = parts.reduce((s, p) => s + Math.round(Number(p.amount || 0) * 100), 0) + Math.round(Number(labor || 0) * 100); return <form className="detail-block form-grid" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); submit({ diagnosis: f.get('diagnosis'), work: f.get('work'), parts: parts.filter(p => p.name).map(p => ({ name: p.name, amount: Math.round(Number(p.amount) * 100) })), labor: Math.round(Number(labor) * 100), eta: f.get('eta') }); }}><h3 className="full">{record.quotes.length ? t('Yeni teklif sürümü') : t('Fiyat teklifi oluştur')}</h3><label className="full">{t("Tespit edilen arıza")}<textarea name="diagnosis" required minLength={3} defaultValue={record.id.startsWith('sample-') ? t(record.fault) : record.fault}/></label><label className="full">{t("Yapılacak işlemler")}<textarea name="work" required minLength={3}/></label><div className="full"><h3>{t("Parçalar ve ücretleri")}</h3>{parts.map((p, i) => <div className="part-editor" key={p.id}><input placeholder={t("Parça adı")} aria-label={t('Parça {index} adı', { index: i + 1 })} value={p.name} onChange={e => setParts(parts.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))}/><input placeholder={t("Tutar") + " (" + (record.currency ?? "TRY") + ")"} type="number" min="0" step="0.01" required={!!p.name} aria-label={t('Parça {index} tutarı', { index: i + 1 })} value={p.amount} onChange={e => setParts(parts.map(x => x.id === p.id ? { ...x, amount: e.target.value } : x))}/><button type="button" className="icon-btn" aria-label={t("Parçayı kaldır")} onClick={() => setParts(parts.filter(x => x.id !== p.id))}>{t("Kald\u0131r")}</button></div>)}<button type="button" className="text-btn" onClick={() => setParts([...parts, { id: crypto.randomUUID(), name: '', amount: '' }])}>{t("Parça ekle")}</button></div><label>{t("İşçilik") + " (" + (record.currency ?? "TRY") + ")"}<input type="number" value={labor} onChange={e => setLabor(e.target.value)} min="0" step="0.01" required/></label><label>{t("Tahmini teslim")}<input type="date" name="eta"/></label><div className="price-line total full"><span>{t("Teklif toplamı")}</span><strong>{money(total, record.currency)}</strong></div><button disabled={busy} className="btn primary full">{t("Teklifi onaya sun")}</button></form>; }

function StaffPasswordForm({staffId,onSaved}:{staffId:string;onSaved:(message:string)=>void}){
 const {t}=useI18n();const [busy,setBusy]=useState(false);
 return <details><summary>{t("Parola belirle")}</summary><form className="detail-block" onSubmit={async e=>{
  e.preventDefault();if(busy)return;const form=e.currentTarget;const password=new FormData(form).get('password');setBusy(true);
  try{await api('users/password','PATCH',{id:staffId,password});form.reset();onSaved('Parola güncellendi. Önceki oturumlar kapatıldı.');}
  catch(error){onSaved((error as Error).message);}finally{setBusy(false);}
 }}><label>{t("Yeni parola (en az 12 karakter)")}<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={200} required disabled={busy}/></label><button className="btn" disabled={busy}>{t("Parolayı kaydet")}</button></form></details>;
}
