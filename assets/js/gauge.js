/* BB Gauges: motor de gauges en SVG (redondo R-Model y panel X-Model). Sin librerías. */
(function(){
const NS='http://www.w3.org/2000/svg';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const C=2*Math.PI*210, ARC=C*.75;
const pt=(f,r,cx=240,cy=240)=>{const a=(135+270*f)*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]};
const HD='Barlow Condensed,Arial Narrow,sans-serif', BO='Barlow,Arial,sans-serif';
const GREEN='#2BD46A', RED='#E10600';
const RM=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

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
const flashOp=z=>{if(z==='n'||RM)return z==='n'?0:.18;const per=z==='r'?110:220;return (Math.floor(performance.now()/per)%2)?.42:.08};

/* ---------- simulación de manejo realista (marchas) ---------- */
function Drive(){
 const s={rpm:900,gear:1,t:0,phase:'idle',hold:0};
 s.step=(dt,thr)=>{s.t+=dt;
  if(thr===undefined){ // automático: acelera, cambia, desacelera
   if(s.phase==='idle'){s.rpm+=(900-s.rpm)*dt*3;s.hold+=dt;if(s.hold>1.2){s.phase='pull';s.hold=0}}
   else if(s.phase==='pull'){s.rpm+=(1500+s.gear*-120)*dt*1.25*(1+ (7000-s.rpm)/9000)*(s.rpm>5900?.28:1);
     if(s.rpm>=6720){if(s.gear<5){s.phase='shift';s.hold=0}else{s.phase='coast'}}}
   else if(s.phase==='shift'){s.hold+=dt;if(s.hold>.12){s.gear++;s.rpm=s.rpm*.66;s.phase='pull'}}
   else if(s.phase==='coast'){s.rpm-=1900*dt;if(s.rpm<2200){s.gear=Math.max(1,s.gear-1);s.rpm=3600}if(s.gear===1&&s.rpm<2400){s.phase='idle';s.rpm=Math.max(900,s.rpm)}}
  }else{s.rpm+=thr?(7200-s.rpm)*dt*1.15:(850-s.rpm)*dt*1.6}
  s.rpm=clamp(s.rpm,800,7000);
  const load=(s.rpm-850)/6150*(s.phase==='coast'?.2:1);
  s.boost=-11+load*30.5;s.afr=load>.4?12.7-(load-.4)*2.1:14.7+.15*Math.sin(s.t*3);
  s.oil=98+3*Math.sin(s.t*.2);s.water=90+Math.sin(s.t*.12);s.iat=34+load*12;s.volt=14.1+.05*Math.sin(s.t);s.oilp=22+load*50;
  s.peakBoost=Math.max(s.peakBoost??-99,s.boost);return s};
 return s;
}

/* ---------- arranque compartido: TU LOGO (cargando) → BoostBang → autotest ---------- */
function bootLayer(parent,cx,cy,scale,accent,opts){
 const g=el('g',{transform:`translate(${cx} ${cy}) scale(${scale})`,opacity:0},parent);
 const ring=el('circle',{r:78,fill:'none',stroke:'#3a3a3a','stroke-width':3,'stroke-dasharray':'8 7'},g);
 const spin=el('circle',{r:92,fill:'none',stroke:accent,'stroke-width':5,'stroke-linecap':'round','stroke-dasharray':'90 490'},g);
 const ttl=el('text',{y:6,'text-anchor':'middle',fill:'#CFCAC0','font-family':HD,'font-weight':800,'font-size':30,'letter-spacing':4},g);ttl.textContent='TU LOGO';
 const cimg=el('image',{x:-70,y:-70,width:140,height:140,preserveAspectRatio:'xMidYMid meet',opacity:0},g);
 const sub=el('text',{y:128,'text-anchor':'middle',fill:'#8A8577','font-family':BO,'font-weight':600,'font-size':14,'letter-spacing':5},g);sub.textContent='CARGANDO';
 const bb=el('image',{href:opts.brandLogo||'assets/img/logoFull.webp',x:-150,y:-118,width:300,height:185,preserveAspectRatio:'xMidYMid meet',opacity:0},g);
 const word=el('text',{y:112,'text-anchor':'middle',fill:'#fff','font-family':HD,'font-weight':800,'font-size':42,'letter-spacing':7,opacity:0},g);
 word.innerHTML=`BB <tspan fill="${accent}">GAUGES</tspan>`;
 el('rect',{x:-100,y:146,width:200,height:4,fill:'#1E1E1E'},g);const pb=el('rect',{x:-100,y:146,width:0,height:4,fill:accent},g);
 return {g,set(p,logo,acc){ // p en segundos, 0..2.9
  g.setAttribute('opacity',p<2.9?1:0);spin.setAttribute('stroke',acc);pb.setAttribute('fill',acc);word.querySelector('tspan').setAttribute('fill',acc);
  const a=clamp(p/.3)*(1-clamp((p-1.35)/.25));
  [ring,spin,sub].forEach(x=>x.setAttribute('opacity',a));
  ttl.setAttribute('opacity',logo?0:a);cimg.setAttribute('opacity',logo?a:0);if(logo&&cimg.getAttribute('href')!==logo)cimg.setAttribute('href',logo);
  spin.setAttribute('transform',`rotate(${p*360})`);sub.textContent=p<.8?'CARGANDO':'CONECTANDO';
  const b=clamp((p-1.55)/.3)*(1-clamp((p-2.6)/.3));bb.setAttribute('opacity',b);word.setAttribute('opacity',b);
  bb.setAttribute('transform',`scale(${.92+.08*ease(clamp((p-1.55)/.5))})`);
  pb.setAttribute('width',200*ease(p/2.8))}};
}

/* ================= R-Model: gauge redondo ================= */
function Gauge(svg,opt={}){
 svg.setAttribute('viewBox','0 0 480 480');
 const id='g'+Math.random().toString(36).slice(2,7);
 svg.innerHTML=`<defs>
  <pattern id="${id}cf" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#0A0A0A"/><path d="M0 8L8 0" stroke="rgba(255,255,255,0.035)" stroke-width="2"/><path d="M0 0L8 8" stroke="rgba(0,0,0,0.6)" stroke-width="2"/></pattern>
  <radialGradient id="${id}v" cx="50%" cy="50%" r="50%"><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
  <radialGradient id="${id}b" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#4A4A4A"/><stop offset=".45" stop-color="#181818"/><stop offset="1" stop-color="#050505"/></radialGradient>
  <radialGradient id="${id}f" cx="50%" cy="50%" r="50%"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></radialGradient>
  <linearGradient id="${id}gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="${id}c"><circle cx="240" cy="240" r="226"/></clipPath></defs>
  <circle cx="240" cy="240" r="240" fill="url(#${id}b)"/><circle cx="240" cy="240" r="228" fill="#020202"/>
  <g clip-path="url(#${id}c)"><g transform="translate(240 240) scale(.94) translate(-240 -240)">
   <rect width="480" height="480" fill="url(#${id}cf)"/><circle class="FL" cx="240" cy="240" r="250" fill="${GREEN}" opacity="0" style="mix-blend-mode:screen"/><g class="L"></g></g>
   <circle cx="240" cy="240" r="240" fill="url(#${id}v)"/></g>
  <circle cx="240" cy="240" r="226" fill="url(#${id}gl)" pointer-events="none"/>`;
 const L=svg.querySelector('.L'),FL=svg.querySelector('.FL');
 const st={gauge:opt.gauge||'rpm',val:null,accent:opt.accent||RED,green:opt.green||6000,red:opt.red||6500,list:opt.list||['rpm','boost','afr','oilt','water'],peak:{},zone:'n'};
 const face=el('g',{},L);
 const track=el('circle',{cx:240,cy:240,r:210,transform:'rotate(135 240 240)',fill:'none',stroke:'#1C1C1C','stroke-width':16,'stroke-dasharray':`${ARC} ${C}`},face);
 const zg=el('g',{},face), fill=el('circle',{cx:240,cy:240,r:210,transform:'rotate(135 240 240)',fill:'none','stroke-width':16,'stroke-dasharray':`0 ${C}`},face);
 const tg=el('g',{},face), cg=el('g',{},face);
 const lab=el('text',{x:240,y:160,'text-anchor':'middle',fill:'#A8A396','font-family':HD,'font-weight':700,'font-size':19,'letter-spacing':4},cg);
 const val=el('text',{x:240,y:282,'text-anchor':'middle',fill:'#fff','font-family':HD,'font-weight':700,'font-size':128},cg);
 const unit=el('text',{x:240,y:316,'text-anchor':'middle',fill:'#A8A396','font-family':BO,'font-weight':600,'font-size':15,'letter-spacing':3},cg);
 const bg=el('g',{transform:'translate(240 350)'},cg);
 const bR=el('rect',{x:-60,y:-14,width:120,height:26,fill:'#161616',transform:'skewX(-12)'},bg);
 const bT=el('text',{x:0,y:5,'text-anchor':'middle','font-family':HD,'font-weight':700,'font-size':15,'letter-spacing':3,fill:'#A8A396'},bg);
 const dots=el('g',{},face);
 const brand=el('text',{x:240,y:438,'text-anchor':'middle','font-family':HD,'font-weight':800,'font-size':17,'letter-spacing':5,fill:'#6f6a60'},face);
 brand.innerHTML=`<tspan fill="${st.accent}">BB</tspan> GAUGES`;
 const boot=bootLayer(L,240,232,1,st.accent,opt);
 function drawScale(){
  const d=DEFS[st.gauge];zg.innerHTML='';tg.innerHTML='';
  const fr=x=>clamp((x-d.min)/(d.max-d.min));
  const zones=d.shift?[[st.green,st.red,'#0E3A1E'],[st.red,d.max,'#4A0D0A']]:(d.zones||[]).map(z=>[z[0],z[1],'#4A0D0A']);
  zones.forEach(z=>{const a=fr(z[0])*ARC,b=fr(z[1])*ARC;el('circle',{cx:240,cy:240,r:210,transform:'rotate(135 240 240)',fill:'none',stroke:z[2],'stroke-width':16,'stroke-dasharray':`${b-a} ${C}`,'stroke-dashoffset':-a},zg)});
  const n=Math.round((d.max-d.min)/d.step);
  for(let i=0;i<=n*2;i++){const f=i/(n*2),maj=i%2===0,v=d.min+f*(d.max-d.min),hot=zones.some(z=>v>=z[0]&&v<=z[1]);
   const [x1,y1]=pt(f,196),[x2,y2]=pt(f,maj?176:186);
   el('line',{x1,y1,x2,y2,stroke:hot?'#8A2A24':maj?'#EDE6D6':'#5A5650','stroke-width':maj?3:1.5},tg);
   if(maj){const [lx,ly]=pt(f,154);const t=el('text',{x:lx,y:ly+9,'text-anchor':'middle','font-family':HD,'font-weight':600,'font-size':27,fill:hot?'#FF4D42':'#A8A396'},tg);t.textContent=d.div?String(v/d.div):String(Math.round(v*10)/10)}}
  lab.textContent=d.label;unit.textContent=d.unit;
  dots.innerHTML='';const k=st.list.indexOf(st.gauge);let x=240-(st.list.length*14+18)/2;
  st.list.forEach((g,i)=>{const w=i===k?20:8;el('rect',{x,y:398,width:w,height:6,fill:i===k?st.accent:'#3A3A3A',transform:`skewX(-20)`,'transform-origin':`${x} 401`},dots);x+=w+6});
  brand.querySelector('tspan').setAttribute('fill',st.accent);
 }
 function set(v,o={}){
  const d=DEFS[st.gauge];st.val=v;const f=clamp((v-d.min)/(d.max-d.min));
  let z='n';
  if(!o.noZone){if(d.shift)z=v>=st.red?'r':v>=st.green?'g':'n';else if((d.hi!=null&&v>=d.hi)||(d.lo!=null&&v<=d.lo))z='r'}
  st.zone=z;
  const col=z==='r'?RED:z==='g'?GREEN:st.accent;
  fill.setAttribute('stroke',col);fill.setAttribute('stroke-dasharray',`${(o.fill!=null?o.fill:f)*ARC} ${C}`);
  fill.style.filter=`drop-shadow(0 0 7px ${col})`;
  val.textContent=d.fmt(v);val.setAttribute('fill',z==='r'?'#FF4D42':z==='g'?GREEN:'#fff');
  FL.setAttribute('fill',z==='r'?RED:GREEN);FL.setAttribute('opacity',flashOp(z));
  if(!o.noZone)st.peak[st.gauge]=Math.max(st.peak[st.gauge]??-1e9,v);
  let t=o.badge||('MÁX '+d.fmt(st.peak[st.gauge]??v)),bb='#161616',bf='#A8A396';
  if(d.shift&&z==='g'){t='CAMBIA YA';bb=GREEN;bf='#06140B'}
  if(z==='r'){t=d.shift?'TE PASASTE':'ALERTA';bb=RED;bf='#fff'}
  bT.textContent=t;bR.setAttribute('fill',bb);bT.setAttribute('fill',bf);
  const w=t.length*10+34;bR.setAttribute('x',-w/2);bR.setAttribute('width',w);
  svg.dispatchEvent(new CustomEvent('zone',{detail:z}));
 }
 function setGauge(g){st.gauge=g;drawScale();set(sim(g,0))}
 function setAccent(c){st.accent=c;drawScale();if(st.val!=null)set(st.val)}
 drawScale();set(0);
 let booting=false;
 function playBoot(logo,_name,cb){
  booting=true;face.style.opacity=0;FL.setAttribute('opacity',0);const t0=performance.now();
  (function f(now){const p=(now-t0)/1000;
   if(p<2.9){boot.set(p,logo,st.accent)}
   else if(p<4.3){boot.set(3);face.style.opacity=clamp((p-2.9)/.3);const q=(p-2.9)/1.4;const d=DEFS[st.gauge];set(d.min+(d.max-d.min)*(q<.5?ease(q*2):1-ease((q-.5)*2)),{noZone:true,badge:'AUTOTEST'})}
   else{face.style.opacity=1;set(sim(st.gauge,0),{badge:'LISTO'});booting=false;cb&&cb();return}
   requestAnimationFrame(f)})(t0);
 }
 return {st,set,setGauge,setAccent,playBoot,get booting(){return booting},setShift(g,r){st.green=g;st.red=r;drawScale();if(st.val!=null)set(st.val)},
  next(d=1){const i=st.list.indexOf(st.gauge);setGauge(st.list[(i+d+st.list.length)%st.list.length])}};
}

/* ================= X-Model: panel multi-gauge ================= */
function Panel(svg,opt={}){
 const W=800,H=480;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 const id='p'+Math.random().toString(36).slice(2,7);
 const st={accent:opt.accent||RED,green:opt.green||6000,red:opt.red||6500,compact:!!opt.compact,zone:'n'};
 svg.innerHTML=`<defs><pattern id="${id}cf" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#0A0A0A"/><path d="M0 8L8 0" stroke="rgba(255,255,255,0.03)" stroke-width="2"/><path d="M0 0L8 8" stroke="rgba(0,0,0,0.6)" stroke-width="2"/></pattern>
  <linearGradient id="${id}gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <radialGradient id="${id}fl" cx="50%" cy="50%" r="70%"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></radialGradient>
  <clipPath id="${id}c"><rect width="${W}" height="${H}" rx="6"/></clipPath></defs>
  <g clip-path="url(#${id}c)"><rect width="${W}" height="${H}" fill="url(#${id}cf)"/><rect class="FL" width="${W}" height="${H}" fill="${GREEN}" opacity="0"/><g class="L"></g></g>
  <rect width="${W}" height="${H}" rx="6" fill="url(#${id}gl)" pointer-events="none"/>`;
 const L=svg.querySelector('.L'),FL=svg.querySelector('.FL');
 const face=el('g',{},L);
 // barra de cambio segmentada (0–7k) con números
 const leds=el('g',{},face);const N=28,X0=34,BW=W-68,SW=BW/N,ledEls=[];
 for(let i=0;i<N;i++){const x=X0+i*SW;ledEls.push(el('path',{d:`M${x+6} 14H${x+SW-1}L${x+SW-6} 40H${x+1}Z`,fill:'#1d1d1d'},leds))}
 for(let k=0;k<=7;k++){const t=el('text',{x:X0+k*BW/7,y:58,'text-anchor':'middle','font-family':HD,'font-weight':600,'font-size':13,fill:k>=7?'#FF4D42':'#8A8577'},leds);t.textContent=k}
 // tacómetro central
 const cx=400,cy=286,R=156,ARC2=2*Math.PI*R*.75,C2=2*Math.PI*R;
 el('circle',{cx,cy,r:R,transform:`rotate(135 ${cx} ${cy})`,fill:'none',stroke:'#1C1C1C','stroke-width':18,'stroke-dasharray':`${ARC2} ${C2}`},face);
 const fr=x=>clamp(x/7000);
 [[6000,6500,'#0E3A1E'],[6500,7000,'#4A0D0A']].forEach(z=>{const a=fr(z[0])*ARC2,b=fr(z[1])*ARC2;el('circle',{cx,cy,r:R,transform:`rotate(135 ${cx} ${cy})`,fill:'none',stroke:z[2],'stroke-width':18,'stroke-dasharray':`${b-a} ${C2}`,'stroke-dashoffset':-a},face)});
 const rf=el('circle',{cx,cy,r:R,transform:`rotate(135 ${cx} ${cy})`,fill:'none','stroke-width':18,'stroke-dasharray':`0 ${C2}`,stroke:st.accent},face);
 for(let i=0;i<=14;i++){const f=i/14,maj=i%2===0;const [x1,y1]=pt(f,R-16,cx,cy),[x2,y2]=pt(f,R-(maj?36:26),cx,cy);
  el('line',{x1,y1,x2,y2,stroke:f*7000>=6500?'#8A2A24':maj?'#EDE6D6':'#5A5650','stroke-width':maj?3:1.5},face);
  if(maj&&i>0&&i<14){const [lx,ly]=pt(f,R-58,cx,cy);const t=el('text',{x:lx,y:ly+8,'text-anchor':'middle','font-family':HD,'font-weight':600,'font-size':24,fill:f*7000>=6500?'#FF4D42':'#A8A396'},face);t.textContent=i/2}}
 const gl=el('text',{x:cx,y:cy-58,'text-anchor':'middle','font-family':HD,'font-weight':700,'font-size':16,'letter-spacing':5,fill:'#8A8577'},face);gl.textContent='MARCHA';
 const gear=el('text',{x:cx,y:cy+46,'text-anchor':'middle','font-family':HD,'font-weight':800,'font-size':136,fill:'#fff'},face);
 const rpmT=el('text',{x:cx,y:cy+84,'text-anchor':'middle','font-family':HD,'font-weight':700,'font-size':34,fill:'#fff'},face);
 const zoneG=el('g',{transform:`translate(${cx} ${cy+118})`},face);const zR=el('rect',{x:-62,y:-15,width:124,height:26,transform:'skewX(-12)',fill:'#161616'},zoneG);
 const zT=el('text',{y:5,'text-anchor':'middle','font-family':HD,'font-weight':700,'font-size':15,'letter-spacing':3,fill:'#8A8577'},zoneG);
 // tarjetas laterales
 function card(x,y,w,h,label,unit,min,max,hi,lo){
  const g=el('g',{transform:`translate(${x} ${y})`},face);
  el('rect',{width:w,height:h,rx:4,fill:'rgba(20,20,20,.85)',stroke:'#2a2a2a'},g);
  const l=el('text',{x:14,y:24,'font-family':HD,'font-weight':700,'font-size':14,'letter-spacing':3,fill:'#8A8577'},g);l.textContent=label;
  const v=el('text',{x:14,y:h-30,'font-family':HD,'font-weight':700,'font-size':h>110?58:44,fill:'#fff'},g);
  const u=el('text',{x:w-14,y:h-30,'text-anchor':'end','font-family':BO,'font-weight':600,'font-size':13,fill:'#8A8577'},g);u.textContent=unit;
  const bg=el('g',{transform:`translate(16 ${h-18})`},g);
  el('rect',{width:w-32,height:6,fill:'#1E1E1E',transform:'skewX(-20)'},bg);const b=el('rect',{width:0,height:6,fill:st.accent,transform:'skewX(-20)'},bg);
  return {g,set(val,fmt){const f=clamp((val-min)/(max-min));const bad=(hi!=null&&val>=hi)||(lo!=null&&val<=lo);
   v.textContent=fmt(val);v.setAttribute('fill',bad?'#FF4D42':'#fff');b.setAttribute('width',(w-32)*f);b.setAttribute('fill',bad?RED:st.accent);return bad}};
 }
 const cw=178;
 const cards={
  boost:card(30,76,cw,132,'BOOST','PSI',-15,25,21),
  afr:card(30,220,cw,104,'AFR','ECU',10,18,16,10.8),
  water:card(W-30-cw,76,cw,132,'AGUA','°C',40,120,105),
  oil:card(W-30-cw,220,cw,104,'ACEITE','°C',40,140,120),
  iat:card(30,336,cw,96,'ADMISIÓN','°C',0,80,60),
  volt:card(W-30-cw,336,cw,96,'BATERÍA','V',10,16,15,12)};
 const brand=el('text',{x:cx,y:H-14,'text-anchor':'middle','font-family':HD,'font-weight':800,'font-size':16,'letter-spacing':6,fill:'#6f6a60'},face);
 brand.innerHTML=`<tspan fill="${st.accent}">BB</tspan> GAUGES`;
 const boot=bootLayer(L,cx,250,1.0,st.accent,opt);
 function layout(){const c=st.compact;['afr','oil','iat','volt'].forEach(k=>cards[k].g.style.display=c?'none':'');
  cards.boost.g.setAttribute('transform',`translate(30 ${c?150:76})`);cards.water.g.setAttribute('transform',`translate(${W-30-cw} ${c?150:76})`)}
 layout();
 function set(s){
  const z=s.rpm>=st.red?'r':s.rpm>=st.green?'g':'n';st.zone=z;
  const col=z==='r'?RED:z==='g'?GREEN:st.accent;
  rf.setAttribute('stroke',col);rf.setAttribute('stroke-dasharray',`${fr(s.rpm)*ARC2} ${C2}`);rf.style.filter=`drop-shadow(0 0 8px ${col})`;
  const lit=Math.round(fr(s.rpm)*N);const blink=z==='r'&&(Math.floor(performance.now()/90)%2);
  ledEls.forEach((r,i)=>{const v=(i+.5)/N*7000,zg=v>=6000&&v<6500,zr=v>=6500;
   let c=zr?'#3A0D0A':zg?'#0D3019':'#1d1d1d',on=i<lit;
   if(on)c=zr?RED:zg?GREEN:'#EDE6D6';
   if(z==='g'&&on)c=GREEN;if(z==='r'){c=blink?'#2a0806':RED;on=!blink}
   r.setAttribute('fill',c);r.style.filter=on?`drop-shadow(0 0 4px ${c})`:''});
  gear.textContent=s.gear;gear.setAttribute('fill',z==='r'?'#FF4D42':z==='g'?GREEN:'#fff');
  rpmT.innerHTML=`${Math.round(s.rpm).toLocaleString('en-US')} <tspan font-size="14" fill="#8A8577" font-family="${BO}">RPM</tspan>`;
  zT.textContent=z==='r'?'TE PASASTE':z==='g'?'CAMBIA YA':'NORMAL';zR.setAttribute('fill',z==='r'?RED:z==='g'?GREEN:'#161616');zT.setAttribute('fill',z==='r'?'#fff':z==='g'?'#06140B':'#8A8577');
  let bad=false;
  bad|=cards.boost.set(s.boost,v=>v.toFixed(1));cards.afr.set(s.afr,v=>v.toFixed(1));cards.water.set(s.water,v=>Math.round(v)+'°');
  cards.oil.set(s.oil,v=>Math.round(v)+'°');cards.iat.set(s.iat,v=>Math.round(v)+'°');cards.volt.set(s.volt,v=>v.toFixed(1));
  FL.setAttribute('fill',z==='r'?RED:GREEN);FL.setAttribute('opacity',flashOp(z)*.8);
  svg.dispatchEvent(new CustomEvent('zone',{detail:z}));
 }
 let booting=false;
 function playBoot(logo,cb){booting=true;face.style.opacity=0;FL.setAttribute('opacity',0);const t0=performance.now();
  (function f(now){const p=(now-t0)/1000;
   if(p<2.9)boot.set(p,logo,st.accent);
   else if(p<4.2){boot.set(3);face.style.opacity=clamp((p-2.9)/.3);const q=(p-2.9)/1.3;const r=7000*(q<.5?ease(q*2):1-ease((q-.5)*2));
     set({rpm:r,gear:'–',boost:-15+40*(r/7000),afr:14.7,water:90,oil:98,iat:30,volt:14.1});zT.textContent='AUTOTEST';zR.setAttribute('fill','#161616');zT.setAttribute('fill','#8A8577');FL.setAttribute('opacity',0)}
   else{face.style.opacity=1;booting=false;cb&&cb();return}
   requestAnimationFrame(f)})(t0)}
 return {st,set,playBoot,get booting(){return booting},
  setCompact(c){st.compact=c;layout()},
  setAccent(c){st.accent=c;brand.querySelector('tspan').setAttribute('fill',c)}};
}

function sim(g,t,load){
 load=load??(0.5+0.5*Math.sin(t*0.6));
 switch(g){case'rpm':return 900+load*5900;case'boost':return -10+load*29;case'afr':return load>.4?12.6-(load-.4)*2:14.7+0.2*Math.sin(t*3);
  case'oilt':return 98+3*Math.sin(t*.2);case'water':return 90+Math.sin(t*.1);case'iat':return 34+load*14;case'volt':return 14.1+.05*Math.sin(t)}return 0}

/* animación continua que solo corre cuando está a la vista */
function visibleLoop(node,fn){let on=false,last=performance.now();
 new IntersectionObserver(e=>on=e[0].isIntersecting,{threshold:.05}).observe(node);
 (function l(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(on)fn(dt,now);requestAnimationFrame(l)})(last)}

/* demo autónoma: arranca, maneja con cambios de marcha y repite el arranque cada cierto tiempo */
function autoRound(svg,opts={}){
 const g=Gauge(svg,{gauge:'rpm',...opts});const d=Drive();let since=0,started=false;
 const go=()=>{g.playBoot(opts.logo||null,null,()=>{since=0})};
 new IntersectionObserver(e=>{if(e[0].isIntersecting&&!started){started=true;go()}},{threshold:.3}).observe(svg);
 visibleLoop(svg,dt=>{if(!started||g.booting)return;since+=dt;d.step(dt);g.set(g.st.gauge==='rpm'?d.rpm:d.boost);
  if(opts.cycle&&since>9&&since<9.05)g.setGauge(g.st.gauge==='rpm'?'boost':'rpm');
  if(opts.reboot&&since>opts.reboot){since=0;go()}});
 return g}
function autoPanel(svg,opts={}){
 const p=Panel(svg,opts);const d=Drive();let since=0,started=false;
 const go=()=>p.playBoot(opts.logo||null,()=>{since=0});
 new IntersectionObserver(e=>{if(e[0].isIntersecting&&!started){started=true;go()}},{threshold:.3}).observe(svg);
 visibleLoop(svg,dt=>{if(!started||p.booting)return;since+=dt;d.step(dt);p.set(d);if(opts.reboot&&since>opts.reboot){since=0;go()}});
 return {panel:p,drive:d,reboot:go}}

function mini(svg){if(!svg||svg.dataset.on)return;svg.dataset.on=1;autoRound(svg,{cycle:true,reboot:22})}

window.BBGauge={Gauge,Panel,Drive,DEFS,sim,mini,autoRound,autoPanel,clamp,ease};
const m0=()=>{const m=document.getElementById('mini-g');if(m)mini(m)};
if(document.readyState!=='loading')m0();else document.addEventListener('DOMContentLoaded',m0);
})();
