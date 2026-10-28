import {change} from './core.js';
import {variations,yearVolumeChange} from './metrics.js';
import {macroMetrics,tradeAccumulated,accumulatedHistory,signedPercentChange} from './macro-metrics.js';
export function seriesMetrics(rows,meta){
 const annual=meta.frequency==='anual',monthly=meta.frequency==='mensual'||meta.id==='CEDAR_3'||meta.id.startsWith('CEDOL');
 return rows.map(r=>({...r,...variations(rows,r,{annual,monthly,preserve:!!meta.preserveVariations}),...(meta.id==='CEDAR_3'?{ytd:yearVolumeChange(rows,r)}:{})}));
}
export function comparisonMetrics(r,{monthly=false,annual=false,quarterly=false,seasonal=false,volume=false}={}){
 const out=[];if(quarterly)out.push({label:'Var. trimestral',value:r.quarterly,unit:'%'});
 if(!monthly&&!annual&&!quarterly&&!seasonal)out.push({label:'Var. semanal',value:r.weekly,unit:'%'});
 if(monthly||(!annual&&!quarterly&&!seasonal))out.push({label:'Var. mensual',value:r.monthly,unit:'%'});
 out.push({label:seasonal?'Var. frente a temporada anterior':'Var. interanual',value:r.yoy,unit:'%'});
 if(!annual&&!seasonal)out.push({label:volume?'Var. i.a. acumulada':'Var. acumulada del año',value:r.ytd,unit:'%'});if(r.coverageChanged)out.push({label:'Cobertura',text:'Puertos informados distintos entre períodos'});return out;
}
// Indexed periods compare only observations with the same reported scope.
export function periodMetrics(points,{quarterly=false,requireSameCoverage=true}={}){
 const map=new Map(points.map(r=>[r.period,r])),compatible=(a,b)=>a&&b&&(!requireSameCoverage||(a.coverage??'')===(b.coverage??''));
 return points.map(r=>{
  const year=quarterly?Math.floor(r.period/4):r.period,quarter=quarterly?r.period%4+1:null,previous=map.get(r.period-1),prior=map.get(r.period-(quarterly?4:1));
  let ytd=null;
  if(quarterly){let current=0,base=0,ok=true;for(let q=0;q<quarter;q++){const a=map.get(year*4+q),b=map.get((year-1)*4+q);if(!compatible(a,b)){ok=false;break;}current+=a.value;base+=b.value;}if(ok)ytd=change(current,base);}
  return {...r,coverageChanged:!!((previous&&(r.coverage??'')!==(previous.coverage??''))||(prior&&(r.coverage??'')!==(prior.coverage??''))),quarterly:quarterly&&compatible(r,previous)?change(r.value,previous.value):null,yoy:compatible(r,prior)?change(r.value,prior.value):null,ytd};
 });
}
export const cargoSeriesKey=r=>JSON.stringify([r.province,r.port,r.rubro,r.operation,r.unit,r.type,r.sector]);
export function cargoMetrics(rows){
 const groups=new Map();for(const r of rows){const key=cargoSeriesKey(r);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
 const lookup=new Map();for(const [key,rs] of groups){const periods=new Map();for(const r of rs){const period=r.year*4+r.quarter-1;if(!periods.has(period))periods.set(period,{period,value:0});periods.get(period).value+=r.value;}lookup.set(key,new Map(periodMetrics([...periods.values()],{quarterly:true}).map(r=>[r.period,r])));}
 return rows.map(r=>{const m=lookup.get(cargoSeriesKey(r)).get(r.year*4+r.quarter-1);return {...r,quarterly:m.quarterly,yoy:m.yoy,ytd:m.ytd};});
}
export function cruiseMetrics(rows){
 const key=r=>JSON.stringify([r.port,r.metric,r.month||'Temporada completa']),map=new Map(rows.map(r=>[key(r)+'|'+r.season,r]));
 return rows.map(r=>{const year=+r.season.slice(0,4),p=map.get(key(r)+'|'+(year-1)+'-'+year);return {...r,yoy:change(r.value,p?.value)};});
}
export function comparableHistory(rows,row,range,frequency){
 if(frequency==='Mensual')return accumulatedHistory(rows,row,range);
 const year=+row.date.slice(0,4),first=range==='all'?-Infinity:year-Number(range),prior=rows.filter(r=>+r.date.slice(0,4)>=first&&+r.date.slice(0,4)<year&&r.date.slice(5,7)===row.date.slice(5,7)),average=prior.length?prior.reduce((s,r)=>s+r.value,0)/prior.length:null;
 return {current:row.value,average,difference:average===null?null:row.value-average,percentage:signedPercentChange(row.value,average),years:prior.map(r=>+r.date.slice(0,4))};
}
export function macroSeriesMetrics(data,meta,rows){
 const activity=meta.domain==='Actividad',balance=meta.id==='SAL',total=meta.group==='EMAE total',frequency=meta.frequency;
 const original=activity&&total?data.records.filter(r=>r.id==='EMAE_O'):rows,sa=activity?(total?data.records.filter(r=>r.id==='EMAE_SA'):[]):(data.tradeSeasonallyAdjusted?.[meta.id]||[]);
 return rows.map(r=>{const o=original.find(z=>z.date.slice(0,7)===r.date.slice(0,7))||r,v=macroMetrics(original,o,frequency),a=sa.find(z=>z.date.slice(0,7)===r.date.slice(0,7)),prior=rows.find(z=>z.date.slice(0,7)===(+r.date.slice(0,4)-1)+r.date.slice(4,7));
  return {...r,yoy:balance?null:v.yoy,changeYoy:balance&&prior?r.value-prior.value:null,monthly:a?macroMetrics(sa,a,frequency).monthly:null,ytd:v.ytd,...(!activity&&frequency==='Mensual'?tradeAccumulated(rows,r):{})};
 });
}
