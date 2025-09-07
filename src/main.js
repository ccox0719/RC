import { initApp, paint } from './ui.js';
import { S, makeHero, startBoss } from './state.js';
import { SUITS } from './cfg.js';
import { shuffle, buildStartingDeck, drawUpTo } from './deck.js';
import { setSeed } from './rng.js';
import { bossPhase } from './boss.js';

/* Build UI skeleton */
initApp();

/* Seed RNG and bootstrap decks */
setSeed(1337);
S.heroes = {
  A: makeHero("A / Knight","Knight"),
  B: makeHero("B / Mage","Mage"),
};

/* Build gauntlet: shuffled J/Q/K of suits, then two Jokers */
function buildGauntlet(){
  const order=[];
  const SUITS_ARR = [...SUITS];
  const shuffleLocal = (arr)=>{ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; };
  for (const r of ["Jack","Queen","King"]){
    const suits = shuffleLocal([...SUITS_ARR]);
    for (const s of suits) order.push({rank:r, suit:s});
  }
  order.push({rank:"Joker", suit:"★"},{rank:"Joker", suit:"★"});
  return order;
}
S.gauntlet = buildGauntlet();

/* Decks + initial draw */
for (const id of ["A","B"]) {
  const H = S.heroes[id];
  H.deck = buildStartingDeck();
  shuffle(H.deck);
  drawUpTo(H, 4);
}

/* Advance to next royal */
window.nextRoyal = function nextRoyal(){
  if (S.gauntlet.length===0){ const t=document.getElementById('toast'); if(t){ t.textContent='Gauntlet cleared!'; t.style.display='block'; setTimeout(()=>t.style.display='none',1000);} return; }
  const r = S.gauntlet.shift();
  startBoss(r.rank, r.suit);
  for (const id of ["A","B"]) drawUpTo(S.heroes[id], 4);
  paint();
  const log = document.getElementById('log'); if(log){ const line=document.createElement('div'); line.textContent=`• Facing ${r.rank}${r.rank==="Joker"?"":` ${r.suit}`}.`; log.prepend(line); }
};
window.bossPhase = bossPhase;

/* Start */
window.nextRoyal();
