export const SUITS = ["♣","♥","♠","♦"];
export const SUIT_NAME = { "♣":"Clubs", "♥":"Hearts", "♠":"Spades", "♦":"Diamonds" };
export const RANKS = ["Jack","Queen","King","Joker"];

export const HERO_FOCUS = {
  Knight:["♣","♥"],
  Mage:["♦","♠"],
  Assassin:["♣","♠"],
  Priest:["♥","♦"]
};

export const RULES = {
  bossHP:   { Jack:8, Queen:14, King:18, Joker:26 },
  bossDMG:  { Jack:2, Queen:4,  King:5,  Joker:6  },
  baseDamagePerHit: 5,
  baseShield: 3,           // Knight +1
  baseHeal: 3,             // Priest +1
  basePoison: 1,           // Assassin +1
  basePlaysPerRound: 1,
  diamondCap: 2,           // Mage +1 cap
  luckyBonus: { Mage:2, Knight:1, Assassin:1, Priest:1 },
  assistCap: 3,
};

export const ELIGIBLE = {
  Knight:  new Set(["J♣","Q♣","K♣","J♥","Q♥","K♥"]),
  Mage:    new Set(["J♦","Q♦","K♦","J♠","Q♠","K♠"]),
  Assassin:new Set(["J♣","Q♣","K♣","J♠","Q♠","K♠"]),
  Priest:  new Set(["J♥","Q♥","K♥","J♦","Q♦","K♦"]),
};

export const GENERICS = {
  Jack: [
    {name:"Training", attrs:"+1 atk, +1 heal, Trash 1", key:"training"},
    {name:"Sprint",   attrs:"+2 atk, -1 team HP, Trash 1", key:"sprint"},
    {name:"Parry",    attrs:"+Guard 2, Trash 1", key:"parry"},
  ],
  Queen: [
    {name:"Tactics",  attrs:"+2 atk, Trash 1", key:"tactics"},
    {name:"Rally",    attrs:"+1 atk, +1 heal, Trash 1", key:"rally"},
    {name:"Scout",    attrs:"+3 atk, Trash 1", key:"scout"},
  ],
  King: [
    {name:"Resolve",  attrs:"+2 heal, Trash 1", key:"resolve"},
    {name:"Fortify",  attrs:"+1 max HP, +1 heal, Trash 1", key:"fortify"},
    {name:"Purge",    attrs:"Trash 2 lowest cards", key:"purge"},
  ],
  Joker: [
    {name:"Chaos Spark", attrs:"+5 atk, Trash 1", key:"chaos_spark"},
    {name:"Chaos Trick", attrs:"+3 atk, Trash 1", key:"chaos_trick"},
    {name:"Chaos Ward",  attrs:"+Guard 2, Trash 1", key:"chaos_ward"},
  ],
};
