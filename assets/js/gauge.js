/* BB Gauges: motor de gauges redondos en SVG (sin librerías). */
(function(){
const NS='http://www.w3.org/2000/svg';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const C=2*Math.PI*210, ARC=C*.75;
const pt=(f,r)=>{const a=(135+270*f)*Math.PI/180;return [240+r*Math.cos(a),240+r*Math.sin(a)]};

const DEFS={
 rpm:{label:'RPM',unit:'x1000 RPM',min:0,max:7000,step:1000,div:1000,fmt:v=>Math.round(v).toLocaleString('en-US'),shift:true},
 boost:{label:'BOOST',unit:'PSI',min:-15,max:25,step:5,fmt:v=>v.toFixed(1),zones:[[21,25]],hi:21},
 afr:{label:'AFR',unit:'AFR · ECU',min:10,max:18,step:1,fmt:v=>v.toFixed(1),zones:[[10,10.8],[16,18]],lo:10.8,hi:16},
 oilt:{label:'TEMP. ACEITE',unit:'°C',min:40,max:140,step:20,fmt:v=>Math.round(v),zones:[[120,140]],hi:120},
 water:{label:'TEMP. AGUA',unit:'°C',min:40,max:120,step:20,fmt:v=>Math.round(v),zones:[[105,120]],hi:105},
 iat:{label:'ADMISIÓN',unit:'°C',min:0,max:80,step:20,fmt:v=>Math.round(v),zones:[[60,80]],hi:60},
 volt:{label:'BATERÍA',unit:'V',min:10,max:16,step:1,fmt:v=>v.toFixed(1),zones:[[10,12],[15,16]],lo:12,hi:15}
};

function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}

function Gauge(svg,opt={}){
 svg.setAttribute('viewBox','0 0 480 480');
 const id='g'+Math.random().toString(36).slice(2,7);
 svg.innerHTML=`<defs>
  <pattern id="${id}cf" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#0A0A0A"/><path d="M0 8L8 0" stroke="rgba(255,255,255,0.035)" stroke-width="2"/><path d="M0 0L8 8" stroke="rgba(0,0,0,0.6)" stroke-width="2"/></pattern>
  <radialGradient id="${id}v" cx="50%" cy="50%" r="50%"><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
  <radialGradient id="${id}b" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#4A4A4A"/><stop offset=".45" stop-color="#181818"/><stop offset="1" stop-color="#050505"/></radialGradient>
  <linearGradient id="${id}gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="${id}c"><circle cx="240" cy="240" r="226"/></clipPath></defs>
  <circle cx="240" cy="240" r="240" fill="url(#${id}b)"/><circle cx="240" cy="240" r="228" fill="#020202"/>
  <g clip-path="url(#${id}c)"><g transform="translate(240 240) scale(.94) translate(-240 -240)">
   <rect width="480" height="480" fill="url(#${id}cf)"/><g class="L"></g></g>
   <circle cx="240" cy="240" r="240" fill="url(#${id}v)"/></g>
  <circle cx="240" cy="240" r="226" fill="url(#${id}gl)" pointer-events="none"/>`;
 const L=svg.querySelector('.L');
 const st={gauge:opt.gauge||'rpm',val:null,accent:opt.accent||'#E10600',green:opt.green||6000,red:opt.red||6500,list:opt.list||['rpm','boost','afr','oilt','water'],peak:{}};
 // capas
 const track=el('circle',{cx:240,cy:240,r:210,transform:'rotate(135 240 240)',fill:'none',stroke:'#1C1C1C','stroke-width':16,'stroke-dasharray':`${ARC} ${C}`},L);
 const zg=el('g',{},L), fill=el('circle',{cx:240,cy:240,r:210,transform:'rotate(135 240 240)',fill:'none','stroke-width':16,'stroke-dasharray':`0 ${C}`},L);
 const tg=el('g',{},L), cg=el('g',{},L);
 const lab=el('text',{x:240,y:160,'text-anchor':'middle',fill:'#A8A396','font-family':'Barlow Condensed,Arial Narrow,sans-serif','font-weight':700,'font-size':19,'letter-spacing':4},cg);
 const val=el('text',{x:240,y:282,'text-anchor':'middle',fill:'#fff','font-family':'Barlow Condensed,Arial Narrow,sans-serif','font-weight':700,'font-size':128},cg);
 const unit=el('text',{x:240,y:316,'text-anchor':'middle',fill:'#A8A396','font-family':'Barlow,Arial,sans-serif','font-weight':600,'font-size':15,'letter-spacing':3},cg);
 const bg=el('g',{transform:'translate(240 350)'},cg);
 const bR=el('rect',{x:-60,y:-14,width:120,height:26,fill:'#161616',transform:'skewX(-12)'},bg);
 const bT=el('text',{x:0,y:5,'text-anchor':'middle','font-family':'Barlow Condensed,Arial Narrow,sans-serif','font-weight':700,'font-size':15,'letter-spacing':3,fill:'#A8A396'},bg);
 const dots=el('g',{},L);
 const boot=el('g',{opacity:0},L);
 function drawScale(){
  const d=DEFS[st.gauge];zg.innerHTML='';tg.innerHTML='';
  const fr=x=>clamp((x-d.min)/(d.max-d.min));
  const zones=d.shift?[[st.green,st.red,'#0E3A1E'],[st.red,d.max,'#4A0D0A']]:(d.zones||[]).map(z=>[z[0],z[1],'#4A0D0A']);
  zones.forEach(z=>{const a=fr(z[0])*ARC,b=fr(z[1])*ARC;el('circle',{cx:240,cy:240,r:210,transform:'rotate(135 240 240)',fill:'none',stroke:z[2],'stroke-width':16,'stroke-dasharray':`${b-a} ${C}`,'stroke-dashoffset':-a},zg)});
  const n=Math.round((d.max-d.min)/d.step);
  for(let i=0;i<=n*2;i++){const f=i/(n*2),maj=i%2===0,v=d.min+f*(d.max-d.min),hot=zones.some(z=>v>=z[0]&&v<=z[1]);
   const [x1,y1]=pt(f,196),[x2,y2]=pt(f,maj?176:186);
   el('line',{x1,y1,x2,y2,stroke:hot?'#8A2A24':maj?'#EDE6D6':'#5A5650','stroke-width':maj?3:1.5},tg);
   if(maj){const [lx,ly]=pt(f,154);const t=el('text',{x:lx,y:ly+9,'text-anchor':'middle','font-family':'Barlow Condensed,Arial Narrow,sans-serif','font-weight':600,'font-size':27,fill:hot?'#FF4D42':'#A8A396'},tg);t.textContent=d.div?String(v/d.div):String(Math.round(v*10)/10)}}
  lab.textContent=d.label;unit.textContent=d.unit;
  dots.innerHTML='';const k=st.list.indexOf(st.gauge);let x=240-(st.list.length*14+18)/2;
  st.list.forEach((g,i)=>{const w=i===k?20:8;el('rect',{x,y:398,width:w,height:6,fill:i===k?st.accent:'#3A3A3A',transform:`skewX(-20)`,'transform-origin':`${x} 401`},dots);x+=w+6});
 }
 function set(v,o={}){
  const d=DEFS[st.gauge];st.val=v;const f=clamp((v-d.min)/(d.max-d.min));
  let z='n';
  if(!o.noZone){if(d.shift)z=v>=st.red?'r':v>=st.green?'g':'n';else if((d.hi!=null&&v>=d.hi)||(d.lo!=null&&v<=d.lo))z='r'}
  const col=z==='r'?'#E10600':z==='g'?'#2BD46A':st.accent;
  fill.setAttribute('stroke',col);fill.setAttribute('stroke-dasharray',`${(o.fill!=null?o.fill:f)*ARC} ${C}`);
  fill.style.filter=`drop-shadow(0 0 6px ${col}99)`;
  val.textContent=d.fmt(v);val.setAttribute('fill',z==='r'?'#FF4D42':z==='g'?'#2BD46A':'#fff');
  if(!o.noZone)st.peak[st.gauge]=Math.max(st.peak[st.gauge]??-1e9,v);
  let t=o.badge||('MÁX '+d.fmt(st.peak[st.gauge]??v)),bb='#161616',bf='#A8A396';
  if(d.shift&&z==='g'){t='CAMBIA YA';bb='#2BD46A';bf='#06140B'}
  if(z==='r'){t=d.shift?'TE PASASTE':'ALERTA';bb='#E10600';bf='#fff'}
  bT.textContent=t;bR.setAttribute('fill',bb);bT.setAttribute('fill',bf);
  const w=t.length*10+34;bR.setAttribute('x',-w/2);bR.setAttribute('width',w);
  svg.dispatchEvent(new CustomEvent('zone',{detail:z}));
 }
 function setGauge(g){st.gauge=g;drawScale();set(sim(g,0))}
 function setAccent(c){st.accent=c;drawScale();if(st.val!=null)set(st.val)}
 drawScale();set(0);
 // arranque
 function playBoot(logo,name,cb){
  cg.style.opacity=0;tg.style.opacity=0;zg.style.opacity=0;dots.style.opacity=0;track.style.opacity=0;fill.style.opacity=0;
  boot.innerHTML='';boot.setAttribute('opacity',1);
  const img1=el('image',{href:opt.brandLogo||'assets/img/logoFull.webp',x:95,y:120,width:290,height:180,preserveAspectRatio:'xMidYMid meet'},boot);
  const tx=el('text',{x:240,y:345,'text-anchor':'middle',fill:'#fff','font-family':'Barlow Condensed,Arial Narrow,sans-serif','font-weight':800,'font-size':44,'letter-spacing':6},boot);tx.innerHTML=`BB <tspan fill="${st.accent}">GAUGES</tspan>`;
  el('rect',{x:140,y:375,width:200,height:4,fill:'#1E1E1E'},boot);
  const pb=el('rect',{x:140,y:375,width:0,height:4,fill:st.accent},boot);
  const t0=performance.now();
  function f(now){const p=(now-t0)/1000;
   if(p<1.2){img1.setAttribute('opacity',clamp(p/.35)*(1-clamp((p-.95)/.25)));tx.setAttribute('opacity',img1.getAttribute('opacity'));pb.setAttribute('width',200*ease(p/2.8))}
   else if(p<2.9){img1.setAttribute('href',logo||opt.carLogo||'assets/img/logoFull.webp');img1.setAttribute('opacity',clamp((p-1.2)/.3)*(1-clamp((p-2.6)/.3)));
    tx.textContent=(name||'TU AUTO').toUpperCase();tx.setAttribute('font-size',22);tx.setAttribute('fill','#A8A396');tx.setAttribute('opacity',img1.getAttribute('opacity'));pb.setAttribute('width',200*ease(p/2.8))}
   else if(p<4.3){boot.setAttribute('opacity',0);[cg,tg,zg,dots,track,fill].forEach(x=>x.style.opacity=1);cg.style.opacity=clamp((p-2.9)/.3);
    const q=(p-2.9)/1.4;const g=st.gauge;const d=DEFS[g];set(d.min+(d.max-d.min)*(q<.5?ease(q*2):1-ease((q-.5)*2)),{noZone:true,badge:'AUTOTEST'})}
   else{[cg,tg,zg,dots,track,fill].forEach(x=>x.style.opacity=1);set(sim(st.gauge,0),{badge:'LISTO'});cb&&cb();return}
   requestAnimationFrame(f)}
  requestAnimationFrame(f);
 }
 return {st,set,setGauge,setAccent,playBoot,setShift(g,r){st.green=g;st.red=r;drawScale();if(st.val!=null)set(st.val)},
  next(d=1){const i=st.list.indexOf(st.gauge);setGauge(st.list[(i+d+st.list.length)%st.list.length])}};
}
// valores simulados creíbles
function sim(g,t,load){
 load=load??(0.5+0.5*Math.sin(t*0.6));
 switch(g){case'rpm':return 900+load*5900;case'boost':return -10+load*29;case'afr':return load>.4?12.6-(load-.4)*2:14.7+0.2*Math.sin(t*3);
  case'oilt':return 98+3*Math.sin(t*.2);case'water':return 90+Math.sin(t*.1);case'iat':return 34+load*14;case'volt':return 14.1+.05*Math.sin(t)}return 0}

function mini(svg){
 if(!svg)return;const g=Gauge(svg,{gauge:'rpm'});let t=0,last=performance.now(),on=true;
 const io=new IntersectionObserver(e=>on=e[0].isIntersecting);io.observe(svg);
 g.playBoot(null,'BoostBang',()=>{(function loop(now){const dt=(now-last)/1000;last=now;if(on){t+=dt;g.set(sim('rpm',t))}
  if(Math.floor(t/6)%2===1&&g.st.gauge==='rpm')g.setGauge('boost');else if(Math.floor(t/6)%2===0&&g.st.gauge==='boost')g.setGauge('rpm');
  if(g.st.gauge==='boost'&&on)g.set(sim('boost',t));requestAnimationFrame(loop)})(performance.now())});
}
window.BBGauge={Gauge,DEFS,sim,mini,clamp,ease};
document.addEventListener('DOMContentLoaded',()=>{const m=document.getElementById('mini-g');if(m)mini(m)});
if(document.readyState!=='loading'){const m=document.getElementById('mini-g');if(m&&!m.childNodes.length)mini(m)}
})();
