// --- Card & deck helpers --------------------------------------------
    const SUITS = ['♠', '♥', '♦', '♣'];
    const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const ENEMY_PORTRAITS = [];
  const GENERATED_BULK_PORTRAITS = Array.from({ length: 6 }, (_, i) => `enemies/enemy${i + 1}.png`);
  const BOSS_PORTRAITS = Array.from({ length: 6 }, (_, i) => `enemies/boss/boss${i + 1}.png`);
    let enemyPortraitPool = [];
    refreshEnemyPortraitPool();

    const SAVE_KEY = 'card-dungeon-save';

    function rankValue(rank) {
      if (rank === 'A') return 11;
      if (['J','Q','K'].includes(rank)) return 10;
      return parseInt(rank, 10);
    }

    function makeDeck() {
      const deck = [];
      for (const suit of SUITS) {
        for (const rank of RANKS) {
          deck.push({ rank, suit, value: rankValue(rank) });
        }
      }
      return deck;
    }

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    function drawCard(deck) {
      if (deck.length === 0) {
        deck.push(...makeDeck());
        shuffle(deck);
      }
      return deck.pop();
    }

    function cardLabel(card) {
      return card ? `${card.rank}${card.suit}` : '—';
    }

    function setupPlanSelect() {
      const planSelect = document.getElementById('planSelect');
      if (!planSelect) return;
      planSelect.innerHTML = '';
    }
    window.setupPlanSelect = setupPlanSelect;

    function getRoomType(card, isLast) {
      if (devForcedRoomType && devForcedRoomType !== 'auto') return devForcedRoomType;
      if (isLast) return 'boss';
      if (card && card.roomType) return card.roomType;
      switch (card.suit) {
        case '♠': return 'enemy';
        case '♥': return 'enemyHeart';
        case '♣': return 'trap';
        case '♦': return 'treasure';
        default: return 'unknown';
      }
    }

    function displayTypeFor(type) {
      if (type === 'boon' && currentDifficulty === 'dire') return 'enemy';
      if (type === 'enemyHeart') return 'enemy';
      return type;
    }

    function roomTypeLabel(type) {
      switch (type) {
        case 'enemy': return 'Enemy';
        case 'enemyHeart': return 'Elite / Trick Enemy';
        case 'trap': return 'Trap / Hazard';
        case 'boon': return 'Boon Room';
        case 'treasure': return 'Treasure';
        case 'boss': return 'Boss';
        default: return type;
      }
    }

    // --- Game State ------------------------------------------------------
    const game = {
      numPlayers: 0,
      players: [],
      dungeonDeck: [],
      dungeonRooms: [],
      roomIndex: -1,
      enemy: null,
      over: false,
      boonEmpowerNextRound: false,
      roomEventMessage: '',
      handBonusReady: false,
      handBonusActive: false,
      partyChips: 0,
      lastChanceTokens: 0,
      nextRoundExtraCards: 0,
      currentRoundExtraCards: 0,
      handSizePenalty: 0,
      guardBraceActive: false,
      luckyFlipReady: false,
      luckyFlipUsedThisRoom: false,
      roomDamageTaken: false,
      roomStyleReward: 0,
      roomStyleCombo: '',
      lastRewardedRoomIndex: -1,
      traitLegendLoggedRoom: -1,
      handSizeStack: 0
    };

const ROOM_BACKGROUND_GRADIENT = 'linear-gradient(145deg, rgba(14, 16, 32, 0.96), rgba(8, 10, 22, 0.96))';
const DEFAULT_ROOM_COUNT = 12;
const TRAP_BG_IMAGE = 'objects/trap.png';
const MAX_HAND_STACK_FROM_ENEMY = 5; // +5 over base (10 max) from enemy defeats
const BASE_HAND_SIZE = 5;
const HERO_STARTING_COINS = 5;
const COMBO_DAMAGE = {
  none: 0,
  high: 2,
  pair: 4,
  twoPair: 5,
  three: 6,
  straight: 7,
  flush: 8,
  full: 9,
  straightFlush: 10,
  blackjack: 11
};
const COMBO_KEYS = Object.keys(COMBO_DAMAGE).filter(key => key !== 'none');
const BOON_ATTACK_ORDER = [
  'none',
  'high',
  'pair',
  'twoPair',
  'three',
  'straight',
  'flush',
  'full',
  'straightFlush',
  'blackjack'
];
const BOON_GUARD_ORDER = ['high', 'pair', 'three', 'full'];
const BOON_STAT_KEYS = ['might', 'agility', 'lore'];
const BOON_STAT_LABELS = {
  might: 'Might',
  agility: 'Agility',
  lore: 'Lore'
};
const RECOVER_HEAL_MAP = {
  high: 1,
  pair: 2,
  twoPair: 4,
  three: 6,
  straight: 7,
  flush: 8,
  full: 10,
  straightFlush: 12,
  blackjack: 14
};

function recoverLoreMultiplier(hero) {
  const lore = hero?.lore || 0;
  return 1 + Math.floor(Math.max(0, lore) / 5);
}
const STYLE_REWARD_MAP = {
  three: { value: 1, label: 'Three-of-a-Kind' },
  straight: { value: 2, label: 'Straight' },
  flush: { value: 2, label: 'Flush' },
  full: { value: 2, label: 'Full House' },
  straightFlush: { value: 2, label: 'Straight Flush' },
  blackjack: { value: 1, label: 'Blackjack' }
};
const HAND_TYPE_LABELS = {
  highCard: 'High Card',
  pair: 'Pair',
  twoPair: 'Two Pair',
  threeKind: 'Three of a Kind',
  straight: 'Straight',
  flush: 'Flush',
  fullHouse: 'Full House',
  straightFlush: 'Straight Flush',
  blackjack: 'Blackjack'
};
const HAND_SHORT_LABELS = {
  highCard: 'HC',
  pair: 'P',
  twoPair: '2P',
  threeKind: '3K',
  straight: 'ST',
  flush: 'FL',
  fullHouse: 'FH',
  straightFlush: 'SF',
  blackjack: 'BJ'
};
const INTENT_SYMBOLS = {
  heavyWindup: '⚡',
  ignoreGuard: '🛡️',
  aoePulse: '🌐',
  defensivePosture: '🛡',
  enrage: '🔥'
};
const FOCUS_ROLE_ICONS = {
  might: '⚔',
  agility: '⚡',
  lore: '💠',
  balanced: '✦'
};
const ENEMY_PROFILE_LIBRARY = [
  {
    id: 'goblin-brute',
    name: 'Goblin Brute',
    weaknesses: { pair: 1, twoPair: 2 },
    resistances: { straight: 1 },
    tells: ['heavyWindup', 'defensivePosture']
  },
  {
    id: 'shadow-wraith',
    name: 'Shadow Wraith',
    weaknesses: { flush: 2 },
    resistances: { pair: 1 },
    tells: ['ignoreGuard', 'aoePulse']
  },
  {
    id: 'iron-sentinel',
    name: 'Iron Sentinel',
    weaknesses: { straight: 1, highCard: 1 },
    resistances: { flush: 2 },
    tells: ['defensivePosture']
  },
  {
    id: 'spike-horror',
    name: 'Spike Horror',
    weaknesses: { threeKind: 2, straightFlush: 3 },
    resistances: { twoPair: 1 },
    tells: ['heavyWindup', 'enrage']
  }
];
const BOSS_PROFILE = {
  id: 'iron-tyrant',
  name: 'Iron Tyrant',
  weaknesses: { straightFlush: 3 },
  resistances: { fullHouse: 2, flush: 1 },
  tells: ['heavyWindup', 'enrage', 'ignoreGuard']
};

const INTENT_EFFECTS = {
  heavyWindup: {
    label: 'Heavy Attack',
    log: 'winds up for a HEAVY ATTACK!',
    damageBonus: 2,
    description: 'Next attack deals +2 damage.'
  },
  ignoreGuard: {
    label: 'Ignoring Guard',
    log: 'prepares to ignore Guard!',
    ignoreGuard: true
    ,
    description: 'Next attack ignores Guard mitigation.'
  },
  aoePulse: {
    label: 'AoE Pulse',
    log: 'charges an AoE Pulse!',
    aoe: true
    ,
    description: 'This turn hits every living hero.'
  },
  defensivePosture: {
    label: 'Defensive Posture',
    log: 'slides into a defensive posture.',
    defensive: true
    ,
    description: 'Hero attacks deal 25% less damage this round.'
  },
  enrage: {
    label: 'Enraged',
    log: 'becomes enraged and grows stronger!',
    enrageBonus: 1,
    onAssign: enemy => {
      enemy.dmg = Math.max(enemy.dmg, 0) + 1;
    }
  }
};

function normalizedHandKey(comboKey) {
  const MAP = {
    high: 'highCard',
    pair: 'pair',
    twoPair: 'twoPair',
    three: 'threeKind',
    straight: 'straight',
    flush: 'flush',
    full: 'fullHouse',
    straightFlush: 'straightFlush',
    blackjack: 'blackjack'
  };
  return MAP[comboKey] || comboKey;
}

function handDisplayLabel(handKey) {
  return HAND_TYPE_LABELS[handKey] || handKey;
}

function cloneEnemyProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    weaknesses: profile.weaknesses ? { ...profile.weaknesses } : {},
    resistances: profile.resistances ? { ...profile.resistances } : {},
    tells: profile.tells ? [...profile.tells] : []
  };
}

function chooseEnemyProfile(card, type, roomIndex) {
  if (type === 'boss') {
    return cloneEnemyProfile(BOSS_PROFILE);
  }
  const source = ENEMY_PROFILE_LIBRARY;
  if (!source.length) return null;
  const idx = card && typeof card.value === 'number'
    ? card.value % source.length
    : (roomIndex % source.length);
  return cloneEnemyProfile(source[idx]);
}

function applyWeaknessResistance(damage, profile, handType) {
  if (!profile) return { damage, weaknessBonus: 0, resistancePenalty: 0 };
  const weaknessBonus = profile.weaknesses?.[handType] || 0;
  const resistancePenalty = profile.resistances?.[handType] || 0;
  const boosted = damage + weaknessBonus;
  const adjusted = Math.max(0, boosted - resistancePenalty);
  return {
    damage: adjusted,
    weaknessBonus,
    resistancePenalty
  };
}

function handShortLabel(handKey) {
  return HAND_SHORT_LABELS[handKey] || handDisplayLabel(handKey).split(' ').map(word => word[0]).join('').toUpperCase() || handKey;
}

function traitBadgeLabel(handKey) {
  return HAND_SHORT_LABELS[handKey] || handKey.toUpperCase();
}

function traitBadgeHtml(type, hand, value) {
  const short = traitBadgeLabel(hand);
  const symbol = type === 'weakness' ? `+${value}` : `-${value}`;
  const title = `${type === 'weakness' ? 'Weak vs' : 'Resists'} ${handDisplayLabel(hand)} (${symbol})`;
  return `<span class="enemy-badge trait-badge trait-${type}" title="${title}">${short}${symbol}</span>`;
}

function createEnemyTraitBadges(profile) {
  if (!profile) return '';
  const weaknessBadges = Object.entries(profile.weaknesses || {})
    .filter(([, value]) => value > 0)
    .map(([hand, value]) => traitBadgeHtml('weakness', hand, value));
  const resistanceBadges = Object.entries(profile.resistances || {})
    .filter(([, value]) => value > 0)
    .map(([hand, value]) => traitBadgeHtml('resistance', hand, value));
  return [...weaknessBadges, ...resistanceBadges].join('');
}

function logTraitLegend(profile) {
  if (!profile || game.traitLegendLoggedRoom === game.roomIndex) return;
  const legend = Object.entries(HAND_SHORT_LABELS)
    .map(([hand, short]) => `${short}=${HAND_TYPE_LABELS[hand]}`)
    .join(' · ');
  addLog(`Weak/Resist shorthand: ${legend}. Weak chips show bonus, resist chips show penalty.`, 'small');
  game.traitLegendLoggedRoom = game.roomIndex;
}

function setEnemyIntent(enemy, logIt = false) {
  if (!enemy || !enemy.profile) return;
  const tells = enemy.profile.tells || [];
  if (!tells.length) {
    enemy.currentIntent = { type: null, label: '', turnsRemaining: 0, extra: null };
    return;
  }
  const nextType = tells[Math.floor(Math.random() * tells.length)];
  const effect = INTENT_EFFECTS[nextType] || {};
  enemy.currentIntent = {
    type: nextType,
    label: effect.label || nextType,
    turnsRemaining: effect.duration || 1,
    extra: effect
  };
  if (effect.onAssign) effect.onAssign(enemy);
  if (logIt && effect.log) {
    const name = enemy.profile.name || (enemy.type === 'boss' ? 'Boss' : 'Enemy');
    const detail = effect.description ? ` ${effect.description}` : '';
    addLog(`${name} ${effect.log}${detail}`, 'badge-warning');
  }
}

function enemyIntentLine(enemy) {
  if (!enemy || !enemy.currentIntent || !enemy.currentIntent.type) return '';
  const symbol = INTENT_SYMBOLS[enemy.currentIntent.type] || '⚔';
  return `
    <div class="enemy-intent-row">
      ${symbol} Intent: ${enemy.currentIntent.label}
    </div>
  `;
}

function updateEnemySummaryDisplay() {
  if (!enemySummaryEl || !game.enemy) return;
  const hpPercent = Math.max(
    0,
    Math.min(100, Math.round((game.enemy.hp / game.enemy.maxHp) * 100))
  );
  const traitHtml = createEnemyTraitBadges(game.enemy.profile);
  const intentHtml = enemyIntentLine(game.enemy);
  const totalRooms = game.dungeonRooms.length || 0;
  const currentCard = game.dungeonRooms[game.roomIndex];
  const isLast = game.roomIndex === totalRooms - 1;
  const cardTypeKey = currentCard ? getRoomType(currentCard, isLast) : game.enemy.type;
  const cardTypeLabel = (displayTypeFor(cardTypeKey) || 'Enemy').toUpperCase();
  const rankSuit = currentCard ? `${currentCard.rank}${currentCard.suit}` : '—';
  const metaHtml = `
    <div class="enemy-meta-row">
      <span class="room-label">Room ${Math.max(0, game.roomIndex + 1)} / ${totalRooms}</span>
      <span class="card-label">
        <span class="card-rank-suit">Card: ${rankSuit}</span>
        <span class="card-type-pill">${cardTypeLabel}</span>
      </span>
    </div>
  `;
  enemySummaryEl.innerHTML = `
    ${metaHtml}
    <div class="enemy-stats-row">
      <div class="cluster cluster-left">
        <span class="enemy-badge enemy-tag">${game.enemy.type === 'boss' ? 'Boss' : 'Enemy'}</span>
        <span class="enemy-badge enemy-dmg">⚔ ${game.enemy.dmg}</span>
      </div>
      <div class="cluster cluster-mid">
        ${traitHtml || '<span class="enemy-badge empty">No traits</span>'}
      </div>
      <div class="cluster cluster-right">
        <span class="enemy-badge enemy-hp">&#9829; ${Math.max(0, game.enemy.hp)}</span>
      </div>
    </div>
    ${intentHtml}
    <div class="hp-bar"><span class="hp-fill" style="width:${hpPercent}%;"></span></div>
  `;
}

const DEFAULT_STORE_ROOMS = [6, 10];
const DEFAULT_ROOM_PLAN = [
  { start: 0, end: 2, pool: ['enemy', 'trap'] },
  { start: 3, end: 4, pool: ['enemy', 'enemyHeart'] },
  { start: 5, end: 5, pool: ['enemy'] },
  { start: 6, end: 8, pool: ['enemyHeart', 'enemyHeart', 'enemy'] },
  { start: 9, end: 9, pool: ['enemy'] },
  { start: 10, end: 10, pool: ['enemyHeart'] }
];
const KEEN_EDGE_COMBOS = new Set(['three', 'straight', 'flush', 'full', 'straightFlush', 'blackjack']);
const ECONOMY_MODES = {
  table: 'table',
  app: 'app'
};
const DEV_TWEAKS_VERSION = 4;
let economyMode = ECONOMY_MODES.table;
const COIN_REWARD_SCALE = 0.5;
const STORE_ITEMS = [
  {
    key: 'battleTonic',
    label: 'Battle Tonic',
    category: 'Boost',
    cost: 2,
    description: 'Hero draws 1 extra card next combat.',
    effect: () => {
      game.nextRoundExtraCards = Math.max(game.nextRoundExtraCards, 1);
      addLog('Battle Tonic acquired — next round draws +1 card.', 'badge-success');
    },
    requiresHero: false
  },
  {
    key: 'luckyFlip',
    label: 'Lucky Flip',
    category: 'Boost',
    cost: 2,
    description: 'Discard and redraw once before combat begins.',
    effect: () => {
      game.luckyFlipReady = true;
      game.luckyFlipUsedThisRoom = false;
      addLog('Lucky Flip ready — reset hero selections once before resolving combat.', 'badge-success');
      updateLuckyFlipButton();
    },
    requiresHero: false
  },
  {
    key: 'guardBrace',
    label: 'Guard Brace',
    category: 'Boost',
    cost: 2,
    description: 'Guard counts as one tier higher for the next round.',
    effect: () => {
      game.guardBraceActive = true;
      addLog('Guard Brace readied — next round Guard effects upgrade by one tier.', 'badge-success');
    },
    requiresHero: false
  },
  {
    key: 'minorHeal',
    label: 'Minor Heal',
    category: 'Healing',
    cost: 2,
    description: 'Restore 2 HP to a selected hero.',
    requiresHero: true,
    heroFilter: h => h.hp > 0 && h.hp < h.maxHp,
    effect: hero => {
      if (!hero) return;
      const before = hero.hp;
      hero.hp = Math.min(hero.maxHp, hero.hp + 2);
      addLog(`Minor Heal restores ${hero.hp - before} HP to Hero ${hero.id + 1}.`, 'badge-success');
      refreshUI();
    }
  },
  {
    key: 'groupRally',
    label: 'Group Rally',
    category: 'Healing',
    cost: 4,
    description: 'All heroes recover 1 HP.',
    effect: () => {
      aliveHeroes().forEach(h => {
        const hero = game.players[h.index];
        hero.hp = Math.min(hero.maxHp, hero.hp + 1);
      });
      addLog('Group Rally heals 1 HP to every living hero.', 'badge-success');
      refreshUI();
    },
    requiresHero: false
  },
  {
    key: 'lastChance',
    label: 'Last Chance Token',
    category: 'Healing',
    cost: 5,
    description: 'Prevent the next death, hero stays at 1 HP.',
    effect: () => {
      game.lastChanceTokens += 1;
      addLog('Last Chance Token stored — next fatal hit keeps a hero at 1 HP.', 'badge-success');
    },
    requiresHero: false
  },
  {
    key: 'sturdyFrame',
    label: 'Sturdy Frame',
    category: 'Upgrade',
    cost: 6,
    description: 'Permanently +1 Max HP to a hero (max ×2 per hero).',
    requiresHero: true,
    heroFilter: h => (h.sturdyFrames || 0) < 2,
    effect: hero => {
      if (!hero) return;
      hero.sturdyFrames = (hero.sturdyFrames || 0) + 1;
      hero.baseMaxHp += 1;
      hero.maxHp = adjustHeroMaxHp(hero.baseMaxHp, hero);
      hero.hp = Math.min(hero.hp + 1, hero.maxHp);
      addLog(`Sturdy Frame fitted to Hero ${hero.id + 1} (+1 Max HP).`, 'badge-success');
      refreshUI();
    }
  },
  {
    key: 'keenEdge',
    label: 'Keen Edge',
    category: 'Upgrade',
    cost: 5,
    description: 'Hero deals +1 damage on 3-of-a-kind+ combos.',
    requiresHero: true,
    heroFilter: h => !h.keenEdge,
    effect: hero => {
      if (!hero) return;
      hero.keenEdge = true;
      addLog(`Hero ${hero.id + 1} now wields a Keen Edge.`, 'badge-success');
    }
  },
  {
    key: 'gamblersGlint',
    label: 'Gambler\'s Glint',
    category: 'Upgrade',
    cost: 5,
    description: 'Once per room this hero gets a free Insight redraw.',
    requiresHero: true,
    heroFilter: h => !h.gamblersGlintPurchased,
    effect: hero => {
      if (!hero) return;
      hero.gamblersGlintPurchased = true;
      hero.gamblersGlintUsed = false;
      addLog(`Hero ${hero.id + 1} gains Gambler's Glint.`, 'badge-success');
    }
  }
];

    const DIFFICULTY_CONFIG = {
      normal: {
        heroHpDelta: 0,
        heroMinHp: 1,
        enemyDamageBonus: 0,
        bossHpMultiplier: 1,
        healReduction: 0,
        enemyHitChanceBonus: 0,
        disableHealingRooms: false
      },
      hard: {
        heroHpDelta: -2,
        heroMinHp: 8,
        enemyDamageBonus: 1,
        bossHpMultiplier: 1.2,
        healReduction: 1,
        enemyHitChanceBonus: 0,
        disableHealingRooms: false
      },
      dire: {
        heroHpDelta: -4,
        heroMinHp: 6,
        enemyDamageBonus: 2,
        bossHpMultiplier: 1,
        healReduction: 0,
        enemyHitChanceBonus: 0.1,
        disableHealingRooms: true
      }
    };
    const DIFFICULTY_LABELS = {
      normal: '⚔ Normal',
      hard: '⚠ Hard',
      dire: '☠ Dire'
    };
    let currentDifficulty = 'normal';
    let optionsLocked = false;
    let activeVariants = {
      spike: false,
      accelerated: false,
      ironSoul: false
    };
    const variantNames = {
      spike: 'Spike Rounds',
      accelerated: 'Accelerated Dungeon',
      ironSoul: 'Iron Soul Mode'
    };
    let heroSelections = {};
  let devRoomCount = DEFAULT_ROOM_COUNT;
  let devEnemyBaseDamage = 0;
  let devEnemyHitChance = 0;
  let devBossHpMultiplier = 1;
  let devHeroHpModifier = 0;
  let devRecoverStrength = 1;
  let devGuardEffectiveness = 1;
  let devLoreOverride = 0;
  let devInsightOverride = 0;
  let devShowInsightAnim = true;
  let devUnderdogThreshold = 10;
  let devForcedRoomType = 'auto';
  let devComboDamageCurve = 1;
  let devCoinGainMultiplier = 1;
  let devHandStackCap = MAX_HAND_STACK_FROM_ENEMY;
    let storeOpen = false;
    let storePendingAdvance = false;
    let pendingHeroPurchase = null;
    let storeDisabled = false;
    const variantInputMap = {
      variantSpike: 'spike',
      variantAccelerated: 'accelerated',
      variantIronSoul: 'ironSoul'
    };
    // Balance knobs
    const BASE_ENEMY_HP_MULT = 4;
    const BOSS_HP_MULT = 7;
    const NORMAL_DMG_BASE = 4;
    const BOSS_DMG_BASE = 7;
    const BASE_HIT_CHANCE = 0.7;
    const TRAP_BASE_HIT = 0.7;
    const TRAP_DMG_VALUES = [6,7];
    const ENRAGE_ACTIVE = true;
    const ENRAGE_MULTIPLIER = 1.25;
    const ENRAGE_TRAP_DAMAGE = 1;
    const ENRAGE_ELITE_ROOMS = [6, 7, 8];
    const ENRAGE_HIT_CHANCE_BONUS = 0.05;

    // --- DOM elements ----------------------------------------------------
    const numPlayersSelect = document.getElementById('numPlayers');
    const startBtn = document.getElementById('startBtn');
    const nextRoomBtn = document.getElementById('nextRoomBtn');
    const setupNote = document.getElementById('setupNote');

    const dungeonCard = document.getElementById('dungeonCard');
    const partyCard = document.getElementById('partyCard');
    const logCard = document.getElementById('logCard');
    const logToggleBtn = document.getElementById('logToggleBtn');

    const roomIndexEl = document.getElementById('roomIndex');
    const roomTotalEl = document.getElementById('roomTotal');
    const handBadgeEl = document.getElementById('handSizeBadge');
    const roomSummaryEl = document.getElementById('roomSummary');
    const roomEventEl = document.getElementById('roomEvent');
    const enemyPortraitEl = document.getElementById('enemyPortrait');
    const enemySummaryEl = document.getElementById('enemySummary');
    const difficultyDropdown = document.getElementById('difficultyDropdown');
    const difficultyToggle = document.getElementById('difficultyToggle');
    const playerDropdown = document.getElementById('playerDropdown');
    const playerToggle = document.getElementById('playerToggle');

    const playersContainer = document.getElementById('playersContainer');
    const confirmActionsContainer = document.getElementById('confirmActionsContainer');
    const confirmActionsBtn = document.getElementById('confirmActionsBtn');
    const chipBadge = document.getElementById('chipBadge');
    const useLuckyFlipBtn = document.getElementById('useLuckyFlipBtn');
    const logEl = document.getElementById('log');
    const clearLogBtn = document.getElementById('clearLogBtn');
    const storeModal = document.getElementById('storeModal');
    const storeItems = document.getElementById('storeItems');
    const storeCloseBtn = document.getElementById('storeCloseBtn');
    const storeChipCount = document.getElementById('storeChipCount');
    const storeHeroTargets = document.getElementById('storeHeroTargets');
    const devGiveChipsBtn = document.getElementById('devGiveChips');
    const devOpenStoreBtn = document.getElementById('devOpenStore');
    const devDisableStoreToggle = document.getElementById('devDisableStore');
    const devChipReadout = document.getElementById('devChipReadout');

    const boonOptions = document.getElementById('boonOptions');
    const boonOptionButtons = boonOptions ? Array.from(boonOptions.querySelectorAll('.boon-option')) : [];

    const rulesBtn = document.getElementById('rulesBtn');
    const rulesOverlay = document.getElementById('rulesOverlay');
    const closeRulesBtn = document.getElementById('closeRulesBtn');
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const menuPanel = document.getElementById('menuPanel');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const difficultyButtons = document.querySelectorAll('[data-difficulty]');
    const difficultyBadge = document.getElementById('difficultyBadge');
    const difficultyControls = document.getElementById('difficultyControls');
    const startOptions = document.getElementById('startOptions');
    const variantPanel = document.getElementById('variantPanel');
    const variantSpikeInput = document.getElementById('variantSpike');
    const variantAcceleratedInput = document.getElementById('variantAccelerated');
    const variantIronSoulInput = document.getElementById('variantIronSoul');
    const variantInputs = [variantSpikeInput, variantAcceleratedInput, variantIronSoulInput];
    const economyRadios = document.querySelectorAll('input[name="economyMode"]');
    const storeEconomyNote = document.getElementById('storeEconomyNote');
    const variantBadge = document.getElementById('variantBadge');
    const devToggle = document.getElementById('devToggle');
    const devPanel = document.getElementById('devPanel');
    const devNextRoomBtn = document.getElementById('devNextRoom');
    const devResolveAutoBtn = document.getElementById('devResolveAuto');
    const devKillEnemyBtn = document.getElementById('devKillEnemy');
    const devFullHealBtn = document.getElementById('devFullHeal');
    const devWoundBtn = document.getElementById('devWoundParty');
    const devClearSaveBtn = document.getElementById('devClearSave');
    const devHeroStats = document.getElementById('devHeroStats');
    const devDifficultyInfo = document.getElementById('devDifficultyInfo');
    const devVariantInfo = document.getElementById('devVariantInfo');
    const devForceNormal = document.getElementById('devForceNormal');
    const devForceHard = document.getElementById('devForceHard');
    const devForceDire = document.getElementById('devForceDire');
    const devDungeonInfo = document.getElementById('devDungeonInfo');
    const devRerollBtn = document.getElementById('devRerollDungeon');
    const devQuickSimBtn = document.getElementById('devQuickSim');
    const devCopySettingsBtn = document.getElementById('devCopySettings');
    const devResetSettingsBtn = document.getElementById('devResetSettings');
    const devSimResult = document.getElementById('devSimResult');
    const devRoomCountInput = document.getElementById('devRoomCount');
    const devEnemyDamageInput = document.getElementById('devEnemyDamage');
    const devEnemyHitInput = document.getElementById('devEnemyHit');
    const devBossHpInput = document.getElementById('devBossHpMult');
    const devHeroHpInput = document.getElementById('devHeroHpMod');
    const devRecoverInput = document.getElementById('devRecoverStrength');
    const devGuardInput = document.getElementById('devGuardEffectiveness');
    const devComboCurveInput = document.getElementById('devComboCurve');
    const devCoinGainMultiplierInput = document.getElementById('devCoinGainMultiplier');
    const devHandStackCapInput = document.getElementById('devHandStackCap');
    const devLoreOverrideInput = document.getElementById('devLoreOverride');
    const devInsightOverrideInput = document.getElementById('devInsightOverride');
    const devInsightAnimToggle = document.getElementById('devInsightAnimToggle');
    const devUnderdogInput = document.getElementById('devUnderdogThreshold');
    const devForceRoomTypeInput = document.getElementById('devForceRoomType');
    const devTweaksInfo = document.getElementById('devTweaksInfo');
    const runOverlay = document.getElementById('runOverlay');
    const runOverlayTitle = document.getElementById('runOverlayTitle');
    const runOverlayMessage = document.getElementById('runOverlayMessage');
    const runOverlayButton = document.getElementById('runOverlayButton');

    // Rules overlay behaviour
    rulesBtn.addEventListener('click', () => {
      rulesOverlay.classList.add('active');
      toggleMenu(false);
    });
    closeRulesBtn.addEventListener('click', () => {
      rulesOverlay.classList.remove('active');
    });
    rulesOverlay.addEventListener('click', (e) => {
      if (e.target === rulesOverlay) {
        rulesOverlay.classList.remove('active');
      }
    });

    function toggleMenu(force) {
      if (!menuPanel) return;
      const show = typeof force === 'boolean' ? force : !menuPanel.classList.contains('active');
      if (!show && menuPanel.contains(document.activeElement)) {
        if (menuToggleBtn) menuToggleBtn.focus();
        else document.activeElement.blur();
      }
      menuPanel.classList.toggle('active', show);
      menuPanel.setAttribute('aria-hidden', (!show).toString());
      if (!show) {
        menuPanel.setAttribute('inert', '');
        toggleDevPanel(false);
      } else {
        menuPanel.removeAttribute('inert');
        const firstFocusable = menuPanel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
      }
      if (menuToggleBtn) {
        menuToggleBtn.setAttribute('aria-expanded', show.toString());
      }
    }

    function showRunOverlay(type, message) {
      if (!runOverlay) return;
      runOverlayTitle && (runOverlayTitle.textContent = type === 'victory' ? 'Victory!' : 'Game Over');
      runOverlayMessage && (runOverlayMessage.textContent = message);
      runOverlay.classList.toggle('victory', type === 'victory');
      runOverlay.classList.toggle('gameover', type === 'gameover');
      runOverlay.classList.add('active');
      runOverlay.setAttribute('aria-hidden', 'false');
    }

    function hideRunOverlay() {
      if (!runOverlay) return;
      runOverlay.classList.remove('active', 'victory', 'gameover');
      runOverlay.setAttribute('aria-hidden', 'true');
    }

    menuToggleBtn?.addEventListener('click', () => toggleMenu());
    closeMenuBtn?.addEventListener('click', () => toggleMenu(false));
    menuPanel?.addEventListener('click', (e) => {
      if (e.target === menuPanel) {
        toggleMenu(false);
      }
    });

    if (logToggleBtn && logCard) {
      logToggleBtn.addEventListener('click', () => {
        if (window.innerWidth > 900) {
          logCard.classList.toggle('hidden');
        } else {
          logCard.classList.toggle('visible');
        }
      });
      updateConfirmButtonState();
    }

    function updateStartDropdownLabel() {}

    function setRoomEventMessage(text) {
      game.roomEventMessage = text || '';
      if (!roomEventEl) return;
      roomEventEl.textContent = game.roomEventMessage;
      roomEventEl.classList.toggle('visible', Boolean(game.roomEventMessage));
      if (game.roomEventMessage) {
        roomEventEl.classList.remove('highlight');
        // force reflow to restart animation
        void roomEventEl.offsetWidth;
        roomEventEl.classList.add('highlight');
        setTimeout(() => roomEventEl?.classList.remove('highlight'), 850);
      }
    }

    // Trap state (simplified to final number display only)
    let trapState = null;

    function initTrapState(tn) {
      trapState = { tn, final: null };
    }

    function clearTrapPanel() {
      trapState = null;
      setRoomEventMessage('');
    }

    function refreshEnemyPortraitPool() {
      enemyPortraitPool = [...ENEMY_PORTRAITS, ...GENERATED_BULK_PORTRAITS];
    }

    function removePortraitFromPool(path) {
      enemyPortraitPool = enemyPortraitPool.filter(p => p !== path);
    }

    function pickEnemyPortrait() {
      if (enemyPortraitPool.length === 0) {
        refreshEnemyPortraitPool();
      }
      if (!enemyPortraitPool.length) return null;
      const index = Math.floor(Math.random() * enemyPortraitPool.length);
      return enemyPortraitPool[index];
    }

    function bossPortraitForIndex(roomIndex) {
      if (!BOSS_PORTRAITS.length) return null;
      const idx = Math.max(0, Math.min(BOSS_PORTRAITS.length - 1, roomIndex % BOSS_PORTRAITS.length));
      return BOSS_PORTRAITS[idx];
    }

    function setEnemyPortrait(src, label = '') {
      const portrait = document.getElementById('enemyPortrait');
      if (!portrait) return;
      portrait.onerror = null;
      const currentSrc = portrait.dataset.currentEnemySrc || '';
      if (!src) {
        portrait.classList.add('hidden');
        portrait.removeAttribute('src');
        portrait.removeAttribute('alt');
        portrait.dataset.currentEnemySrc = '';
        return;
      }
      if (currentSrc === src && portrait.dataset.enemyLabel === label) {
        return;
      }
      portrait.alt = label || 'Enemy portrait';
      portrait.classList.remove('hidden');
      portrait.dataset.enemyLabel = label || 'Enemy portrait';
      portrait.onerror = () => {
        removePortraitFromPool(src);
        const next = pickEnemyPortrait();
        if (next && next !== src) {
          portrait.dataset.currentEnemySrc = '';
          portrait.src = next;
        } else {
          portrait.removeAttribute('src');
          portrait.classList.add('hidden');
          portrait.dataset.currentEnemySrc = '';
        }
      };
      portrait.dataset.currentEnemySrc = src;
      portrait.src = src;
    }

    function getHeroSelection(idx) {
      if (!heroSelections[idx]) {
        heroSelections[idx] = { action: '', combo: '' };
      }
      return heroSelections[idx];
    }

    function updateHeroSelection(idx, key, value) {
      const sel = getHeroSelection(idx);
      sel[key] = value;
    }

    function resetHeroSelections() {
      heroSelections = {};
      aliveHeroes().forEach(h => {
        const actionSel = document.getElementById(`hero-${h.index}-action-${h.index}`);
        const comboSel = document.getElementById(`hero-${h.index}-combo-${h.index}`);
        if (actionSel) actionSel.value = '';
        if (comboSel) comboSel.value = '';
      });
      updateConfirmButtonState();
    }

    function heroSelectionsReady() {
      return aliveHeroes().every(h => {
        const sel = heroSelections[h.index];
        return sel && sel.action && sel.combo;
      });
    }

    const HERO_DIFFICULTY_TIERS = ['easy', 'normal', 'hard'];
    const HERO_DIFFICULTY_LABELS = {
      easy: '★ Easy',
      normal: '★★ Normal',
      hard: '★★★ Hard'
    };

    function heroDifficultyTier(hero) {
      return hero?.difficultyTier && HERO_DIFFICULTY_TIERS.includes(hero.difficultyTier)
        ? hero.difficultyTier
        : 'normal';
    }

    function adjustHeroMaxHp(baseHp, hero) {
      const tier = heroDifficultyTier(hero);
      if (tier === 'easy') return Math.max(1, Math.ceil(baseHp * 1.2));
      if (tier === 'hard') return Math.max(1, Math.floor(baseHp * 0.85));
      return Math.max(1, baseHp);
    }

    function adjustIncomingDamage(hero, amount) {
      const tier = heroDifficultyTier(hero);
      if (tier === 'easy') return Math.floor(amount * 0.8);
      if (tier === 'hard') return Math.ceil(amount * 1.2);
      return amount;
    }

    function adjustLoreForInsight(hero, lore) {
      if (heroDifficultyTier(hero) === 'hard') {
        return Math.max(0, lore - 1);
      }
      return lore;
    }

    function setHeroDifficulty(idx, tier) {
      const hero = game.players[idx];
      if (!hero) return;
      hero.difficultyTier = tier;
      if (hero.baseMaxHp) {
        hero.maxHp = adjustHeroMaxHp(hero.baseMaxHp, hero);
        hero.hp = Math.min(hero.hp, hero.maxHp);
      }
      renderPlayers();
      saveRunState();
    }

    const ACTION_EFFECT_CLASSES = {
      attack: 'action-attack',
      guard: 'action-guard',
      recover: 'action-recover',
      hold: 'action-hold'
    };
    const ENEMY_HIT_CLASS = 'enemy-hit';

    function applyTemporaryBodyClass(cls, duration = 900) {
      document.body.classList.add(cls);
      setTimeout(() => document.body.classList.remove(cls), duration);
    }

    function triggerActionEffects() {
      const actions = Object.values(heroSelections)
        .map(sel => sel.action)
        .filter(Boolean);
      const unique = [...new Set(actions)];
      unique.forEach(action => {
        const cls = ACTION_EFFECT_CLASSES[action];
        if (cls) applyTemporaryBodyClass(cls);
      });
    }

    function triggerEnemyHitEffect() {
      applyTemporaryBodyClass(ENEMY_HIT_CLASS, 600);
    }

    function wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    function saveRunState() {
      if (game.roomIndex < 0 || game.dungeonRooms.length === 0) {
        localStorage.removeItem(SAVE_KEY);
        return;
      }
      const payload = {
        players: game.players,
        dungeonDeck: game.dungeonDeck,
        dungeonRooms: game.dungeonRooms,
        roomIndex: game.roomIndex,
        enemy: game.enemy,
        handBonusReady: game.handBonusReady,
        handBonusActive: game.handBonusActive,
        partyChips: game.partyChips,
        lastChanceTokens: game.lastChanceTokens,
        nextRoundExtraCards: game.nextRoundExtraCards,
        currentRoundExtraCards: game.currentRoundExtraCards,
        handSizePenalty: game.handSizePenalty,
        handSizeStack: clampHandSizeStack(game.handSizeStack),
        guardBraceActive: game.guardBraceActive,
        luckyFlipReady: game.luckyFlipReady,
        luckyFlipUsedThisRoom: game.luckyFlipUsedThisRoom,
        roomDamageTaken: game.roomDamageTaken,
        roomStyleReward: game.roomStyleReward,
        roomStyleCombo: game.roomStyleCombo,
        lastRewardedRoomIndex: game.lastRewardedRoomIndex,
        heroSelections,
        currentDifficulty,
        activeVariants,
        over: game.over,
        storeDisabled,
        economyMode
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    }

    function clearSavedRun() {
      localStorage.removeItem(SAVE_KEY);
    }

    function loadSavedRun() {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      try {
        const payload = JSON.parse(raw);
        if (!payload || !Array.isArray(payload.players)) return false;
        game.players = payload.players.map(p => ({
          ...p,
          sturdyFrames: p.sturdyFrames || 0,
          keenEdge: p.keenEdge || false,
          gamblersGlintPurchased: p.gamblersGlintPurchased || false,
          gamblersGlintUsed: p.gamblersGlintUsed || false,
          coins: typeof p.coins === 'number' ? p.coins : HERO_STARTING_COINS
        }));
        game.dungeonDeck = Array.isArray(payload.dungeonDeck) ? payload.dungeonDeck : shuffle(makeDeck());
        game.dungeonRooms = Array.isArray(payload.dungeonRooms) ? payload.dungeonRooms : [];
        game.roomIndex = typeof payload.roomIndex === 'number' ? payload.roomIndex : -1;
        game.enemy = payload.enemy || null;
        game.handBonusReady = Boolean(payload.handBonusReady);
        game.handBonusActive = Boolean(payload.handBonusActive);
        game.partyChips = typeof payload.partyChips === 'number' ? payload.partyChips : game.partyChips;
        game.lastChanceTokens = typeof payload.lastChanceTokens === 'number' ? payload.lastChanceTokens : 0;
        game.nextRoundExtraCards = typeof payload.nextRoundExtraCards === 'number' ? payload.nextRoundExtraCards : 0;
        game.currentRoundExtraCards = typeof payload.currentRoundExtraCards === 'number' ? payload.currentRoundExtraCards : 0;
        game.handSizePenalty = typeof payload.handSizePenalty === 'number' ? payload.handSizePenalty : 0;
        game.handSizeStack = clampHandSizeStack(
          typeof payload.handSizeStack === 'number' ? payload.handSizeStack : 0
        );
        game.guardBraceActive = Boolean(payload.guardBraceActive);
        game.luckyFlipReady = Boolean(payload.luckyFlipReady);
        game.luckyFlipUsedThisRoom = Boolean(payload.luckyFlipUsedThisRoom);
        game.roomDamageTaken = Boolean(payload.roomDamageTaken);
        game.roomStyleReward = typeof payload.roomStyleReward === 'number' ? payload.roomStyleReward : 0;
        game.roomStyleCombo = payload.roomStyleCombo || '';
        game.lastRewardedRoomIndex = typeof payload.lastRewardedRoomIndex === 'number' ? payload.lastRewardedRoomIndex : -1;
        storeDisabled = typeof payload.storeDisabled === 'boolean' ? payload.storeDisabled : storeDisabled;
        if (payload.economyMode && Object.values(ECONOMY_MODES).includes(payload.economyMode)) {
          economyMode = payload.economyMode;
        }
        heroSelections = payload.heroSelections || {};
        currentDifficulty = payload.currentDifficulty || currentDifficulty;
        activeVariants = payload.activeVariants || activeVariants;
        game.over = Boolean(payload.over);
        storeOpen = false;
        storePendingAdvance = false;
        resetStoreSelection();
        if (storeModal) {
          storeModal.classList.remove('visible');
          storeModal.setAttribute('aria-hidden', 'true');
        }
        setEconomyMode(economyMode);
        return game.roomIndex >= 0;
      } catch {
        return false;
      }
    }
    function currentRoomDisplayType() {
      if (game.roomIndex < 0 || game.roomIndex >= game.dungeonRooms.length) return null;
      const card = game.dungeonRooms[game.roomIndex];
      if (!card) return null;
      const isLast = game.roomIndex === game.dungeonRooms.length - 1;
      return displayTypeFor(getRoomType(card, isLast));
    }

    function updateConfirmButtonState() {
      if (!confirmActionsBtn) return;
      const displayType = currentRoomDisplayType();
      const isCombat = displayType === 'enemy' || displayType === 'boss';
      const ready = isCombat && heroSelectionsReady() && !game.over && Boolean(game.enemy);
      confirmActionsBtn.disabled = !ready;
      if (confirmActionsContainer) {
        confirmActionsContainer.classList.toggle('visible', isCombat);
      }
    }

    function showBoonOptions(show) {
      if (!boonOptions) return;
      boonOptions.classList.toggle('active', show);
      boonOptions.setAttribute('aria-hidden', (!show).toString());
      boonOptionButtons.forEach(btn => {
        btn.disabled = !show;
      });
      updateConfirmButtonState();
    }

    function handleBoonChoice(effect) {
      if (!effect) return;
      showBoonOptions(false);
      applyBoonEffect(effect);
      refreshUI();
      saveRunState();
    }

    function applyBoonEffect(effect) {
      const living = aliveHeroes();
      switch (effect) {
        case 'stat': {
          if (!living.length) {
            addLog('Boon fades; no heroes remain to receive it.', 'badge-danger');
            return;
          }
          const targetIndex = living[Math.floor(Math.random() * living.length)].index;
          const hero = game.players[targetIndex];
          const statKey = BOON_STAT_KEYS[Math.floor(Math.random() * BOON_STAT_KEYS.length)];
          hero[statKey] += 1;
          addLog(
            `Boon blesses Hero ${targetIndex + 1}: ${BOON_STAT_LABELS[statKey]} +1 (now ${hero[statKey]}).`,
            'badge-success'
          );
          setRoomEventMessage(`Boon: Hero ${targetIndex + 1} +1 ${BOON_STAT_LABELS[statKey]}`);
          break;
        }
        case 'heal': {
          if (!living.length) {
            addLog('Boon attempts to heal, but no heroes remain.', 'badge-danger');
            return;
          }
          living.forEach(({ index }) => {
            const hero = game.players[index];
            const healAmount = Math.min(2, hero.maxHp - hero.hp);
            hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);
          });
          addLog('Boon restores 2 HP to every living hero.', 'badge-success');
          setRoomEventMessage('Boon: Every hero healed +2 HP');
          break;
        }
        case 'bonus':
          if (!game.handBonusReady) {
            game.handBonusReady = true;
            addLog('Boon grants +1 bonus card for the next hand.', 'badge-success');
            setRoomEventMessage('Boon: +1 bonus card queued for the next draw');
          } else {
            addLog('Boon attempts to grant a bonus card, but one is already queued.', 'small');
          }
          break;
        case 'empower':
          game.boonEmpowerNextRound = true;
          addLog('Boon empowers the next Attack or Guard one tier.', 'badge-success');
          setRoomEventMessage('Boon: Next Attack or Guard empowered');
          break;
        default:
          break;
      }
    }

    boonOptionButtons.forEach(btn => {
      btn.addEventListener('click', () => handleBoonChoice(btn.dataset.effect));
    });
    showBoonOptions(false);

    function setDifficulty(mode) {
      currentDifficulty = mode;
      difficultyButtons.forEach(btn => {
        if (btn.dataset.difficulty === mode) btn.classList.add('active');
        else btn.classList.remove('active');
      });
      if (!optionsLocked && difficultyBadge) {
        difficultyBadge.classList.remove('visible');
      }
      updateStartDropdownLabel();
    }

    function updateStartDropdownLabel() {}

    function updateVariantState() {
      activeVariants = {
        spike: variantSpikeInput.checked,
        accelerated: variantAcceleratedInput.checked,
        ironSoul: variantIronSoulInput.checked
      };
    }

    function getActiveVariantLabels() {
      const checkList = optionsLocked ? activeVariants : variantInputs.reduce((acc, input) => {
        if (variantInputMap[input.id]) {
          acc[variantInputMap[input.id]] = input.checked;
        }
        return acc;
      }, {});
      return Object.entries(checkList)
        .filter(([, on]) => on)
        .map(([key]) => variantNames[key]);
    }

    function updateVariantBadge() {
      if (!variantBadge) return;
      const activeLabels = getActiveVariantLabels();
      variantBadge.textContent = activeLabels.length
        ? `Variants: ${activeLabels.join(', ')}`
        : 'Variants: None';
      refreshDevPanel();
    }

    function readNumberInput(input, fallback) {
      if (!input) return fallback;
      const val = parseFloat(input.value);
      return Number.isFinite(val) ? val : fallback;
    }

    function updateDevOverrides() {
      devRoomCount = Math.max(1, Math.round(readNumberInput(devRoomCountInput, devRoomCount)));
      devEnemyBaseDamage = readNumberInput(devEnemyDamageInput, devEnemyBaseDamage);
      devEnemyHitChance = readNumberInput(devEnemyHitInput, devEnemyHitChance);
      devBossHpMultiplier = Math.max(0.1, readNumberInput(devBossHpInput, devBossHpMultiplier));
      devHeroHpModifier = readNumberInput(devHeroHpInput, devHeroHpModifier);
      devRecoverStrength = Math.max(0.1, readNumberInput(devRecoverInput, devRecoverStrength));
      devGuardEffectiveness = Math.max(0.1, readNumberInput(devGuardInput, devGuardEffectiveness));
      devComboDamageCurve = Math.max(0.1, readNumberInput(devComboCurveInput, devComboDamageCurve));
      devCoinGainMultiplier = Math.max(0, readNumberInput(devCoinGainMultiplierInput, devCoinGainMultiplier));
      devHandStackCap = Math.max(0, Math.round(readNumberInput(devHandStackCapInput, devHandStackCap)));
      devLoreOverride = Math.max(0, Math.round(readNumberInput(devLoreOverrideInput, devLoreOverride)));
      devInsightOverride = Math.max(0, Math.round(readNumberInput(devInsightOverrideInput, devInsightOverride)));
      devShowInsightAnim = devInsightAnimToggle ? devInsightAnimToggle.checked : true;
      devUnderdogThreshold = Math.max(1, Math.round(readNumberInput(devUnderdogInput, devUnderdogThreshold)));
      devForcedRoomType = devForceRoomTypeInput ? devForceRoomTypeInput.value : devForcedRoomType;
      game.handSizeStack = clampHandSizeStack(game.handSizeStack);
      updateLeverDisplays();
      refreshDevPanel();
      applyDevTweaksToCurrentEnemy();
      saveDevTweaks();
      resetRoundInsights();
      refreshUI();
    }

    function applyDevTweaksToCurrentEnemy() {
      if (!game.enemy || game.roomIndex < 0 || game.roomIndex >= game.dungeonRooms.length) return;
      const cfg = DIFFICULTY_CONFIG[currentDifficulty];
      const type = game.enemy.type;
      const card = game.dungeonRooms[game.roomIndex];
      const enrageMultiplier = ENRAGE_ACTIVE ? ENRAGE_MULTIPLIER : 1;
      const isEnrageElite = ENRAGE_ACTIVE && ENRAGE_ELITE_ROOMS.includes(game.roomIndex);
      const mult = type === 'boss' ? BOSS_HP_MULT : BASE_ENEMY_HP_MULT;
      const bossHpMult = type === 'boss' ? cfg.bossHpMultiplier * devBossHpMultiplier : 1;
      const depthBonus = Math.floor(game.roomIndex / 2);
      const base = (type === 'boss' ? BOSS_DMG_BASE : NORMAL_DMG_BASE) + cfg.enemyDamageBonus + devEnemyBaseDamage;
      const dmg = Math.max(0, Math.round((base + depthBonus) * enrageMultiplier));
      const hp = Math.round(card.value * mult * bossHpMult * (isEnrageElite ? 1.3 : 1) * enrageMultiplier);
      game.enemy.dmg = dmg;
      game.enemy.maxHp = hp;
      game.enemy.hp = Math.min(game.enemy.hp, hp);
    }

    function updateLeverDisplays() {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setVal('devRoomCountVal', devRoomCount);
      setVal('devEnemyDamageVal', devEnemyBaseDamage);
      setVal('devEnemyHitVal', devEnemyHitChance.toFixed(2));
      setVal('devBossHpMultVal', devBossHpMultiplier.toFixed(2));
      setVal('devHeroHpModVal', devHeroHpModifier);
      setVal('devRecoverStrengthVal', devRecoverStrength.toFixed(2));
      setVal('devGuardEffectivenessVal', devGuardEffectiveness.toFixed(2));
      setVal('devComboCurveVal', devComboDamageCurve.toFixed(2));
      setVal('devCoinGainMultiplierVal', devCoinGainMultiplier.toFixed(2));
      setVal('devHandStackCapVal', `+${devHandStackCap} → ${BASE_HAND_SIZE + devHandStackCap} cards`);
      setVal('devUnderdogThresholdVal', devUnderdogThreshold);
      setVal('devLoreOverrideVal', devLoreOverride > 0 ? devLoreOverride : 'auto');
      setVal('devInsightOverrideVal', devInsightOverride > 0 ? devInsightOverride : 'auto');
    }

    function saveDevTweaks() {
      const data = {
        devRoomCount,
        devEnemyBaseDamage,
        devEnemyHitChance,
        devBossHpMultiplier,
        devHeroHpModifier,
        devRecoverStrength,
        devGuardEffectiveness,
        devComboDamageCurve,
        devCoinGainMultiplier,
        devHandStackCap,
        devLoreOverride,
        devInsightOverride,
        devShowInsightAnim,
        devUnderdogThreshold,
        devForcedRoomType,
        devTweaksVersion: DEV_TWEAKS_VERSION
      };
      try {
        localStorage.setItem('devTweaks', JSON.stringify(data));
      } catch (e) {
        console.warn('Unable to save dev tweaks', e);
      }
    }

    function resetDevTweaks() {
      devRoomCount = DEFAULT_ROOM_COUNT;
      devEnemyBaseDamage = 0;
      devEnemyHitChance = 0;
      devBossHpMultiplier = 1;
      devHeroHpModifier = 0;
      devRecoverStrength = 1;
      devGuardEffectiveness = 1;
      devComboDamageCurve = 1;
      devCoinGainMultiplier = 1;
      devHandStackCap = MAX_HAND_STACK_FROM_ENEMY;
      devLoreOverride = 0;
      devInsightOverride = 0;
      devShowInsightAnim = true;
      devUnderdogThreshold = 10;
      devForcedRoomType = 'auto';
      if (devRoomCountInput) devRoomCountInput.value = devRoomCount;
      if (devEnemyDamageInput) devEnemyDamageInput.value = devEnemyBaseDamage;
      if (devEnemyHitInput) devEnemyHitInput.value = devEnemyHitChance;
      if (devBossHpInput) devBossHpInput.value = devBossHpMultiplier;
      if (devHeroHpInput) devHeroHpInput.value = devHeroHpModifier;
      if (devRecoverInput) devRecoverInput.value = devRecoverStrength;
      if (devGuardInput) devGuardInput.value = devGuardEffectiveness;
      if (devComboCurveInput) devComboCurveInput.value = devComboDamageCurve;
      if (devCoinGainMultiplierInput) devCoinGainMultiplierInput.value = devCoinGainMultiplier;
      if (devHandStackCapInput) devHandStackCapInput.value = devHandStackCap;
      if (devLoreOverrideInput) devLoreOverrideInput.value = '';
      if (devInsightOverrideInput) devInsightOverrideInput.value = '';
      if (devInsightAnimToggle) devInsightAnimToggle.checked = true;
      if (devUnderdogInput) devUnderdogInput.value = devUnderdogThreshold;
      if (devForceRoomTypeInput) devForceRoomTypeInput.value = 'auto';
      updateDevOverrides();
      saveDevTweaks();
      addLog('Dev tweaks reset to defaults.', 'small');
    }

    function loadDevTweaks() {
      let saved = null;
      try {
        const raw = localStorage.getItem('devTweaks');
        if (raw) saved = JSON.parse(raw);
      } catch (e) {
        console.warn('Unable to load dev tweaks', e);
      }
      if (!saved) return;
      let upgraded = false;
      if (!saved.devTweaksVersion || saved.devTweaksVersion < DEV_TWEAKS_VERSION) {
        saved.devRoomCount = DEFAULT_ROOM_COUNT;
        saved.devTweaksVersion = DEV_TWEAKS_VERSION;
        upgraded = true;
      }
      if (saved.devHandStackCap === undefined || saved.devHandStackCap === null) {
        saved.devHandStackCap = MAX_HAND_STACK_FROM_ENEMY;
      }
      if (saved.devCoinGainMultiplier === undefined || saved.devCoinGainMultiplier === null) {
        saved.devCoinGainMultiplier = 1;
      }
      if (upgraded) {
        try {
          localStorage.setItem('devTweaks', JSON.stringify(saved));
        } catch (e) {
          console.warn('Unable to persist upgraded dev tweaks', e);
        }
      }
      const assignVal = (input, key) => {
        if (!input || saved[key] === undefined || saved[key] === null) return;
        input.value = saved[key];
      };
      assignVal(devRoomCountInput, 'devRoomCount');
      assignVal(devEnemyDamageInput, 'devEnemyBaseDamage');
      assignVal(devEnemyHitInput, 'devEnemyHitChance');
      assignVal(devBossHpInput, 'devBossHpMultiplier');
      assignVal(devHeroHpInput, 'devHeroHpModifier');
      assignVal(devRecoverInput, 'devRecoverStrength');
      assignVal(devGuardInput, 'devGuardEffectiveness');
      assignVal(devComboCurveInput, 'devComboDamageCurve');
      assignVal(devCoinGainMultiplierInput, 'devCoinGainMultiplier');
      assignVal(devHandStackCapInput, 'devHandStackCap');
      assignVal(devUnderdogInput, 'devUnderdogThreshold');
      if (devLoreOverrideInput && typeof saved.devLoreOverride === 'number') {
        devLoreOverrideInput.value = saved.devLoreOverride;
      }
      if (devInsightOverrideInput && typeof saved.devInsightOverride === 'number') {
        devInsightOverrideInput.value = saved.devInsightOverride;
      }
      if (devInsightAnimToggle && typeof saved.devShowInsightAnim === 'boolean') {
        devInsightAnimToggle.checked = saved.devShowInsightAnim;
      }
      if (devForceRoomTypeInput && saved.devForcedRoomType) {
        devForceRoomTypeInput.value = saved.devForcedRoomType;
      }
    }

    function lockRunOptions() {
      optionsLocked = true;
      toggleMenu(false);
      if (difficultyControls) difficultyControls.style.display = 'none';
      if (variantPanel) variantPanel.style.display = 'none';
      if (startOptions) startOptions.style.display = 'none';
      variantInputs.forEach(input => { if (input) input.disabled = true; });
      if (difficultyBadge) {
        difficultyBadge.classList.add('visible');
        difficultyBadge.textContent = DIFFICULTY_LABELS[currentDifficulty];
      }
      updateVariantBadge();
      saveDevTweaks();
    }

    function unlockRunOptions() {
      optionsLocked = false;
      if (difficultyControls) difficultyControls.style.display = '';
      if (variantPanel) variantPanel.style.display = '';
      if (startOptions) startOptions.style.display = 'flex';
      variantInputs.forEach(input => { if (input) input.disabled = false; });
      if (difficultyBadge) difficultyBadge.classList.remove('visible');
      updateVariantBadge();
    }

    loadDevTweaks();
    updateLeverDisplays();

    difficultyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (optionsLocked) return;
        setDifficulty(btn.dataset.difficulty);
      });
    });
    setDifficulty(currentDifficulty);
    variantInputs.forEach(input => {
      input.addEventListener('change', () => {
        updateVariantBadge();
      });
    });
    economyRadios.forEach(radio => {
      if (!radio) return;
      radio.addEventListener('change', () => setEconomyMode(radio.value));
    });
    setEconomyMode(economyMode);
    [
      devRoomCountInput,
      devEnemyDamageInput,
      devEnemyHitInput,
      devBossHpInput,
      devHeroHpInput,
      devRecoverInput,
      devGuardInput,
      devComboCurveInput,
      devCoinGainMultiplierInput,
      devHandStackCapInput,
      devLoreOverrideInput,
      devInsightOverrideInput,
      devUnderdogInput,
      devForceRoomTypeInput
    ].forEach(input => {
      if (input) {
        input.addEventListener('input', updateDevOverrides);
      }
    });
    if (devInsightAnimToggle) {
      devInsightAnimToggle.addEventListener('change', updateDevOverrides);
    }
    runOverlayButton?.addEventListener('click', () => {
      hideRunOverlay();
      startRun();
    });
    updateDevOverrides();
    updateVariantBadge();
    const resumedRun = loadSavedRun();
    if (resumedRun) {
      addLog('Resumed saved run from disk.', 'badge-success');
      refreshUI();
    }
    renderChipBadge();
    updateLuckyFlipButton();
    renderStoreItems();

    // --- Logging ---------------------------------------------------------
    function addLog(msg, cssClass = '') {
      const entry = document.createElement('div');
      entry.className = 'log-entry ' + cssClass;
      const ts = new Date().toLocaleTimeString();
      entry.innerHTML = `<span class="ts">[${ts}]</span> ${msg}`;
      logEl.prepend(entry);
    }

    function clearLog() {
      logEl.innerHTML = '';
    }

    clearLogBtn.addEventListener('click', clearLog);

    // --- Rendering -------------------------------------------------------
    function isAppEconomy() {
      return economyMode === ECONOMY_MODES.app;
    }

    function renderPlayers() {
      playersContainer.innerHTML = '';
      game.players.forEach((p, idx) => {
        const div = document.createElement('div');
        div.id = `hero-${idx}-card`;

        let focusKey = 'balanced';
        if (p.might >= p.agility && p.might >= p.lore) {
          focusKey = 'might';
        } else if (p.agility >= p.might && p.agility >= p.lore) {
          focusKey = 'agility';
        } else if (p.lore >= p.might && p.lore >= p.agility) {
          focusKey = 'lore';
        }

        const underdogBadge = p.underdog ? '<span class="tag-pill underdog">Underdog</span>' : '';

        const tier = heroDifficultyTier(p);
        div.className = `player-card focus-${focusKey}`;
        div.innerHTML = `
          <div class="hero-header">
            <span class="hero-label">Hero ${idx + 1}</span>
            <span class="hero-role-icon">${FOCUS_ROLE_ICONS[focusKey] || '✦'}</span>
          </div>
          <div class="hero-stat-row">
            <div class="stat-pill hp-pill">
              <span class="icon">❤</span>
              <span class="value">${p.hp}</span>
            </div>
            <div class="stat-pill coin-pill hero-coin-stat hidden" id="hero-${idx}-coin">
              <span class="icon"><i class="bi bi-database-fill"></i></span>
              <span class="value coin-value">${p.coins || 0}</span>
            </div>
            <button type="button" class="stat-pill insight-pill" id="hero-${idx}-insight-btn">
              <span class="icon"><i class="bi bi-lightbulb"></i></span>
              <span class="value insight-value">${p.insightPoints || 0}</span>
              <span class="sr-only">Use Insight for Hero ${idx + 1}</span>
            </button>
          </div>
          <div class="hero-stats-compact">
            <span><i class="bi bi-shield-fill-check"></i> ${p.might}</span>
            <span><i class="bi bi-speedometer2"></i> ${p.agility}</span>
            <span><i class="bi bi-stars"></i> ${p.lore}</span>
          </div>
          <div class="hero-controls-row hero-actions" id="hero-${idx}-actions" aria-live="polite"></div>
        `;
        playersContainer.appendChild(div);
        const insightBtn = div.querySelector(`#hero-${idx}-insight-btn`);
        if (insightBtn) {
          insightBtn.addEventListener('click', () => useInsight(idx));
        }
        renderInsightState(idx);
        renderHeroCoinState(idx);
      });
    updateConfirmButtonState();
  }

    function renderChipBadge() {
      if (!chipBadge) return;
      const countEl = chipBadge.querySelector('.chip-count');
      if (isAppEconomy()) {
        chipBadge.classList.add('hidden');
      } else {
        chipBadge.classList.remove('hidden');
        if (countEl) {
          countEl.textContent = `${game.partyChips}`;
        }
      }
    if (storeChipCount) {
      storeChipCount.textContent = isAppEconomy()
        ? 'App economy: hero badges show coins.'
        : `Table chips: ${game.partyChips}`;
    }
  }

  function setEconomyMode(mode) {
    if (!Object.values(ECONOMY_MODES).includes(mode)) return;
    economyMode = mode;
    if (economyRadios && economyRadios.length) {
      economyRadios.forEach(radio => {
        if (radio) radio.checked = radio.value === mode;
      });
    }
    renderPlayers();
    renderHeroCoins();
    renderChipBadge();
    renderStoreItems();
    renderStoreHeroTargets();
    updateStoreEconomyNote();
  }

  function updateStoreEconomyNote() {
    if (!storeEconomyNote) return;
    storeEconomyNote.textContent = isAppEconomy()
      ? 'App Coin Tracker: hero badges show balances and the app auto-deducts.'
      : 'Poker Chips at Table: track rewards/costs here while handling physical chips yourself.';
  }

  function updateDevChipReadout() {
    if (!devChipReadout) return;
    devChipReadout.textContent = `Party Chips: ${game.partyChips}`;
  }

  function addChips(amount, context) {
    if (amount <= 0) return;
    game.partyChips += amount;
    renderChipBadge();
    updateDevChipReadout();
    renderStoreItems();
    addLog(`+${amount} chips${context ? ` (${context})` : ''}.`, 'badge-success');
    saveRunState();
  }

  function spendChips(amount, context) {
    if (amount <= 0) return true;
    if (game.partyChips < amount) {
      addLog(`Not enough chips for ${context || 'that purchase'}.`, 'badge-danger');
      return false;
    }
    game.partyChips -= amount;
    renderChipBadge();
    updateDevChipReadout();
    renderStoreItems();
    addLog(`-${amount} chips${context ? ` (${context})` : ''}.`, 'badge-danger');
    saveRunState();
    return true;
  }

  function addHeroCoins(idx, amount, context) {
    if (amount <= 0) return;
    const hero = game.players[idx];
    if (!hero) return;
    const scaled = Math.max(0, Math.round(amount * COIN_REWARD_SCALE * devCoinGainMultiplier));
    if (scaled <= 0) return;
    hero.coins = (hero.coins || 0) + scaled;
    renderHeroCoinState(idx);
    addLog(`Hero ${idx + 1} gains +${scaled} coins${context ? ` (${context})` : ''}.`, 'badge-success');
    saveRunState();
  }

  function spendHeroCoins(idx, amount, context) {
    if (amount <= 0) return true;
    const hero = game.players[idx];
    if (!hero) return false;
    if ((hero.coins || 0) < amount) {
      addLog(`Hero ${idx + 1} lacks ${amount} coins for ${context || 'this purchase'}.`, 'badge-danger');
      return false;
    }
    hero.coins -= amount;
    renderHeroCoinState(idx);
    addLog(`Hero ${idx + 1} spends -${amount} coins${context ? ` (${context})` : ''}.`, 'badge-danger');
    saveRunState();
    return true;
  }

  function awardCoins(amount, context) {
    if (amount <= 0) return;
    if (isAppEconomy()) {
      aliveHeroes().forEach(hero => addHeroCoins(hero.index, amount, context));
    } else {
      addChips(amount, context);
    }
  }

    function renderInsightState(idx) {
      const hero = game.players[idx];
      if (!hero) return;
      const insightBtn = document.getElementById(`hero-${idx}-insight-btn`);
      if (!insightBtn) return;
      const valueEl = insightBtn.querySelector('.insight-value');
      if (valueEl) {
        valueEl.textContent = hero.insightPoints || 0;
      }
      const hasPoints = (hero.insightPoints || 0) > 0;
      const hasGlint = hero.gamblersGlintPurchased && !hero.gamblersGlintUsed;
      insightBtn.disabled = hero.hp <= 0 || !(hasPoints || hasGlint);
      const label = hasPoints
        ? `Use Insight for Hero ${idx + 1}`
        : hasGlint
          ? `Use Gambler's Glint for Hero ${idx + 1}`
          : `Hero ${idx + 1} has no Insight`;
      insightBtn.setAttribute('aria-label', label);
    }

    function updateLuckyFlipButton() {
      if (!useLuckyFlipBtn) return;
      const show = game.luckyFlipReady && !game.luckyFlipUsedThisRoom;
      useLuckyFlipBtn.hidden = !show;
      useLuckyFlipBtn.disabled = !show;
    }

    function useLuckyFlip() {
      if (!game.luckyFlipReady || game.luckyFlipUsedThisRoom) return;
      resetHeroSelections();
      game.luckyFlipUsedThisRoom = true;
      game.luckyFlipReady = false;
      addLog('Lucky Flip used — discard and redraw selections.', 'badge-success');
      updateLuckyFlipButton();
    }

    function recordStyleCombo(comboKey) {
      const style = STYLE_REWARD_MAP[comboKey];
      if (!style) return;
      if (style.value > game.roomStyleReward) {
        game.roomStyleReward = style.value;
        game.roomStyleCombo = style.label;
      }
    }

    function hasAvailableHero(item) {
      if (!item.requiresHero && !isAppEconomy()) return true;
      return game.players.some(hero => {
        if (hero.hp <= 0) return false;
        if (item.heroFilter && !item.heroFilter(hero)) return false;
        if (isAppEconomy() && (!hero.coins || hero.coins < item.cost)) return false;
        return true;
      });
    }

    function renderStoreItems() {
      if (!storeItems) return;
      storeItems.innerHTML = '';
      updateStoreEconomyNote();
      STORE_ITEMS.forEach(item => {
        const card = document.createElement('div');
        card.className = 'store-item';

        const cost = document.createElement('strong');
        cost.textContent = `${item.cost} Chips`;

        const tag = document.createElement('span');
        tag.textContent = item.category;
        tag.style.opacity = '0.7';
        tag.style.fontSize = '0.65rem';
        tag.style.letterSpacing = '0.2em';
        tag.style.textTransform = 'uppercase';

        const description = document.createElement('p');
        description.textContent = item.description;

        const button = document.createElement('button');
        button.textContent = item.label;
        const affordable = isAppEconomy()
          ? hasAvailableHero(item)
          : item.cost <= game.partyChips && (!item.requiresHero || hasAvailableHero(item));
        button.disabled = !affordable;
        button.addEventListener('click', () => handleStoreItemClick(item));

        card.appendChild(cost);
        card.appendChild(tag);
        card.appendChild(description);
        card.appendChild(button);
        storeItems.appendChild(card);
      });
    }

    function renderStoreHeroTargets() {
      if (!storeHeroTargets) return;
      storeHeroTargets.innerHTML = '';
      if (!pendingHeroPurchase) {
        storeHeroTargets.classList.add('hidden');
        return;
      }
      const prompt = document.createElement('span');
      prompt.textContent = `Select hero for ${pendingHeroPurchase.label}`;
      storeHeroTargets.appendChild(prompt);

      game.players.forEach(hero => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'store-target';
        const coinInfo = isAppEconomy() ? ` • 🪙 ${hero.coins || 0}` : '';
        btn.textContent = `Hero ${hero.id + 1} • ${hero.hp}/${hero.maxHp} HP${coinInfo}`;
        const eligible = hero.hp > 0 &&
          (!pendingHeroPurchase.heroFilter || pendingHeroPurchase.heroFilter(hero)) &&
          (!isAppEconomy() || (hero.coins || 0) >= pendingHeroPurchase.cost);
        btn.disabled = !eligible;
        btn.addEventListener('click', () => applyStoreItemEffect(pendingHeroPurchase, hero.id));
        storeHeroTargets.appendChild(btn);
      });

      storeHeroTargets.classList.remove('hidden');
    }

    function resetStoreSelection() {
      pendingHeroPurchase = null;
      if (storeHeroTargets) {
        storeHeroTargets.classList.add('hidden');
        storeHeroTargets.innerHTML = '';
      }
    }

    function handleStoreItemClick(item) {
      const needsHeroSelection = isAppEconomy() || item.requiresHero;
      if (needsHeroSelection) {
        if (!hasAvailableHero(item)) {
          addLog(`No eligible hero for ${item.label}.`, 'badge-danger');
          return;
        }
        pendingHeroPurchase = item;
        renderStoreHeroTargets();
        return;
      }
      applyStoreItemEffect(item);
    }

    function applyStoreItemEffect(item, heroIdx) {
      if (isAppEconomy()) {
        if (typeof heroIdx !== 'number') {
          addLog('Select a hero to pay for that item.', 'badge-danger');
          return;
        }
        if (!spendHeroCoins(heroIdx, item.cost, item.label)) {
          return;
        }
      } else {
        if (!spendChips(item.cost, item.label)) {
          return;
        }
      }
      const hero = typeof heroIdx === 'number' ? game.players[heroIdx] : undefined;
      item.effect(hero);
      resetStoreSelection();
      renderStoreItems();
      renderChipBadge();
      renderHeroCoins();
      if (isAppEconomy()) {
        if (hero) {
          addLog(
            `Hero ${hero.id + 1} purchases ${item.label} for ${item.cost} coins (remaining ${hero.coins || 0}).`,
            'badge-success'
          );
        }
      } else {
        addLog(`Purchased ${item.label} for ${item.cost} chips (pool now ${game.partyChips}).`, 'badge-success');
      }
    }

    function clearStoreModalFocus() {
      if (!storeModal) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && storeModal.contains(active)) {
        active.blur();
      }
    }

    function openStore(autoAdvance = false) {
      if (storeDisabled || storeOpen || !storeModal) return;
      storeOpen = true;
      storePendingAdvance = autoAdvance;
      storeModal.classList.add('visible');
      storeModal.removeAttribute('aria-hidden');
      renderStoreItems();
      resetStoreSelection();
      renderStoreHeroTargets();
      renderChipBadge();
    }

    function closeStore() {
      if (!storeOpen || !storeModal) return;
      storeOpen = false;
      storeModal.classList.remove('visible');
      clearStoreModalFocus();
      storeModal.setAttribute('aria-hidden', 'true');
      resetStoreSelection();
      if (storePendingAdvance) {
        storePendingAdvance = false;
        if (!game.over && game.roomIndex + 1 < game.dungeonRooms.length) {
          goToNextRoom();
        }
      }
    }

    function shouldOpenStoreAfterRoom() {
      if (storeDisabled) return false;
      const total = game.dungeonRooms.length;
      if (total <= 0) return false;
      const finishedIndex = game.roomIndex;
      const finishedNumber = finishedIndex + 1;
      const plannedStores = DEFAULT_STORE_ROOMS.filter(n => n <= total);
      if (plannedStores.includes(finishedNumber)) return true;
      if (!plannedStores.length && finishedIndex === total - 2 && total > 1) return true;
      return false;
    }

    function prepareRoomTracking() {
      game.roomDamageTaken = false;
      game.roomStyleReward = 0;
      game.roomStyleCombo = '';
      game.currentRoundExtraCards = 0;
      game.lastRewardedRoomIndex = -1;
      game.luckyFlipUsedThisRoom = false;
      game.players.forEach(hero => {
        hero.gamblersGlintUsed = false;
      });
      updateLuckyFlipButton();
    }

    function setDungeonBackground(image) {
      if (!dungeonCard) return;
      const gradient = 'linear-gradient(145deg, rgba(14, 16, 32, 0.96), rgba(8, 10, 22, 0.96))';
      const urlPart = image ? `, url("${image}")` : '';
      dungeonCard.style.setProperty('--room-bg', `${gradient}${urlPart}`);
    }

    function setCombatMode(active) {
      document.body.classList.toggle('combat-active', active);
    }

    function getHeroLoreForInsight(hero) {
      const baseLore = devLoreOverride > 0 ? devLoreOverride : hero.lore;
      return adjustLoreForInsight(hero, baseLore);
    }

    function computeRoundInsight(hero) {
      if (!hero || hero.hp <= 0) return 0;
      if (devInsightOverride > 0) return devInsightOverride;
      return Math.max(0, Math.floor(getHeroLoreForInsight(hero) / 2));
    }

    function clampHandSizeStack(value) {
      const cap = Number.isFinite(devHandStackCap) ? devHandStackCap : MAX_HAND_STACK_FROM_ENEMY;
      return Math.max(0, Math.min(cap, value || 0));
    }

    function resetRoundInsights() {
      game.players.forEach(hero => {
        if (!hero) return;
        hero.insightPoints = computeRoundInsight(hero);
      });
    }

    function getHandSizeTotals() {
      const activeExtra = game.handBonusActive ? 1 : 0;
      const queuedExtra = game.handBonusReady && !game.handBonusActive ? 1 : 0;
      const storeExtra = game.currentRoundExtraCards || 0;
      const penalty = game.handSizePenalty || 0;
      const stackExtra = clampHandSizeStack(game.handSizeStack);
      const baseTotal = Math.max(
        1,
        BASE_HAND_SIZE + stackExtra + activeExtra + storeExtra - penalty
      );
      const displayTotal = baseTotal + queuedExtra;
      return {
        baseTotal,
        displayTotal,
        queuedExtra,
        storeExtra,
        penalty,
        activeExtra,
        stackExtra
      };
    }

    function renderHandBadge() {
      if (!handBadgeEl) return;
      const { displayTotal, queuedExtra, storeExtra, penalty, stackExtra } = getHandSizeTotals();
      const queuedHint = queuedExtra ? ' (bonus queued)' : '';
      const storeHint = storeExtra ? ` (+${storeExtra})` : '';
      const penaltyHint = penalty ? ` (-${penalty})` : '';
      const stackHint = stackExtra ? ` (+${stackExtra} stacked)` : '';
      handBadgeEl.textContent = `🂡 ${displayTotal}${stackHint}${queuedHint}${storeHint}${penaltyHint}`;
    }

    function activateHandBonusForCombat() {
      const hadReady = game.handBonusReady;
      if (game.handBonusReady) {
        game.handBonusActive = true;
        game.handBonusReady = false;
        const { baseTotal } = getHandSizeTotals();
        addLog(`Stacked hand size active — draw ${baseTotal} cards this round.`, 'badge-success');
      } else {
        game.handBonusActive = false;
      }
      const stackExtra = clampHandSizeStack(game.handSizeStack);
      if (stackExtra > 0 && !hadReady) {
        const { baseTotal } = getHandSizeTotals();
        addLog(
          `Stacked hand size active — draw ${baseTotal} cards this round (${stackExtra} stacked).`,
          'badge-success'
        );
      }
    }

    function renderRoom() {
      const total = game.dungeonRooms.length;
      if (roomTotalEl) {
        roomTotalEl.textContent = total;
      }
      if (roomIndexEl) {
        roomIndexEl.textContent = game.roomIndex >= 0 ? (game.roomIndex + 1) : 0;
      }

      if (game.roomIndex < 0 || game.roomIndex >= total) {
        if (roomSummaryEl) {
          roomSummaryEl.textContent = 'Awaiting the first draw.';
        }
        enemySummaryEl.textContent = '';
        setEnemyPortrait(null);
        setCombatMode(false);
        return;
      }

      const card = game.dungeonRooms[game.roomIndex];
      const isLast = (game.roomIndex === total - 1);
      const type = getRoomType(card, isLast);
      let displayType = type === 'boon' && currentDifficulty === 'dire' ? 'enemy' : type;
      if (type === 'enemyHeart') displayType = 'enemy';

      const suitNotes = {
        enemy: '♠ Spades — Standard Enemies (goblins, skeletons, beasts)',
        enemyHeart: '♥ Hearts — Elite / Trick Enemies (weird effects, disruption)',
        trap: '♣ Clubs — Traps / Hazards',
        treasure: '♦ Diamonds — Treasure & rewards',
        boon: 'Boon Room'
      };

      if (roomSummaryEl) {
        roomSummaryEl.innerHTML = `
        <div class="badge-row" style="align-items:center;gap:8px;flex-wrap:wrap;">
          <strong>Card:</strong> <span>${cardLabel(card)}</span>
          <span class="badge-pill">${roomTypeLabel(type)}</span>
        </div>
        <div class="muted" style="margin-top:4px;">${suitNotes[type] || ''}</div>
      `;
      }

      const trapNumber = type === 'trap' ? card.value + Math.floor(game.roomIndex / 2) : null;
      if (type === 'trap') {
        setDungeonBackground(TRAP_BG_IMAGE);
      }
      if (displayType === 'enemy' || displayType === 'boss') {
        clearTrapPanel();
        const shell = document.querySelector('.enemy-portrait-shell');
        if (shell) {
          // Ensure trap/room icons are replaced with the combat portrait when entering an enemy room.
          const hasPortrait = shell.querySelector('#enemyPortrait');
          if (!hasPortrait) {
            shell.innerHTML = `<img id="enemyPortrait" class="enemy-portrait" alt="" />`;
          }
        }
        if (!game.enemy) {
          const mult = displayType === 'boss' ? BOSS_HP_MULT : BASE_ENEMY_HP_MULT;
          const hp = card.value * mult;
          const depthBonus = Math.floor(game.roomIndex / 2);
          const base = displayType === 'boss' ? BOSS_DMG_BASE : NORMAL_DMG_BASE;
          const dmg = base + depthBonus;
          const portrait = displayType === 'boss'
            ? bossPortraitForIndex(game.roomIndex)
            : pickEnemyPortrait();
          const profile = chooseEnemyProfile(card, displayType, game.roomIndex);
          game.enemy = { hp, maxHp: hp, dmg, type: displayType, portrait, profile };
          activateHandBonusForCombat();
          setEnemyIntent(game.enemy, true);
          logTraitLegend(game.enemy.profile);
          setDungeonBackground(game.enemy.portrait);
        }
        updateEnemySummaryDisplay();
        setEnemyPortrait(game.enemy.portrait, game.enemy.type === 'boss' ? 'Boss portrait' : 'Enemy portrait');
        setCombatMode(true);
        renderActionSelectors();
      } else {
        // Non-combat rooms: show a simple icon instead of an enemy portrait.
        enemySummaryEl.innerHTML = `
          <div class="badge-row">
            <span class="badge-pill">${roomTypeLabel(type)}</span>
          </div>
        `;
        setEnemyPortrait(null);
        const shell = document.querySelector('.enemy-portrait-shell');
        if (shell) {
          const iconContent = type === 'trap'
            ? `<div class="trap-frame">
                 <img class="trap-portrait-full" src="objects/trap.png" alt="Trap" />
                 <span class="trap-number trap-number-frame">${trapNumber ?? '—'}</span>
               </div>`
            : `<div class="room-icon">${type === 'boon' ? '♥' : type === 'treasure' ? '♦' : '🜏'}</div>`;
          shell.innerHTML = iconContent;
        }
        setCombatMode(false);
        game.handBonusActive = false;
        if (type === 'trap') {
          const tn = trapNumber ?? (card.value + Math.floor(game.roomIndex / 2));
          initTrapState(tn);
          const hasInlineTrapControls = roomEventEl && roomEventEl.querySelector('.trap-pass');
          if (!hasInlineTrapControls) {
            setRoomEventMessage(`Trap TN ${tn} — play cards to beat or match`);
          }
        } else {
          clearTrapPanel();
        }
      }
      // Preserve inline trap controls if present; otherwise update the room event message normally.
      if (trapState && roomEventEl && roomEventEl.querySelector('.trap-pass')) {
        roomEventEl.classList.add('visible');
      } else {
        setRoomEventMessage(game.roomEventMessage);
      }
      const showBoon = type === 'boon' && currentDifficulty !== 'dire';
      showBoonOptions(showBoon);
    }

    function actionOptionsHtml(idPrefix, idx) {
      const recoverDisabledAttr = activeVariants.ironSoul ? ' disabled' : '';
      return `
        <select id="${idPrefix}-action-${idx}" class="hero-select" aria-label="Hero action choice">
          <option value="" selected disabled>Choose action</option>
          <option value="attack">Attack</option>
          <option value="recover"${recoverDisabledAttr}>Recover</option>
          <option value="guard">Guard</option>
          <option value="revive"${recoverDisabledAttr}>Revive</option>
          <option value="hold">Hold</option>
        </select>
      `;
    }

    function comboOptionsHtml(idPrefix, idx) {
      return `
        <select id="${idPrefix}-combo-${idx}" class="hero-select" aria-label="Hero hand choice">
          <option value="" selected disabled>Choose hand</option>
          <option value="none">None</option>
          <option value="high">High Card</option>
          <option value="pair">Pair</option>
          <option value="twoPair">Two Pair</option>
          <option value="three">Trips</option>
          <option value="straight">Straight</option>
          <option value="flush">Flush</option>
          <option value="full">Full House</option>
          <option value="straightFlush">Straight Flush</option>
          <option value="blackjack">Blackjack 21</option>
        </select>
      `;
    }

    function renderActionSelectors() {
      game.players.forEach((p, idx) => {
        const actionShell = document.getElementById(`hero-${idx}-actions`);
        if (!actionShell) return;
        actionShell.innerHTML = '';
        if (p.hp <= 0) return;

        const baseId = `hero-${idx}`;
        const rerollButtonHtml = p.underdog
          ? `<button type="button" class="ghost reroll-btn" data-hero="${idx}" ${p.underdogRerollUsed ? 'disabled' : ''}>Scrappy</button>`
          : '';
        actionShell.innerHTML = `
          ${actionOptionsHtml(baseId, idx)}
          ${comboOptionsHtml(baseId, idx)}
          ${rerollButtonHtml}
        `;
        const rerollBtn = actionShell.querySelector('.reroll-btn');
        if (rerollBtn) {
          rerollBtn.addEventListener('click', handleUnderdogReroll);
        }
        const actionSel = actionShell.querySelector(`#${baseId}-action-${idx}`);
        const comboSel = actionShell.querySelector(`#${baseId}-combo-${idx}`);
        if (actionSel) {
          actionSel.value = getHeroSelection(idx).action || '';
          actionSel.addEventListener('change', () => {
            updateHeroSelection(idx, 'action', actionSel.value);
            updateConfirmButtonState();
          });
        }
        if (comboSel) {
          comboSel.value = getHeroSelection(idx).combo || '';
          comboSel.addEventListener('change', () => {
            updateHeroSelection(idx, 'combo', comboSel.value);
            updateConfirmButtonState();
          });
        }
      });
      updateConfirmButtonState();
    }

    function renderHeroCoinState(idx) {
      const hero = game.players[idx];
      if (!hero) return;
      const coinEl = document.getElementById(`hero-${idx}-coin`);
      if (!coinEl) return;
      const valueEl = coinEl.querySelector('.coin-value');
      if (valueEl) {
        valueEl.textContent = hero.coins || 0;
      }
      const shouldShow = isAppEconomy() && hero.hp > 0;
      coinEl.classList.toggle('hidden', !shouldShow);
    }

    function renderHeroCoins() {
      game.players.forEach((_, idx) => renderHeroCoinState(idx));
    }

    function useInsight(idx) {
      const hero = game.players[idx];
      if (!hero || hero.hp <= 0) {
        addLog(`Hero ${idx + 1} can't use Insight while down.`, 'badge-danger');
        return;
      }
      const hasPoints = (hero.insightPoints || 0) > 0;
      const canUseGlint = hero.gamblersGlintPurchased && !hero.gamblersGlintUsed;
      if (!hasPoints && !canUseGlint) {
        addLog(`Hero ${idx + 1} has no Insight to spend.`, 'small');
        return;
      }
      const comboSel = document.getElementById(`hero-${idx}-combo-${idx}`);
      const choice = COMBO_KEYS[Math.floor(Math.random() * COMBO_KEYS.length)];
      if (comboSel) {
        comboSel.value = choice;
        updateHeroSelection(idx, 'combo', choice);
      }

      let sourceLabel = 'Insight';
      if (hasPoints) {
        hero.insightPoints -= 1;
      } else {
        hero.gamblersGlintUsed = true;
        sourceLabel = "Gambler's Glint";
      }

      addLog(`Hero ${idx + 1} spends ${sourceLabel} to redraw → ${choice}.`, 'badge-success');
      renderInsightState(idx);
      updateConfirmButtonState();
      if (devShowInsightAnim) {
        const heroCard = document.getElementById(`hero-${idx}-card`);
        if (heroCard) {
          heroCard.classList.add('insight-pulse');
          setTimeout(() => heroCard.classList.remove('insight-pulse'), 750);
        }
      }
    }

    function downHeroes() {
      return game.players
        .map((p, idx) => ({ hero: p, index: idx }))
        .filter(entry => entry.hero.hp <= 0);
    }

    function refreshUI() {
      renderPlayers();
      renderRoom();
      renderHandBadge();
      renderChipBadge();
      dungeonCard.style.display = '';
      partyCard.style.display = '';
      logCard.style.display = '';
      refreshDevPanel();
      updateConfirmButtonState();
    }

    // --- Utility ---------------------------------------------------------
    function aliveHeroes() {
      return game.players
        .map((p, idx) => ({ ...p, index: idx }))
        .filter(p => p.hp > 0);
    }

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

    function damageHero(idx, amount, sourceLabel = 'hit') {
      const p = game.players[idx];
      if (p.hp <= 0) return;

      const adjusted = Math.max(0, adjustIncomingDamage(p, amount));
      if (adjusted === 0) {
        addLog(`Hero ${idx + 1} would take ${amount} from ${sourceLabel}, but difficulty reduces it to 0.`, 'small');
        return;
      }

      game.roomDamageTaken = true;
      p.hp = Math.max(0, p.hp - adjusted);
      addLog(`Hero ${idx + 1} takes ${adjusted} damage (${sourceLabel}). HP now ${p.hp}.`, 'badge-danger');

    if (p.hp <= 0 && game.lastChanceTokens > 0) {
      game.lastChanceTokens -= 1;
      p.hp = 1;
      addLog(`Last Chance Token keeps Hero ${idx + 1} at 1 HP.`, 'badge-success');
    } else if (p.hp <= 0) {
      const remaining = aliveHeroes();
      if (remaining.length === 0) {
        addLog(`Hero ${idx + 1} has fallen. The run is over.`, 'badge-danger');
        game.over = true;
        unlockRunOptions();
        showRunOverlay('gameover', 'All heroes have fallen. The run is over.');
      } else {
        addLog(`Hero ${idx + 1} has fallen. Remaining heroes carry on.`, 'badge-danger');
      }
    }
      saveRunState();
    }

    function handleUnderdogReroll(event) {
      const idx = parseInt(event.currentTarget.dataset.hero, 10);
      const hero = game.players[idx];
      if (!hero || hero.underdogRerollUsed) return;
      const comboSel = document.getElementById(`hero-${idx}-combo-${idx}`);
      if (!comboSel) return;
      const validOptions = Array.from(comboSel.options)
        .map(opt => opt.value)
        .filter(val => val !== 'none');
      if (validOptions.length === 0) return;
      const choice = validOptions[Math.floor(Math.random() * validOptions.length)];
      comboSel.value = choice;
      updateHeroSelection(idx, 'combo', choice);
      hero.underdogRerollUsed = true;
      event.currentTarget.disabled = true;
      addLog(`Hero ${idx + 1} uses Underdog reroll → ${choice}.`, 'badge-success');
      updateConfirmButtonState();
    }

    function loreModifier(lore) {
      if (lore <= 7) return 1;
      if (lore <= 10) return 2;
      if (lore <= 13) return 3;
      return 4;
    }

    function pickRoomTypeFromPool(pool) {
      if (!Array.isArray(pool) || pool.length === 0) return null;
      const idx = Math.floor(Math.random() * pool.length);
      return pool[idx];
    }

    function plannedRoomTypeForIndex(idx, total) {
      const plan = DEFAULT_ROOM_PLAN.find(entry => idx >= entry.start && idx <= entry.end && idx < total);
      if (!plan) return null;
      return pickRoomTypeFromPool(plan.pool);
    }

    function suitForRoomType(type) {
      switch (type) {
        case 'enemy': return '♠';
        case 'enemyHeart': return '♥';
        case 'trap': return '♣';
        case 'treasure': return '♦';
        default: return null;
      }
    }

    function buildDungeonRooms(deck, roomCount) {
      const rooms = [];
      for (let i = 0; i < roomCount; i++) {
        const card = drawCard(deck);
        const plannedType = plannedRoomTypeForIndex(i, roomCount);
        if (plannedType) {
          const plannedSuit = suitForRoomType(plannedType);
          const plannedCard = { ...card, roomType: plannedType };
          if (plannedSuit) plannedCard.suit = plannedSuit;
          rooms.push(plannedCard);
        } else {
          rooms.push(card);
        }
      }
      return rooms;
    }

    // --- Start game ------------------------------------------------------
    function startRun() {
      hideRunOverlay();
      const n = parseInt(numPlayersSelect.value, 10) || 1;
      updateVariantState();
      lockRunOptions();
      const cfg = DIFFICULTY_CONFIG[currentDifficulty];
      game.numPlayers = n;
      game.players = [];
      game.dungeonDeck = shuffle(makeDeck());
      game.dungeonRooms = [];
      game.roomIndex = -1;
      game.enemy = null;
      game.handBonusReady = false;
      game.handBonusActive = false;
      game.over = false;
      heroSelections = {};
      storeDisabled = devDisableStoreToggle ? devDisableStoreToggle.checked : storeDisabled;
      storeOpen = false;
      storePendingAdvance = false;
      resetStoreSelection();
      if (storeModal) {
        storeModal.classList.remove('visible');
        storeModal.setAttribute('aria-hidden', 'true');
      }
      game.partyChips = 5;
      game.lastChanceTokens = 0;
      game.nextRoundExtraCards = 0;
      game.currentRoundExtraCards = 0;
      game.handSizePenalty = 0;
      game.guardBraceActive = false;
      game.luckyFlipReady = false;
      game.luckyFlipUsedThisRoom = false;
      game.roomDamageTaken = false;
      game.roomStyleReward = 0;
      game.roomStyleCombo = '';
      game.lastRewardedRoomIndex = -1;
      game.handSizeStack = 0;
      renderChipBadge();
      updateDevChipReadout();
      updateLuckyFlipButton();

      clearLog();
      setRoomEventMessage('');

      const statDeck = shuffle(makeDeck());
      for (let i = 0; i < n; i++) {
        const mightCard = statDeck.pop();
        const agiCard = statDeck.pop();
        const loreCard = statDeck.pop();

        let maxHp = 16;
        const mVal = mightCard.value;
        const aVal = agiCard.value;
        const lVal = loreCard.value;
        if (mVal >= aVal && mVal >= lVal) maxHp = 18;
        else if (lVal >= mVal && lVal >= aVal) maxHp = 14;

        const heroBaseHp = Math.max(cfg.heroMinHp, maxHp + cfg.heroHpDelta + devHeroHpModifier);
        const hero = {
          id: i,
          baseMaxHp: heroBaseHp,
          difficultyTier: 'normal',
          maxHp: heroBaseHp,
          hp: heroBaseHp,
          might: mVal,
          agility: aVal,
          lore: lVal,
          ritualUsed: false,
          underdog: Math.max(mVal, aVal, lVal) < devUnderdogThreshold,
          underdogRerollUsed: false,
          sturdyFrames: 0,
          keenEdge: false,
          gamblersGlintPurchased: false,
          gamblersGlintUsed: false,
          coins: HERO_STARTING_COINS
        };
        hero.maxHp = adjustHeroMaxHp(heroBaseHp, hero);
        hero.hp = hero.maxHp;
        game.players.push(hero);
        addLog(
          `Hero ${i + 1} created – Might: ${mVal}, Agility: ${aVal}, Lore: ${lVal}, HP: ${hero.maxHp}.`
        );
      }

      const roomCount = Math.max(1, Math.round(devRoomCount));
      game.dungeonRooms = buildDungeonRooms(game.dungeonDeck, roomCount);

      const activeVariantList = Object.entries(activeVariants)
        .filter(([, on]) => on)
        .map(([key]) => variantNames[key]);
      const variantLabel = activeVariantList.length ? activeVariantList.join(', ') : 'None';
      setupNote.textContent =
        `Run started with ${n} hero(s). Difficulty: ${DIFFICULTY_LABELS[currentDifficulty]}. Variants: ${variantLabel}.`;

      addLog('New run started. First room is drawn automatically.', 'badge-success');

        goToNextRoom();
    }

    function startRunWithDefaultsIfNeeded() {
      const notStarted = game.roomIndex < 0 && game.dungeonRooms.length === 0 && !optionsLocked;
      if (!notStarted) return false;
      if (numPlayersSelect) numPlayersSelect.value = '2';
      setDifficulty('normal');
      startRun();
      return true;
    }

    startBtn.addEventListener('click', startRun);

    // --- Room resolution -------------------------------------------------
    function goToNextRoom() {
      startRunWithDefaultsIfNeeded();
      saveRunState();
      if (game.over) {
        addLog('Run is already over. Start a new run.', 'badge-danger');
        return;
      }
      if (game.roomIndex + 1 >= game.dungeonRooms.length) {
        addLog('No more rooms. The dungeon is cleared!', 'badge-success');
        return;
      }

      game.players.forEach(h => {
        h.ritualUsed = false;
        h.underdogRerollUsed = false;
      });

      game.roomIndex += 1;
      game.enemy = null;
      prepareRoomTracking();
      resetRoundInsights();
      setRoomEventMessage('');
      resetHeroSelections();
      prepareRoomTracking();

      const card = game.dungeonRooms[game.roomIndex];
      const isLast = (game.roomIndex === game.dungeonRooms.length - 1);
      const type = getRoomType(card, isLast);
      const displayType = displayTypeFor(type);

      addLog(`Entering Room ${game.roomIndex + 1}: ${cardLabel(card)} (${roomTypeLabel(type)}).`);
      if (type === 'boon' && currentDifficulty === 'dire') {
        addLog('Dire difficulty turns this room into combat.', 'badge-danger');
      } else if (displayType === 'enemy' || displayType === 'boss') {
      addLog('Select actions and poker hands for each alive hero to resolve combat.', 'small');
      }
      refreshUI();
      // Always attempt a resolve after entering a room; non-combat/non-trap will auto-advance.
      void resolveRoomOrRound();
    }

    if (nextRoomBtn) nextRoomBtn.addEventListener('click', goToNextRoom);
    if (confirmActionsBtn) {
      confirmActionsBtn.addEventListener('click', () => {
        if (!heroSelectionsReady()) return;
        triggerActionEffects();
        void resolveRoomOrRound({ forceCombat: true });
      });
    }
    if (useLuckyFlipBtn) {
      useLuckyFlipBtn.addEventListener('click', useLuckyFlip);
    }

    async function resolveRoomOrRound({ forceCombat = false } = {}) {
      try {
        startRunWithDefaultsIfNeeded();
        if (game.over) {
          addLog('Run is already over. Start a new run.', 'badge-danger');
          return;
        }
        if (game.roomIndex < 0 || game.roomIndex >= game.dungeonRooms.length) {
          addLog('No active room yet. Tap “Next Room” first.', 'badge-danger');
          return;
        }

        const card = game.dungeonRooms[game.roomIndex];
        const isLast = (game.roomIndex === game.dungeonRooms.length - 1);
        const type = getRoomType(card, isLast);
        const displayType = displayTypeFor(type);

        if (displayType === 'enemy' || displayType === 'boss') {
          if (forceCombat) {
            await resolveCombatRound(displayType);
          } else {
            addLog('Select actions and hands for each alive hero to resolve combat.', 'small');
          }
        } else if (type === 'trap') {
          resolveTrapRoom();
        } else if (type === 'boon') {
          if (currentDifficulty !== 'dire') {
            addLog('Boon Room opens — choose a blessing from the panel.', 'badge-success');
            showBoonOptions(true);
          }
        } else if (type === 'treasure') {
          resolveTreasureRoom();
        }

        refreshUI();

      if (displayType !== 'enemy' && displayType !== 'boss' && type !== 'trap' && !game.over) {
        if (handlePostRoomCompletion(type)) {
          if (game.roomIndex + 1 < game.dungeonRooms.length) {
            goToNextRoom();
          } else {
            addLog('No more rooms. The dungeon is cleared!', 'badge-success');
          }
        }
      }

        if (game.over) {
          if (nextRoomBtn) nextRoomBtn.disabled = true;
          addLog('Run ended. Tap “Start Run” to play again.', 'badge-danger');
          unlockRunOptions();
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (devToggle) {
      devToggle.addEventListener('click', () => toggleDevPanel());
      document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'd' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
          toggleDevPanel();
        }
      });
    }
    if (devNextRoomBtn) devNextRoomBtn.addEventListener('click', devSkipToNextRoom);
    if (devResolveAutoBtn) devResolveAutoBtn.addEventListener('click', devResolveCombatAuto);
    if (devKillEnemyBtn) devKillEnemyBtn.addEventListener('click', devKillEnemy);
    if (devFullHealBtn) devFullHealBtn.addEventListener('click', devFullHealParty);
    if (devWoundBtn) devWoundBtn.addEventListener('click', devWoundParty);
    if (devClearSaveBtn) {
      devClearSaveBtn.addEventListener('click', () => {
        clearSavedRun();
        addLog('Saved run cleared.', 'small');
      });
    }
    if (devGiveChipsBtn) {
      devGiveChipsBtn.addEventListener('click', () => awardCoins(5, 'Dev grant'));
    }
    if (devOpenStoreBtn) {
      devOpenStoreBtn.addEventListener('click', () => openStore(false));
    }
    if (devDisableStoreToggle) {
      devDisableStoreToggle.addEventListener('change', () => {
        storeDisabled = devDisableStoreToggle.checked;
        addLog(storeDisabled ? 'Store disabled for this run.' : 'Store enabled.', 'small');
      });
    }
    if (storeCloseBtn) {
      storeCloseBtn.addEventListener('click', closeStore);
    }
    if (devForceNormal) devForceNormal.addEventListener('click', () => devForceDifficulty('normal'));
    if (devForceHard) devForceHard.addEventListener('click', () => devForceDifficulty('hard'));
    if (devForceDire) devForceDire.addEventListener('click', () => devForceDifficulty('dire'));
    if (devRerollBtn) devRerollBtn.addEventListener('click', devRerollDungeon);
    if (devQuickSimBtn) devQuickSimBtn.addEventListener('click', devQuickSim);
    if (devCopySettingsBtn) devCopySettingsBtn.addEventListener('click', copyDevTweaks);
    if (devResetSettingsBtn) devResetSettingsBtn.addEventListener('click', resetDevTweaks);
    const openStoreImpl = openStore;
    window.openStore = (autoAdvance = false) => openStoreImpl(autoAdvance);
    const trapLoreSlider = document.getElementById('trapLoreAdjust');
    if (trapLoreSlider) {
      trapLoreSlider.addEventListener('input', () => {
        const valEl = document.getElementById('trapLoreAdjustVal');
        if (valEl) valEl.textContent = trapLoreSlider.value;
        if (trapState) trapState.loreAdjust = parseInt(trapLoreSlider.value, 10) || 0;
      });
    }
    const trapResolveBtn = document.getElementById('trapResolveBtn');
    if (trapResolveBtn) {
      trapResolveBtn.addEventListener('click', resolveTrapRoom);
    }
    function upgradeCombo(key) {
      const idx = BOON_ATTACK_ORDER.indexOf(key);
      if (idx === -1) return 'high';
      return BOON_ATTACK_ORDER[Math.min(BOON_ATTACK_ORDER.length - 1, idx + 1)];
    }

    function upgradeGuardCombo(key) {
      const idx = BOON_GUARD_ORDER.indexOf(key);
      if (idx === -1) return 'high';
      return BOON_GUARD_ORDER[Math.min(BOON_GUARD_ORDER.length - 1, idx + 1)];
    }
    // --- Combat ----------------------------------------------------------
    async function resolveCombatRound(type) {
      const cfg = DIFFICULTY_CONFIG[currentDifficulty];
      const isAcceleratedElite = activeVariants.accelerated && (game.roomIndex === 4 || game.roomIndex === 5);
      const enrageMultiplier = ENRAGE_ACTIVE ? ENRAGE_MULTIPLIER : 1;
      const isEnrageElite = ENRAGE_ACTIVE && ENRAGE_ELITE_ROOMS.includes(game.roomIndex);
      if (game.nextRoundExtraCards > 0) {
        game.currentRoundExtraCards = Math.max(game.currentRoundExtraCards, game.nextRoundExtraCards);
        game.nextRoundExtraCards = 0;
      }
      if (!game.enemy) {
        const card = game.dungeonRooms[game.roomIndex];
        const mult = type === 'boss' ? BOSS_HP_MULT : BASE_ENEMY_HP_MULT;
        const bossHpMult = type === 'boss' ? cfg.bossHpMultiplier * devBossHpMultiplier : 1;
        const hp = Math.round(card.value * mult * bossHpMult * enrageMultiplier);
        const depthBonus = Math.floor(game.roomIndex / 2);
        const base = (type === 'boss' ? BOSS_DMG_BASE : NORMAL_DMG_BASE) + cfg.enemyDamageBonus + devEnemyBaseDamage;
        const dmg = Math.max(0, Math.round((base + depthBonus) * enrageMultiplier));
        const eliteHp = Math.round(hp * (isAcceleratedElite || isEnrageElite ? 1.3 : 1));
        const hitChanceBonus = isAcceleratedElite ? 0.15 : 0;
        const profile = chooseEnemyProfile(card, type, game.roomIndex);
        game.enemy = {
          hp: eliteHp,
          maxHp: eliteHp,
          dmg,
          type,
          hitChanceBonus,
          profile
        };
        activateHandBonusForCombat();
        setEnemyIntent(game.enemy, true);
      }

      const enemy = game.enemy;
      const isSpikeRound = activeVariants.spike && ((game.roomIndex + 1) % 3 === 0);
      const intentEffect = enemy.currentIntent?.extra;
      const ignoreGuardEffect = Boolean(intentEffect?.ignoreGuard);
      let ignoreGuardAnnounced = !ignoreGuardEffect;
      const enemyDisplayName = enemy.profile?.name || (enemy.type === 'boss' ? 'Boss' : 'Enemy');
      if (intentEffect?.aoe) {
        addLog(`${enemyDisplayName} unleashes an AoE Pulse!`, 'badge-warning');
      }
      let empowerActive = game.boonEmpowerNextRound;
      let empowerUsed = false;
      if (empowerActive) {
        game.boonEmpowerNextRound = false;
      }
      let living = aliveHeroes();
      if (living.length === 0) {
        addLog('No living heroes to fight. The dungeon claims you.', 'badge-danger');
        game.over = true;
        return;
      }

      // Lore auto "ritual heal"
      living.forEach(h => {
        const hero = game.players[h.index];
        if (!hero.ritualUsed && hero.lore >= 9) {
          let bestIdx = null;
          let maxMissing = 0;
          aliveHeroes().forEach(t => {
            const ht = game.players[t.index];
            const missing = ht.maxHp - ht.hp;
            if (missing >= 5 && missing > maxMissing) {
              maxMissing = missing;
              bestIdx = t.index;
            }
          });
          if (bestIdx !== null) {
            const amount = loreModifier(hero.lore) * 1;
            const target = game.players[bestIdx];
            const before = target.hp;
            target.hp = Math.min(target.maxHp, target.hp + amount);
            hero.ritualUsed = true;
            addLog(
              `Lore hero ${h.index + 1} performs a ritual heal on Hero ${bestIdx + 1} for ${target.hp - before} HP.`,
              'badge-success'
            );
          }
        }
      });

      // Read actions
      living = aliveHeroes();
      let totalDamage = 0;
      let guardDamageReduction = 0;
      let guardMultiplier = 1;
      let guardPreventAll = false;
      const direGuard = currentDifficulty === 'dire';
      const guardingHeroes = new Set();

      for (const h of living) {
        const idx = h.index;
        const baseId = `hero-${idx}`;
        const actionSel = document.getElementById(`${baseId}-action-${idx}`);
        const comboSel = document.getElementById(`${baseId}-combo-${idx}`);
        if (!actionSel || !comboSel) continue;

        const action = actionSel.value;
        let comboKey = comboSel.value;
        const hero = game.players[idx];
        if (empowerActive && !empowerUsed && (action === 'attack' || action === 'guard')) {
          const upgraded = action === 'attack' ? upgradeCombo(comboKey) : upgradeGuardCombo(comboKey);
          if (upgraded !== comboKey) {
            addLog(`Boon empowers Hero ${idx + 1}: ${comboKey} → ${upgraded}.`, 'badge-success');
            comboKey = upgraded;
            empowerUsed = true;
            comboSel.value = comboKey;
          }
        }

        if (action === 'attack') {
          recordStyleCombo(comboKey);
          const baseDmg = COMBO_DAMAGE[comboKey] || 0;
          const bonus = Math.max(0, Math.floor((hero.might - 6) / 4));
          const extra = hero.keenEdge && KEEN_EDGE_COMBOS.has(comboKey) ? 1 : 0;
          const rawDamage = baseDmg + bonus + extra;
          const scaledDamage = Math.max(0, Math.round(rawDamage * devComboDamageCurve));
          const handType = normalizedHandKey(comboKey);
          const { damage: baseFinalDamage, weaknessBonus, resistancePenalty } =
            applyWeaknessResistance(scaledDamage, game.enemy?.profile, handType);
          let finalDamage = baseFinalDamage;
          if (intentEffect?.defensive) {
            finalDamage = Math.max(0, Math.round(finalDamage * 0.75));
          }
          if (finalDamage > 0) {
            totalDamage += finalDamage;
            const curveHint = devComboDamageCurve !== 1 ? ` (${devComboDamageCurve.toFixed(2)}× curve)` : '';
            const effectParts = [];
            if (weaknessBonus) effectParts.push(`WEAKNESS +${weaknessBonus}`);
            if (resistancePenalty) effectParts.push('RESISTS');
            if (intentEffect?.defensive) effectParts.push('DEFENSE −25%');
            const effectHint = effectParts.length ? ` (${effectParts.join(' & ')})` : '';
            addLog(
              `Hero ${idx + 1} attacks with ${comboKey} for ${finalDamage} damage${curveHint}${effectHint} (Might bonus +${bonus}).`,
              'badge-success'
            );
            if (resistancePenalty) {
              const enemyLabel = game.enemy?.profile?.name || `${game.enemy.type === 'boss' ? 'Boss' : 'Enemy'}`;
              addLog(
                `${enemyLabel} RESISTS ${handDisplayLabel(handType)}. ${finalDamage} damage still hits.`,
                'badge-danger'
              );
            }
            if (extra > 0) {
              addLog(`Keen Edge grants Hero ${idx + 1} +1 bonus damage.`, 'small');
            }
            if (intentEffect?.defensive) {
              addLog(`${enemyDisplayName}'s defensive posture blunts the strike.`, 'small');
            }
          } else {
            addLog(`Hero ${idx + 1} chose Attack but had no effective combo.`, 'small');
          }
        }

        if (action === 'recover' || action === 'revive') {
          const isRevive = action === 'revive';
          if (activeVariants.ironSoul) {
            addLog(
              `Hero ${idx + 1} can't ${isRevive ? 'Revive' : 'Recover'} in Iron Soul mode.`,
              'badge-danger'
            );
          } else {
            const baseHeal = RECOVER_HEAL_MAP[comboKey] || 0;
            const loreMultiplier = recoverLoreMultiplier(hero);
            const heal = Math.max(1, Math.round(baseHeal * devRecoverStrength * loreMultiplier));
            if (heal > 0) {
              if (isRevive) {
                const downed = downHeroes();
                if (!downed.length) {
                  addLog(`Hero ${idx + 1} tries to Revive but no hero is down.`, 'small');
                } else {
                  const targetEntry = downed[Math.floor(Math.random() * downed.length)];
                  const targetHero = targetEntry.hero;
                  const before = targetHero.hp;
                  targetHero.hp = Math.min(targetHero.maxHp, targetHero.hp + heal);
                  addLog(
                    `Hero ${idx + 1} revives Hero ${targetEntry.index + 1} for ${targetHero.hp - before} HP (now ${targetHero.hp}/${targetHero.maxHp}).`,
                    'badge-success'
                  );
                }
              } else {
                const before = hero.hp;
                hero.hp = Math.min(hero.maxHp, hero.hp + heal);
                addLog(
                  `Hero ${idx + 1} uses ${comboKey} to Recover ${hero.hp - before} HP (now ${hero.hp}/${hero.maxHp}).`,
                  'badge-success'
                );
              }
            } else {
              addLog(
                `Hero ${idx + 1} tried to ${isRevive ? 'Revive' : 'Recover'} but the hand gives no heal.`,
                'small'
              );
            }
          }
        }

        if (action === 'guard') {
          guardingHeroes.add(idx);
          if (comboKey === 'high') {
            if (!direGuard) {
              guardDamageReduction = Math.max(guardDamageReduction, 1);
              addLog(`Hero ${idx + 1} Guards with High Card: enemy damage −1 this round.`, 'badge-success');
            } else {
              addLog(`Hero ${idx + 1} Guards with High Card (Dire): no effect.`, 'small');
            }
          } else if (comboKey === 'pair') {
            guardDamageReduction = Math.max(guardDamageReduction, direGuard ? 1 : 2);
            addLog(
              `Hero ${idx + 1} Guards with Pair: enemy damage −${direGuard ? 1 : 2} this round.`,
              'badge-success'
            );
          } else if (comboKey === 'three') {
            guardMultiplier = Math.min(guardMultiplier, direGuard ? 0.75 : 0.5);
            addLog(
              `Hero ${idx + 1} Guards with Trips: enemy damage ${direGuard ? 'reduced to 75%' : 'halved'} this round.`,
              'badge-success'
            );
          } else if (comboKey === 'full') {
            if (direGuard) {
              guardMultiplier = Math.min(guardMultiplier, 0.5);
              addLog(`Hero ${idx + 1} Guards with Full House: enemy damage halved this round.`, 'badge-success');
            } else {
              guardPreventAll = true;
              addLog(`Hero ${idx + 1} Guards with Full House: all damage prevented this round.`, 'badge-success');
            }
          } else {
            addLog(`Hero ${idx + 1} Guards, but the hand has no extra effect here.`, 'small');
          }
        }

        if (action === 'hold') {
          addLog(`Hero ${idx + 1} holds and saves cards.`, 'small');
        }

        await wait(320);
      }

      if (guardDamageReduction > 0 || guardPreventAll || guardMultiplier < 1) {
        guardDamageReduction *= devGuardEffectiveness;
        guardMultiplier = Math.max(0, guardMultiplier * devGuardEffectiveness);
      }
      if (isSpikeRound && (guardDamageReduction > 0 || guardPreventAll || guardMultiplier < 1)) {
        guardDamageReduction = Math.max(0, guardDamageReduction - 1);
        if (guardPreventAll) {
          guardPreventAll = false;
          guardMultiplier = Math.min(guardMultiplier, 0.75);
        }
        guardMultiplier = Math.min(guardMultiplier + 0.25, 1);
        addLog('Spike Round weakens Guard this round.', 'small');
      }
      const guardEffectActive = guardDamageReduction > 0 || guardPreventAll || guardMultiplier < 1;

      // Apply hero damage to enemy
      if (totalDamage > 0) {
        enemy.hp -= totalDamage;
        updateEnemySummaryDisplay();
        addLog(
          `${enemy.type === 'boss' ? 'Boss' : 'Enemy'} takes ${totalDamage} total damage. HP now ${Math.max(0, enemy.hp)}.`,
          'badge-success'
        );
      } else {
        addLog('No net damage dealt to the enemy this round.', 'small');
      }

      if (enemy.hp <= 0) {
        handleEnemyDefeat(type);
        refreshUI();
        return;
      }

      // Enemy attacks
      living = aliveHeroes();
      if (enemy.currentIntent?.type) {
        const detailParts = [];
        if (intentEffect?.description) detailParts.push(intentEffect.description);
        if (intentEffect?.damageBonus) detailParts.push(`+${intentEffect.damageBonus} damage`);
        if (intentEffect?.ignoreGuard) detailParts.push('ignores Guard');
        if (intentEffect?.aoe) detailParts.push('hits all heroes');
        if (intentEffect?.defensive) detailParts.push('hero attacks deal −25%');
        const intentDetail = detailParts.length ? detailParts.join(' • ') : 'Enemy follows through on its intent.';
        addLog(`Intent resolves: ${enemy.currentIntent.label} — ${intentDetail}`, 'badge-warning');
      }
      living.forEach(h => {
        const idx = h.index;
        if (game.players[idx].hp <= 0) return;

        const hero = game.players[idx];
        const agility = hero.agility;
        const agilityMod = (agility - 7) * 0.03;
        const enemyHitBonus =
          cfg.enemyHitChanceBonus +
          devEnemyHitChance +
          (enemy.hitChanceBonus || 0) +
          (ENRAGE_ACTIVE ? ENRAGE_HIT_CHANCE_BONUS : 0) +
          (isEnrageElite ? ENRAGE_HIT_CHANCE_BONUS : 0);
        const hitChance = clamp(BASE_HIT_CHANCE + enemyHitBonus - agilityMod, 0.2, 0.95);

        if (Math.random() < hitChance) {
          if (ignoreGuardEffect && !ignoreGuardAnnounced && guardEffectActive) {
            addLog(`${enemyDisplayName} ignores Guard this round.`, 'badge-warning');
            ignoreGuardAnnounced = true;
          }
          if (!ignoreGuardEffect && guardEffectActive && !guardingHeroes.has(idx)) {
            const sourceIdx = guardingHeroes.size ? [...guardingHeroes][0] : null;
            const sourceLabel = sourceIdx !== null ? ` Hero ${sourceIdx + 1}'s guard` : ' Guard';
            addLog(
              `${enemy.type === 'boss' ? 'Boss' : 'Enemy'} would hit Hero ${idx + 1}, but${sourceLabel} blocks it for the whole party.`,
              'badge-success'
            );
            return;
          }

          if (!ignoreGuardEffect && guardPreventAll) {
            addLog(
              `${enemy.type === 'boss' ? 'Boss' : 'Enemy'} would hit Hero ${idx + 1}, but Guard prevents all damage this round.`,
              'badge-success'
            );
            return;
          }

          let dmg = enemy.dmg;
          if (intentEffect?.damageBonus) {
            dmg += intentEffect.damageBonus;
          }
          if (isSpikeRound) {
            dmg = Math.ceil(dmg * 1.5);
          }
          const guardReductionToApply = ignoreGuardEffect ? 0 : guardDamageReduction;
          const guardMultiplierToApply = ignoreGuardEffect ? 1 : guardMultiplier;
          if (guardReductionToApply > 0) {
            dmg = Math.max(0, dmg - guardReductionToApply);
          }
          dmg = Math.floor(dmg * guardMultiplierToApply);

          if (dmg <= 0) {
            addLog(
              `${enemy.type === 'boss' ? 'Boss' : 'Enemy'} hits Hero ${idx + 1}, but Guard reduces the damage to 0.`,
              'badge-success'
            );
          } else {
            damageHero(idx, dmg, enemy.type === 'boss' ? 'boss attack' : 'enemy attack');
            triggerEnemyHitEffect();
          }
        } else {
          addLog(
            `${enemy.type === 'boss' ? 'Boss' : 'Enemy'} misses Hero ${idx + 1} (Agility helped avoid the hit).`,
            'badge-success'
          );
        }
      });

      if (!game.over && enemy.hp > 0) {
        setEnemyIntent(enemy, true);
      }

      refreshUI();
    }

    function awardEnemyChips(type) {
      if (!game.dungeonRooms.length) return;
      const card = game.dungeonRooms[game.roomIndex];
      if (type === 'boss') {
        awardCoins(5, 'Boss defeated');
        return;
      }
      if (type === 'enemy') {
        const suit = card?.suit;
        const isElite = suit === '♥';
        awardCoins(isElite ? 3 : 2, isElite ? 'Elite enemy defeated' : 'Enemy defeated');
      }
    }

    function awardPerformanceChips() {
      const aliveCount = aliveHeroes().length;
      if (aliveCount === game.players.length) {
        awardCoins(1, 'All heroes survived the room');
      }
      if (!game.roomDamageTaken) {
        awardCoins(1, 'No hero damage taken');
      }
      if (game.roomStyleReward > 0) {
        awardCoins(game.roomStyleReward, `Style hand (${game.roomStyleCombo})`);
      }
    }

    function handlePostRoomCompletion(type) {
      if (game.lastRewardedRoomIndex === game.roomIndex) {
        return true;
      }
      awardEnemyChips(type);
      awardPerformanceChips();
      game.lastRewardedRoomIndex = game.roomIndex;
      const shouldOpen = shouldOpenStoreAfterRoom();
      if (shouldOpen && !game.over) {
        openStore(true);
        return false;
      }
      return true;
    }

    function handleEnemyDefeat(type) {
      addLog(`${type === 'boss' ? 'Boss' : 'Enemy'} is defeated!`, 'badge-success');
      game.handBonusActive = false;
      if (type !== 'boss') {
        const previousStack = clampHandSizeStack(game.handSizeStack);
        const nextStack = clampHandSizeStack(previousStack + 1);
        game.handSizeStack = nextStack;
        if (nextStack > previousStack) {
          addLog(
            `Enemy defeat adds +1 stackable hand size for the next round (${nextStack}/${devHandStackCap} max).`,
            'badge-success'
          );
          const { displayTotal } = getHandSizeTotals();
          setRoomEventMessage(`Hand size buff earned! Draw ${displayTotal} cards next round.`);
        } else {
          const { displayTotal } = getHandSizeTotals();
          addLog(
            `Hand size bonus from enemy defeats is already at the cap (${displayTotal} cards).`,
            'small'
          );
          setRoomEventMessage(`Hand size bonus capped at ${displayTotal} cards.`);
        }
      }
      const shouldAdvance = handlePostRoomCompletion(type);
      game.guardBraceActive = false;
      game.luckyFlipReady = false;
      updateLuckyFlipButton();
      game.enemy = null;
      setEnemyPortrait(null);
      setCombatMode(false);
      if (type === 'boss') {
        addLog('The boss falls. The dungeon is cleared. Victory!', 'badge-success');
        game.over = true;
        unlockRunOptions();
        showRunOverlay('victory', 'All rooms have been completed. Victory is yours!');
      } else if (!game.over) {
        if (shouldAdvance) {
          if (game.roomIndex + 1 < game.dungeonRooms.length) {
            goToNextRoom();
          } else {
            addLog('No more rooms. The dungeon is cleared!', 'badge-success');
          }
        }
      }
    }

    function updateDevHeroStats() {
      if (!devHeroStats) return;
      if (game.players.length === 0) {
        devHeroStats.textContent = 'No heroes yet.';
        return;
      }
      devHeroStats.innerHTML = game.players
        .map(p => `Hero ${p.id + 1}: ${p.hp} / ${p.maxHp} HP · ⚔${p.might} 🏹${p.agility} ✨${p.lore}`)
        .join('<br>');
    }

    function updateDevDifficultyInfo() {
      if (!devDifficultyInfo) return;
      devDifficultyInfo.innerHTML = `<strong>Difficulty:</strong> ${DIFFICULTY_LABELS[currentDifficulty]}`;
    }

    function updateDevVariantInfo() {
      if (!devVariantInfo) return;
      const activeList = getActiveVariantLabels();
      devVariantInfo.innerHTML = `<strong>Variants:</strong> ${activeList.length ? activeList.join(', ') : 'None'}`;
    }

    function updateDevDungeonInfo() {
      if (!devDungeonInfo) return;
      const total = game.dungeonRooms.length;
      const idx = game.roomIndex;
      const type = idx >= 0 && idx < total
        ? roomTypeLabel(getRoomType(game.dungeonRooms[idx], idx === total - 1))
        : 'N/A';
      devDungeonInfo.innerHTML = `<strong>Rooms:</strong> ${total}<br><strong>Index:</strong> ${idx}<br><strong>Type:</strong> ${type}`;
    }

    function refreshDevPanel() {
      updateDevChipReadout();
      updateDevHeroStats();
      updateDevDifficultyInfo();
      updateDevVariantInfo();
      updateDevDungeonInfo();
      if (devTweaksInfo) {
      const lines = [
        `Room Count: ${devRoomCount}`,
        `Enemy Damage: ${devEnemyBaseDamage >= 0 ? '+' : ''}${devEnemyBaseDamage}`,
        `Enemy Hit: ${devEnemyHitChance >= 0 ? '+' : ''}${devEnemyHitChance.toFixed(2)}`,
        `Boss HP Mult: ${devBossHpMultiplier.toFixed(2)}`,
        `Hero HP Mod: ${devHeroHpModifier >= 0 ? '+' : ''}${devHeroHpModifier}`,
        `Recover Str: ×${devRecoverStrength.toFixed(2)}`,
        `Guard Mult: ×${devGuardEffectiveness.toFixed(2)}`,
        `Hand Stack Cap: +${devHandStackCap} (max ${BASE_HAND_SIZE + devHandStackCap})`,
        `Underdog @< ${devUnderdogThreshold}`,
        `Force Room: ${devForcedRoomType}`,
        `Combo curve: ×${devComboDamageCurve.toFixed(2)}`,
        `Coin Gain Mult: ×${devCoinGainMultiplier.toFixed(2)}`,
        `Lore override: ${devLoreOverride > 0 ? devLoreOverride : 'auto'}`,
        `Insight override: ${devInsightOverride > 0 ? devInsightOverride : 'auto'}`,
        `Insight anim: ${devShowInsightAnim ? 'On' : 'Off'}`
      ];
      devTweaksInfo.innerHTML = lines.join('<br>');
    }
    }

    function copyDevTweaks() {
      const data = {
        roomCount: devRoomCount,
        enemyBaseDamage: devEnemyBaseDamage,
        enemyHitChance: devEnemyHitChance,
        bossHpMultiplier: devBossHpMultiplier,
        heroHpModifier: devHeroHpModifier,
        recoverStrength: devRecoverStrength,
        guardEffectiveness: devGuardEffectiveness,
        comboDamageCurve: devComboDamageCurve,
        coinGainMultiplier: devCoinGainMultiplier,
        loreOverride: devLoreOverride,
        insightOverride: devInsightOverride,
        insightAnim: devShowInsightAnim,
        underdogThreshold: devUnderdogThreshold,
        forcedRoomType: devForcedRoomType
      };
      const text = JSON.stringify(data, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => addLog('Dev tweaks copied to clipboard.', 'small'));
      } else {
        const tmp = document.createElement('textarea');
        tmp.value = text;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        addLog('Dev tweaks copied to clipboard.', 'small');
      }
    }

    function toggleDevPanel(force) {
      if (!devPanel) return;
      const show = typeof force === 'boolean' ? force : !devPanel.classList.contains('active');
      devPanel.classList.toggle('active', show);
      devPanel.setAttribute('aria-hidden', (!show).toString());
    }

    function devSkipToNextRoom() {
      if (game.over) {
        addLog('Dev: Run is over.', 'badge-danger');
        return;
      }
      goToNextRoom();
    }

    function devResolveCombatAuto() {
      if (!game.enemy) {
        addLog('Dev: No enemy to resolve.', 'badge-danger');
        return;
      }
      renderActionSelectors();
      aliveHeroes().forEach(h => {
        const actionSel = document.getElementById(`hero-${h.index}-action-${h.index}`);
        const comboSel = document.getElementById(`hero-${h.index}-combo-${h.index}`);
        if (actionSel) {
          actionSel.value = 'attack';
          updateHeroSelection(h.index, 'action', 'attack');
        }
        if (comboSel) {
          comboSel.value = 'high';
          updateHeroSelection(h.index, 'combo', 'high');
        }
      });
      void resolveRoomOrRound({ forceCombat: true });
    }

    function devKillEnemy() {
      if (!game.enemy) {
        addLog('Dev: No enemy to kill.', 'small');
        return;
      }
      const type = game.enemy.type;
      game.enemy.hp = 0;
      handleEnemyDefeat(type);
      refreshUI();
    }

    function devFullHealParty() {
      game.players.forEach(p => {
        if (p.hp > 0) p.hp = p.maxHp;
      });
      addLog('Dev: Party healed to full.', 'badge-success');
      refreshUI();
    }

    function devWoundParty() {
      game.players.forEach((p, idx) => {
        if (p.hp > 0) damageHero(idx, 4);
      });
      refreshUI();
    }

    function devForceDifficulty(mode) {
      setDifficulty(mode);
      addLog(`Dev: Difficulty forced to ${DIFFICULTY_LABELS[mode]}.`, 'badge-success');
    }

    function devRerollDungeon() {
      if (game.roomIndex >= 0 && !game.over) {
        addLog('Dev: Cannot reroll after run started.', 'badge-danger');
        return;
      }
      game.dungeonDeck = shuffle(makeDeck());
      const roomCount = Math.max(1, Math.round(devRoomCount || DEFAULT_ROOM_COUNT));
      game.dungeonRooms = buildDungeonRooms(game.dungeonDeck, roomCount);
      game.roomIndex = -1;
      game.enemy = null;
      addLog('Dev: Dungeon rerolled.', 'small');
      refreshUI();
    }

    function devQuickSim() {
      const runs = 50;
      let winChance = 0.5;
      winChance -= Math.max(0, devRoomCount - DEFAULT_ROOM_COUNT) * 0.01;
      winChance -= devEnemyBaseDamage * 0.01;
      winChance -= devEnemyHitChance * 0.2;
      winChance -= (devBossHpMultiplier - 1) * 0.05;
      winChance += devHeroHpModifier * 0.005;
      winChance += (devRecoverStrength - 1) * 0.05;
      winChance += (devGuardEffectiveness - 1) * 0.03;
      winChance = Math.max(0.05, Math.min(0.95, winChance));

      let wins = 0;
      for (let i = 0; i < runs; i++) {
        if (Math.random() < winChance) wins++;
      }
      if (devSimResult) {
        devSimResult.textContent = `Quick Sim: ${wins}/${runs} wins (${Math.round(
          (wins / runs) * 100
        )}%) — chance est: ${(winChance * 100).toFixed(0)}%`;
      }
    }

    // --- Trap, Heal, Treasure -------------------------------------------
    function resolveTrapRoom(forceOutcome) {
      if (!trapState) return;
      const { tn } = trapState;

      const finalizeTrap = (success) => {
        if (!success) {
          game.handSizePenalty = Math.max(0, (game.handSizePenalty || 0) + 1);
          const { displayTotal } = getHandSizeTotals();
          addLog('Trap not disarmed. Hand size reduced by 1.', 'badge-danger');
          setRoomEventMessage(`Trap TN ${tn} failed — hand size now ${displayTotal}.`);
        } else {
          awardCoins(1, 'Trap disarmed');
          addLog(`Trap TN ${tn} disarmed.`, 'badge-success');
          setRoomEventMessage(`Trap TN ${tn} disarmed.`);
        }
        trapState = null;
        refreshUI();
        saveRunState();
        if (game.over) return;
        if (handlePostRoomCompletion('trap')) {
          if (game.roomIndex + 1 < game.dungeonRooms.length) {
            goToNextRoom();
          } else {
            addLog('No more rooms. The dungeon is cleared!', 'badge-success');
          }
        }
      };

      // If a forced outcome was provided (e.g., future automation), resolve immediately.
      if (typeof forceOutcome === 'boolean') {
        finalizeTrap(forceOutcome);
        return;
      }

      const trapPrompt = `Trap TN ${tn}`;
      setRoomEventMessage(trapPrompt);
      if (roomEventEl) {
        roomEventEl.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:4px;">
            <span>${trapPrompt}</span>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:2px;">
              <button type="button" class="secondary trap-pass">Success</button>
              <button type="button" class="secondary trap-fail">Failure</button>
            </div>
          </div>
        `;
        const passBtn = roomEventEl.querySelector('.trap-pass');
        const failBtn = roomEventEl.querySelector('.trap-fail');
        if (passBtn) passBtn.addEventListener('click', () => finalizeTrap(true), { once: true });
        if (failBtn) failBtn.addEventListener('click', () => finalizeTrap(false), { once: true });
      }
    }

    function resolveTreasureRoom() {
      const living = aliveHeroes();
      if (living.length === 0) {
        addLog('Treasure found, but no one can claim it.', 'badge-danger');
        return;
      }
      const target = living[Math.floor(Math.random() * living.length)];
      const hero = game.players[target.index];

      let treasureMsg = '';
      if (Math.random() < 0.5) {
        hero.might += 1;
        treasureMsg = `Hero ${target.index + 1} gains Might +1 (${hero.might})`;
        addLog(
          `Treasure! Hero ${target.index + 1} finds a weapon upgrade: Might +1 (now ${hero.might}).`,
          'badge-success'
        );
      } else {
        hero.agility += 1;
        treasureMsg = `Hero ${target.index + 1} gains Agility +1 (${hero.agility})`;
        addLog(
          `Treasure! Hero ${target.index + 1} finds agile gear: Agility +1 (now ${hero.agility}).`,
          'badge-success'
        );
      }
      setRoomEventMessage(`Treasure: ${treasureMsg}. Decide rewards, then continue.`);
    }
