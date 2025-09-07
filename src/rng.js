let seed = 1337;

export function setSeed(s){
  seed = (s||1)%2147483647;
  if(seed<=0) seed+=2147483646;
}

export function rnd(){
  seed = seed*48271 % 2147483647;
  return seed/2147483647;
}

export function pick(arr){ return arr[Math.floor(rnd()*arr.length)] }
