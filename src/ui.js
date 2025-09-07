import { S } from './state.js';
import { SUIT_NAME, HERO_FOCUS } from './cfg.js';
import { playCard, assist, endTurn } from './actions.js';

export function initApp(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app">
      <header>
        <div class="title">Royal Crush — <span class="pill">Full Gauntlet</span></div>
        <div class="stack">
          <span class="chip" id="gauntletChip">Gauntlet: —</span>
          <span class="chip" id="turnChip">Turn: —</span>
          <button class="dev chip" id="toggleDev">Dev</button>
        </div>
      </header>

      <section class="boss" id="bossPanel">
        <h2>Boss: <span id="bossName">—</span> <span class="pill" id="bossRank">—</span> <span class="suit" id="bossSuit">—</span></h2>
        <div class="stats">
          <div class="stat" style="flex:1">
            <span>HP</span>
            <div class="bar"><span id="bossHpBar"></span></div>
            <strong id="bossHpTxt" style="min-width:66px;text-align:right">—</strong>
          </div>
          <div class="stat">
            <span class="pill" id="bossPoison">☠︎ 0</span>
            <span class="pill" id="bossTarget">Targets: A</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="note tiny">Royal ability (ability check happens before attack each Boss Phase): <span id="bossAbility" class="pill">—</span></div>
      </section>

      <div class="row" id="heroesRow">
        <section class="hero" id="heroA"></section>
        <section class="hero" id="heroB"></section>
      </div>

      <div class="log" id="log"></div>
    </div>

    <div class="toast" id="toast"></div>

    <div class="modalWrap" id="modalWrap" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal" id="modal">
        <h4 id="modalTitle">Rewards</h4>
        <div class="note tiny sub" id="modalTip">Pick <strong>one</strong> reward per hero. Swap tabs to choose for the other hero.</div>

        <div class="upgradeBox">
          <div class="upLine" id="upLine"></div>
        </div>

        <div class="tabs">
          <button id="tabA" class="tab">A</button>
          <button id="tabB" class="tab">B</button>
        </div>

        <div class="pane" id="pane"></div>

        <div class="footerRow">
          <div id="footerMsg" class="ghostMsg"></div>
          <div style="flex:1"></div>
          <button class="btnGhost" id="closeBtn">Close</button>
          <button class="btnPrimary" id="continueBtn">Continue</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modalWrap').addEventListener('click',(e)=>{ if(e.target.id==='modalWrap') document.getElementById('modalWrap').style.display='none'; });
  document.getElementById('toggleDev').addEventListener('click',toggleDevDrawer);
}

function focusBadgeHTML(cls){
  const [s1,s2]=HERO_FOCUS[cls];
  const c1 = s1==='♥'?'heart':s1==='♣'?'club':s1==='♠'?'spade':'diamond';
  const c2 = s2==='♥'?'heart':s2==='♣'?'club':s2==='♠'?'spade':'diamond';
  return `<span class="focus ${c1}">${s1}</span><span class="focus ${c2}">${s2}</span>`;
}

export function paint(){
  const nm = `${S.boss.rank}${S.boss.rank==='Joker'?'':' of '+SUIT_NAME[S.boss.suit]}`;
  const bossSuitClass = (S.boss.rank==='Joker' ? '' :
    (S.boss.suit==='♥'?'heart':S.boss.suit==='♣'?'club':S.boss.suit==='♠'?'spade':'diamond'));
  document.getElementById('bossName').textContent = nm;
  document.getElementById('bossRank').textContent = S.boss.rank[0];
  const bs = document.getElementById('bossSuit');
  bs.textContent = S.boss.rank==='Joker' ? '★' : S.boss.suit;
  bs.className = 'suit '+bossSuitClass;

  document.getElementById('bossHpBar').style.width = Math.max(0,(S.boss.hp/S.boss.hpMax)*100)+'%';
  document.getElementById('bossHpTxt').textContent = `${S.boss.hp}/${S.boss.hpMax}`;
  document.getElementById('bossPoison').textContent = `☠︎ ${S.boss.poison}`;
  document.getElementById('bossTarget').textContent = `Targets: ${S.boss.target}`;
  document.getElementById('bossAbility').textContent =
    (S.boss.rank==='Jack')  ? 'On d12 1–3: +2 to next attack.' :
    (S.boss.rank==='Queen') ? 'On d12 1–3: Heal 3.' :
    (S.boss.rank==='King')  ? 'On d12 1–2: Purge all poison.' :
                               'On d12 8–10: Next attack deals double.';

  document.getElementById('gauntletChip').textContent = `Gauntlet left: ${S.gauntlet.length+1}`;
  document.getElementById('turnChip').textContent = `Turn ${S.turn} • ${S.phase}`;

  renderHero('A');
  renderHero('B');

  window._labelTabA = `${S.heroes.A.name} <span class="foci">${focusBadgeHTML(S.heroes.A.cls)}</span>`;
  window._labelTabB = `${S.heroes.B.name} <span class="foci">${focusBadgeHTML(S.heroes.B.cls)}</span>`;
}

function renderHero(id){
  const H = S.heroes[id];
  const wrap = document.getElementById(id==='A'?'heroA':'heroB');
  wrap.innerHTML = `
    <h3>${H.name} <span class="pill">${H.cls}</span>
      <span class="foci">${focusBadgeHTML(H.cls)}</span>
    </h3>
    <div class="stats">
      <div class="stat" style="flex:1">
        <span>HP</span>
        <div class="bar"><span style="width:${(H.hp/H.hpMax)*100}%"></span></div>
        <strong style="min-width:66px;text-align:right">${H.hp}/${H.hpMax}</strong>
      </div>
      <div class="stat"><span>Shield</span><strong>${H.shield}</strong></div>
      <div class="stat"><span>Plays</span><strong>${H.plays}/${H.playCap}</strong></div>
      <div class="stat"><span>Assist</span><strong>+${H.assist||0}</strong></div>
    </div>
    <div class="divider"></div>
    <div class="note tiny">Hand</div>
    <div class="hand">
      ${H.hand.map((c)=>(
        `<div class="card" aria-label="${c.v} of ${SUIT_NAME[c.s]}">
           <div class="v">${c.v}<span class="suit ${c.s==='♥'?'heart':c.s==='♣'?'club':c.s==='♠'?'spade':'diamond'}"> ${c.s}</span></div>
           <div class="actions">
             <button class="play" ${H.hp<=0?'disabled':''} onclick="playCard('${id}', ${c.v}, '${c.s}')">Play</button>
           </div>
         </div>`
      )).join('')}
    </div>
    <div class="actions">
      <button class="assist" ${H.hp<=0?'disabled':''} onclick="assist('${id}')">Assist partner (-1 play)</button>
      <button class="end" ${H.hp<=0?'disabled':''} onclick="endTurn('${id}')">End turn</button>
    </div>
  `;
}

/* dev drawer */
function toggleDevDrawer(){
  const id='devDrawer';
  const existing=document.getElementById(id);
  if (existing){ existing.remove(); return; }
  const wrap=document.createElement('div');
  wrap.id=id;
  wrap.style.position='fixed'; wrap.style.right='10px'; wrap.style.top='50px';
  wrap.style.background='#0f1424'; wrap.style.border='1px solid #27304a'; wrap.style.borderRadius='12px';
  wrap.style.padding='10px'; wrap.style.width='280px'; wrap.style.zIndex='5';
  wrap.innerHTML = `
    <div style="font-weight:800;margin-bottom:6px">Dev</div>
    <div class="tiny">Performance Mode reduces log scrolling.</div>
    <div class="divider"></div>
    <button onclick="S.performanceMode=!S.performanceMode; document.getElementById('toast').textContent='Performance: '+S.performanceMode; document.getElementById('toast').style.display='block'; setTimeout(()=>document.getElementById('toast').style.display='none',1000)">Toggle Perf</button>
    <button style="margin-left:6px" onclick="S.boss.hp=1; window.paint();">Set Boss 1 HP</button>
    <div class="divider"></div>
    <button onclick="S.boss.poison = Math.max(1, S.boss.hp); window.bossPhase();">Force Poison Kill</button>
    <button style="margin-left:6px" onclick="window.nextRoyal();">Skip to Next Royal</button>
  `;
  document.body.appendChild(wrap);
}

window.paint = paint;
