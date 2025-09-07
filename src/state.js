import { RULES, SUITS } from './cfg.js';

export const S = {
  heroes: {},
  boss: { rank:"Jack", suit:"♣", hp:8, hpMax:8, poison:0, target:"A", jackPlus2:false, jokerDouble:false },
  gauntlet: [],
  finisher: null,
  turn: 1,
  phase: "players",
  poisonLegendClaimed:false,
  performanceMode:false,
  timers:new Set(),
  rewards:{A:{taken:false},B:{taken:false}},
  ui:{tab:"A"}
};

export function schedule(fn, ms){
  const id = setTimeout(()=>{ S.timers.delete(id); fn(); }, ms);
  S.timers.add(id);
}
export function clearTimers(){
  for (const id of Array.from(S.timers)) clearTimeout(id);
  S.timers.clear();
}

export function toast(t){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=t; el.style.display='block';
  clearTimeout(el._t); el._t=setTimeout(()=>el.style.display='none',1400);
}
export function log(t){
  const el=document.getElementById('log');
  if(!el) return;
  const line=document.createElement('div');
  line.textContent=`• ${t}`;
  el.prepend(line);
  if(!S.performanceMode){ el.scrollTop=0; }
}

export function royalKey(rank, suit){ return rank==="Joker" ? "Joker" : `${rank[0]}${suit}`; }

export function livingHeroIds(){ return ["A","B"].filter(id=>S.heroes[id].hp>0); }
export function lowestLivingHeroId(){
  const live = livingHeroIds();
  if (live.length===0) return null;
  if (live.length===1) return live[0];
  const [id1,id2]=live;
  return S.heroes[id1].hp <= S.heroes[id2].hp ? id1 : id2;
}
export function chooseNextTarget(){
  const nextDefault = (S.boss?.target==="A") ? "B" : "A");
  const live = livingHeroIds();
  if (live.includes(nextDefault)) return nextDefault;
  return live[0] ?? "A";
}

export function makeHero(name, cls){
  const hp = (cls==="Knight"||cls==="Priest") ? 35 : 30;
  const cap = RULES.diamondCap + (cls==="Mage"?1:0);
  return {
    name, cls, hp, hpMax:hp, shield:0,
    hand:[], deck:[], discard:[],
    plays: RULES.basePlaysPerRound,
    playCap: RULES.basePlaysPerRound + cap,
    assist: 0, claimedLegend:false
  };
}

export function startBoss(rank, suit){
  const hp = RULES.bossHP[rank];
  S.boss = { rank, suit, hp, hpMax:hp, poison:0, target: chooseNextTarget(), jackPlus2:false, jokerDouble:false };
  S.finisher = null;
  S.poisonLegendClaimed = false;
  S.rewards = {A:{taken:false},B:{taken:false}};
  clearTimers();

  for (const id of ["A","B"]) {
    const H = S.heroes[id];
    H.plays = RULES.basePlaysPerRound;
    H.playCap = RULES.basePlaysPerRound + (RULES.diamondCap + (H.cls==="Mage"?1:0));
    H.assist = 0;
  }
}

export function grantUpgradeToBoth(rank, suit, rngPick){
  const upByRank = { Jack:6, Queen:7, King:8, Joker:9 };
  const upVal = upByRank[rank];
  for (const id of ["A","B"]){
    const H = S.heroes[id];
    const s = (rank==="Joker") ? rngPick() : suit;
    H.discard.push({v:upVal, s});
  }
}
