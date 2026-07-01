/* ===== Lumora app — vanilla, deterministic mock ===== */

// theme
function setThemeIcon(){
  const b=document.getElementById('themeBtn');if(!b)return;
  const dark=document.documentElement.getAttribute('data-theme')==='dark';
  b.innerHTML=`<svg class="ic"><use href="#ic-${dark?'sun':'moon'}"/></svg>`;
}
function toggleTheme(){
  const r=document.documentElement;
  const next=r.getAttribute('data-theme')==='dark'?'light':'dark';
  r.setAttribute('data-theme',next);localStorage.setItem('lumora-theme',next);setThemeIcon();
}
document.documentElement.setAttribute('data-theme',localStorage.getItem('lumora-theme')||'dark');

// ---- navigation ----
const TITLES={today:'Hoje',library:'Biblioteca',flashcards:'Flashcards',notes:'Notas',study:'Estudar',import:'Importar',drive:'Drive',progress:'Progresso',sim:'Simulados',settings:'Configurações',tutor:'Tutor IA',arena:'Arena'};
function go(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.querySelectorAll('.navlink').forEach(l=>l.classList.toggle('active',l.dataset.view===view));
  document.getElementById('title').textContent=TITLES[view];
  document.querySelector('main').scrollTo(0,0);
  if(view==='progress')drawCharts();
  if(view==='notes')renderNotes();
  if(view==='flashcards')renderFlash();
}
function studyNow(){startSession();go('study');}

// ---- data ----
const DECKS=[
  {e:'🧬',t:'Biologia Celular',n:142,m:78},
  {e:'⚛️',t:'Física — Mecânica',n:98,m:52},
  {e:'⚖️',t:'Direito Constitucional',n:210,m:64},
  {e:'🇬🇧',t:'Inglês — Phrasal Verbs',n:180,m:88},
  {e:'🧪',t:'Química Orgânica',n:120,m:41},
  {e:'💻',t:'System Design',n:75,m:70},
  {e:'📜',t:'História do Brasil',n:160,m:59},
  {e:'🫀',t:'Anatomia',n:300,m:33},
];
const CARDS=[
  {q:'Qual a função da mitocôndria?',a:'Produção de energia (ATP) via respiração celular.',src:'Bio_cap4.pdf · p.12',bloom:'Lembrar'},
  {q:'Defina a 2ª Lei de Newton.',a:'F = m·a — a força resultante é igual à massa vezes a aceleração.',src:'Fisica_aula3.pdf · p.7',bloom:'Entender'},
  {q:'O que estabelece o princípio da legalidade (art. 5º)?',a:'Ninguém será obrigado a fazer ou deixar de fazer algo senão em virtude de lei.',src:'CF88.pdf · p.3',bloom:'Lembrar'},
  {q:'Explique a fase clara da fotossíntese.',a:'Ocorre nos tilacoides; converte luz em ATP e NADPH, liberando O₂.',src:'Bio_cap5.pdf · p.18',bloom:'Aplicar'},
  {q:'O que é uma transação ACID?',a:'Atomicidade, Consistência, Isolamento e Durabilidade — garantias de banco de dados.',src:'SystemDesign.pdf · p.44',bloom:'Entender'},
];
const GRADES=[['Errei','<1min','g0'],['Difícil','~10min','g1'],['Bom','2 dias','g2'],['Fácil','5 dias','g3']];

function renderDecks(){
  document.getElementById('decks').innerHTML=DECKS.map(d=>`
    <div class="deck glass" onclick="studyNow()">
      <div class="emoji">${d.e}</div>
      <h4>${d.t}</h4>
      <div class="meta">${d.n} cards · ${d.m}% domínio</div>
      <div class="bar"><i style="width:${d.m}%;${d.m<55?'background:var(--warning)':''}"></i></div>
    </div>`).join('');
}

// ---- study session ----
let sIdx=0,sFlip=false,STUDY_CARDS=CARDS,SESSION_LEN=5,studyBack='today',sResults=[],cardDir='next';
function startSession(cards,back){
  STUDY_CARDS=(cards&&cards.length)?cards:CARDS;
  SESSION_LEN=cards&&cards.length?cards.length:5;
  studyBack=back||'today';
  sResults=[];sIdx=0;cardDir='next';sBusy=false;renderCard();
}
function renderCard(){
  const el=document.getElementById('session');
  if(sIdx>=SESSION_LEN){el.innerHTML=doneScreen();return;}
  sFlip=false;
  const c=STUDY_CARDS[sIdx%STUDY_CARDS.length];
  const pct=Math.round((sIdx/SESSION_LEN)*100);
  el.innerHTML=`
    <div class="sess-top">
      <span class="x" onclick="go(studyBack)"><svg class="ic"><use href="#ic-close"/></svg></span>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <span class="muted" style="font-size:14px">${sIdx+1}/${SESSION_LEN}</span>
      <span class="x" id="fsBtn" onclick="toggleFs()" title="Tela cheia"><svg class="ic"><use href="#ic-expand"/></svg></span>
    </div>
    <div class="flashcard" id="fc" onclick="flip()">
      <div class="fc-inner">
        <div class="fc-face glass">
          <div class="lbl">${c.bloom} · Active Recall</div>
          <div class="q">${c.q}</div>
          <div class="fc-src"><svg class="ic"><use href="#ic-file"/></svg> ${c.src}</div>
        </div>
        <div class="fc-face fc-back glass glass-strong">
          <div class="lbl">Resposta</div>
          <div class="a">${c.a}</div>
          <div class="fc-src"><svg class="ic"><use href="#ic-file"/></svg> ${c.src}</div>
        </div>
      </div>
    </div>
    <div class="answers">
      <div class="ans no" onclick="grade(0)"><svg class="ic"><use href="#ic-close"/></svg> Não memorizei</div>
      <div class="ans yes" onclick="grade(1)"><svg class="ic"><use href="#ic-check"/></svg> Aprendi</div>
    </div>
    <div class="sess-keys muted">
      <span onclick="prevCard()">⬅️ voltar</span>
      <span onclick="flip()">space virar</span>
      <span>⬆️ aprendi · ⬇️ não</span>
      <span onclick="nextCard()">próximo ➡️</span>
    </div>`;
  animateCardIn();syncFsIcon();
}
// troca de card SEM delay: renderiza na hora; entrada curta e não-bloqueante
let sBusy=false;
function animateCardIn(){
  const fc=document.getElementById('fc'); if(!fc||!fc.animate)return;
  const x=cardDir==='prev'?-22:22;
  fc.animate(
    [{opacity:.45,transform:`translateX(${x}px)`},{opacity:1,transform:'none'}],
    {duration:120,easing:'cubic-bezier(.16,.84,.44,1)',fill:'both'}
  );
}
function leaveThen(cb){cb();} // sem saída — instantâneo
// tela cheia da sessão de estudo
function toggleFs(){
  const el=document.getElementById('view-study');
  if(!document.fullscreenElement){ if(el.requestFullscreen)el.requestFullscreen(); }
  else if(document.exitFullscreen) document.exitFullscreen();
}
function syncFsIcon(){
  const b=document.getElementById('fsBtn'); if(!b)return;
  b.innerHTML=`<svg class="ic"><use href="#ic-${document.fullscreenElement?'shrink':'expand'}"/></svg>`;
}
document.addEventListener('fullscreenchange',syncFsIcon);
function flip(){
  const fc=document.getElementById('fc'); if(!fc)return;
  const inner=fc.querySelector('.fc-inner'); if(!inner)return;
  sFlip=!sFlip;
  fc.classList.toggle('flip',sFlip);
  if(inner.animate){
    inner.animate(
      [{transform:`rotateY(${sFlip?0:180}deg)`},{transform:`rotateY(${sFlip?180:0}deg)`}],
      {duration:600,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'}
    );
  }
}
function grade(i){
  if(sBusy)return;
  const ok=(i===1);sResults[sIdx]=ok;
  const fc=document.getElementById('fc');
  const advance=()=>{cardDir='next';sIdx++;renderCard();};
  if(fc&&fc.animate){
    sBusy=true;
    const col=ok?'57,255,20':'255,42,42'; // neon verde acerto / neon vermelho erro
    const ring=a=>`0 0 0 2px rgba(${col},${a}), 0 0 12px 2px rgba(${col},${a*.85}), 0 0 26px 6px rgba(${col},${a*.55}), 0 0 48px 14px rgba(${col},${a*.3})`;
    fc.animate([
      {boxShadow:ring(0)},
      {boxShadow:ring(1),offset:.4},
      {boxShadow:ring(0)}
    ],{duration:360,easing:'ease-out'});
    setTimeout(()=>{sBusy=false;advance();},200);
  }else{advance();}
}
function redoWrong(){const w=STUDY_CARDS.filter((c,i)=>sResults[i]===false);startSession(w,studyBack);}
function redoAll(){startSession(STUDY_CARDS,studyBack);}
function nextCard(){if(sBusy)return;cardDir='next';leaveThen(()=>{sIdx++;renderCard();});}
function prevCard(){if(sBusy||sIdx<=0)return;cardDir='prev';leaveThen(()=>{sIdx--;renderCard();});}
// keyboard controls (only in study view)
document.addEventListener('keydown',e=>{
  const v=document.getElementById('view-study');
  if(!v||!v.classList.contains('active'))return;
  // tela final: → refaz tudo · ← refaz os que errei (só quando a tela de resultado está visível)
  if(sIdx>=SESSION_LEN){
    if(!document.querySelector('.done-wrap'))return; // Test/Match ativo → ignora teclas
    if(e.key==='ArrowRight'){e.preventDefault();redoAll();}
    else if(e.key==='ArrowLeft'){e.preventDefault();if(sResults.some(r=>r===false))redoWrong();}
    return;
  }
  switch(e.key){
    case ' ':e.preventDefault();flip();break;
    case 'ArrowUp':e.preventDefault();grade(1);break;
    case 'ArrowDown':e.preventDefault();grade(0);break;
    case 'ArrowRight':e.preventDefault();nextCard();break;
    case 'ArrowLeft':e.preventDefault();prevCard();break;
  }
});

// ---- done screen + study modes ----
const MODES=[
  {k:'learn',n:'Learn',e:'🧠',d:'IA + repetição espaçada adaptam as perguntas e reforçam o que você erra. Mistura múltipla escolha, digitação e V/F.'},
  {k:'test',n:'Test',e:'📝',d:'Gera provas automáticas: múltipla escolha, V/F, escrita e correspondência. Refaça quantas vezes quiser.'},
  {k:'match',n:'Match',e:'⚡️',d:'Minijogo: combine termos e definições o mais rápido possível. Cronometrado.'},
  {k:'blast',n:'Blast',e:'🚀',d:'Jogo colaborativo em equipes. Alunos respondem certo para avançar.',tag:'Escolas'},
  {k:'qchat',n:'Q-Chat',e:'💬',d:'Tutor conversacional com IA: faz perguntas, explica conceitos e conduz a sessão.',tag:'Pro'},
  {k:'expert',n:'Expert Solutions',e:'🎓',d:'Explicações passo a passo de exercícios de livros didáticos.',tag:'Pro'},
];
function doneScreen(){
  const ok=sResults.filter(r=>r===true).length;
  const err=sResults.filter(r=>r===false).length;
  const total=ok+err,pct=total?Math.round(ok/total*100):0;
  return `<div class="done-wrap">
    <div class="sess-done glass">
      <div class="big emo">${pct>=80?'🎉':pct>=50?'💪':'📚'}</div>
      <h2 style="margin:14px 0 4px">Sessão concluída!</h2>
      <p class="muted" style="margin-bottom:20px">${total} cards · ${pct}% de acerto · +${ok*10} XP</p>
      <div class="score">
        <div class="sc yes"><svg class="ic"><use href="#ic-check"/></svg><div><b>${ok}</b><span>aprendi</span></div></div>
        <div class="sc no"><svg class="ic"><use href="#ic-close"/></svg><div><b>${err}</b><span>errei</span></div></div>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap">
        ${err?`<button class="btn btn-glass" onclick="redoWrong()"><svg class="ic"><use href="#ic-close"/></svg> Refazer os que errei (${err}) <kbd>←</kbd></button>`:''}
        <button class="btn btn-grad" onclick="redoAll()"><svg class="ic"><use href="#ic-brain"/></svg> Refazer todos <kbd>→</kbd></button>
        <button class="btn btn-glass" onclick="exportSessionToDrive('Sessão de estudo')"><span class="nav-emo emo">📁</span> Exportar para o Drive</button>
        <button class="btn btn-ghost" onclick="go(studyBack)">Voltar</button>
      </div>
    </div>
    <div class="modes glass">
      <h3><svg class="ic"><use href="#ic-spark"/></svg> Modos</h3>
      ${MODES.map(m=>`
        <div class="mode" onclick="startMode('${m.k}')">
          <span class="me emo">${m.e}</span>
          <div><div class="mn">${m.n}${m.tag?` <span class="mtag">${m.tag}</span>`:''}</div>
          <div class="md">${m.d}</div></div>
        </div>`).join('')}
    </div>
  </div>`;
}
function showDone(){sIdx=SESSION_LEN;sFlip=false;document.getElementById('session').innerHTML=doneScreen();}
function startMode(k){
  if(k==='learn'){startSession(STUDY_CARDS,studyBack);return;}
  if(k==='test'){startTest();return;}
  if(k==='match'){startMatch();return;}
  toast(k==='blast'?'Blast é para turmas/escolas — disponível no plano Schools.':'Recurso em breve nesta demo.');
}

// helpers
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function sample(arr,n){return shuffle(arr).slice(0,n);}
function norm(s){return(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,'').trim();}
function toast(msg){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';t.className='toast glass';document.body.appendChild(t);}
  t.textContent=msg;t.classList.add('show');
  clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),3200);
}

// ---- TEST mode ----
let TEST=[];
function startTest(){
  const cards=STUDY_CARDS,answers=cards.map(c=>c.a);
  TEST=cards.slice(0,Math.min(cards.length,10)).map((c,i)=>{
    const t=i%3;
    if(t===0){
      // pool de distratores: únicos (normalizados) e diferentes da correta
      const seen=new Set([norm(c.a)]);
      const pool=answers.filter(a=>{const k=norm(a);if(seen.has(k))return false;seen.add(k);return true;});
      return{type:'mc',q:c.q,correct:c.a,opts:shuffle([c.a,...sample(pool,3)])};
    }
    if(t===1){const good=Math.random()<0.5;const shown=good?c.a:(sample(answers.filter(a=>a!==c.a),1)[0]||c.a);return{type:'tf',q:c.q,shown,answer:good};}
    return{type:'wr',q:c.q,correct:c.a};
  });
  renderTest();
}
function renderTest(){
  const el=document.getElementById('session');
  el.innerHTML=`
    <div class="sess-top"><span class="x" onclick="showDone()"><svg class="ic"><use href="#ic-close"/></svg></span>
      <b style="flex:1">📝 Test · ${TEST.length} questões</b></div>
    <div id="test-body">${TEST.map((q,i)=>testQuestion(q,i)).join('')}</div>
    <button class="btn btn-grad" style="width:100%;margin-top:8px" onclick="gradeTest()">Corrigir prova</button>`;
}
function testQuestion(q,i){
  let body='';
  if(q.type==='mc'){
    body=q.opts.map(o=>`<label class="t-opt"><input type="radio" name="q${i}" value="${esc(o)}"> ${esc(o)}</label>`).join('');
  }else if(q.type==='tf'){
    body=`<div class="t-claim">Afirmação: <b>${esc(q.shown)}</b></div>
      <label class="t-opt"><input type="radio" name="q${i}" value="true"> Verdadeiro</label>
      <label class="t-opt"><input type="radio" name="q${i}" value="false"> Falso</label>`;
  }else{
    body=`<input class="t-input" id="q${i}" placeholder="Sua resposta…">`;
  }
  return `<div class="t-q glass" id="tq${i}"><div class="t-num">${i+1}. ${esc(q.q)}</div>${body}</div>`;
}
function gradeTest(){
  let ok=0;
  TEST.forEach((q,i)=>{
    let correct=false,box=document.getElementById('tq'+i);
    if(q.type==='wr'){correct=norm(document.getElementById('q'+i).value)===norm(q.correct);}
    else{const sel=document.querySelector(`input[name=q${i}]:checked`);const v=sel?sel.value:null;
      correct=q.type==='mc'?(v===q.correct):(v===String(q.answer));}
    if(correct)ok++;
    box.classList.add(correct?'t-ok':'t-bad');
    if(!correct){const ans=q.type==='tf'?(q.answer?'Verdadeiro':'Falso'):q.correct;
      box.insertAdjacentHTML('beforeend',`<div class="t-ans"><svg class="ic"><use href="#ic-check"/></svg> ${esc(ans)}</div>`);}
  });
  const pct=Math.round(ok/TEST.length*100);
  document.getElementById('test-body').insertAdjacentHTML('beforebegin',
    `<div class="t-result glass">Resultado: <b>${ok}/${TEST.length}</b> · ${pct}%</div>`);
  document.querySelector('#session .btn-grad').outerHTML=
    `<div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap"><button class="btn btn-grad" style="flex:1" onclick="startTest()">Refazer prova</button><button class="btn btn-glass" onclick="exportSessionToDrive('Simulado')"><span class="nav-emo emo">📁</span> Exportar para o Drive</button><button class="btn btn-ghost" onclick="showDone()">Modos</button></div>`;
}

// ---- MATCH mode ----
let MATCH={};
function startMatch(){
  const cards=sample(STUDY_CARDS,Math.min(6,STUDY_CARDS.length));
  const tiles=shuffle(cards.flatMap((c,i)=>[{id:i,t:'q',x:c.q},{id:i,t:'a',x:c.a}]));
  MATCH={tiles,sel:null,done:0,n:cards.length,start:Date.now(),timer:null};
  renderMatch();
  MATCH.timer=setInterval(()=>{const t=document.getElementById('m-time');if(t)t.textContent=((Date.now()-MATCH.start)/1000).toFixed(1)+'s';},100);
}
function renderMatch(){
  const el=document.getElementById('session');
  el.innerHTML=`
    <div class="sess-top"><span class="x" onclick="stopMatch();showDone()"><svg class="ic"><use href="#ic-close"/></svg></span>
      <b style="flex:1">⚡️ Match</b><span class="muted" id="m-time">0.0s</span></div>
    <div class="match-grid">${MATCH.tiles.map((t,i)=>
      `<div class="mtile glass" data-i="${i}" onclick="pickTile(${i})">${esc(t.x)}</div>`).join('')}</div>`;
}
function pickTile(i){
  const tiles=MATCH.tiles,el=document.querySelector(`.mtile[data-i="${i}"]`);
  if(!el||el.classList.contains('gone')||el.classList.contains('sel'))return;
  if(MATCH.sel===null){MATCH.sel=i;el.classList.add('sel');return;}
  if(MATCH.sel===i)return;
  const a=tiles[MATCH.sel],b=tiles[i],ela=document.querySelector(`.mtile[data-i="${MATCH.sel}"]`);
  if(a.id===b.id&&a.t!==b.t){
    el.classList.add('gone');ela.classList.add('gone');MATCH.sel=null;MATCH.done++;
    if(MATCH.done===MATCH.n)finishMatch();
  }else{
    el.classList.add('bad');ela.classList.add('bad');const s=MATCH.sel;MATCH.sel=null;
    setTimeout(()=>{document.querySelectorAll('.mtile.bad,.mtile.sel').forEach(x=>x.classList.remove('bad','sel'));},500);
  }
}
function stopMatch(){clearInterval(MATCH.timer);}
function finishMatch(){
  stopMatch();const time=((Date.now()-MATCH.start)/1000).toFixed(1);
  document.getElementById('session').innerHTML=`<div class="sess-done glass">
    <div class="big emo">⚡️</div><h2 style="margin:14px 0 4px">Combinou tudo!</h2>
    <p class="muted" style="margin-bottom:20px">Tempo: <b>${time}s</b></p>
    <div style="display:flex;gap:10px;justify-content:center">
      <button class="btn btn-grad" onclick="startMatch()">Jogar de novo</button>
      <button class="btn btn-glass" onclick="exportSessionToDrive('Match')"><span class="nav-emo emo">📁</span> Exportar para o Drive</button>
      <button class="btn btn-ghost" onclick="showDone()">Modos</button></div></div>`;
}

// ---- charts (SVG) ----
function drawCharts(){
  const pts=[20,28,25,40,45,38,52,60,58,70,75,82,79,88,91];
  const W=460,H=180,pad=10,max=100,step=(W-pad*2)/(pts.length-1);
  const xy=pts.map((p,i)=>[pad+i*step,H-pad-(p/max)*(H-pad*2)]);
  const line=xy.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area=line+` L ${xy.at(-1)[0].toFixed(1)} ${H-pad} L ${pad} ${H-pad} Z`;
  document.getElementById('chart-line').innerHTML=`
    <svg viewBox="0 0 ${W} ${H}" style="width:100%">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--primary)" stop-opacity=".4"/>
        <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#lg)"/>
      <path d="${line}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${xy.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" fill="var(--primary)"/>`).join('')}
    </svg>
    <div class="muted" style="font-size:13px;text-align:center;margin-top:4px">Retenção média por semana ↑</div>`;

  const m=[['Biologia',78],['Inglês',88],['Direito',64],['Física',52],['História',59],['Química',41]];
  document.getElementById('chart-mastery').innerHTML=m.map(x=>`
    <div style="margin:11px 0">
      <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:5px">
        <span>${x[0]}</span><span class="muted">${x[1]}%</span></div>
      <div class="bar"><i style="width:${x[1]}%;${x[1]<55?'background:var(--warning)':''}"></i></div>
    </div>`).join('');

  let cells='';
  for(let i=0;i<26*7;i++){
    const v=(i*37+13)%5,op=[0.06,0.3,0.5,0.75,1][v];
    cells+=`<span style="background:color-mix(in srgb,var(--primary) ${op*100}%,var(--surface-2))"></span>`;
  }
  document.getElementById('heat').innerHTML=cells;
}

// ---- tutor ----
const CHAT=[
  {r:'ai',t:'Olá! Sou seu tutor. Pergunte sobre qualquer material que você importou — eu explico e cito a fonte. <span class="emo">📚</span>',
   cite:'',acts:['Me teste em Biologia','Explique o Ciclo de Krebs']}
];
const REPLIES={
  default:{t:'Boa pergunta. Com base no seu material: o conceito se conecta diretamente ao que você estudou ontem. Quer que eu gere flashcards sobre isso?',cite:'Bio_cap4.pdf · p.12',acts:['Gerar flashcards','Me teste']},
  krebs:{t:'O Ciclo de Krebs ocorre na matriz mitocondrial. Ele oxida o acetil-CoA, gerando NADH, FADH₂, ATP e CO₂ — alimentando a cadeia respiratória. Pense nele como a "usina" que abastece a fase final da respiração celular.',cite:'Bio_cap4.pdf · p.14',acts:['Gerar flashcards','Explique mais simples (Feynman)']}
};
function renderChat(){
  document.getElementById('msgs').innerHTML=CHAT.map(m=>`
    <div class="msg ${m.r} ${m.r==='ai'?'glass':''}">
      ${m.t}
      ${m.cite?`<div class="cite"><svg class="ic"><use href="#ic-file"/></svg> Fonte: ${m.cite}</div>`:''}
      ${m.acts&&m.acts.length?`<div class="acts">${m.acts.map(a=>`<button onclick="quickAsk('${a}')">${a}</button>`).join('')}</div>`:''}
    </div>`).join('');
  const box=document.getElementById('msgs');box.scrollTop=box.scrollHeight;
}
function quickAsk(t){document.getElementById('chat-in').value=t;sendChat();}
async function sendChat(){
  const inp=document.getElementById('chat-in'),txt=inp.value.trim();if(!txt)return;
  CHAT.push({r:'user',t:txt});inp.value='';renderChat();
  if(groqKey()){ // IA real via Groq
    CHAT.push({r:'ai',t:'…'});renderChat();
    try{
      const msgs=[{role:'system',content:'Você é o Tutor IA do Lumora, um app de estudos. Responda em português, de forma didática e concisa.'}];
      CHAT.filter(m=>m.t!=='…').forEach(m=>msgs.push({role:m.r==='user'?'user':'assistant',content:m.t}));
      const ans=await groqChat(msgs);
      CHAT[CHAT.length-1]={r:'ai',t:esc(ans).replace(/\n/g,'<br>')};
    }catch(e){CHAT[CHAT.length-1]={r:'ai',t:'⚠️ Erro Groq: '+esc(e.message)+'. Confira a chave em Configurações.'};}
    renderChat();return;
  }
  setTimeout(()=>{ // fallback mock (sem chave)
    const r=REPLIES[/krebs/i.test(txt)?'krebs':'default'];
    CHAT.push({r:'ai',t:r.t,cite:r.cite,acts:r.acts});renderChat();
  },450);
}

// ---- Tutor · ações da conversa ----
function htmlToText(h){const d=document.createElement('div');d.innerHTML=String(h).replace(/<br\s*\/?>/gi,'\n');return (d.textContent||'').trim();}
function chatPlain(){return CHAT.map(m=>`${m.r==='user'?'Você':'Tutor IA'}: ${htmlToText(m.t)}`).join('\n\n');}
function chatCopy(){
  navigator.clipboard.writeText(chatPlain()).then(()=>toast('Conversa copiada ✓')).catch(()=>toast('Falha ao copiar','err'));
}
function chatTxt(){
  const blob=new Blob([chatPlain()],{type:'text/plain;charset=utf-8'});
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download='lumora-tutor-'+new Date().toISOString().slice(0,10)+'.txt';a.click();
  setTimeout(()=>URL.revokeObjectURL(u),3000);
}
function chatClear(){
  if(!confirm('Limpar toda a conversa?'))return;
  CHAT.length=0;
  CHAT.push({r:'ai',t:'Olá! Sou seu tutor. Pergunte sobre qualquer material que você importou — eu explico e cito a fonte. <span class="emo">📚</span>',cite:'',acts:['Me teste em Biologia','Explique o Ciclo de Krebs']});
  renderChat();
}
function chatPDF(){
  const rows=CHAT.map(m=>`<div class="m ${m.r}"><b>${m.r==='user'?'Você':'Tutor IA'}</b><p>${esc(htmlToText(m.t)).replace(/\n/g,'<br>')}</p></div>`).join('');
  const w=window.open('','_blank');if(!w){toast('Permita pop-ups para gerar o PDF','err');return;}
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Tutor IA — Conversa</title>
    <style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#1a1a2e}
    h1{font-size:20px;border-bottom:2px solid #7c5cff;padding-bottom:10px}
    .meta{color:#888;font-size:12px;margin-bottom:22px}
    .m{margin:0 0 16px;padding:12px 16px;border-radius:12px;page-break-inside:avoid}
    .m.user{background:#efeaff;border-left:3px solid #7c5cff}
    .m.ai{background:#f4f5f8;border-left:3px solid #34e0a1}
    .m b{display:block;font-size:12px;color:#7c5cff;margin-bottom:4px}
    .m.ai b{color:#1aa47a}.m p{margin:0;font-size:14px;line-height:1.55;white-space:pre-wrap}</style></head>
    <body><h1>Lumora · Tutor IA</h1><div class="meta">Conversa exportada em ${new Date().toLocaleString('pt-BR')}</div>${rows}
    <script>onload=()=>{print();}<\/script></body></html>`);
  w.document.close();
}
function toast(msg,cls){
  let t=document.getElementById('dv-toast');
  if(!t){t=document.createElement('div');t.id='dv-toast';document.body.appendChild(t);}
  t.textContent=msg;t.className=cls==='err'?'err':'';t.classList.add('show');
  clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2200);
}

// ---- import ----
const SOURCES=[['file','PDF'],['cam','Foto / Scanner'],['play','YouTube'],['link','Link'],['mic','Áudio'],['text','Texto'],['grad','Notion'],['library','Google Drive'],['crystal','OneDrive']];
function renderImport(){
  document.getElementById('imp-grid').innerHTML=SOURCES.map(s=>`
    <div class="imp glass" onclick="fakeImport('${s[1]}')">
      <div class="e"><svg class="ic"><use href="#ic-${s[0]}"/></svg></div><h4>${s[1]}</h4></div>`).join('');
}
function fakeImport(name){
  const box=document.getElementById('imp-result');
  box.style.display='block';
  box.innerHTML=`<h3><svg><use href="#ic-spark"/></svg> Processando ${name}…</h3><div class="bar"><i id="imp-bar" style="width:0"></i></div>`;
  let p=0;const iv=setInterval(()=>{p+=20;document.getElementById('imp-bar').style.width=p+'%';
    if(p>=100){clearInterval(iv);impDone(name);}},220);
}
function impDone(name){
  document.getElementById('imp-result').innerHTML=`
    <h3><svg><use href="#ic-check"/></svg> ${name} processado pela IA</h3>
    <div class="row"><span><span class="emo">🃏</span> <b>&nbsp;34 flashcards</b>&nbsp;gerados</span><span class="pill ok">pronto</span></div>
    <div class="row"><span><span class="emo">📋</span> <b>&nbsp;Resumo</b>&nbsp;com 8 conceitos-chave</span><span class="pill ok">pronto</span></div>
    <div class="row"><span><span class="emo">❓</span> <b>&nbsp;Quiz</b>&nbsp;de 12 questões (Bloom)</span><span class="pill ok">pronto</span></div>
    <div class="row"><span><span class="emo">🗺️</span> <b>&nbsp;Mapa mental</b>&nbsp;gerado</span><span class="pill ok">pronto</span></div>
    <button class="btn btn-grad" style="margin-top:16px" onclick="studyNow()">Estudar agora <svg class="ic"><use href="#ic-arrow"/></svg></button>`;
}

// ---- notes (repositório estilo Notion, persiste em localStorage) ----
const NOTE_TAGS={Biologia:'#34E0A1',Física:'#46D6FF',Direito:'#FFC34D',Geral:'#8B7CFF',Idiomas:'#FF6FD8'};
const SEED_NOTES=[
  {id:'n1',title:'Respiração celular — resumo',tag:'Biologia',
   body:'Glicólise → Ciclo de Krebs → Cadeia transportadora de elétrons.\n\n• Glicólise ocorre no citoplasma, gera 2 ATP.\n• Krebs na matriz mitocondrial, libera CO₂ e NADH.\n• Fosforilação oxidativa produz ~34 ATP.\n\nDúvida: revisar diferença entre fermentação láctica e alcoólica.',
   updated:Date.now()-3600e3},
  {id:'n2',title:'Leis de Newton',tag:'Física',
   body:'1ª (Inércia): corpo mantém estado sem força resultante.\n2ª: F = m·a.\n3ª (Ação-reação): forças em pares, mesma intensidade, sentidos opostos.\n\nExemplo de prova: bloco em plano inclinado — decompor peso.',
   updated:Date.now()-86400e3},
  {id:'n3',title:'Direitos fundamentais (art. 5º)',tag:'Direito',
   body:'Princípio da legalidade, isonomia, devido processo legal.\n\nCláusulas pétreas não podem ser abolidas por emenda.\nDecorar incisos mais cobrados: I (igualdade), XXXV (inafastabilidade da jurisdição), LXIX (mandado de segurança).',
   updated:Date.now()-2*86400e3},
];
let NOTES=[],activeNote=null,noteFilter='Todas',saveTimer=null;
function loadNotes(){
  try{NOTES=JSON.parse(localStorage.getItem('lumora-notes'))||SEED_NOTES;}
  catch(e){NOTES=SEED_NOTES;}
  if(!NOTES.length)NOTES=SEED_NOTES;
}
function persistNotes(){localStorage.setItem('lumora-notes',JSON.stringify(NOTES));if(window.cloudSync)cloudSync();}
function timeAgo(t){
  const d=(Date.now()-t)/1000;
  if(d<60)return'agora';if(d<3600)return Math.floor(d/60)+'min';
  if(d<86400)return Math.floor(d/3600)+'h';return Math.floor(d/86400)+'d';
}
function renderNotes(){
  if(!NOTES.length)loadNotes();
  // tag filter chips
  const tags=['Todas',...Object.keys(NOTE_TAGS)];
  document.getElementById('notes-tags').innerHTML=tags.map(t=>
    `<span class="ntag ${noteFilter===t?'on':''}" onclick="setNoteFilter('${t}')">${t}</span>`).join('');
  // list
  const q=(document.getElementById('note-search').value||'').toLowerCase();
  let list=[...NOTES].sort((a,b)=>b.updated-a.updated);
  if(noteFilter!=='Todas')list=list.filter(n=>n.tag===noteFilter);
  if(q)list=list.filter(n=>(n.title+n.body).toLowerCase().includes(q));
  document.getElementById('notes-items').innerHTML=list.length?list.map(n=>`
    <div class="nitem ${activeNote===n.id?'on':''}" onclick="openNote('${n.id}')">
      <h4>${esc(n.title)||'Sem título'}<span class="dot-tag" style="background:${NOTE_TAGS[n.tag]||'#888'}"></span></h4>
      <p>${esc(n.body)||'Vazio…'}</p>
      <div class="when">${n.tag} · ${timeAgo(n.updated)}</div>
    </div>`).join(''):`<div class="muted" style="text-align:center;padding:30px;font-size:14px">Nenhuma nota encontrada.</div>`;
  // editor
  if(activeNote&&!NOTES.find(n=>n.id===activeNote))activeNote=null;
  renderEditor();
}
function setNoteFilter(t){noteFilter=t;renderNotes();}
function esc(s){return(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function openNote(id){activeNote=id;renderNotes();}
function newNote(){
  const n={id:'n'+Date.now(),title:'',tag:'Geral',body:'',updated:Date.now()};
  NOTES.unshift(n);persistNotes();activeNote=n.id;renderNotes();
  setTimeout(()=>{const t=document.querySelector('.ed-title');if(t)t.focus();},50);
}
function deleteNote(id){
  if(!confirm('Excluir esta nota? Não pode ser desfeito.'))return;
  NOTES=NOTES.filter(n=>n.id!==id);persistNotes();
  if(activeNote===id)activeNote=null;renderNotes();
}
function editNote(field,val){
  const n=NOTES.find(x=>x.id===activeNote);if(!n)return;
  n[field]=val;n.updated=Date.now();
  clearTimeout(saveTimer);
  const meta=document.getElementById('ed-status');
  if(meta)meta.textContent='salvando…';
  saveTimer=setTimeout(()=>{
    persistNotes();
    // refresh only list (keep editor focus)
    const items=document.getElementById('notes-items');
    if(items){
      const q=(document.getElementById('note-search').value||'').toLowerCase();
      let list=[...NOTES].sort((a,b)=>b.updated-a.updated);
      if(noteFilter!=='Todas')list=list.filter(x=>x.tag===noteFilter);
      if(q)list=list.filter(x=>(x.title+x.body).toLowerCase().includes(q));
      items.innerHTML=list.map(x=>`
        <div class="nitem ${activeNote===x.id?'on':''}" onclick="openNote('${x.id}')">
          <h4>${esc(x.title)||'Sem título'}<span class="dot-tag" style="background:${NOTE_TAGS[x.tag]||'#888'}"></span></h4>
          <p>${esc(x.body)||'Vazio…'}</p><div class="when">${x.tag} · ${timeAgo(x.updated)}</div></div>`).join('');
    }
    if(meta)meta.innerHTML='<svg class="ic"><use href="#ic-check"/></svg> salvo';
  },500);
}
function setNoteTag(t){const n=NOTES.find(x=>x.id===activeNote);if(!n)return;n.tag=t;n.updated=Date.now();persistNotes();renderNotes();}
function renderEditor(){
  const el=document.getElementById('note-editor');
  const n=NOTES.find(x=>x.id===activeNote);
  if(!n){
    el.innerHTML=`<div class="note-empty">
      <svg class="ic"><use href="#ic-note"/></svg>
      <h3 style="color:var(--text);margin-bottom:6px">Suas notas</h3>
      <p>Selecione uma nota ou crie uma nova.<br>Tudo salvo automaticamente no navegador.</p>
      <button class="btn btn-grad" style="margin-top:18px" onclick="newNote()"><svg class="ic"><use href="#ic-plus"/></svg> Nova nota</button>
    </div>`;return;
  }
  el.innerHTML=`
    <div class="ed-top">
      <div class="ed-meta" id="ed-status"><svg class="ic"><use href="#ic-check"/></svg> salvo · ${timeAgo(n.updated)}</div>
      <div class="ed-actions">
        <button onclick="genFlashcards()" title="Gerar flashcards com IA"><svg class="ic"><use href="#ic-spark"/></svg></button>
        <button class="danger" onclick="deleteNote('${n.id}')" title="Excluir"><svg class="ic"><use href="#ic-trash"/></svg></button>
      </div>
    </div>
    <input class="ed-title" placeholder="Título da nota" value="${esc(n.title)}" oninput="editNote('title',this.value)">
    <div class="ed-tagsel">${Object.keys(NOTE_TAGS).map(t=>
      `<span class="ntag ${n.tag===t?'on':''}" onclick="setNoteTag('${t}')">${t}</span>`).join('')}</div>
    <textarea class="ed-body" placeholder="Escreva aqui… (Markdown simples, salvo automaticamente)" oninput="editNote('body',this.value)">${esc(n.body)}</textarea>
    <div class="ed-foot">
      <button class="btn btn-grad btn-sm" onclick="genFlashcards()"><svg class="ic"><use href="#ic-spark"/></svg> Gerar flashcards</button>
      <button class="btn btn-ghost btn-sm" onclick="studyNow()"><svg class="ic"><use href="#ic-brain"/></svg> Estudar</button>
    </div>`;
}
function genFlashcards(){
  const n=NOTES.find(x=>x.id===activeNote);if(!n)return;
  const foot=document.querySelector('.ed-foot');
  if(foot)foot.innerHTML=`<span class="muted" style="font-size:14px;display:flex;gap:8px;align-items:center"><svg class="ic"><use href="#ic-spark"/></svg> IA gerando flashcards de "${esc(n.title)||'nota'}"…</span>`;
  setTimeout(()=>{if(foot)foot.innerHTML=`
    <span class="pill ok" style="display:inline-flex;gap:6px;align-items:center;font-size:13px"><svg class="ic" style="width:14px;height:14px"><use href="#ic-check"/></svg> 8 flashcards gerados</span>
    <button class="btn btn-grad btn-sm" onclick="studyNow()">Estudar agora <svg class="ic"><use href="#ic-arrow"/></svg></button>`;},1100);
}

// ---- flashcards (decks + cards, persiste em localStorage) ----
const SEED_FDECKS=[
  {id:'fd1',e:'🧬',title:'Biologia Celular',cards:[
    {front:'Função da mitocôndria?',back:'Produzir energia (ATP) via respiração celular.'},
    {front:'O que são ribossomos?',back:'Organelas que sintetizam proteínas.'},
    {front:'Função do núcleo?',back:'Armazenar o DNA e controlar a célula.'},
    {front:'Fase clara da fotossíntese ocorre onde?',back:'Nos tilacoides do cloroplasto.'},
  ]},
  {id:'fd2',e:'⚛️',title:'Física — Mecânica',cards:[
    {front:'2ª Lei de Newton',back:'F = m·a'},
    {front:'Unidade de força no SI',back:'Newton (N) = kg·m/s²'},
    {front:'O que é energia cinética?',back:'Ec = ½·m·v²'},
  ]},
  {id:'fd3',e:'🇬🇧',title:'Inglês — Phrasal Verbs',cards:[
    {front:'give up',back:'desistir'},
    {front:'look after',back:'cuidar de'},
    {front:'run into',back:'encontrar por acaso'},
    {front:'put off',back:'adiar'},
  ]},
];
const SEED_FOLDERS=[{id:'fo1',name:'Vestibular'},{id:'fo2',name:'Idiomas'}];
let FDECKS=[],FFOLDERS=[],activeFDeck=null,activeFolder='all';
function loadFDecks(){
  try{FDECKS=JSON.parse(localStorage.getItem('lumora-fdecks'))||SEED_FDECKS;}
  catch(e){FDECKS=SEED_FDECKS;}
  if(!FDECKS.length)FDECKS=SEED_FDECKS;
  try{FFOLDERS=JSON.parse(localStorage.getItem('lumora-ffolders'))||SEED_FOLDERS;}
  catch(e){FFOLDERS=SEED_FOLDERS;}
}
function persistFDecks(){localStorage.setItem('lumora-fdecks',JSON.stringify(FDECKS));if(window.cloudSync)cloudSync();}
function persistFolders(){localStorage.setItem('lumora-ffolders',JSON.stringify(FFOLDERS));if(window.cloudSync)cloudSync();}
function setFolder(id){activeFolder=id;renderFlash();}
function newFolder(){
  const n=prompt('Nome da pasta:');if(n===null)return;
  const f={id:'fo'+Date.now(),name:(n.trim()||'Pasta')};
  FFOLDERS.push(f);persistFolders();activeFolder=f.id;renderFlash();
}
function delFolder(id){
  if(!confirm('Excluir esta pasta? Os decks dentro ficam sem pasta (não são apagados).'))return;
  FFOLDERS=FFOLDERS.filter(f=>f.id!==id);
  FDECKS.forEach(d=>{if(d.folderId===id)d.folderId=null;});
  persistFolders();persistFDecks();activeFolder='all';renderFlash();
}
function renameFolder(id){
  const f=FFOLDERS.find(x=>x.id===id);if(!f)return;
  const n=prompt('Renomear pasta:',f.name);if(n===null)return;
  f.name=n.trim()||f.name;persistFolders();renderFlash();
}
function setDeckFolder(deckId,folderId){
  const d=FDECKS.find(x=>x.id===deckId);if(!d)return;
  d.folderId=folderId||null;persistFDecks();renderFlash();
}
let _dragDeck=null;
function fcDrag(ev,id){_dragDeck=id;ev.dataTransfer.effectAllowed='move';try{ev.dataTransfer.setData('text/plain',id);}catch(e){}ev.currentTarget.classList.add('dragging');}
function fcDragEnd(ev){_dragDeck=null;ev.currentTarget.classList.remove('dragging');document.querySelectorAll('.ntag.drop-on').forEach(n=>n.classList.remove('drop-on'));}
function fcOver(ev,el){if(!_dragDeck)return;ev.preventDefault();ev.dataTransfer.dropEffect='move';el.classList.add('drop-on');}
function fcLeave(el){el.classList.remove('drop-on');}
function fcDrop(ev,folderId){ev.preventDefault();const id=_dragDeck||(ev.dataTransfer&&ev.dataTransfer.getData('text/plain'));document.querySelectorAll('.ntag.drop-on').forEach(n=>n.classList.remove('drop-on'));if(!id)return;_dragDeck=null;setDeckFolder(id,folderId);}
function curFolderId(){return(activeFolder!=='all'&&activeFolder!=='none')?activeFolder:null;}
function folderName(id){const f=FFOLDERS.find(x=>x.id===id);return f?f.name:'';}
function renderFlash(){
  if(!FDECKS.length)loadFDecks();
  const root=document.getElementById('fc-root');
  if(activeFDeck&&!FDECKS.find(d=>d.id===activeFDeck))activeFDeck=null;
  activeFDeck?renderFDeckDetail(root):renderFDeckGrid(root);
}
function renderFDeckGrid(root){
  const total=FDECKS.reduce((s,d)=>s+d.cards.length,0);
  // filtro por pasta
  let decks=FDECKS;
  if(activeFolder==='none')decks=FDECKS.filter(d=>!d.folderId);
  else if(activeFolder!=='all')decks=FDECKS.filter(d=>d.folderId===activeFolder);
  const cnt=id=>FDECKS.filter(d=>d.folderId===id).length;
  const chips=`
    <div class="fc-folders">
      <span class="ntag ${activeFolder==='all'?'on':''}" onclick="setFolder('all')">Todos · ${FDECKS.length}</span>
      ${FFOLDERS.map(f=>`<span class="ntag ${activeFolder===f.id?'on':''}" onclick="setFolder('${f.id}')" ondragover="fcOver(event,this)" ondragleave="fcLeave(this)" ondrop="fcDrop(event,'${f.id}')"><span class="emo">📁</span> ${esc(f.name)} · ${cnt(f.id)}</span>`).join('')}
      <span class="ntag ${activeFolder==='none'?'on':''}" onclick="setFolder('none')" ondragover="fcOver(event,this)" ondragleave="fcLeave(this)" ondrop="fcDrop(event,'')">Sem pasta · ${FDECKS.filter(d=>!d.folderId).length}</span>
      <span class="ntag add-folder" onclick="newFolder()">+ Nova pasta</span>
      ${(activeFolder!=='all'&&activeFolder!=='none')?`
        <span class="ntag mini-act" onclick="renameFolder('${activeFolder}')"><svg class="ic"><use href="#ic-note"/></svg></span>
        <span class="ntag mini-act danger" onclick="delFolder('${activeFolder}')"><svg class="ic"><use href="#ic-trash"/></svg></span>`:''}
    </div>`;
  root.innerHTML=`
    <div class="fc-bar">
      <div class="ttl"><span class="em emo">🃏</span> ${FDECKS.length} decks · ${total} flashcards</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="triggerSheetImport()"><svg class="ic"><use href="#ic-file"/></svg> Excel / CSV</button>
        <button class="btn btn-ghost btn-sm" onclick="importSheetUrl()"><svg class="ic"><use href="#ic-link"/></svg> Google Sheets</button>
        <button class="btn btn-grad btn-sm" onclick="newFDeck()"><svg class="ic"><use href="#ic-plus"/></svg> Novo deck</button>
      </div>
    </div>
    ${chips}
    <div class="fc-decks">
      ${decks.map(d=>`
        <div class="fcd glass" draggable="true" ondragstart="fcDrag(event,'${d.id}')" ondragend="fcDragEnd(event)" onclick="openFDeck('${d.id}')">
          <span class="em emo">${d.e}</span>
          <h4>${esc(d.title)}</h4>
          <div class="meta">${d.cards.length} cards${d.folderId?` · <span class="emo">📁</span> ${esc(folderName(d.folderId))}`:''}</div>
          <div class="go">
            <button class="btn btn-grad btn-sm" onclick="event.stopPropagation();studyFDeck('${d.id}')"><svg class="ic"><use href="#ic-brain"/></svg> Estudar</button>
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openFDeck('${d.id}')">Editar</button>
          </div>
        </div>`).join('')}
      <div class="fcd add" onclick="newFDeck()"><svg class="ic"><use href="#ic-plus"/></svg>Criar novo deck${activeFolder!=='all'&&activeFolder!=='none'?' em '+esc(folderName(activeFolder)):''}</div>
    </div>`;
}
function renderFDeckDetail(root){
  const d=FDECKS.find(x=>x.id===activeFDeck);if(!d){activeFDeck=null;return renderFlash();}
  root.innerHTML=`
    <div class="fc-bar">
      <div class="ttl"><button class="btn btn-ghost btn-sm" onclick="activeFDeck=null;renderFlash()"><svg class="ic"><use href="#ic-arrow"/></svg></button>
        <span class="em emo">${d.e}</span> ${esc(d.title)}</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-grad btn-sm" onclick="studyFDeck('${d.id}')" ${d.cards.length?'':'disabled style=opacity:.5'}><svg class="ic"><use href="#ic-brain"/></svg> Estudar (${d.cards.length})</button>
        <button class="btn btn-ghost btn-sm" onclick="delFDeck('${d.id}')"><svg class="ic"><use href="#ic-trash"/></svg></button>
      </div>
    </div>
    <div class="panel glass" style="margin-bottom:16px">
      <div class="folder-pick">
        <span class="muted" style="font-size:13px;align-self:center">Pasta:</span>
        <span class="ntag ${!d.folderId?'on':''}" onclick="setDeckFolder('${d.id}','')">Sem pasta</span>
        ${FFOLDERS.map(f=>`<span class="ntag ${d.folderId===f.id?'on':''}" onclick="setDeckFolder('${d.id}','${f.id}')"><span class="emo">📁</span> ${esc(f.name)}</span>`).join('')}
        <span class="ntag add-folder" onclick="newFolderForDeck('${d.id}')">+ nova</span>
      </div>
    </div>
    <div class="panel glass">
      <div class="card-add">
        <input id="cf" placeholder="Frente (pergunta)" onkeydown="if(event.key==='Enter')addCard()">
        <input id="cb" placeholder="Verso (resposta)" onkeydown="if(event.key==='Enter')addCard()">
        <button class="btn btn-grad" onclick="addCard()" aria-label="Adicionar"><svg class="ic"><use href="#ic-plus"/></svg></button>
      </div>
      <div class="clist">
        ${d.cards.length?d.cards.map((c,i)=>`
          <div class="crow">
            <div class="cf">${esc(c.front)}</div>
            <div class="cb">${esc(c.back)}</div>
            <span class="cdel" onclick="delCard(${i})"><svg class="ic"><use href="#ic-trash"/></svg></span>
          </div>`).join(''):`<div class="muted" style="text-align:center;padding:24px;font-size:14px">Nenhum card. Adicione acima.</div>`}
      </div>
    </div>`;
}
function openFDeck(id){activeFDeck=id;renderFlash();}
function newFDeck(){
  const title=prompt('Nome do deck:','Novo deck');if(title===null)return;
  const d={id:'fd'+Date.now(),e:'🃏',title:title.trim()||'Novo deck',cards:[],folderId:curFolderId()};
  FDECKS.unshift(d);persistFDecks();activeFDeck=d.id;renderFlash();
}
function newFolderForDeck(deckId){
  const n=prompt('Nome da nova pasta:');if(n===null)return;
  const f={id:'fo'+Date.now(),name:(n.trim()||'Pasta')};
  FFOLDERS.push(f);persistFolders();setDeckFolder(deckId,f.id);
}
function delFDeck(id){
  if(!confirm('Excluir este deck e todos os cards?'))return;
  FDECKS=FDECKS.filter(d=>d.id!==id);persistFDecks();activeFDeck=null;renderFlash();
}
function addCard(){
  const d=FDECKS.find(x=>x.id===activeFDeck);if(!d)return;
  const cf=document.getElementById('cf'),cb=document.getElementById('cb');
  const front=cf.value.trim(),back=cb.value.trim();
  if(!front||!back){cf.focus();return;}
  d.cards.push({front,back});persistFDecks();renderFlash();
  setTimeout(()=>{const n=document.getElementById('cf');if(n)n.focus();},30);
}
function delCard(i){
  const d=FDECKS.find(x=>x.id===activeFDeck);if(!d)return;
  d.cards.splice(i,1);persistFDecks();renderFlash();
}
function studyFDeck(id){
  const d=FDECKS.find(x=>x.id===id);if(!d||!d.cards.length)return;
  const cards=d.cards.map(c=>({q:c.front,a:c.back,bloom:'Flashcard',src:d.title}));
  startSession(cards,'flashcards');go('study');
}

// ---- import Excel / CSV / Google Sheets ----
function triggerSheetImport(){document.getElementById('sheet-file').click();}
function handleSheetFile(input){
  const f=input.files&&input.files[0];if(!f)return;
  const name=f.name.replace(/\.[^.]+$/,'');
  const ext=(f.name.split('.').pop()||'').toLowerCase();
  const r=new FileReader();
  if(ext==='xlsx'||ext==='xls'){
    if(typeof XLSX==='undefined'){alert('Leitor de Excel não carregou (precisa de internet). Salve como CSV e tente.');input.value='';return;}
    r.onload=e=>{
      try{
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        buildDeckFromRows(XLSX.utils.sheet_to_json(ws,{header:1,defval:''}),name);
      }catch(err){alert('Erro ao ler o Excel.');}
    };
    r.readAsArrayBuffer(f);
  }else{
    r.onload=e=>buildDeckFromRows(parseCSV(e.target.result),name);
    r.readAsText(f);
  }
  input.value='';
}
function parseCSV(text){
  text=text.replace(/^﻿/,'');
  const head=(text.split(/\r?\n/)[0]||'');
  const delim=head.indexOf('\t')>=0?'\t':(head.split(';').length>head.split(',').length?';':',');
  const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){
      if(ch==='"'){if(text[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=ch;
    }else if(ch==='"')q=true;
    else if(ch===delim){row.push(cur);cur='';}
    else if(ch==='\n'){row.push(cur);rows.push(row);row=[];cur='';}
    else if(ch!=='\r')cur+=ch;
  }
  if(cur!==''||row.length){row.push(cur);rows.push(row);}
  return rows;
}
function buildDeckFromRows(rows,name){
  const HEAD=/^(front|frente|pergunta|termo|term|q|question|word|palavra)$/i;
  const HEAD2=/^(back|verso|resposta|defini[cç][aã]o|def|a|answer|tradu[cç][aã]o|meaning)$/i;
  const cards=[];
  rows.forEach((r,idx)=>{
    const front=(r[0]==null?'':r[0]).toString().trim();
    const back=(r[1]==null?'':r[1]).toString().trim();
    if(idx===0&&HEAD.test(front)&&HEAD2.test(back))return;
    if(!front||!back)return;
    cards.push({front,back});
  });
  if(!cards.length){alert('Nenhum card válido. Use 2 colunas: frente | verso.');return;}
  const d={id:'fd'+Date.now(),e:'📊',title:(name||'Planilha').slice(0,40),cards,folderId:curFolderId()};
  FDECKS.unshift(d);persistFDecks();activeFDeck=d.id;go('flashcards');
}
function importSheetUrl(){
  const url=prompt('Cole o link do Google Sheets (planilha precisa estar pública/compartilhada por link):');
  if(!url)return;
  const m=url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if(!m){alert('Link inválido.');return;}
  const gid=(url.match(/[#&?]gid=(\d+)/)||[])[1]||'0';
  const csvUrl=`https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
  fetch(csvUrl).then(res=>{if(!res.ok)throw 0;return res.text();})
    .then(t=>buildDeckFromRows(parseCSV(t),'Google Sheets'))
    .catch(()=>alert('Não consegui acessar. Deixe a planilha pública (Compartilhar → qualquer um com o link), ou baixe como CSV/Excel e importe o arquivo.'));
}

// Twemoji: converte todo emoji em SVG colorido (visível em qualquer SO/navegador)
let _emojiMO=null,_emojiT=null;
function parseEmoji(){
  if(!window.twemoji)return;
  twemoji.parse(document.body,{base:'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/',folder:'svg',ext:'.svg'});
}
function startEmoji(){
  if(!window.twemoji)return;
  parseEmoji();
  _emojiMO=new MutationObserver(()=>{clearTimeout(_emojiT);_emojiT=setTimeout(()=>{
    _emojiMO.disconnect();parseEmoji();_emojiMO.observe(document.body,{childList:true,subtree:true});
  },50);});
  _emojiMO.observe(document.body,{childList:true,subtree:true});
}

// ===== Groq (IA) =====
const GROQ_KEY='lumora_groq_key',GROQ_MODEL='lumora_groq_model';
function groqKey(){return localStorage.getItem(GROQ_KEY)||'';}
function groqModel(){return localStorage.getItem(GROQ_MODEL)||'llama-3.3-70b-versatile';}
async function groqChat(messages){
  const key=groqKey();if(!key)throw new Error('sem chave');
  const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
    body:JSON.stringify({model:groqModel(),messages,temperature:0.6})
  });
  if(!res.ok){let d='';try{d=(await res.json()).error?.message||''}catch(e){}throw new Error((res.status)+(d?' · '+d:''));}
  const j=await res.json();return j.choices?.[0]?.message?.content?.trim()||'(resposta vazia)';
}
function loadGroqSettings(){
  const k=document.getElementById('groq-key'),m=document.getElementById('groq-model');
  if(k)k.value=groqKey();
  if(m)m.value=groqModel();
}
function setGroqStatus(msg,cls){const el=document.getElementById('groq-status');if(!el)return;el.textContent=msg;el.className='set-status '+(cls||'muted');}
function saveGroq(){
  const k=document.getElementById('groq-key').value.trim(),m=document.getElementById('groq-model').value;
  if(k)localStorage.setItem(GROQ_KEY,k);else localStorage.removeItem(GROQ_KEY);
  localStorage.setItem(GROQ_MODEL,m);
  setGroqStatus(k?'✓ Chave salva. Tutor IA ativado.':'Chave removida — Tutor IA em modo demo.','ok');
}
function clearGroq(){
  localStorage.removeItem(GROQ_KEY);
  const k=document.getElementById('groq-key');if(k)k.value='';
  setGroqStatus('Chave removida — Tutor IA em modo demo.','ok');
}
async function testGroq(){
  const k=document.getElementById('groq-key').value.trim();
  if(!k){setGroqStatus('Cole uma chave primeiro.','err');return;}
  localStorage.setItem(GROQ_KEY,k);localStorage.setItem(GROQ_MODEL,document.getElementById('groq-model').value);
  setGroqStatus('Testando…','muted');
  try{const r=await groqChat([{role:'user',content:'responda apenas: ok'}]);setGroqStatus('✓ Conectado. Resposta: '+r.slice(0,40),'ok');}
  catch(e){setGroqStatus('✗ Falhou: '+e.message,'err');}
}
function toggleGroqKey(){const k=document.getElementById('groq-key');if(k)k.type=k.type==='password'?'text':'password';}

// ===== Simulados (gerador via IA) =====
let simQuiz=[];
function simSetStatus(m,c){const el=document.getElementById('sim-status');if(el){el.textContent=m;el.className='set-status '+(c||'muted');}}
function parseQuiz(txt){
  let s=txt.trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  const a=s.indexOf('['),b=s.lastIndexOf(']');if(a>=0&&b>a)s=s.slice(a,b+1);
  const arr=JSON.parse(s);
  return arr.map(q=>({q:String(q.q||q.question||''),options:(q.options||q.alternativas||[]).map(String),
    answer:Number(q.answer??q.correct??q.resposta??0),explanation:String(q.explanation||q.explicacao||'')}))
    .filter(q=>q.q&&q.options.length>=2);
}
async function genSim(){
  const topic=document.getElementById('sim-topic').value.trim();
  if(!topic){simSetStatus('Digite um tema.','err');return;}
  if(!groqKey()){simSetStatus('Configure a chave da Groq em Configurações para gerar simulados.','err');return;}
  const n=document.getElementById('sim-count').value,diff=document.getElementById('sim-diff').value;
  const btn=document.getElementById('sim-gen');btn.disabled=true;
  simSetStatus('Gerando simulado…','muted');document.getElementById('sim-body').innerHTML='';
  try{
    const sys='Você gera simulados de múltipla escolha. Responda APENAS com um array JSON válido, sem texto extra, sem markdown. '+
      'Cada item: {"q":"pergunta","options":["a","b","c","d"],"answer":<índice 0-3 da correta>,"explanation":"por que"}. Em português.';
    const user=`Crie ${n} questões de nível ${diff} sobre: ${topic}. Retorne só o JSON.`;
    const raw=await groqChat([{role:'system',content:sys},{role:'user',content:user}]);
    simQuiz=parseQuiz(raw);
    if(!simQuiz.length)throw new Error('não consegui interpretar as questões');
    simSetStatus('✓ '+simQuiz.length+' questões geradas.','ok');
    renderSimQuiz();
  }catch(e){simSetStatus('✗ Erro: '+e.message,'err');}
  finally{btn.disabled=false;}
}
function renderSimQuiz(){
  const box=document.getElementById('sim-body');
  box.innerHTML=simQuiz.map((q,i)=>`
    <div class="panel glass sim-q" id="simq-${i}">
      <div class="qh"><span class="n">${i+1}.</span><span>${esc(q.q)}</span></div>
      ${q.options.map((o,j)=>`<label class="sim-opt" data-opt="${j}">
        <input type="radio" name="simq-${i}" value="${j}"> <span>${esc(o)}</span></label>`).join('')}
      <div class="sim-exp" style="display:none">${esc(q.explanation)}</div>
    </div>`).join('')+
    `<div class="set-actions"><button class="btn btn-grad" onclick="submitSim()">Corrigir</button>
       <button class="btn" onclick="go('sim');document.getElementById('sim-body').innerHTML='';document.getElementById('sim-topic').focus()">Novo</button></div>`;
  window.scrollTo?box.scrollIntoView({behavior:'smooth',block:'start'}):0;
}
function submitSim(){
  let score=0;
  simQuiz.forEach((q,i)=>{
    const sel=document.querySelector(`input[name="simq-${i}"]:checked`);
    const picked=sel?Number(sel.value):-1;if(picked===q.answer)score++;
    document.querySelectorAll(`#simq-${i} .sim-opt`).forEach(el=>{
      const j=Number(el.dataset.opt);
      if(j===q.answer)el.classList.add('correct');
      else if(j===picked)el.classList.add('wrong');
      el.querySelector('input').disabled=true;
    });
    const exp=document.querySelector(`#simq-${i} .sim-exp`);if(exp&&q.explanation)exp.style.display='block';
  });
  const pct=Math.round(score/simQuiz.length*100);
  const card=document.createElement('div');card.className='panel glass sim-score';card.style.marginTop='16px';
  card.innerHTML=`<div class="big" style="color:${pct>=70?'var(--success)':pct>=50?'var(--warning)':'var(--danger,#ff5a5a)'}">${score}/${simQuiz.length}</div>
    <div class="stat-lbl">${pct}% de acerto</div>`;
  const box=document.getElementById('sim-body');box.prepend(card);card.scrollIntoView({behavior:'smooth',block:'center'});
}

// ===== Sidebar · seções visíveis =====
const NAV_HIDDEN_KEY='lumora_hidden_nav',NAV_ORDER_KEY='lumora_nav_order';
const NAV_LOCKED=['settings']; // sempre visível (não some) — garante ao menos 1 view acessível
function navHidden(){try{return JSON.parse(localStorage.getItem(NAV_HIDDEN_KEY))||[]}catch(e){return[]}}
// --- ordem ---
function navAllViews(){return [...document.querySelectorAll('aside .navlink[data-view]')].map(l=>l.dataset.view);}
function orderedViews(){
  const present=navAllViews();
  let saved=null;try{saved=JSON.parse(localStorage.getItem(NAV_ORDER_KEY))}catch(e){}
  if(!Array.isArray(saved))return present;
  const out=saved.filter(v=>present.includes(v));
  present.forEach(v=>{if(!out.includes(v))out.push(v);}); // itens novos vão pro fim
  return out;
}
function applyNavOrder(){
  const aside=document.querySelector('aside'),foot=aside&&aside.querySelector('.side-foot');if(!aside)return;
  const map={};aside.querySelectorAll('.navlink[data-view]').forEach(l=>map[l.dataset.view]=l);
  orderedViews().forEach(v=>{if(map[v])aside.insertBefore(map[v],foot);});
}
function moveNav(view,dir){
  const ord=orderedViews(),i=ord.indexOf(view),j=i+dir;
  if(i<0||j<0||j>=ord.length)return;
  [ord[i],ord[j]]=[ord[j],ord[i]];
  localStorage.setItem(NAV_ORDER_KEY,JSON.stringify(ord));
  applyNavOrder();renderNavToggles();
}
function applyNavVisibility(){
  const hid=navHidden();
  document.querySelectorAll('.navlink[data-view]').forEach(l=>{
    l.style.display=(!NAV_LOCKED.includes(l.dataset.view)&&hid.includes(l.dataset.view))?'none':'';
  });
  // se a view ativa foi escondida, volta pra primeira view visível
  const active=document.querySelector('.view.active');
  if(active){const v=active.id.replace('view-','');
    if(hid.includes(v)&&!NAV_LOCKED.includes(v)){
      const first=orderedViews().find(x=>!hid.includes(x)||NAV_LOCKED.includes(x));
      go(first||'settings');
    }}
}
function toggleNavView(view,on){
  let hid=navHidden();
  if(on)hid=hid.filter(v=>v!==view); else if(!hid.includes(view))hid.push(view);
  localStorage.setItem(NAV_HIDDEN_KEY,JSON.stringify(hid));
  applyNavVisibility();
}
function renderNavToggles(){
  const box=document.getElementById('nav-toggles');if(!box)return;
  const hid=navHidden();
  const map={};document.querySelectorAll('aside .navlink[data-view]').forEach(l=>map[l.dataset.view]=l);
  const ord=orderedViews();
  box.innerHTML=ord.map((v,idx)=>{
    const l=map[v];if(!l)return'';
    const on=!hid.includes(v),locked=NAV_LOCKED.includes(v);
    return `<div class="nt">
      <div class="nt-move">
        <button title="Subir" onclick="moveNav('${v}',-1)" ${idx===0?'disabled':''}>▲</button>
        <button title="Descer" onclick="moveNav('${v}',1)" ${idx===ord.length-1?'disabled':''}>▼</button>
      </div>
      <span class="lbl">${l.innerHTML}</span>
      <label class="sw" ${locked?'title="Sempre visível"':''}>
        <input type="checkbox" ${on?'checked':''} ${locked?'disabled':''} onchange="toggleNavView('${v}',this.checked)">
        <span class="track"></span></label>
    </div>`;
  }).join('');
  if(window.twemoji)twemoji.parse(box);
}

// ===== Drive =====
let driveFiles=[],driveFolders=[],driveCwd=null; // cwd null = raiz
let driveUrls=[]; // objectURLs de miniaturas (revogados a cada render)
const DRIVE_KEY='lumora_drive',DRIVE_FOLDERS_KEY='lumora_drive_folders';
function fIcon(t){t=t||'';if(t.includes('pdf'))return'📕';if(t.startsWith('image'))return'🖼️';
  if(t.startsWith('audio'))return'🎵';if(t.startsWith('video'))return'🎬';
  if(t.includes('word')||t.includes('document'))return'📘';
  if(t.includes('sheet')||t.includes('excel')||t.includes('csv'))return'📗';return'📄';}
function fSize(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(0)+' KB';return(b/1048576).toFixed(1)+' MB';}
function uid(p){return p+Date.now()+Math.random().toString(36).slice(2,6);}

// --- IndexedDB (guarda os bytes reais dos arquivos) ---
function dvDB(){return new Promise((res,rej)=>{const r=indexedDB.open('lumora_drive_db',1);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('blobs'))r.result.createObjectStore('blobs');};
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function dvPut(id,blob){const db=await dvDB();return new Promise((res,rej)=>{const t=db.transaction('blobs','readwrite');t.objectStore('blobs').put(blob,id);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
async function dvGet(id){const db=await dvDB();return new Promise((res,rej)=>{const t=db.transaction('blobs','readonly');const q=t.objectStore('blobs').get(id);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
async function dvDel(id){const db=await dvDB();return new Promise(res=>{const t=db.transaction('blobs','readwrite');t.objectStore('blobs').delete(id);t.oncomplete=()=>res();t.onerror=()=>res();});}

function loadDrive(){
  try{driveFiles=JSON.parse(localStorage.getItem(DRIVE_KEY))||[]}catch(e){driveFiles=[]}
  try{driveFolders=JSON.parse(localStorage.getItem(DRIVE_FOLDERS_KEY))||[]}catch(e){driveFolders=[]}
}
function saveDrive(){
  localStorage.setItem(DRIVE_KEY,JSON.stringify(driveFiles));
  localStorage.setItem(DRIVE_FOLDERS_KEY,JSON.stringify(driveFolders));
}
function folderPath(id){const p=[];let c=id;while(c){const f=driveFolders.find(x=>x.id===c);if(!f)break;p.unshift(f);c=f.parent;}return p;}
function descendants(id){const out=[id];driveFolders.filter(f=>f.parent===id).forEach(f=>out.push(...descendants(f.id)));return out;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function renderDrive(){
  const g=document.getElementById('drive-grid'),cr=document.getElementById('drive-crumbs');if(!g)return;
  driveUrls.forEach(u=>URL.revokeObjectURL(u));driveUrls=[];
  if(cr){
    let h=`<span class="cr ${driveCwd?'':'cur'}" onclick="goDrive(null)"><span class="nav-emo emo">🏠</span> Drive</span>`;
    folderPath(driveCwd).forEach((f,i,a)=>{h+=`<span class="sep">/</span><span class="cr ${i===a.length-1?'cur':''}" onclick="goDrive('${f.id}')">${esc(f.name)}</span>`;});
    cr.innerHTML=h;
  }
  const folders=driveFolders.filter(f=>(f.parent||null)===driveCwd);
  const files=driveFiles.filter(f=>(f.folder||null)===driveCwd);
  if(!folders.length&&!files.length){g.innerHTML='<p class="muted" style="grid-column:1/-1;text-align:center;padding:20px">Pasta vazia.</p>';if(window.twemoji)twemoji.parse(document.getElementById('view-drive'));return;}
  g.innerHTML=folders.map(f=>`<div class="panel glass drive-card folder" data-folder="${f.id}"
      onclick="goDrive('${f.id}')"
      ondragover="dvFolderOver(event,this)" ondragleave="this.classList.remove('dragover')" ondrop="dvDropOnFolder(event,'${f.id}',this)">
    <div class="fico fopen">📁</div>
    <div class="fname">${esc(f.name)}</div>
    <div class="fmeta">pasta</div>
    <div class="dv-actions" onclick="event.stopPropagation()">
      <button title="Renomear" onclick="renameFolder('${f.id}')">✏️</button>
      <button title="Excluir" onclick="delFolder('${f.id}')">🗑️</button>
    </div>
  </div>`).join('')+files.map(f=>{
    const img=(f.type||'').startsWith('image');
    return `<div class="panel glass drive-card" draggable="true" data-file="${f.id}" ondragstart="dvDragFile(event,'${f.id}')">
    <div class="fopen" onclick="openDriveFile('${f.id}')">
      ${img?`<img class="fthumb" data-thumb="${f.id}" alt="">`:`<div class="fico">${fIcon(f.type)}</div>`}
      <div class="fname">${esc(f.name)}</div>
      <div class="fmeta">${fSize(f.size)} · ${f.date}</div>
    </div>
    <div class="dv-actions">
      <button title="Baixar" onclick="downloadDriveFile('${f.id}')">⬇️</button>
      <button title="Renomear" onclick="renameDriveFile('${f.id}')">✏️</button>
      <button title="Mover" onclick="moveDriveFile('${f.id}')">📂</button>
      <button title="Excluir" onclick="delDriveFile('${f.id}')">🗑️</button>
    </div>
  </div>`;}).join('');
  if(window.twemoji)twemoji.parse(document.getElementById('view-drive'));
  // miniaturas de imagem (assíncrono)
  files.filter(f=>(f.type||'').startsWith('image')).forEach(async f=>{
    const el=g.querySelector(`img[data-thumb="${f.id}"]`);if(!el)return;
    const b=await dvGet(f.id);if(!b)return;const u=URL.createObjectURL(b);driveUrls.push(u);el.src=u;
  });
}
function goDrive(id){driveCwd=id;renderDrive();}
function mkFolder(){
  const name=(prompt('Nome da pasta:')||'').trim();if(!name)return;
  driveFolders.push({id:uid('d'),name,parent:driveCwd});saveDrive();renderDrive();
}
function renameFolder(id){
  const f=driveFolders.find(x=>x.id===id);if(!f)return;
  const n=(prompt('Renomear pasta:',f.name)||'').trim();if(!n)return;
  f.name=n;saveDrive();renderDrive();
}
async function delFolder(id){
  const f=driveFolders.find(x=>x.id===id);if(!f)return;
  if(!confirm(`Excluir a pasta "${f.name}" e todo o conteúdo dela?`))return;
  const kill=descendants(id);
  const killedFiles=driveFiles.filter(x=>kill.includes(x.folder||null));
  await Promise.all(killedFiles.map(x=>dvDel(x.id)));
  driveFolders=driveFolders.filter(x=>!kill.includes(x.id));
  driveFiles=driveFiles.filter(x=>!kill.includes(x.folder||null));
  saveDrive();renderDrive();
}
async function addDriveFiles(list){
  for(const f of [...list]){
    const id=uid('f');
    try{await dvPut(id,f);}catch(e){alert('Falha ao salvar '+f.name+' (arquivo muito grande?).');continue;}
    driveFiles.unshift({id,folder:driveCwd,name:f.name,size:f.size,type:f.type,date:new Date().toLocaleDateString('pt-BR')});
  }
  saveDrive();renderDrive();
}
async function delDriveFile(id){await dvDel(id);driveFiles=driveFiles.filter(f=>f.id!==id);saveDrive();renderDrive();}
function renameDriveFile(id){
  const f=driveFiles.find(x=>x.id===id);if(!f)return;
  const n=(prompt('Renomear arquivo:',f.name)||'').trim();if(!n)return;
  f.name=n;saveDrive();renderDrive();
}
async function downloadDriveFile(id){
  const f=driveFiles.find(x=>x.id===id);if(!f)return;
  const b=await dvGet(id);if(!b){alert('Arquivo não encontrado.');return;}
  const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=f.name;a.click();
  setTimeout(()=>URL.revokeObjectURL(u),4000);
}
async function openDriveFile(id){
  const f=driveFiles.find(x=>x.id===id);if(!f)return;
  const t=f.type||'';
  if(!t.startsWith('image')&&!t.includes('pdf')){return downloadDriveFile(id);} // sem preview → baixa
  const b=await dvGet(id);if(!b){alert('Arquivo não encontrado.');return;}
  const u=URL.createObjectURL(b);
  const body=t.startsWith('image')?`<img src="${u}" alt="${esc(f.name)}">`:`<iframe src="${u}"></iframe>`;
  openDvModal(`<h3>${esc(f.name)}</h3>${body}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
      <button class="btn" onclick="downloadDriveFile('${id}')">Baixar</button>
      <button class="btn btn-grad" onclick="closeDvModal()">Fechar</button></div>`,u);
}
function moveDriveFile(id){
  const f=driveFiles.find(x=>x.id===id);if(!f)return;
  const cur=f.folder||null;
  let rows=`<div class="mv ${cur===null?'':''}" ${cur===null?'data-disabled':''} onclick="doMove('${id}',null)"><span class="nav-emo emo">🏠</span> Drive (raiz)</div>`;
  driveFolders.forEach(fd=>{
    const path=folderPath(fd.id).map(x=>x.name).join(' / ');
    rows+=`<div class="mv" ${fd.id===cur?'data-disabled':''} onclick="doMove('${id}','${fd.id}')"><span class="nav-emo emo">📁</span> ${esc(path)}</div>`;
  });
  openDvModal(`<h3>Mover "${esc(f.name)}" para…</h3><div class="dv-mv-list">${rows}</div>
    <div style="text-align:right"><button class="btn" onclick="closeDvModal()">Cancelar</button></div>`);
}
function doMove(id,dest){
  const f=driveFiles.find(x=>x.id===id);if(f){f.folder=dest;saveDrive();}
  closeDvModal();renderDrive();
}
// drag & drop de arquivo para dentro de pasta
function dvDragFile(e,id){e.dataTransfer.setData('text/dv-file',id);e.dataTransfer.effectAllowed='move';}
function dvFolderOver(e,el){if([...e.dataTransfer.types].includes('text/dv-file')){e.preventDefault();el.classList.add('dragover');}}
function dvDropOnFolder(e,folderId,el){
  e.preventDefault();e.stopPropagation();el.classList.remove('dragover');
  const id=e.dataTransfer.getData('text/dv-file');if(id)doMove(id,folderId);
}
// modal
function openDvModal(html,revokeUrl){
  const m=document.getElementById('dv-modal'),box=document.getElementById('dv-modal-box');
  box.innerHTML=html;box._url=revokeUrl||null;m.hidden=false;
  if(window.twemoji)twemoji.parse(box);
}
function closeDvModal(){
  const m=document.getElementById('dv-modal'),box=document.getElementById('dv-modal-box');
  if(box._url){URL.revokeObjectURL(box._url);box._url=null;}
  m.hidden=true;box.innerHTML='';
}
function initDrive(){
  loadDrive();driveCwd=null;renderDrive();
  const drop=document.getElementById('drive-drop'),inp=document.getElementById('drive-file');
  if(!drop||!inp)return;
  drop.onclick=()=>inp.click();
  inp.onchange=e=>{if(e.target.files.length)addDriveFiles(e.target.files);inp.value='';};
  ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag');}));
  drop.addEventListener('drop',e=>{if(e.dataTransfer.files&&e.dataTransfer.files.length)addDriveFiles(e.dataTransfer.files);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=document.getElementById('dv-modal');if(m&&!m.hidden)closeDvModal();}});
}

// ===== Exportar sessão para o Drive (monta área de estudos) =====
let _expMd=null;
function sessionMarkdown(label){
  const cards=(STUDY_CARDS||[]);
  const date=new Date().toLocaleString('pt-BR');
  let head=`# ${label}\n\n_Exportado do Lumora · ${date}_\n\n`;
  if(sResults&&sResults.some(r=>r!==undefined)){
    const ok=sResults.filter(r=>r===true).length;
    const total=sResults.filter(r=>r!==undefined).length||cards.length;
    head+=`**Resultado:** ${ok}/${total} · ${total?Math.round(ok/total*100):0}% de acerto\n\n`;
  }
  const body=cards.map((c,i)=>{
    const mk=(sResults&&sResults[i]===true)?'✅':(sResults&&sResults[i]===false)?'❌':'•';
    return `### ${i+1}. ${c.q}\n${mk} ${c.a}\n`;
  }).join('\n');
  return head+'---\n\n'+(body||'_Sem cards nesta sessão._');
}
function safeName(s){return String(s||'sessao').replace(/[\\/:*?"<>|\n]+/g,' ').trim().slice(0,70);}
function exportSessionToDrive(label){
  if(!STUDY_CARDS||!STUDY_CARDS.length){toast('Nenhum item para exportar');return;}
  loadDrive();
  _expMd=sessionMarkdown(label);
  const defName=safeName(label+' — '+new Date().toLocaleDateString('pt-BR'))+'.md';
  const opts=`<option value="">🏠 Drive (raiz)</option>`+
    driveFolders.map(fd=>{const path=folderPath(fd.id).map(x=>x.name).join(' / ');
      return `<option value="${esc(fd.id)}">📁 ${esc(path)}</option>`;}).join('');
  openDvModal(`<h3 style="margin-bottom:14px"><span class="nav-emo emo">📁</span> Exportar para o Drive</h3>
    <div style="display:flex;flex-direction:column;gap:12px">
      <label style="font-size:13px;color:var(--muted)">Nome do arquivo
        <input id="exp-name" class="t-input" style="width:100%;margin-top:5px" value="${esc(defName)}"></label>
      <label style="font-size:13px;color:var(--muted)">Pasta de destino
        <select id="exp-folder" class="t-input" style="width:100%;margin-top:5px">${opts}</select></label>
      <label style="font-size:13px;color:var(--muted)">Ou crie uma nova pasta
        <input id="exp-newfolder" class="t-input" style="width:100%;margin-top:5px" placeholder="ex.: Biologia · Prova final"></label>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
        <button class="btn btn-glass" onclick="closeDvModal()">Cancelar</button>
        <button class="btn btn-grad" onclick="confirmExport()">Salvar no Drive</button></div>
    </div>`);
}
async function confirmExport(){
  const name=safeName((document.getElementById('exp-name').value||'').replace(/\.md$/i,''))+'.md';
  let folder=document.getElementById('exp-folder').value||null;
  const nf=(document.getElementById('exp-newfolder').value||'').trim();
  if(nf){const id=uid('d');driveFolders.push({id,name:nf,parent:folder});folder=id;}
  const blob=new File([_expMd||''],name,{type:'text/markdown'});
  const id=uid('f');
  try{await dvPut(id,blob);}catch(e){alert('Falha ao salvar no Drive (arquivo muito grande?).');return;}
  driveFiles.unshift({id,folder:folder||null,name,size:blob.size,type:'text/markdown',date:new Date().toLocaleDateString('pt-BR')});
  saveDrive();closeDvModal();
  if(window.cloudSync)cloudSync();
  toast('Salvo no Drive 📁 — abrindo a pasta');
  driveCwd=folder||null;go('drive');renderDrive();
}

// init
addEventListener('DOMContentLoaded',async()=>{
  setThemeIcon();
  // autentica + carrega dados da nuvem (redireciona pro login se não houver sessão)
  if(window.cloudInit){ const ok=await cloudInit(); if(!ok)return; }
  const em=document.getElementById('acct-email'); if(em&&window.userEmail)em.textContent=userEmail()||'conta';
  loadNotes();loadFDecks();renderDecks();renderImport();renderChat();initDrive();loadGroqSettings();
  document.querySelectorAll('.navlink').forEach(l=>l.onclick=()=>go(l.dataset.view));
  startEmoji();
  applyNavOrder();renderNavToggles();applyNavVisibility();
  go('tutor'); // página inicial = Tutor IA
});
