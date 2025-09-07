import { RULES, ELIGIBLE, GENERICS, SUITS } from './cfg.js';
import { S, clearTimers, log, toast, grantUpgradeToBoth } from './state.js';
import { paint } from './ui.js';
import { trashLowestCard } from './deck.js';

function parseAttrChips(text){
  const parts = text.split(',').map(s=>s.trim().toLowerCase());
  const chips=[];
  parts.forEach(p=>{
    if (p.includes('atk')) chips.push(`⚔ ${p}`);
    else if (p.includes('heal')) chips.push(`✚ ${p}`);
    else if (p.includes('guard')) chips.push(`🛡 ${p}`);
    else if (p.includes('poison')) chips.push(`☠ ${p}`);
    else if (p.includes('play')) chips.push(`▶ ${p}`);
    else if (p.includes('team hp')) chips.push(`❤️ ${p}`);
    else if (p.includes('trash')) chips.push(`🗑 ${p}`);
    else chips.push(p);
  });
  return chips;
}

function upgradePreview(){
  const line = document.getElementById('upLine');
  if(!line) return;
  line.innerHTML = '';
  const rank = S.boss.rank, suit = S.boss.suit;
  const upByRank = { Jack:6, Queen:7, King:8, Joker:9 };
  const v = upByRank[rank];
  const addChip=(txt)=>{ const b=document.createElement('div'); b.className='upBadge'; b.textContent=txt; line.appendChild(b); };
  if (rank==='Joker'){
    addChip(`Each hero: +${v} (random suit)`);
    addChip('♣ Guard +3 (Knight +1)');
    addChip('♥ Heal +3 (Priest +1)');
    addChip('♠ Poison +1 (Assassin +1)');
    addChip('♦ +1 Play (to cap; Mage +1 cap)');
  } else {
    addChip(`Each hero: +${v} ${suit}`);
    if (suit==='♣') addChip('Guard +3 (Knight +1)');
    if (suit==='♥') addChip('Heal +3 (Priest +1)');
    if (suit==='♠') addChip('Poison +1 (Assassin +1)');
    if (suit==='♦') addChip('+1 Play (to cap; Mage +1 cap)');
  }
}

function syncFooter(){
  const msg = document.getElementById('footerMsg');
  if(!msg) return;
  const aDone = !!S.rewards.A.taken || !!S.heroes.A.claimedLegend;
  const bDone = !!S.rewards.B.taken || !!S.heroes.B.claimedLegend;
  msg.textContent = (aDone && bDone) ? '' : 'Choose for both heroes to continue.';
  const btn = document.getElementById('continueBtn');
  if(btn) btn.disabled = !(aDone && bDone);
}

function buildGenericCard(opt, heroId){
  const H = S.heroes[heroId];
  const card = document.createElement('div'); card.className='rewardCard';
  const name = document.createElement('div'); name.className='gName'; name.textContent = opt.name;
  const chips = document.createElement('div'); chips.className='chips';
  parseAttrChips(opt.attrs).forEach(t=>{
    const ch=document.createElement('div'); ch.className='chipAttr'; ch.textContent=t; chips.appendChild(ch);
  });
  const btn = document.createElement('button'); btn.className='btnFull'; btn.textContent='Choose';
  btn.onclick = ()=>{
    switch(opt.key){
      case 'training': H.assist=Math.min((H.assist||0)+1, RULES.assistCap); healLowest(1); break;
      case 'sprint':   H.assist=Math.min((H.assist||0)+2, RULES.assistCap); teamLoseHP(1); break;
      case 'parry':    H.shield += 2; log(`${H.name} gains Guard 2.`); break;
      case 'tactics':  H.assist=Math.min((H.assist||0)+2, RULES.assistCap); break;
      case 'rally':    H.assist=Math.min((H.assist||0)+1, RULES.assistCap); healLowest(1); break;
      case 'scout':    H.assist=Math.min((H.assist||0)+3, RULES.assistCap); break;
      case 'resolve':  healLowest(2); break;
      case 'fortify':  H.hpMax += 1; H.hp = Math.min(H.hpMax, H.hp+1); log(`${H.name} fortifies (+1 max HP, +1 heal).`); break;
      case 'purge':    trashLowestCard(H); trashLowestCard(H); break;
      case 'chaos_spark': applyGenericDamage(5); break;
      case 'chaos_trick': applyGenericDamage(3); break;
      case 'chaos_ward':  H.shield += 2; log(`${H.name} gains Guard 2.`); break;
    }
    if (opt.key==='purge') {
      // already trashed 2
    } else {
      if (opt.attrs.toLowerCase().includes('trash 1')) trashLowestCard(H);
    }
    S.rewards[heroId] = { taken:true, chosen: opt.name };
    toast(`${H.name} chose ${opt.name}`);
    paintRewardsPane(); syncFooter();
  };
  card.appendChild(name); card.appendChild(chips); card.appendChild(btn);
  return card;
}

function applyGenericDamage(n){
  S.boss.hp = Math.max(0, S.boss.hp - n);
  if (S.boss.hp===0){
    S.finisher = { via:'generic', who:null, royal: (S.boss.rank==='Joker') ? 'Joker' : `${S.boss.rank[0]}${S.boss.suit}` };
    onBossDefeated();
  } else {
    log(`Generic deals ${n} to boss.`);
  }
}

function healLowest(n){
  const live = ['A','B'].filter(id=>S.heroes[id].hp>0);
  if (live.length===0) return;
  const lo = live.reduce((a,b)=> S.heroes[a].hp<=S.heroes[b].hp ? a : b);
  const T = S.heroes[lo];
  const before = T.hp;
  T.hp = Math.min(T.hpMax, T.hp + n);
  log(`${T.name} heals ${T.hp - before}.`);
}
function teamLoseHP(n){
  for (const id of ['A','B']){
    const H = S.heroes[id]; if (H.hp>0){ H.hp = Math.max(0, H.hp - n); }
  }
}

export function openRewardsModal(){
  const wrap = document.getElementById('modalWrap');
  const tabA = document.getElementById('tabA');
  const tabB = document.getElementById('tabB');

  tabA.innerHTML = window._labelTabA;
  tabB.innerHTML = window._labelTabB;

  const applyTabClasses=()=>{
    tabA.classList.toggle('active', S.ui.tab==='A');
    tabB.classList.toggle('active', S.ui.tab==='B');
  };
  tabA.onclick = ()=>{ S.ui.tab='A'; paintRewardsPane(); applyTabClasses(); };
  tabB.onclick = ()=>{ S.ui.tab='B'; paintRewardsPane(); applyTabClasses(); };

  upgradePreview();
  paintRewardsPane();
  applyTabClasses();

  syncFooter();
  document.getElementById('continueBtn').onclick = ()=>{ closeRewardsModal(); window.nextRoyal(); };
  document.getElementById('closeBtn').onclick = ()=>{ closeRewardsModal(); };

  wrap.style.display = 'flex';
  S.phase = 'rewards';
}

export function closeRewardsModal(){ const w=document.getElementById('modalWrap'); if(w) w.style.display='none'; }

export function paintRewardsPane(){
  const id = S.ui.tab;
  const H = S.heroes[id];
  const pane = document.getElementById('pane');
  if(!pane) return;
  pane.innerHTML = '';

  if (S.rewards[id]?.taken){
    const doneMsg = document.createElement('div');
    doneMsg.className='ghostMsg';
    doneMsg.style.gridColumn='1 / -1';
    doneMsg.textContent = H.claimedLegend ? 'Legendary granted for this hero.' : 'Reward already chosen for this hero.';
    pane.appendChild(doneMsg);
    return;
  }

  const isJoker = S.boss.rank==='Joker';
  if (!isJoker && S.finisher?.via==='poison' && !S.poisonLegendClaimed){
    const card = document.createElement('div'); card.className='rewardCard'; card.style.gridColumn='1 / -1';
    const btn = document.createElement('button'); btn.className='legendCard btnFull'; btn.textContent='Claim Legendary';
    btn.onclick = ()=>{
      S.poisonLegendClaimed = true;
      H.claimedLegend = true;
      S.rewards[id] = { taken:true, chosen:'Legendary' };
      toast(`${H.name} claimed a Legendary.`);
      paintRewardsPane(); syncFooter();
    };
    card.appendChild(btn);
    pane.appendChild(card);
  }

  const hitAuto = H.claimedLegend===true && S.finisher?.via==='hit';
  if (!hitAuto && !(S.finisher?.via==='poison' && S.poisonLegendClaimed)){
    (GENERICS[S.boss.rank]||[]).forEach(opt=>{
      pane.appendChild(buildGenericCard(opt, id));
    });
  }

  if (isJoker){
    const n = document.createElement('div'); n.className='ghostMsg'; n.style.gridColumn='1/-1';
    n.textContent = 'Joker defeated: no Legendary offered.';
    pane.appendChild(n);
  }
}

export function onBossDefeated(){
  clearTimers();
  S.phase = 'rewards';
  log(`Defeated ${S.boss.rank}${S.boss.rank==='Joker'?'':' ' + S.boss.suit}!`);

  grantUpgradeToBoth(S.boss.rank, S.boss.suit, ()=>SUITS[Math.floor(Math.random()*4)]);
  const vMap={Jack:6,Queen:7,King:8,Joker:9};
  log(`Both heroes gain a ${vMap[S.boss.rank]}${S.boss.rank==='Joker'?' (random suit)':' of '+S.boss.suit} to discard.`);

  if (S.finisher && S.finisher.via==='hit' && S.boss.rank!=='Joker'){
    const heroId = S.finisher.who;
    const H = S.heroes[heroId];
    const set = ELIGIBLE[H.cls];
    if (set && set.has(S.finisher.royal)){
      H.claimedLegend = true;
      S.rewards[heroId].taken = true;
      log(`${H.name} auto-claims Legendary (${S.finisher.royal}).`);
      toast(`${H.name} auto-claims a Legendary!`);
    }
  }
  openRewardsModal();
}
