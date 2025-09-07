import { rnd } from './rng.js';
import { SUITS } from './cfg.js';
import { log } from './state.js';

export function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

export function buildStartingDeck(){
  const deck=[];
  for (const v of [2,3,4,5]){
    for (const s of SUITS) deck.push({v,s});
  }
  return deck;
}

export function drawUpTo(H, n){
  while (H.hp>0 && H.hand.length < n){
    if (H.deck.length===0){
      if (H.discard.length===0) break;
      H.deck.push(...H.discard);
      H.discard.length = 0;
      shuffle(H.deck);
    }
    const c = H.deck.shift();
    H.hand.push(c);
  }
}

export function trashLowestCard(H){
  const getMinIndex = (arr)=> {
    if (!arr.length) return -1;
    let mV = arr[0].v, mI = 0;
    for (let i=1;i<arr.length;i++){ if (arr[i].v < mV){ mV = arr[i].v; mI = i; } }
    return mI;
  };
  let i = getMinIndex(H.deck);
  if (i>=0){ const c=H.deck.splice(i,1)[0]; log(`${H.name} trashes ${c.v}${c.s} (deck).`); return; }
  i = getMinIndex(H.discard);
  if (i>=0){ const c=H.discard.splice(i,1)[0]; log(`${H.name} trashes ${c.v}${c.s} (discard).`); return; }
  i = getMinIndex(H.hand);
  if (i>=0){ const c=H.hand.splice(i,1)[0]; log(`${H.name} trashes ${c.v}${c.s} (hand).`); return; }
}
