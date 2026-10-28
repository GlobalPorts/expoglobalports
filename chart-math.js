export function zoomWindow(start,end,total,factor,anchor=(start+end)/2){
 if(total<2)return [0,Math.max(0,total-1)];
 const size=Math.min(total-1,Math.max(1,Math.round((end-start)*factor)));
 const ratio=end===start ? .5 : (anchor-start)/(end-start);
 let left=Math.round(anchor-size*ratio);left=Math.max(0,Math.min(total-1-size,left));return [left,left+size];
}
export function nearestPoint(x,left,width,start,end){return Math.max(start,Math.min(end,Math.round(start+(x-left)/width*(end-start))))}
export function chartDomain(values,{floorZero=false,bars=false}={}){
 let lo=Math.min(...values),hi=Math.max(...values);const pad=hi===lo?(Math.abs(hi)*.05||1):(hi-lo)*.1;lo-=pad;hi+=pad;
 if(floorZero&&Math.min(...values)>=0)lo=Math.max(0,lo);
 if(bars){lo=Math.min(0,lo);hi=Math.max(0,hi);}return [lo,hi];
}
export function splitChartSegments(points){const out=[];for(const r of points){if(!out.length||r.breakBefore)out.push([]);out.at(-1).push(r);}return out;}
