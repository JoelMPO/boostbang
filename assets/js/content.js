/* Carga el contenido editable desde Supabase y lo mezcla con los valores por defecto.
   Si Supabase no responde en 2.5 s, el sitio usa lo que trae el código. */
(function(){
  const S = window.BB_SUPA || {};
  const ok = S.url && S.anonKey;
  async function get(id){
    if(!ok) return null;
    const ctl = new AbortController(); const t = setTimeout(()=>ctl.abort(), 2500);
    try{
      const r = await fetch(`${S.url}/rest/v1/content?id=eq.${encodeURIComponent(id)}&select=data`,
        {headers:{apikey:S.anonKey}, signal:ctl.signal});
      if(!r.ok) return null; const j = await r.json(); return j[0] ? j[0].data : null;
    }catch(e){ return null } finally{ clearTimeout(t) }
  }
  async function load(target, id='site'){
    const d = await get(id);
    if(d && typeof d === 'object') for(const k in d){ if(d[k]!==null && d[k]!==undefined) target[k]=d[k] }
    return target;
  }
  async function order(o){
    if(!ok) throw new Error('sin-conexion');
    const r = await fetch(`${S.url}/rest/v1/orders`, {method:'POST',
      headers:{apikey:S.anonKey, 'Content-Type':'application/json', Prefer:'return=minimal'},
      body: JSON.stringify(o)});
    if(!r.ok) throw new Error('error '+r.status);
  }
  window.BBContent = { load, get, order, connected: ok };
})();
