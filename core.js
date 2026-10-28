export const TYPES=['Carga Containerizada','Carga Proyecto','Vehículos','Carga a granel líquida','Carga a granel sólida'];
export const SECTORS=['Agroindustria','Combustibles y Químicos','Minerales','Industriales','Otros Rubros'];
export function sum(rows,key='value'){return rows.reduce((s,r)=>s+(Number.isFinite(r[key])?r[key]:0),0)}
export function group(rows,key,value='value'){const m=new Map();for(const r of rows){const k=typeof key==='function'?key(r):r[key];m.set(k,(m.get(k)||0)+(Number.isFinite(r[value])?r[value]:0));}return [...m].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value)}
export function filterCargo(rows,s){return rows.filter(r=>(!s.year||r.year===+s.year)&&(!s.quarter||r.quarter===+s.quarter)&&(!s.province||r.province===s.province)&&(!s.port||r.port===s.port)&&(!s.type||r.type===s.type)&&(!s.sector||r.sector===s.sector)&&(!s.rubro||r.rubro===s.rubro)&&(!s.unit||r.unit===s.unit));}
export function change(current,previous){return Number.isFinite(current)&&Number.isFinite(previous)&&previous!==0?(current/previous-1)*100:null}
export function monthly(rows){const out=group(rows,r=>r.date.slice(0,7));return out;}
export function latest(rows){return [...rows].sort((a,b)=>a.date.localeCompare(b.date)).at(-1)||null}
