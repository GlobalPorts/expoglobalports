export function macroChange(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&b>0?(a/b-1)*100:null}
export function macroMetrics(rows,row,frequency='Mensual'){
 const [y,m]=row.date.split('-').map(Number), at=(year,month)=>rows.find(r=>+r.date.slice(0,4)===year&&+r.date.slice(5,7)===month)?.value;
 const yoy=macroChange(row.value,at(y-1,m));
 const monthly=frequency==='Mensual'?macroChange(row.value,m===1?at(y-1,12):at(y,m-1)):null;
 const current=Array.from({length:m},(_,i)=>at(y,i+1)),previous=Array.from({length:m},(_,i)=>at(y-1,i+1));
 const complete=a=>a.every(Number.isFinite);
 const accumulated=frequency==='Mensual'&&complete(current)?current.reduce((a,b)=>a+b,0):null;
 const ytd=frequency==='Mensual'&&complete(current)&&complete(previous)?macroChange(accumulated,previous.reduce((a,b)=>a+b,0)):null;
 return {yoy,monthly,accumulated,ytd};
}

export function accumulatedThrough(rows,date){
 const [year,month]=date.split('-').map(Number);let total=0;
 for(let m=1;m<=month;m++){const r=rows.find(r=>+r.date.slice(0,4)===year&&+r.date.slice(5,7)===m);if(!r||!Number.isFinite(r.value))return null;total+=r.value;}return total;
}
export function signedPercentChange(current,previous){return Number.isFinite(current)&&Number.isFinite(previous)&&previous!==0?(current-previous)/Math.abs(previous)*100:null}
export function tradeAccumulated(rows,row){
 const priorDate=(+row.date.slice(0,4)-1)+row.date.slice(4),accumulated=accumulatedThrough(rows,row.date),previous=accumulatedThrough(rows,priorDate);
 return {accumulated,previous,accumulatedYoy:signedPercentChange(accumulated,previous)};
}
export function accumulatedHistory(rows,row,range='5'){
 const year=+row.date.slice(0,4),first=range==='all'?Math.min(...rows.map(r=>+r.date.slice(0,4))):year-Number(range),periods=[];
 for(let y=first;y<year;y++){const value=accumulatedThrough(rows,y+row.date.slice(4));if(value!==null)periods.push({year:y,value});}
 const current=accumulatedThrough(rows,row.date),average=periods.length?periods.reduce((s,r)=>s+r.value,0)/periods.length:null;
 return {current,average,difference:current!==null&&average!==null?current-average:null,percentage:signedPercentChange(current,average),years:periods.map(r=>r.year)};
}
