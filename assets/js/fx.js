/* BoostBang · capa de interacción */
(function(){
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const WA=(document.currentScript&&document.currentScript.dataset.wa)||'50769502405';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];

/* barra de progreso + header compacto + volver arriba + parallax */
const prog=document.createElement('div');prog.id='fx-prog';prog.setAttribute('aria-hidden','true');document.body.prepend(prog);
const header=$('header');let ticking=false;
function onScroll(){const h=document.documentElement,max=h.scrollHeight-h.clientHeight,y=h.scrollTop;
  prog.style.transform=`scaleX(${max>0?y/max:0})`;
  if(header)header.classList.toggle('fx-scrolled',y>30);
  const top=$('#fx-top');if(top)top.classList.toggle('on',y>700);
  if(!RM){const bg=$('.hero .bgp img');if(bg&&y<innerHeight)bg.style.transform=`translateY(${y*.25}px) scale(1.06)`}
  ticking=false}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});

/* onda al tocar botones */
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn');if(!b||RM||b.getAttribute('aria-disabled')==='true')return;
  const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),d=document.createElement('span');
  d.className='fx-rip';d.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;b.append(d);setTimeout(()=>d.remove(),650)});

/* aparición al hacer scroll (también para lo que se dibuja después) */
const SEL='.theme,.cell,.prod,.build,.rv,.dz,.custom,.kc,.facts li,.cg,section h2,.sub,.intro-top p,.model,.rd,.stp,.faq details,.links a,.shirts-head,form,.ok,.vids figure';
const io=RM?null:new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('fx-in');io.unobserve(x.target)}}),{threshold:.08,rootMargin:'0px 0px -40px 0px'});
function arm(root=document){if(RM)return;
  const groups=new Map();
  $$(SEL,root).forEach(el=>{if(el.classList.contains('fx-r')||el.classList.contains('reveal')||el.closest('.reveal')||el.closest('.hero')||el.closest('#lb'))return;
    if(el.getBoundingClientRect().top<innerHeight*.9&&el.offsetParent!==null&&root===document){return}
    const p=el.parentElement;const i=(groups.get(p)||0);groups.set(p,i+1);
    el.style.setProperty('--d',Math.min(i,8)*.06+'s');el.classList.add('fx-r');io.observe(el)})}
const mo=new MutationObserver(ms=>{for(const m of ms)m.addedNodes.forEach(n=>{if(n.nodeType===1)arm(n.parentElement||document)})});

/* título de portada palabra por palabra */
function heroWords(){const h=$('.hero h1');if(!h||RM||h.dataset.fx)return;h.dataset.fx=1;
  let k=0;const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();
    c.textContent.split(/(\s+)/).forEach(w=>{if(!w)return;if(/^\s+$/.test(w)){f.append(w);return}const s=document.createElement('span');s.className='fx-w';s.style.setProperty('--d',(k++*.09)+'s');s.textContent=w;f.append(s)});c.replaceWith(f)}
    else if(c.nodeType===1&&c.tagName!=='BR')walk(c)})};walk(h)}

/* animación al cambiar de pestaña */
const tabObs=new MutationObserver(ms=>ms.forEach(m=>{const t=m.target;if(m.attributeName==='hidden'&&!t.hidden&&!RM){t.classList.remove('fx-tab');void t.offsetWidth;t.classList.add('fx-tab');
  $$('.fx-r:not(.fx-in)',t).forEach(el=>{if(el.getBoundingClientRect().top<innerHeight)el.classList.add('fx-in')})}}));

/* botones flotantes: WhatsApp y volver arriba */
function floats(){
  if(!$('#fx-wa')){const a=document.createElement('a');a.id='fx-wa';a.className='fx-float';a.href=`https://wa.me/${WA}?text=${encodeURIComponent('¡Hola BoostBang!')}`;a.target='_blank';a.rel='noopener';a.setAttribute('aria-label','Escríbenos por WhatsApp');
    a.innerHTML='<span class="fx-tip">Escríbenos</span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>';document.body.append(a)}
  if(!$('#fx-top')){const b=document.createElement('button');b.id='fx-top';b.type='button';b.className='fx-float';b.setAttribute('aria-label','Volver arriba');
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';b.onclick=()=>scrollTo({top:0,behavior:RM?'auto':'smooth'});document.body.append(b)}}

/* aviso al abrir WhatsApp */
const toast=document.createElement('div');toast.id='fx-toast';toast.setAttribute('role','status');document.body.append(toast);
document.addEventListener('click',e=>{const a=e.target.closest('a[href*="wa.me"]');if(!a)return;toast.textContent='Abriendo WhatsApp…';toast.classList.add('on');setTimeout(()=>toast.classList.remove('on'),2200)});

/* flecha en los botones principales */
function arrows(){$$('.ctas .btn:not(.ghost),.bbg-copy .btn:not(.ghost)').forEach(b=>b.classList.add('fx-arrow'))}

function init(){floats();arrows();arm();onScroll();
  mo.observe(document.body,{childList:true,subtree:true});
  $$('.tab').forEach(t=>tabObs.observe(t,{attributes:true,attributeFilter:['hidden']}));
  setTimeout(heroWords,60)}
if(document.readyState==='complete')init();else addEventListener('load',init);
})();
