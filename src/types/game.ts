export enum Rarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum EquipmentType {
  WEAPON = 'weapon',
  DEFENSE = 'defense',
  ECONOMY = 'economy',
  CONSUMABLE = 'consumable',
}

export enum GamePhase {
  INCOME = 'income',
  SHOP = 'shop',
  ACTION = 'action',
  SETTLEMENT = 'settlement',
}

export enum GameStatus {
  SETUP = 'setup',
  PLAYING = 'playing',
  PAUSED = 'paused',
  FINISHED = 'finished',
}

export interface WeaponEffect {
  type: 'critical' | 'penetration' | 'splash' | 'guaranteed_crit';
  value: number;
}

export interface DefenseEffect {
  type: 'damage_reduction' | 'self_repair' | 'reflect' | 'stealth';
  value: number;
  durationInTurns?: number;
}

export interface EconomyEffect {
  type: 'gold_bonus' | 'double_income' | 'lucky_bottle' | 'extra_attack' | 'free_refresh' | 'rare_shop';
  value: number;
  durationInTurns?: number;
}

export interface BaseEquipment {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  basePrice: number;
  currentPrice: number;
  icon: string;
}

export interface Weapon extends BaseEquipment {
  type: EquipmentType.WEAPON;
  attack: number;
  criticalChance?: number;
  effects?: WeaponEffect[];
}

export interface DefenseItem extends BaseEquipment {
  type: EquipmentType.DEFENSE;
  effects: DefenseEffect[];
  shieldHpBonus?: number;
}

export interface EconomyItem extends BaseEquipment {
  type: EquipmentType.ECONOMY;
  effects: EconomyEffect[];
  permanent: boolean;
  remainingUses?: number;
}

export interface Consumable extends BaseEquipment {
  type: EquipmentType.CONSUMABLE;
  effect: EconomyEffect | DefenseEffect;
  remainingUses: number;
}

export type Equipment = Weapon | DefenseItem | EconomyItem | Consumable;

export interface Shield {
  type: 'basic' | 'reinforced' | 'heavy' | 'energy';
  maxHp: number;
  currentHp: number;
  damageReductionPercent: number;
  selfRepairPerTurn: number;
}

export interface IslandConquestInfo {
  turnConquered: number;        // 被占领时的回合数
  originalMaxHp: number;        // 原始最大HP
  restoreTurns: number;         // 恢复所需的回合数
}

export interface Island {
  id: string;
  name: string;
  image: string;
  ownerId: string | null;
  shield: Shield;
  position: {
    x: number;
    y: number;
  };
  goldPerTurn: number;
  defenseItems: DefenseItem[];
  attack?: number;
  conquestInfo?: IslandConquestInfo;
}

export interface EquipmentSlots {
  weapon: Weapon | null;
  defense: DefenseItem[];
  economy: EconomyItem | null;
}

export interface PlayerStats {
  islandsConquered: number;
  islandsLost: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  bottlesOpened: number;
  itemsBought: number;
  itemsSold: number;
}

export interface ActiveEffect {
  type: string;
  value: number;
  remainingTurns: number;
  source: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  gold: number;
  islandIds: string[];
  equipment: EquipmentSlots;
  backpack: Equipment[];
  stats: PlayerStats;
  isAI: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  hasCollectedIncome?: boolean;
  activeEffects: ActiveEffect[];
}

export interface ShopItem {
  equipment: Equipment;
  quantity: number;
  priceModifier: number;
  isRareItem: boolean;
  available: boolean;
}

export interface Shop {
  items: ShopItem[];
  refreshCount: number;
  maxRefreshPerTurn: number;
  refreshCost: number;
}

export interface DriftBottle {
  id: string;
  ownerId: string;
  opened: boolean;
  guaranteedRarity?: Rarity;
}

export interface RarityConfig {
  rarity: Rarity;
  baseProbability: number;
  luckyBonus: number;
}

export interface TurnInfo {
  currentTurn: number;
  currentPlayerIndex: number;
  phase: GamePhase;
  phaseTimeRemaining: number;
  totalTurnTime: number;
  actionsThisTurn: {
    attacks: number;
    itemsUsed: number;
    purchases: number;
    sales: number;
  };
}

export interface GameConfig {
  playerCount: number;
  islandsPerPlayer: number;
  initialGold: number;
  turnDuration: number;
  phaseDurations: {
    income: number;
    shop: number;
    action: number;
    settlement: number;
  };
  maxTurns: number;
  victoryCondition: 'total_conquest' | 'bankruptcy' | 'turns_limit';
}

export interface IncomeInfo {
  playerId: string;
  baseIncome: number;
  bonusMultiplier: number;
  hasDoubleIncome: boolean;
  totalIncome: number;
  islandCount: number;
}

export interface GameState {
  id: string;
  status: GameStatus;
  config: GameConfig;
  players: Player[];
  islands: Island[];
  turn: TurnInfo;
  shop: Shop;
  driftBottles: DriftBottle[];
  createdAt: number;
  updatedAt: number;
  winnerId: string | null;
  turnHistory: TurnRecord[];
  connections: IslandConnection[];
  lastIncome?: IncomeInfo;
}

export interface IslandConnection {
  from: string;
  to: string;
}

export interface GameEvent {
  id: string;
  type: 'attack' | 'conquer' | 'buy' | 'sell' | 'use_item' | 'bottle_open' | 'phase_change' | 'turn_change';
  playerId: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface AttackResult {
  attackerId: string;
  targetIslandId: string;
  weapon: Weapon;
  damage: number;
  isCritical: boolean;
  shieldRemaining: number;
  isConquerable: boolean;
  counterDamage?: number;
}

export interface TurnRecord {
  turn: number;
  playerId: string;
  startGold: number;
  endGold: number;
  actions: GameEvent[];
  income: number;
  bottlesReceived: number;
}

export interface SaveData {
  version: string;
  gameState: GameState;
  savedAt: number;
  playerName: string;
  turnCount: number;
}

export interface AIDecision {
  type: 'attack' | 'buy' | 'sell' | 'use_item' | 'pass' | 'conquer';
  priority: number;
  params: Record<string, unknown>;
}

export interface AIConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  aggressiveness: number;
  defensiveFocus: number;
  economicFocus: number;
}

export interface UIState {
  selectedIslandId: string | null;
  selectedPlayerId: string | null;
  hoveredEquipment: Equipment | null;
  isShopOpen: boolean;
  isBottleOpen: boolean;
  isSettingsOpen: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration: number;
  timestamp: number;
}

export const GAME_CONSTANTS = {
  ISLAND_GOLD_PER_SECOND: 10,
  SELL_PRICE_RATIO: 0.5,
  SELL_CONSUMABLE_RATIO: 0.7,
  MAX_BACKPACK_SIZE: 6,
  MAX_DEFENSE_SLOTS: 2,
  MAX_ATTACKS_PER_TURN: Infinity,
  MAX_ITEMS_PER_TURN: 3,
  BOTTLE_GUARANTEE_TURNS: 5,
} as const;

export const RARITY_CONFIG: RarityConfig[] = [
  { rarity: Rarity.COMMON, baseProbability: 0.6, luckyBonus: -0.15 },
  { rarity: Rarity.RARE, baseProbability: 0.25, luckyBonus: 0.1 },
  { rarity: Rarity.EPIC, baseProbability: 0.12, luckyBonus: 0.05 },
  { rarity: Rarity.LEGENDARY, baseProbability: 0.03, luckyBonus: 0.0 },
];

export const DEFAULT_CONFIG: GameConfig = {
  playerCount: 2,
  islandsPerPlayer: 2,
  initialGold: 1000,
  turnDuration: 45,
  phaseDurations: {
    income: 5,
    shop: 15,
    action: 20,
    settlement: 5,
  },
  maxTurns: 50,
  victoryCondition: 'total_conquest',
};