import {sum,group} from './core.js';
import {periodMetrics,comparisonMetrics} from './series-metrics.js';
import {sourceLink,sourceUrls,formatPercent} from './presentation.js';
const MONTHS=['Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto'];
const METRICS={transportados:'Pasajeros transportados',desembarcados:'Desembarcados',embarcados:'Embarcados',en_transito:'En tránsito'};
const unique=(r,k)=>[...new Set(r.map(x=>x[k]))].filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b),'es'));
export function renderCruisesView(ctx){
 const {data:D,state:S,head,field,options,kpi,fmt,esc,chart,ranking}=ctx;
 const calls=S.cruiseMeasure==='calls',all=calls?D.ships:D.cruisesPublic,seasons=unique(all,'season').reverse();
 if(!seasons.includes(S.season))S.season=seasons[0];
 const sr=all.filter(r=>r.season===S.season),available=unique(sr,'metric');
 if(!calls&&!available.includes(S.metric))S.metric=available.includes('en_transito')?'en_transito':available[0];
 const selected=sr.filter(r=>calls||r.metric===S.metric),ports=unique(selected,'port');if(S.cruisePort&&!ports.includes(S.cruisePort))S.cruisePort='';
 const rr=selected.filter(r=>!S.cruisePort||r.port===S.cruisePort),unit=calls?'recaladas':'movimientos de pasajeros',pct=v=>formatPercent(v,1,fmt);
 const fullPorts=new Set(rr.filter(r=>r.month==='Temporada completa').map(r=>r.port));const totalRows=calls?rr:rr.filter(r=>r.month==='Temporada completa'||!fullPorts.has(r.port));
 const detail=rr.filter(r=>r.month!=='Temporada completa'),monthPorts=unique(detail,'port'),fullOnly=unique(rr.filter(r=>r.month==='Temporada completa'&&!monthPorts.includes(r.port)),'port');
 const source=sourceLink(sourceUrls.cruises,'ANPyN',esc)+(calls?' · '+sourceLink(sourceUrls.madryn,'Administración Portuaria de Puerto Madryn',esc):'');
 let charts='';
 if(calls){
  const scope=all.filter(r=>!S.cruisePort||r.port===S.cruisePort);
  for(const port of unique(scope,'port')){
   const ps=scope.filter(r=>r.port===port),series=periodMetrics(group(ps,'season').sort((a,b)=>a.label.localeCompare(b.label)).map(r=>({...r,period:+r.label.slice(0,4),x:+r.label.slice(0,4),coverage:port})));
   charts+=`<section class="panel"><h2>Recaladas · ${esc(port)}</h2><p class="panel-desc">${series[0].label}–${series.at(-1).label} · Elaboración GlobalPorts en base a ${sourceLink(port==='Puerto Madryn'?sourceUrls.madryn:sourceUrls.cruises,port==='Puerto Madryn'?'APPM':'ANPyN',esc)}</p><div class="chart">${chart(series.map((r,i)=>({...r,short:r.label,breakBefore:i>0&&r.period-series[i-1].period>1,metrics:comparisonMetrics(r,{seasonal:true})})),{unit:'recaladas',floorZero:true})}</div><p class="chart-caption">Serie del mismo puerto. Los períodos sin información interrumpen la curva; no se interpretan como cero.</p></section>`;
  }
 }else{
  const monthly=group(detail,'month').sort((a,b)=>MONTHS.indexOf(a.label)-MONTHS.indexOf(b.label));
  const previous=all.filter(r=>r.season===`${+S.season.slice(0,4)-1}-${S.season.slice(0,4)}`&&r.metric===S.metric);
  const key=r=>r.port+'|'+r.month;
  const points=monthly.map((r,i)=>{const rs=detail.filter(x=>x.month===r.label),old=previous.filter(x=>x.month===r.label&&monthPorts.includes(x.port));const coverage=rs.map(key).sort().join('|'),same=coverage===old.map(key).sort().join('|'),year=+S.season.slice(0,4)+(MONTHS.indexOf(r.label)>=4?1:0);return {...r,label:r.label.toLowerCase()+' de '+year,short:r.label.slice(0,3).toLowerCase()+' '+year,x:year*12+((MONTHS.indexOf(r.label)+8)%12),breakBefore:i>0&&MONTHS.indexOf(r.label)-MONTHS.indexOf(monthly[i-1].label)>1,yoy:same&&sum(old)>0?(r.value/sum(old)-1)*100:null,metrics:[{label:'Variación frente a igual mes de la temporada anterior',value:same&&sum(old)>0?(r.value/sum(old)-1)*100:null,unit:'%'}]};});
  charts=`<section class="panel"><h2>Movimiento mensual de pasajeros</h2><p class="panel-desc">${esc(METRICS[S.metric])} · temporada ${S.season} · ${esc(monthPorts.join(', ')||'sin desglose mensual disponible')}</p>${fullOnly.length?`<p class="note">La curva mensual excluye ${esc(fullOnly.join(', '))}, donde solo se dispone del total de temporada. Esos totales se muestran por separado en la tabla y el ranking.</p>`:''}<div class="chart">${chart(points,{unit:'movimientos de pasajeros',floorZero:true})}</div></section>`;
 }
 const first=calls?'Recaladas de la temporada':METRICS[S.metric];
 const definition=calls?'Las recaladas son escalas: un mismo buque puede arribar varias veces. Cada curva corresponde a un puerto; no se publica una suma nacional de cobertura variable.':'Los pasajeros embarcados, desembarcados y en tránsito son movimientos, no personas únicas. El total transportado no se suma a sus componentes. Los totales de temporada no se distribuyen entre meses.';
 return head('CRUCEROS','Cruceros, pasajeros y recaladas','Movimiento de pasajeros y escalas por puerto y temporada.')+`<section class="filter-bar">${field('cruiseMeasure','Indicador',options([{value:'passengers',label:'Movimiento de pasajeros'},{value:'calls',label:'Recaladas de cruceros'}],S.cruiseMeasure,null))}${field('season','Temporada',options(seasons,S.season,null))}${!calls?field('metric','Movimiento',options(available.map(x=>({value:x,label:METRICS[x]})),S.metric,null)):''}${field('cruisePort','Puerto',options(ports,S.cruisePort,'Puertos con información'))}</section>
 <section class="kpis">${kpi(first,totalRows.length?sum(totalRows):null,calls?'recaladas':'movimientos','Temporada '+S.season+' · puertos seleccionados')}${kpi('Puertos con cruceros informados',unique(rr,'port').length,'','Para el indicador y la temporada seleccionados')}${calls?kpi('Puertos con serie histórica',unique(all.filter(r=>!S.cruisePort||r.port===S.cruisePort),'port').length,'','Historias individuales, sin sumarlas entre puertos'):kpi('Puertos con desglose mensual',monthPorts.length,'','Las restantes referencias son totales de temporada')}</section><div class="status-line"><span class="badge">Temporada ${S.season}</span><span>Elaboración GlobalPorts en base a ${source}</span></div>
 <div class="cruise-series">${charts}</div><section class="panel"><h2>${calls?'Recaladas':'Movimiento de pasajeros'} por puerto</h2><p class="panel-desc">Temporada ${S.season} · cobertura de los puertos seleccionados</p>${ranking(group(totalRows,'port'),calls?'recaladas':'movimientos')}</section>
 <section class="panel"><h2>Detalle de ${calls?'recaladas':'movimientos'}</h2><div class="table-wrap"><table><thead><tr><th scope="col">Puerto</th><th scope="col">Temporada</th>${!calls?'<th scope="col">Período</th><th scope="col">Movimiento</th>':''}<th scope="col" class="num">${calls?'Recaladas':'Movimientos'}</th><th scope="col" class="num">Var. frente a temporada anterior</th></tr></thead><tbody>${rr.map(r=>`<tr><td>${esc(r.port)}</td><td>${r.season}</td>${!calls?`<td>${esc(r.month==='Temporada completa'?r.month:r.month.toLowerCase())}</td><td>${METRICS[r.metric]}</td>`:''}<td class="num">${fmt(r.value)}</td><td class="num">${pct(r.yoy)}</td></tr>`).join('')}</tbody></table></div>${rr.length?'':'<p class="empty">Sin información publicada para esta selección. No equivale a cero actividad.</p>'}</section>
 <section class="panel"><h2>Alcance de los indicadores</h2><p class="note">${definition}</p><p>Se conserva la temporada identificada por cada fuente. Los meses con desglose se presentan con su año calendario; un total de temporada no informa por sí mismo sus fechas de apertura y cierre.</p></section>`;
}
