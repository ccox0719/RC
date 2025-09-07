import { RULES } from './cfg.js';
import { S, lowestLivingHeroId, toast, log } from './state.js';
import { drawUpTo } from './deck.js';
import { queueBossPhase } from './boss.js';
import { onBossDefeated } from './rewards.js';
import { paint } from './ui.js';

function rollD12(){ return 1+Math.floor(Math.random()*12); }

export function playCard(heroId, value, suit){
  const H = S.heroes[heroId];
  if (S.phase!=="players"){ toast("Wait for your turn."); return; }
  if (H.plays<=0){ toast("No plays left."); return; }

  const idx = H.hand.findIndex(c=>c.v===value && c.s===suit);
  if (idx<0){ toast("Card not in hand."); return; }
  const card = H.hand.splice(idx,1)[0];
  H.plays -= 1;

  const d12 = rollD12();
  const mod = H.assist || 0;
  H.assist = 0;
  const total = d12 + mod;
  const hit = total <= card.v;
  const fumble = (d12===12);
  const lucky = (d12===1);
  const luckyBonus = RULES.luckyBonus[H.cls] || 0;

  let suitShield = 0, suitHeal = 0, suitPoison = 0, suitExtraPlay = 0;
  if (hit){
    if (card.s==="♣"){ suitShield = RULES.baseShield + (H.cls==="Knight"?1:0); }
    if (card.s==="♥"){ suitHeal   = RULES.baseHeal   + (H.cls==="Priest"?1:0); }
    if (card.s==="♠"){ suitPoison = RULES.basePoison + (H.cls==="Assassin"?1:0); }
    if (card.s==="♦"){ suitExtraPlay = 1; }
  }
  if (fumble){
    suitShield = Math.floor(suitShield/2);
    suitHeal   = Math.floor(suitHeal/2);
    suitPoison = Math.floor(suitPoison/2);
    suitExtraPlay = Math.floor(suitExtraPlay/2);
  }

  if (suitShield>0){ H.shield += suitShield; log(`${H.name} gains Shield ${suitShield} from ${card.v}♣.`); }
  if (suitHeal>0){ const id = lowestLivingHeroId(); if(id){ const T=S.heroes[id]; const before=T.hp; T.hp=Math.min(T.hpMax, T.hp + suitHeal); log(`${H.name} heals ${T.name} for ${T.hp-before} from ${card.v}♥.`);} }
  if (suitPoison>0){ S.boss.poison += suitPoison; log(`${H.name} adds ${suitPoison} poison from ${card.v}♠.`); }
  if (suitExtraPlay>0){
    const cap = H.playCap;
    if (H.plays < cap){ H.plays = Math.min(cap, H.plays + 1); log(`${H.name} gains +1 play (cap ${cap}).`); }
    else { log(`${H.name} is at play cap (${cap}). ♦ gives no extra play.`); }
  }

  let extraDmg = 0;
  if (lucky){ extraDmg += luckyBonus; log(`Natural 1 → Lucky +${luckyBonus} dmg.`); }

  if (hit){
    const dmg = RULES.baseDamagePerHit + extraDmg;
    applyDamage("hit", heroId, dmg);
    log(`${H.name} hits (d12 ${d12}${mod?`+${mod}`:""} ≤ ${card.v}) for ${dmg}.`);
  } else {
    log(`${H.name} misses (d12 ${d12}${mod?`+${mod}`:""} > ${card.v}).`);
  }

  H.discard.push(card);

  if (fumble){
    const id = lowestLivingHeroId();
    if(id){ const T=S.heroes[id]; T.hp = Math.max(0, T.hp - 1); log(`FUMBLE! ${T.name} takes 1 damage.`); }
  }

  if (S.heroes.A.plays<=0 && S.heroes.B.plays<=0){
    queueBossPhase();
  }

  paint();
}

export function assist(fromId){
  const toId = fromId==="A" ? "B" : "A";
  const F = S.heroes[fromId], T = S.heroes[toId];
  if (S.phase!=="players"){ toast("Wait for your turn."); return; }
  if (F.plays<=0){ toast("No plays left."); return; }
  if (F.hand.length===0){ toast("No cards to sacrifice."); return; }

  const give = Math.min(F.hand.length, RULES.assistCap - (T.assist||0));
  if (give<=0){ toast("Partner is at assist cap."); return; }
  const removed = F.hand.splice(0, give);
  F.discard.push(...removed);
  F.plays -= 1;
  T.assist = Math.min((T.assist||0) + give, RULES.assistCap);
  log(`${F.name} assists ${T.name}: +${give} to next roll (cap ${RULES.assistCap}).`);
  paint();
}

export function endTurn(heroId){
  if (S.phase!=="players") return;
  S.heroes[heroId].plays = 0;
  if (S.heroes.A.plays<=0 && S.heroes.B.plays<=0){
    queueBossPhase();
  }
  paint();
}

export function applyDamage(via, who, dmg){
  const royal = (S.boss.rank==="Joker") ? "Joker" : `${S.boss.rank[0]}${S.boss.suit}`;
  S.finisher = { via, who, royal };
  S.boss.hp = Math.max(0, S.boss.hp - dmg);
  if (S.boss.hp===0){ onBossDefeated(); }
  paint();
}

window.playCard = playCard;
window.assist = assist;
window.endTurn = endTurn;
