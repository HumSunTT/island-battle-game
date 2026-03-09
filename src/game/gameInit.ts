import { 
  Player, 
  Island, 
  GameState, 
  GameConfig, 
  Shield, 
  DEFAULT_CONFIG, 
  GAME_CONSTANTS,
  GameStatus,
  GamePhase,
  DriftBottle,
} from '../types/game';
import { 
  getRandomIslandImage, 
  getIslandNameFromImage, 
  getPlayerBaseImage,
  SHIELDS, 
  WEAPONS 
} from '../data/equipment';
import { v4 as uuidv4 } from 'uuid';

export interface IslandConnection {
  from: string;
  to: string;
}

export function createInitialShield(): Shield {
  return {
    ...SHIELDS.basic,
    currentHp: SHIELDS.basic.maxHp,
  };
}

export function createIsland(
  id: string, 
  image: string,
  ownerId: string | null,
  hpMultiplier: number = 1,
  goldMultiplier: number = 1
): Island {
  const baseShield = createInitialShield();
  const name = getIslandNameFromImage(image);
  return {
    id,
    name,
    image,
    ownerId,
    shield: {
      ...baseShield,
      maxHp: Math.floor(baseShield.maxHp * hpMultiplier),
      currentHp: Math.floor(baseShield.maxHp * hpMultiplier),
    },
    position: { x: 0, y: 0 },
    goldPerTurn: Math.floor(100 + (Math.floor(baseShield.maxHp * hpMultiplier) / 100) * 400),
    defenseItems: [],
  };
}

export function createPlayer(
  id: string,
  name: string,
  color: string,
  islandIds: string[],
  isAI: boolean = false,
  aiDifficulty?: 'easy' | 'medium' | 'hard'
): Player {
  const initialWeapon = { ...WEAPONS[0] };
  initialWeapon.id = uuidv4();

  return {
    id,
    name,
    color,
    avatar: `👤`,
    gold: DEFAULT_CONFIG.initialGold,
    islandIds,
    equipment: {
      weapon: initialWeapon,
      defense: [],
      economy: null,
    },
    backpack: [],
    stats: {
      islandsConquered: 0,
      islandsLost: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      bottlesOpened: 0,
      itemsBought: 0,
      itemsSold: 0,
    },
    isAI,
    aiDifficulty,
    activeEffects: [],
  };
}

function generateQuadrantIslands(
  quadrantIndex: number,
  usedIslandImages: string[]
): { islands: Island[]; connections: IslandConnection[] } {
  const islands: Island[] = [];
  const connections: IslandConnection[] = [];
  
  const quadrantOffsets = [
    { x: -10, y: -7 },
    { x: 10, y: -7 },
    { x: -10, y: 7 },
    { x: 10, y: 7 },
  ];
  
  const offset = quadrantOffsets[quadrantIndex];
  
  const columnLayouts = [
    [
      { col: 0, row: 0 },
      { col: 0, row: 2.5 },
      { col: 0, row: 5.0 },
      { col: 0, row: 7.5 },
    ],
    [
      { col: 3.5, row: 1.25 },
      { col: 3.5, row: 3.75 },
      { col: 3.5, row: 6.25 },
    ],
    [
      { col: 7, row: 2.5 },
      { col: 7, row: 5.0 },
    ],
  ];
  
  const islandIds: string[] = [];
  
  columnLayouts.forEach((column) => {
    column.forEach((pos) => {
      const islandId = uuidv4();
      const islandImage = getRandomIslandImage(usedIslandImages);
      usedIslandImages.push(islandImage);
      
      const hpMultiplier = 0.6 + Math.random() * 0.8;
      const goldMultiplier = 0.6 + Math.random() * 1.2;
      
      const island = createIsland(islandId, islandImage, null, hpMultiplier, goldMultiplier);
      island.position = {
        x: offset.x + pos.col * (quadrantIndex % 2 === 0 ? 1 : -1),
        y: offset.y + pos.row * (quadrantIndex < 2 ? 1 : -1),
      };
      
      island.attack = Math.max(5, Math.floor(island.goldPerTurn * 0.05));
      
      islands.push(island);
      islandIds.push(islandId);
    });
  });
  
  connections.push({ from: islandIds[0], to: islandIds[1] });
  connections.push({ from: islandIds[1], to: islandIds[2] });
  connections.push({ from: islandIds[2], to: islandIds[3] });
  connections.push({ from: islandIds[0], to: islandIds[4] });
  connections.push({ from: islandIds[1], to: islandIds[5] });
  connections.push({ from: islandIds[2], to: islandIds[6] });
  connections.push({ from: islandIds[4], to: islandIds[5] });
  connections.push({ from: islandIds[5], to: islandIds[6] });
  connections.push({ from: islandIds[4], to: islandIds[7] });
  connections.push({ from: islandIds[5], to: islandIds[8] });
  
  return { islands, connections };
}




export function initializeGame(
  playerNames: string[],
  config: Partial<GameConfig> = {}
): GameState {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const players: Player[] = [];
  const islands: Island[] = [];
  const usedIslandImages: string[] = [];
  const connections: IslandConnection[] = [];

  const playerColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
  const quadrantAssignments = [0, 1, 2, 3].sort(() => Math.random() - 0.5);

  const quadrantIslands: Island[][] = [[], [], [], []];
  const quadrantConnections: IslandConnection[][] = [[], [], [], []];

  for (let q = 0; q < 4; q++) {
    const result = generateQuadrantIslands(q, usedIslandImages);
    quadrantIslands[q] = result.islands;
    quadrantConnections[q] = result.connections;
    islands.push(...result.islands);
    connections.push(...result.connections);
  }

  playerNames.forEach((name, index) => {
    const playerId = uuidv4();
    const quadrantIndex = quadrantAssignments[index];
    const playerIslandIds: string[] = [];
    
    const playerIsland = quadrantIslands[quadrantIndex][0];
    playerIsland.ownerId = playerId;
    playerIsland.image = getPlayerBaseImage(index);
    playerIsland.name = `${name}基地`;
    playerIsland.shield = {
      type: 'reinforced',
      maxHp: 200,
      currentHp: 200,
      damageReductionPercent: 0,
      selfRepairPerTurn: 5,
    };
    playerIsland.goldPerTurn = 500;
    playerIsland.attack = 50;
    playerIslandIds.push(playerIsland.id);

    players.push(
      createPlayer(playerId, name, playerColors[index % playerColors.length], playerIslandIds)
    );
  });

  const centerIslandId = uuidv4();
  const centerIslandImage = getRandomIslandImage(usedIslandImages);
  usedIslandImages.push(centerIslandImage);
  
  const centerIsland = createIsland(centerIslandId, centerIslandImage, null, 3, 5);
  centerIsland.position = { x: 0, y: 0 };
  centerIsland.shield = {
    type: 'heavy',
    maxHp: 300,
    currentHp: 300,
    damageReductionPercent: 20,
    selfRepairPerTurn: 10,
  };
  islands.push(centerIsland);

  for (let q = 0; q < 4; q++) {
    const lastIslandInQuadrant = quadrantIslands[q][quadrantIslands[q].length - 1];
    connections.push({
      from: lastIslandInQuadrant.id,
      to: centerIslandId
    });
  }

  return {
    id: uuidv4(),
    status: GameStatus.SETUP,
    config: finalConfig,
    players,
    islands,
    turn: {
      currentTurn: 1,
      currentPlayerIndex: 0,
      phase: GamePhase.INCOME,
      phaseTimeRemaining: finalConfig.phaseDurations.income,
      totalTurnTime: finalConfig.turnDuration,
      actionsThisTurn: {
        attacks: 0,
        itemsUsed: 0,
        purchases: 0,
        sales: 0,
      },
    },
    shop: {
      items: [],
      refreshCount: 0,
      maxRefreshPerTurn: 3,
      refreshCost: 50,
    },
    driftBottles: players.map(player => ({
      id: uuidv4(),
      ownerId: player.id,
      opened: false,
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    winnerId: null,
    turnHistory: [],
    connections,
  };
}

export function canReachPlayer(
  state: GameState,
  fromPlayerId: string,
  toPlayerId: string
): boolean {
  const visited = new Set<string>();
  const queue: string[] = [];
  
  const fromPlayer = state.players.find(p => p.id === fromPlayerId);
  if (!fromPlayer || fromPlayer.islandIds.length === 0) return false;
  
  const startIslandId = fromPlayer.islandIds[0];
  queue.push(startIslandId);
  visited.add(startIslandId);
  
  while (queue.length > 0) {
    const currentIslandId = queue.shift()!;
    
    const connectedIslandIds = state.connections
      .filter(conn => conn.from === currentIslandId || conn.to === currentIslandId)
      .map(conn => conn.from === currentIslandId ? conn.to : conn.from);
    
    for (const islandId of connectedIslandIds) {
      if (visited.has(islandId)) continue;
      
      const island = state.islands.find(i => i.id === islandId);
      
      if (island && island.ownerId === fromPlayerId) {
        const toPlayer = state.players.find(p => p.id === toPlayerId);
        if (toPlayer && toPlayer.islandIds.includes(islandId)) {
          return true;
        }
        
        visited.add(islandId);
        queue.push(islandId);
      }
    }
  }
  
  return false;
}

export function getConnectedIslands(
  state: GameState,
  islandId: string
): string[] {
  return state.connections
    .filter(conn => conn.from === islandId || conn.to === islandId)
    .map(conn => conn.from === islandId ? conn.to : conn.from);
}

export function calculateIncome(
  player: Player,
  islands: Island[],
  turnDuration: number
): number {
  const playerIslands = islands.filter(island => island.ownerId === player.id);
  return playerIslands.reduce((total, island) => {
    return total + island.goldPerTurn;
  }, 0);
}

export function checkVictory(state: GameState): string | null {
  const { players, islands } = state;
  
  const VICTORY_GOLD_THRESHOLD = 100000;
  
  for (const player of players) {
    if (player.gold >= VICTORY_GOLD_THRESHOLD) {
      return player.id;
    }
  }
  
  for (const player of players) {
    const ownedIslands = islands.filter(island => island.ownerId === player.id);
    if (ownedIslands.length === islands.length) {
      return player.id;
    }
  }
  
  const playersWithIslands = players.filter(player => {
    const baseIsland = islands.find(i => i.id === player.islandIds[0]);
    return baseIsland && baseIsland.shield.currentHp > 0;
  });
  
  if (playersWithIslands.length === 1) {
    return playersWithIslands[0].id;
  }
  
  if (playersWithIslands.length === 0) {
    return null;
  }
  
  return null;
}

export function checkDefeat(state: GameState): string[] {
  const { players, islands } = state;
  const defeatedPlayers: string[] = [];
  
  for (const player of players) {
    const ownedIslands = islands.filter(island => island.ownerId === player.id);
    if (ownedIslands.length === 0) {
      defeatedPlayers.push(player.id);
    }
  }
  
  return defeatedPlayers;
}

export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.turn.currentPlayerIndex];
}

export function getPlayerById(state: GameState, playerId: string): Player | undefined {
  return state.players.find(p => p.id === playerId);
}

export function getIslandById(state: GameState, islandId: string): Island | undefined {
  return state.islands.find(i => i.id === islandId);
}