# Card Dungeon – Systems Roadmap & AI Instructions

This file is for **AI assistants** working on the Card Dungeon Companion app.

The goal is to add three layered systems **without** breaking the core game:

1. Enemy Weaknesses & Resistances  
2. Enemy Tells (intent / telegraphs)  
3. Store & Currency (coins / poker chips)

> ❗ When editing code:  
> • Do **not** change core rules (hand rankings, base damage math, HP totals, room flow) unless explicitly asked.  
> • Keep everything mobile-friendly (iPad first, iPhone second).  
> • Prefer configuration objects / data tables over hard-coding logic all over the place.

---

## PROJECT 1 – Enemy Weaknesses & Resistances

### 1.1 Design Goals

- Make enemies feel **different** based on which poker hands hurt them most.  
- Keep it **simple to remember**: each enemy has **0–2 weaknesses** and **0–1 resistances**.  
- All effects are **numeric / rule based**, not cinematic fluff only.

### 1.2 Core Rules

**Weakness examples (per enemy):**

- Weak vs **Pair** → +1 damage  
- Weak vs **Two Pair** → +2 damage or “stun 1 round”  
- Weak vs **Three of a Kind** → cancel enemy’s next ability  
- Weak vs **Straight** → ignore armor / defense  
- Weak vs **Flush** → double damage (or +X damage)  
- Weak vs **Full House** → permanently break armor  
- Weak vs **Straight Flush** → “legendary” effect (run-defining, chosen in design)

**Resistance examples (per enemy):**

- Resists **Pair** → -1 damage from Pair  
- Resists **Straight** → no precision bonus  
- Resists **Flush** → reduce damage by a flat amount (e.g. -2)  
- Resists pattern hands (Two Pair / Full House) → immune to debuffs from those hands

> Enemies never have a weakness **and** resistance to the same hand.

### 1.3 Data Model (companion app)

Create / extend an enemy definition structure. Example (JS-ish):

```js
const ENEMY_LIBRARY = {
  "goblin-brute": {
    id: "goblin-brute",
    name: "Goblin Brute",
    maxHp: 24,
    baseDamage: 4,
    // NEW:
    weaknesses: ["pair", "twoPair"],
    resistances: ["straight"],
    tells: ["heavyWindup", "defensivePosture"], // see Project 2
  },
  "shadow-wraith": {
    id: "shadow-wraith",
    name: "Shadow Wraith",
    maxHp: 18,
    baseDamage: 3,
    weaknesses: ["flush"],
    resistances: ["pair"],
    tells: ["ignoreGuard", "aoePulse"]
  }
};
```

Normalized hand keys:

`"highCard" | "pair" | "twoPair" | "threeKind" | "straight" |`
`"flush" | "fullHouse" | "fourKind" | "straightFlush"`

### 1.4 Combat Integration

When resolving a hero’s attack:  
1. Determine handType from UI selection (already exists).  
2. Look up `enemy.weaknesses` and `enemy.resistances`.  
3. Start with `baseDamage` from existing system.  
4. Apply weakness / resistance in this order:

```js
let dmg = baseDamage;

if (enemy.weaknesses?.includes(handType)) {
  dmg += weaknessBonusOrEffect(...);
}

if (enemy.resistances?.includes(handType)) {
  dmg = Math.max(0, dmg - resistancePenalty(...));
}
```

Log example:  
- `"[HERO] hits Goblin Brute with a Straight (WEAKNESS) for 8 damage!"`  
- `"[HERO] plays Flush, but Shadow Wraith RESISTS it. 3 damage."`

### 1.5 AI Implementation Prompt

You are updating the Card Dungeon companion app.  
Implement the Enemy Weakness & Resistance system as defined in PROJECT 1 of CARD-DUNGEON-SYSTEMS.md.  
• Add a weakness/resistance configuration to the enemy data model.  
• Wire it into the existing combat resolution so that damage is modified by enemy weaknesses/resistances.  
• Do not change base damage math beyond adding these modifiers.  
• Add clear log messages for when a weakness or resistance triggers.  
• Keep the UI changes minimal (e.g., small tags under enemy name).

---

## PROJECT 2 – Enemy Tells (Intent / Telegraphs)

### 2.1 Design Goals

- Players should see attacks coming and react with Guard / Recover.  
- Enemy types should have a pattern of behavior that feels learnable.  
- Tells must be visible in the app and logged in the combat log.

### 2.2 Tell Types

Core tells (can be re-used across enemies):  
• `heavyWindup`  
  • Next attack is a Heavy Attack (high damage). Guard strongly recommended.  
• `ignoreGuard`  
  • Next attack ignores Guard mitigation.  
• `aoePulse`  
  • Next attack hits all heroes.  
• `defensivePosture`  
  • Enemy takes reduced damage next round.  
• `enrage`  
  • Gains permanent +1 attack (or similar) after next action.

Enemies reference these in `tells: []` and the AI uses a simple state machine to pick the next tell.

### 2.3 Data & State

Per enemy instance in a room, we need:

```js
currentIntent: {
  type: "heavyWindup" | "ignoreGuard" | "aoePulse" | "defensivePosture" | "enrage" | null,
  turnsRemaining: 1
}
```

When a new room starts or after the enemy acts:  
• Randomly roll/select the next intent from the enemy’s `tells` list.  
• Set `currentIntent` accordingly.  
• Update UI (icon, text) and log.

### 2.4 UI & Log

• Show a small icon + label under the enemy HP or portrait, e.g.:  
  • “WINDING UP: Heavy Attack next turn”  
  • “DEFENSIVE: Takes reduced damage”  
• Log entry example:  
  • “The Goblin Brute winds up for a HEAVY ATTACK!”

On the turn the enemy acts, the combat resolver uses `currentIntent` to adjust damage / behavior, then clears or replaces it.

### 2.5 AI Implementation Prompt

You are updating the Card Dungeon companion app.  
Implement the Enemy Tell / Intent system as defined in PROJECT 2 of CARD-DUNGEON-SYSTEMS.md.  
• Add per-enemy-instance `currentIntent` state.  
• At the start of each enemy turn, choose an intent from the enemy’s `tells` list and display it in the UI.  
• Modify enemy attack behavior based on the intent (heavy, ignore guard, AoE, defensive, enrage).  
• Log each intent clearly in the combat log.  
• Keep new UI minimal and mobile-friendly.

---

## PROJECT 3 – Store & Currency (Coins / Poker Chips)

### 3.1 Design Goals

• Add a between-room store without bloating combat.  
• Allow players to either:  
  • Use physical poker chips at the table, OR  
  • Let the app track coins digitally.  
• Store sells items that interact with weaknesses/tells but do not redefine them.

### 3.2 Currency Modes

Config flag:

```js
const SETTINGS = {
  currencyMode: "chips" | "digital"  // selected in menu
};
```

• `"chips"` → app only tracks costs and item effects, players handle chips on the table.  
• `"digital"` → app maintains `coinsPerHero` numeric values.

App should store:

```js
coins: {
  hero1: 0,
  hero2: 0,
  // etc
}
```

or a single shared pool if you choose that pattern later.

### 3.3 Store Timing

• Store appears at safe points:  
  • After certain rooms (e.g. 3, 6, 9, 12)  
  • Or after beating miniboss/boss, depending on design.

Companion app flow:  
1. Detect store room or “visit store” event.  
2. Pause combat actions.  
3. Open Store UI modal listing items + prices.  
4. On purchase:  
  • Check coin/chip availability.  
  • Apply item effect to hero or global state.  
  • Log the purchase.

### 3.4 Store Inventory (Core Item Types)

These are good first-wave items:  
1. **Weakness Insight**  
  • Reveal this room’s enemy weakness in the UI.  
2. **Counter Sigil**  
  • Cancel the enemy’s next Pair/Two Pair effect.  
3. **Sharp Mind Tonic**  
  • +1 redraw per room.  
4. **Stat Charms**  
  • +1 Might / +1 Agility / +1 Lore.  
5. **Trap Tools**  
  • Reduce trap total by a flat amount or auto-disarm one trap.  
6. **Keen Eye**  
  • Enemy tells are shown one turn earlier or displayed more clearly.  
7. **Healing & Guard Boosters**  
  • E.g. Recover heals +1 extra HP, Guard prevents +1 damage.

All items should be defined in a data table, not hard-coded:

```js
const STORE_ITEMS = [
  {
    id: "weakness-insight",
    name: "Weakness Insight",
    cost: 3,
    description: "Reveal this room's enemy weakness.",
    applyEffect: (state, heroId) => { /* implement */ }
  },
  // etc
];
```

### 3.5 AI Implementation Prompt

You are updating the Card Dungeon companion app.  
Implement the Store & Currency system as defined in PROJECT 3 of CARD-DUNGEON-SYSTEMS.md.  
• Add a currency mode setting: “chips” vs “digital”.  
• If “digital”, track coins per hero or as a shared pool and update on rewards/purchases.  
• Implement a simple Store UI that can be shown at specific room indexes (configurable).  
• Define store items in a data table with ids, names, costs, and `applyEffect` functions.  
• Hook purchases into game state and log them.  
• Keep functionality minimal and extensible; do not redesign combat or rooms.

---

## IMPLEMENTATION ORDER

When in doubt, AI should implement these projects in this order:  
1. Project 1: Weaknesses & Resistances  
2. Project 2: Enemy Tells / Intent  
3. Project 3: Store & Currency

Each project can be done in its own branch / session, and all logic should be driven by data structures (`ENEMY_LIBRARY`, `STORE_ITEMS`, `SETTINGS`) to make future tuning easy.

--- 
