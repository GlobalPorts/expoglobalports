import {change} from './core.js';
const iso=d=>d.toISOString().slice(0,10);
export function shiftDays(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return iso(d)}
export function shiftMonths(date,months){const d=new Date(date+'T12:00:00Z'),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);const end=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,end));return iso(d)}
export function atOrBefore(rows,date,maxLag=10){let lo=0,hi=rows.length-1,found=null;while(lo<=hi){const m=(lo+hi)>>1;if(rows[m].date<=date){found=rows[m];lo=m+1}else hi=m-1}return found&&found.date>=shiftDays(date,-maxLag)?found:null}
export function variations(rows,row,{monthly=false,annual=false,preserve=false}={}){
 if(annual){const prior=rows.find(r=>r.date.slice(0,4)===String(+row.date.slice(0,4)-1));return {weekly:null,monthly:null,yoy:change(row.value,prior?.value),ytd:null};}

 const lookup=date=>monthly?rows.find(r=>r.date.slice(0,7)===date.slice(0,7)):atOrBefore(rows,date,14);
 const previous=monthly?shiftMonths(row.date,-1):shiftDays(row.date,-31),priorYear=monthly?shiftMonths(row.date,-12):shiftDays(row.date,-365);
 const base=lookup(`${+row.date.slice(0,4)-1}-12-31`);
 const calculated={weekly:monthly?null:change(row.value,lookup(shiftDays(row.date,-7))?.value),monthly:change(row.value,lookup(previous)?.value),yoy:change(row.value,lookup(priorYear)?.value),ytd:change(row.value,base?.value)};
 return preserve?Object.fromEntries(Object.entries(calculated).map(([k,v])=>[k,Number.isFinite(row[k])?row[k]:v])):calculated;
}
export function yearVolume(rows,row){const year=row.date.slice(0,4),end=+row.date.slice(5,7);const yr=rows.filter(r=>r.date.startsWith(year)&&+r.date.slice(5,7)<=end);return new Set(yr.map(r=>r.date.slice(0,7))).size===end?yr.reduce((s,r)=>s+r.value,0):null}
export function yearVolumeChange(rows,row){const current=yearVolume(rows,row),prior=yearVolume(rows,{date:shiftMonths(row.date,-12)});return change(current,prior)}
export function trailingAverage(rows,row){const start=shiftMonths(row.date,-3);const rr=rows.filter(r=>r.date>start&&r.date<=row.date);return rr.length?rr.reduce((s,r)=>s+r.value,0)/rr.length:null}
