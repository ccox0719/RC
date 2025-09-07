import { RULES } from './cfg.js';
import { S, livingHeroIds, schedule } from './state.js';
import { onBossDefeated } from './rewards.js';
import { drawUpTo } from './deck.js';
import { log } from './state.js';
import { paint } from './ui.js';

function rollD12(){ return 1+Math.floor(Math.random()*12); }

export function bossPhase(){
  if (S.phase==="rewards") return;
  if (livingHeroIds().length===0){ log("Both heroes are down. Run ends."); return; }

  // Poison tick
  if (S.boss.poison>0){
    const tick = S.boss.poison;
    S.boss.hp = Math.max(0, S.boss.hp - tick);
    log(`Poison ticks for ${tick}.`);
    if (S.boss.hp===0){
      S.finisher = { via:"poison", who:null, royal: `${S.boss.rank==="Joker"?"Joker":S.boss.rank[0]+S.boss.suit}` };
      onBossDefeated(); paint(); return;
    }
  }

  // Ability check
  const d12 = rollD12();
  switch (S.boss.rank){
    case "Jack": if (d12>=1 && d12<=3){ S.boss.jackPlus2 = true; log("Jack ability triggers: +2 to next attack."); } break;
    case "Queen": if (d12>=1 && d12<=3){ S.boss.hp = Math.min(S.boss.hpMax, S.boss.hp + 3); log("Queen ability triggers: heal 3."); } break;
    case "King": if (d12>=1 && d12<=2){ if (S.boss.poison>0){ S.boss.poison = 0; log("King ability triggers: purges all poison."); } } break;
    case "Joker": if (d12>=8 && d12<=10){ S.boss.jokerDouble = true; log("Joker ability: next attack will deal double damage."); } break;
  }

  // Attack
  let target = S.boss.target;
  if (S.heroes[target].hp<=0){
    const live = livingHeroIds();
    target = live[0] ?? target;
  }
  if (livingHeroIds().length===0){ log("Both heroes are down. Run ends."); return; }

  const base = RULES.bossDMG[S.boss.rank];
  let dmg = base;
  if (S.boss.jackPlus2){ dmg += 2; S.boss.jackPlus2=false; }
  if (S.boss.jokerDouble){ dmg *= 2; S.boss.jokerDouble=false; }

  const H = S.heroes[target];
  const soaked = Math.min(H.shield, dmg);
  const taken = Math.max(0, dmg - soaked);
  H.shield = Math.max(0, H.shield - dmg);
  H.hp = Math.max(0, H.hp - taken);
  log(`Boss attacks ${H.name} for ${dmg}. Shield soaked ${soaked}, took ${taken}.`);

  // Alternate target
  S.boss.target = (target==="A") ? "B" : "A";

  // New round
  for (const id of ["A","B"]){
    const hero = S.heroes[id];
    if (hero.hp>0){
      hero.plays = RULES.basePlaysPerRound;
      hero.playCap = RULES.basePlaysPerRound + (RULES.diamondCap + (hero.cls==="Mage"?1:0));
      drawUpTo(hero, 4);
    } else { hero.plays = 0; }
    hero.assist = 0;
  }

  S.turn += 1;
  S.phase = "players";
  paint();
}

export function queueBossPhase(){ S.phase="boss"; schedule(bossPhase, 250); }
