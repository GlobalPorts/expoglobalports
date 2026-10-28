export const typeName=s=>({'Carga Containerizada':'Carga contenerizada','Carga Proyecto':'Carga de proyecto','Combustibles y Químicos':'Combustibles y químicos','Otros Rubros':'Otros rubros'}[s]||s);
export function formatPercent(value,digits=1,fmt=(v,d)=>v.toLocaleString('es-AR',{maximumFractionDigits:d})){
 if(!Number.isFinite(value))return '—';const rounded=Number(value.toFixed(digits));return (rounded>0?'+':'')+fmt(Object.is(rounded,-0)?0:rounded,digits)+' %';
}
export function sourceLink(url,label,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))){return url?`<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`:esc(label)}
export const sourceUrls={cargo:'https://www.argentina.gob.ar/economia/agencia-nacional-de-puertos-y-navegacion/puertos/estadisticas-de-carga',cruises:'https://www.argentina.gob.ar/economia/agencia-nacional-de-puertos-y-navegacion/puertos/estadisticas-de-carga',madryn:'https://appm.com.ar/extra/estadistica-cruceros-2003-2025.pdf'};
export function dateShort(iso,annual=false){return annual?iso.slice(0,4):new Date(iso+'T12:00:00').toLocaleDateString('es-AR',{month:'short',year:'numeric'})}
export function gapBefore(previous,current,{months=0,days=0}={}){
 if(!previous)return false;
 if(months){const m=d=>+d.slice(0,4)*12+(+d.slice(5,7));return m(current)-m(previous)>months;}
 return days>0&&(Date.parse(current)-Date.parse(previous))/86400000>days;
}

export const unitLabel=value=>String(value??'').replace(/^t(?=$|\s)/,'Tn.').replace(/\/t(?=$|[\s.,;:)])\.?/g,'/Tn.');
