/* Lumora — Supabase client + cloud sync (publishable/anon key, RLS protege os dados) */
const SUPA_URL = 'https://qnhfpivbsvfkmahxrnnu.supabase.co';
const SUPA_KEY = 'sb_publishable_16O_A7uBIiNryBMTclWKVA_kmvhtnKV';
const LOGIN_URL = '../index.html';

const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
let CURRENT_USER = null;

// Gate + carrega dados da nuvem para o localStorage (código existente lê de lá)
async function cloudInit(){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ window.location.href = LOGIN_URL; return false; }
  CURRENT_USER = session.user;
  try{
    const { data } = await sb.from('user_data').select('data').eq('user_id',CURRENT_USER.id).maybeSingle();
    const d = data && data.data;
    if(d){
      if(d.fdecks)  localStorage.setItem('lumora-fdecks',  JSON.stringify(d.fdecks));
      if(d.ffolders)localStorage.setItem('lumora-ffolders',JSON.stringify(d.ffolders));
      if(d.notes)   localStorage.setItem('lumora-notes',   JSON.stringify(d.notes));
    }
  }catch(e){ console.warn('cloud load falhou',e); }
  return true;
}

// Sync (debounced) — manda o estado todo para a nuvem
let _syncT=null;
function cloudSync(){
  if(!CURRENT_USER) return;
  clearTimeout(_syncT);
  _syncT=setTimeout(async()=>{
    const payload={
      fdecks:  JSON.parse(localStorage.getItem('lumora-fdecks')||'[]'),
      ffolders:JSON.parse(localStorage.getItem('lumora-ffolders')||'[]'),
      notes:   JSON.parse(localStorage.getItem('lumora-notes')||'[]'),
    };
    try{
      await sb.from('user_data').upsert({ user_id:CURRENT_USER.id, data:payload, updated_at:new Date().toISOString() });
      const dot=document.getElementById('sync-dot'); if(dot){dot.classList.add('ok');setTimeout(()=>dot.classList.remove('ok'),1200);}
    }catch(e){ console.warn('cloud sync falhou',e); }
  },700);
}

async function cloudLogout(){
  await sb.auth.signOut();
  window.location.href = LOGIN_URL;
}
function userEmail(){ return CURRENT_USER ? CURRENT_USER.email : ''; }
