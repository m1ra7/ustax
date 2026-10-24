'use client';
import { useEffect, useState } from 'react';
import { ThemeSwitch } from '../../theme';
import { useI18n, LanguageSelect } from '../../language';
import { Wrench, ShieldCheck, CheckCircle2, Clock, ChevronRight, Mail, Loader2, ArrowRight, Check, X, Phone, AlertCircle, Smartphone } from 'lucide-react';
import { sampleRecords } from '../../../lib/sample';
import { publicRecord } from '../../../lib/domain';
export default function Tracking({ token }: {
    token: string;
}) {
    const { t, language, locale, money, date, eventText } = useI18n();
    const demo = token === 'ornek';
    const content = (v: string) => demo ? t(v) : v;
    const [r, setR] = useState<any>(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(false), [challenge, setChallenge] = useState(''), [code, setCode] = useState(''), [message, setMessage] = useState(''), [decision, setDecision] = useState('approved'), [zoom, setZoom] = useState('');
    async function call(path = '', body?: unknown) { const res = await fetch('/api/v1/track/' + encodeURIComponent(token) + path, { method: body ? 'POST' : 'GET', headers: { 'Accept-Language': language, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined }); const d: any = await res.json(); if (!res.ok)
        throw new Error(d.errorKey || d.error); return d; }
    async function load() { try {
        setR(demo ? publicRecord(sampleRecords[0]) : await call());
        setError('');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { load(); }, [token]);
    const q = r?.quotes.at(-1);
    const stages = ['Teslim alındı', 'İnceleniyor', 'Fiyat onayı bekliyor', 'Tamir ediliyor', 'Teslime hazır', 'Teslim edildi'];
    const index = stages.indexOf(r?.status === 'Parça bekleniyor' ? 'Tamir ediliyor' : r?.status);
    return <div className="tracking-app"><header className="tracking-header"><a href="/" className="brand">UstaX</a><div className="tracking-header-actions"><span><ShieldCheck size={14}/>{t("G\u00FCvenli servis takibi")}</span><LanguageSelect /></div></header><main className="tracking-content">{loading ? <div className="empty"><Loader2 className="spin"/>{t("Servis kayd\u0131n\u0131z y\u00FCkleniyor...")}</div> : r ? <>
        {demo && <div className="demo-banner"><span><span className="demo-pill">{t("\u00D6RNEK TAK\u0130P SAYFASI")}</span>{t("Bu ekran \u00F6rnek veriler i\u00E7erir. Ger\u00E7ek onay veya ret i\u015Flemi yap\u0131lmaz.")}</span></div>}
        <div className="track-welcome"><h1>{t('Servis takibi')}</h1><p>{t("Cihaz\u0131n\u0131z\u0131n servis s\u00FCrecini buradan takip edebilirsiniz.")}</p></div>
        <section className="panel tracking-device"><div className="track-device-icon"><Smartphone size={33}/></div><div><small>{r.number}</small><h2>{r.brand} {r.model.startsWith(r.brand) ? r.model.slice(r.brand.length) : r.model}</h2><p>{t(r.kind)}{' '}{t("\u00B7 Kabul:")}{' '}{new Date(r.createdAt).toLocaleDateString(locale)}</p></div><span className="badge status-2">{t(r.status)}</span></section>
        {q?.decision === 'pending' && <section className="approval-banner"><span className="approval-icon"><Clock size={24}/></span><div><h2>{t("Bir sonraki ad\u0131m i\u00E7in onay\u0131n\u0131z gerekiyor.")}</h2><p>{t("Teknik inceleme tamamland\u0131. Teklifinizi inceleyip karar\u0131n\u0131z\u0131 iletebilirsiniz.")}</p></div><a className="btn primary" href="#teklif">{t("Teklifi incele")}<ArrowRight size={15}/></a></section>}
        <section className="panel track-progress"><div className="panel-title"><div><h2>{t("Servis yolculu\u011Funuz")}</h2><p>{t("G\u00FCncel durum:")}{' '}{t(r.status)}</p></div><span className="live"><i />{demo ? t('Örnek kayıt') : t('Güncel kayıt')}</span></div><div className="track-stages">{stages.map((s, i) => <div className={i < index ? 'completed' : i === index ? 'current' : ''} key={s}><span>{i < index ? <Check size={15}/> : i + 1}</span><small>{t(s)}</small></div>)}</div>{r.eta && <p className="track-eta"><Clock size={14}/>{t("Tahmini teslim:")}{' '}{new Date(r.eta).toLocaleDateString(locale)}<small>{t("Par\u00E7a ve i\u015Flem s\u00FCresine g\u00F6re de\u011Fi\u015Febilir.")}</small></p>}</section>
        <div className="tracking-columns"><div><section className="panel tracking-history"><div className="panel-title"><h2>{t("Son geli\u015Fmeler")}</h2></div><div className="timeline">{[...r.events].reverse().map((ev: any) => <div className="timeline-item" key={ev.id}><span className="timeline-dot"><Check size={12}/></span><small>{new Date(ev.at).toLocaleString(locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</small><p>{demo ? t(ev.text) : eventText(ev.text)}</p></div>)}</div></section>{r.completion && <section className="panel settings-panel"><span className="section-icon"><CheckCircle2 /></span><h2>{t("Tamamlanan i\u015Flemler")}</h2><p className="muted">{r.completion.work}</p><p>{t("De\u011Fi\u015Fen par\u00E7alar:")}{' '}{r.completion.parts || t('Yok')}</p><div className="price-line total"><span>{t("Nihai \u00FCcret")}</span><strong>{money(r.completion.fee, r.currency)}</strong></div><p className="muted">{t("Garanti ko\u015Fullar\u0131:")}{' '}{r.completion.warranty || t('Garanti bilgisi eklenmedi.')}</p><p className="muted">{t("Tamamlanma:")}{' '}{new Date(r.completion.completedAt).toLocaleDateString(locale)}</p>{r.completion.deliveredAt && <p className="muted">{t("Teslim:")}{' '}{new Date(r.completion.deliveredAt).toLocaleDateString(locale)} · {r.completion.deliveryNote}</p>}</section>}
        {r.photos.length > 0 && <section className="panel settings-panel"><h2>{t("Cihaz foto\u011Fraflar\u0131")}</h2><div className="photo-grid">{r.photos.map((p: any) => <button key={p.id} onClick={() => setZoom('/api/v1/photos/track/' + p.id + '?token=' + encodeURIComponent(token))}><img alt={t('{phase} fotoğrafı', { phase: t(p.phase) })} src={'/api/v1/photos/track/' + p.id + '?token=' + encodeURIComponent(token)}/><small>{t(p.phase)}</small></button>)}</div></section>}</div>
        <div><section className="panel tracking-quote" id="teklif"><div className="panel-title"><div><h2>{t("Fiyat teklifiniz")}</h2><p>{q ? t('Teklif sürümü {version}', { version: q.version }) : t('Teknik inceleme sonrası hazırlanacak')}</p></div><FileSymbol /></div>{q ? <div className="quote-body"><h3>{t("Tespit edilen ar\u0131za")}</h3><p className="muted">{content(q.diagnosis)}</p><h3>{t("Yap\u0131lacak i\u015Flemler")}</h3><p className="muted">{content(q.work)}</p>{q.parts.map((p: any, i: number) => <div className="price-line" key={i}><span>{content(p.name)}</span><b>{money(p.amount, r.currency)}</b></div>)}<div className="price-line"><span>{t("\u0130\u015F\u00E7ilik")}</span><b>{money(q.labor, r.currency)}</b></div><div className="price-line total"><span>{t("Toplam")}</span><strong>{money(q.total, r.currency)}</strong></div>{q.decision === 'pending' ? <><div className="callout"><ShieldCheck size={17}/>{t("Karar\u0131n\u0131z, e-postan\u0131za g\u00F6nderilen tek kullan\u0131ml\u0131k kodla do\u011Frulan\u0131r.")}</div><label>{t("Karar\u0131n\u0131z")}<select value={decision} onChange={e => setDecision(e.target.value)}><option value="approved">{t("Teklifi onayl\u0131yorum")}</option><option value="rejected">{t("Teklifi reddediyorum")}</option></select></label>{!challenge ? <button className="btn primary wide" disabled={busy || demo} onClick={async () => { setBusy(true); setMessage(''); try {
            const d = await call('/code', {});
            setChallenge(d.challengeId);
            setMessage(d.messageKey || d.message);
        }
        catch (e) {
            setMessage((e as Error).message);
        }
        finally {
            setBusy(false);
        } }}>{busy ? <Loader2 size={16} className="spin"/> : <Mail size={16}/>}{t("E-postama do\u011Frulama kodu g\u00F6nder")}</button> : <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); try {
            await call('/decision', { challengeId: challenge, code, version: q.version, decision });
            await load();
            setMessage('Kararınız güvenle kaydedildi.');
            setChallenge('');
        }
        catch (e) {
            setMessage((e as Error).message);
        }
        finally {
            setBusy(false);
        } }}><label>{t("6 haneli kod")}<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)} placeholder="000000" required/></label><button disabled={busy} className="btn primary wide">{busy ? <Loader2 size={16} className="spin"/> : <ShieldCheck size={16}/>}{t("Karar\u0131m\u0131 do\u011Frula ve g\u00F6nder")}</button><button type="button" className="text-btn" onClick={() => { setChallenge(''); setCode(''); }}>{t("Yeni kod iste")}</button></form>}{demo && <p className="muted tiny">{t("\u00D6rnek g\u00F6r\u00FCn\u00FCmde e-posta g\u00F6nderilmez.")}</p>}</> : <div className="callout"><CheckCircle2 size={18}/><div>{t(q.decision === 'approved' ? 'Bu teklifi onayladınız.' : 'Bu teklifi reddettiniz.')}{q.decidedAt && <small className="block">{new Date(q.decidedAt).toLocaleString(locale)}</small>}</div></div>}{message && <p className="feedback" role="status">{t(message)}</p>}</div> : <div className="empty"><Clock size={28}/><p>{t("Servisiniz incelemeyi tamamlad\u0131\u011F\u0131nda teklifiniz burada g\u00F6r\u00FCnecek.")}</p></div>}</section>
        <section className="panel track-contact"><span className="section-icon"><Wrench size={20}/></span><h3>{t('Servis iletişim bilgileri')}</h3><p className="muted">{t("Servisinizle ileti\u015Fime ge\u00E7erken servis numaran\u0131z\u0131 payla\u015F\u0131n.")}</p><b>{r.number}</b><p className="muted">{process.env.NEXT_PUBLIC_SERVICE_NAME || t('Teknik servis')}</p>{process.env.NEXT_PUBLIC_SERVICE_PHONE ? <a className="btn wide" href={'tel:' + process.env.NEXT_PUBLIC_SERVICE_PHONE}><Phone size={15}/>{t("Servisi ara")}</a> : <p className="muted tiny">{t("\u0130leti\u015Fim i\u00E7in cihaz kabul belgenizdeki servis bilgilerini kullan\u0131n.")}</p>}</section></div></div><footer className="tracking-footer"><ThemeSwitch/><ShieldCheck size={15}/>{t("Bu ba\u011Flant\u0131 yaln\u0131zca size ait servis kayd\u0131n\u0131 g\u00F6r\u00FCnt\u00FCler.")}<span>{t("UstaX ile g\u00FCvenle.")}</span></footer></> : <div className="empty panel"><AlertCircle size={34}/><h1>{t("Servis kayd\u0131na ula\u015F\u0131lamad\u0131.")}</h1><p>{error?t(error):t('Bağlantı geçersiz veya iptal edilmiş olabilir.')}</p><p>{t("L\u00FCtfen servisinizden yeni bir takip ba\u011Flant\u0131s\u0131 isteyin.")}</p><button className="btn" onClick={load}>{t("Tekrar dene")}</button></div>}</main>{zoom && <div className="lightbox" onClick={() => setZoom('')} role="dialog" aria-modal="true" aria-label={t("Fotoğraf önizlemesi")}><button className="btn" aria-label={t("Fotoğrafı kapat")} onClick={() => setZoom('')}><X /></button><img src={zoom} alt={t("Büyütülmüş cihaz fotoğrafı")}/></div>}</div>;
}
function FileSymbol() { return <span className="quote-symbol">₺</span>; }
