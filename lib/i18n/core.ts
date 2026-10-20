import {messages} from './messages';
export const languages=['tr','en','de'] as const;
export type Language=typeof languages[number];
export const locales:Record<Language,string>={tr:'tr-TR',en:'en-GB',de:'de-DE'};
export const languageNames:Record<Language,string>={tr:'Türkçe',en:'English',de:'Deutsch'};
export function isLanguage(value:unknown):value is Language{return typeof value==='string'&&(languages as readonly string[]).includes(value);}
export function translate(language:Language,source:string,params:Record<string,string|number>={}):string{
 const key=params.count===1&&Object.prototype.hasOwnProperty.call(messages,source+'_one')?source+'_one':source;
 const entry=(messages as Record<string,{en:string;de:string}>)[key];
 const text=language==='tr'?source:entry?.[language]??source;
 return text.replace(/\{(\w+)\}/g,(match,key)=>params[key]!==undefined?String(params[key]):match);
}
export function requestLanguage(headers:Headers):Language{
 const match=headers.get('cookie')?.match(/(?:^|;\s*)s360-language=([^;]*)/);if(match&&isLanguage(match[1]))return match[1];
 const candidates=(headers.get('accept-language')||'').split(',').map((part,index)=>{const [tag,...params]=part.trim().split(';');const q=params.find(p=>p.trim().startsWith('q='));const quality=q?Number(q.trim().slice(2)):1;return {lang:tag.toLowerCase().split('-')[0],quality,index};}).filter(p=>Number.isFinite(p.quality)&&p.quality>0&&p.quality<=1).sort((a,b)=>b.quality-a.quality||a.index-b.index);
 return candidates.find(p=>isLanguage(p.lang))?.lang as Language||'tr';
}
export function clientLanguage():Language{if(typeof document==='undefined')return 'tr';const lang=document.documentElement.lang;return isLanguage(lang)?lang:'tr';}
export function localizedDate(language:Language,value:string,options:Intl.DateTimeFormatOptions={day:'2-digit',month:'short'}){return new Intl.DateTimeFormat(locales[language],options).format(new Date(value));}
export function localizedMoney(language:Language,kuruş:number){return new Intl.NumberFormat(locales[language],{style:'currency',currency:'TRY',minimumFractionDigits:2,maximumFractionDigits:2}).format(kuruş/100);}
export function systemEvent(language:Language,text:string){const patterns=[[/^Teklif v(\d+) müşteri onayına sunuldu\.$/,'Teklif v{version} müşteri onayına sunuldu.'],[/^Teklif v(\d+) onaylandı\.$/,'Teklif v{version} onaylandı.'],[/^Teklif v(\d+) reddedildi\.$/,'Teklif v{version} reddedildi.']] as const;for(const [pattern,key] of patterns){const match=text.match(pattern);if(match)return translate(language,key,{version:match[1]});}const automatic=['Teslim alındı','İnceleniyor','Fiyat onayı bekliyor','Tamir ediliyor','Parça bekleniyor','Teslime hazır','Teslim edildi','Teklif reddedildi','İptal edildi','Cihaz teslim alındı.','Cihaz teslim alındı ve ilk kontroller kaydedildi.','Teknik inceleme tamamlandı.','Fotoğraf eklendi.','Fotoğraf görünürlüğü değiştirildi.','Müşteri e-posta adresi güncellendi.','Takip bağlantısı yenilendi.'];return automatic.includes(text)?translate(language,text):text;}
