import {
  GameState,
  Player,
  Island,
  Weapon,
  AttackResult,
  Shop,
  ShopItem,
  Equipment,
  DriftBottle,
  Rarity,
  RARITY_CONFIG,
  GAME_CONSTANTS,
} from '../types/game';
import { WEAPONS, DEFENSE_ITEMS, ECONOMY_ITEMS, CONSUMABLES } from '../data/equipment';
import { v4 as uuidv4 } from 'uuid';

export function calculateDamage(
  weapon: Weapon,
  targetIsland: Island
): { damage: number; isCritical: boolean } {
  let damage = weapon.attack;
  let isCritical = false;

  const critChance = weapon.criticalChance || 5;
  const hasGuaranteedCrit = weapon.effects?.some(e => e.type === 'guaranteed_crit');
  
  if (hasGuaranteedCrit || Math.random() * 100 < critChance) {
    damage *= 1.5;
    isCritical = true;
  }

  const hasPenetration = weapon.effects?.some(e => e.type === 'penetration');
  
  if (!hasPenetration) {
    let totalReduction = targetIsland.shield.damageReductionPercent;
    
    targetIsland.defenseItems.forEach((item: any) => {
      if (item.effects) {
        item.effects.forEach((effect: any) => {
          if (effect.type === 'damage_reduction') {
            totalReduction += effect.value;
          }
        });
      }
    });

    totalReduction = Math.min(totalReduction, 75);
    
    const reduction = totalReduction / 100;
    damage = damage * (1 - reduction);
  }

  damage = Math.floor(damage);

  return { damage, isCritical };
}

export function attackIsland(
  state: GameState,
  attackerId: string,
  targetIslandId: string,
  weapon: Weapon
): { newState: GameState; result: AttackResult; splashDamageResults?: { islandId: string; damage: number }[] } {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const attacker = newState.players.find(p => p.id === attackerId);
  const targetIsland = newState.islands.find(i => i.id === targetIslandId);

  if (!attacker || !targetIsland || targetIsland.ownerId === attackerId) {
    throw new Error('Invalid attack');
  }

  const stealthEffect = targetIsland.defenseItems.some(item => 
    item.effects?.some(e => e.type === 'stealth')
  );
  
  if (stealthEffect) {
    throw new Error('目标岛屿处于隐形状态，无法攻击');
  }

  if (state.turn.currentTurn <= 5 && targetIsland.ownerId !== null) {
    throw new Error('前5回合不能攻击其他玩家的岛屿');
  }

  if (!attacker.equipment.weapon || attacker.equipment.weapon.id !== weapon.id) {
    const backpackWeapon = attacker.backpack.find(
      item => item.id === weapon.id && item.type === 'weapon'
    ) as Weapon | undefined;
    
    if (!backpackWeapon) {
      throw new Error('Weapon not available');
    }
  }

  const { damage, isCritical } = calculateDamage(weapon, targetIsland);
  
  targetIsland.shield.currentHp = Math.max(0, targetIsland.shield.currentHp - damage);
  
  const islandAttack = targetIsland.attack || 10;
  let counterDamage = 0;
  let reflectDamage = 0;
  
  const reflectEffect = targetIsland.defenseItems.find(item => 
    item.effects?.some(e => e.type === 'reflect')
  );
  if (reflectEffect) {
    const reflectValue = reflectEffect.effects?.find(e => e.type === 'reflect')?.value || 0;
    reflectDamage = Math.floor(damage * reflectValue / 100);
  }
  
  if (targetIsland.shield.currentHp > 0) {
    counterDamage = Math.floor(islandAttack * (0.9 + Math.random() * 0.2));
    
    const totalDefense = attacker.equipment.defense.reduce((total, item) => {
      if (item.effects) {
        const defenseEffect = item.effects.find(e => e.type === 'damage_reduction');
        return total + (defenseEffect?.value || 0);
      }
      return total;
    }, 0);
    
    counterDamage = Math.max(1, Math.floor(counterDamage * (1 - totalDefense / 100)));
  }

  const splashEffect = weapon.effects?.find(e => e.type === 'splash');
  const splashDamageResults: { islandId: string; damage: number }[] = [];
  
  if (splashEffect) {
    const splashDamagePercent = splashEffect.value;
    const splashDamage = Math.floor(damage * splashDamagePercent / 100);
    
    const connectedIslandIds = state.connections
      .filter(conn => conn.from === targetIslandId || conn.to === targetIslandId)
      .map(conn => conn.from === targetIslandId ? conn.to : conn.from);
    
    connectedIslandIds.forEach(islandId => {
      const splashTarget = newState.islands.find(i => i.id === islandId);
      if (splashTarget && splashTarget.ownerId !== attackerId) {
        splashTarget.shield.currentHp = Math.max(0, splashTarget.shield.currentHp - splashDamage);
        splashDamageResults.push({ islandId, damage: splashDamage });
      }
    });
  }

  if (reflectDamage > 0) {
    attacker.gold = Math.max(0, attacker.gold - reflectDamage);
  }

  if (attacker.equipment.weapon?.id === weapon.id) {
    attacker.equipment.weapon = null;
  } else {
    attacker.backpack = attacker.backpack.filter(item => item.id !== weapon.id);
  }
  newState.turn.actionsThisTurn.attacks++;

  const result: AttackResult = {
    attackerId,
    targetIslandId,
    weapon,
    damage,
    isCritical,
    shieldRemaining: targetIsland.shield.currentHp,
    isConquerable: targetIsland.shield.currentHp === 0,
    counterDamage: counterDamage > 0 ? counterDamage : undefined,
  };

  newState.updatedAt = Date.now();

  return { newState, result, splashDamageResults: splashDamageResults.length > 0 ? splashDamageResults : undefined };
}

export function conquerIsland(
  state: GameState,
  attackerId: string,
  targetIslandId: string,
  currentTurn: number = 1
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const attacker = newState.players.find(p => p.id === attackerId);
  const targetIsland = newState.islands.find(i => i.id === targetIslandId);

  if (!attacker || !targetIsland || targetIsland.shield.currentHp > 0) {
    throw new Error('Cannot conquer island');
  }

  const previousOwnerId = targetIsland.ownerId;
  if (previousOwnerId) {
    const previousOwner = newState.players.find(p => p.id === previousOwnerId);
    if (previousOwner) {
      previousOwner.islandIds = previousOwner.islandIds.filter(id => id !== targetIslandId);
      previousOwner.stats.islandsLost++;
    }
  }

  const originalMaxHp = targetIsland.shield.maxHp;
  
  targetIsland.ownerId = attackerId;
  attacker.islandIds.push(targetIslandId);
  attacker.stats.islandsConquered++;

  targetIsland.shield = {
    type: targetIsland.shield.type,
    maxHp: targetIsland.shield.maxHp,
    currentHp: Math.floor(targetIsland.shield.maxHp * 0.3),
    damageReductionPercent: targetIsland.shield.damageReductionPercent,
    selfRepairPerTurn: targetIsland.shield.selfRepairPerTurn,
  };

  targetIsland.conquestInfo = {
    turnConquered: currentTurn,
    originalMaxHp: originalMaxHp,
    restoreTurns: 2,
  };

  newState.updatedAt = Date.now();

  return newState;
}

export function generateShopItems(turn: number, forceRare: boolean = false): ShopItem[] {
  const items: ShopItem[] = [];
  const usedIds = new Set<string>();

  const weaponPool = WEAPONS.filter(e => !usedIds.has(e.id));
  const defensePool = DEFENSE_ITEMS.filter(e => !usedIds.has(e.id));
  const economyPool = ECONOMY_ITEMS.filter(e => !usedIds.has(e.id));
  const consumablePool = CONSUMABLES.filter(e => !usedIds.has(e.id));

  const pools = [
    { pool: weaponPool, type: 'weapon' },
    { pool: defensePool, type: 'defense' },
    { pool: economyPool, type: 'economy' },
    { pool: consumablePool, type: 'consumable' },
  ];

  const typeIndices = [0, 1, 2, 3, Math.floor(Math.random() * 4)];
  
  for (const typeIndex of typeIndices) {
    const { pool } = pools[typeIndex];
    if (pool.length === 0) continue;

    const available = pool.filter(e => !usedIds.has(e.id));
    if (available.length === 0) continue;

    const equipment = available[Math.floor(Math.random() * available.length)];
    usedIds.add(equipment.id);

    const priceModifier = 0.8 + Math.random() * 0.4;
    const isRareItem = equipment.rarity === Rarity.EPIC || equipment.rarity === Rarity.LEGENDARY;

    items.push({
      equipment: {
        ...equipment,
        currentPrice: Math.floor(equipment.basePrice * priceModifier * (isRareItem ? 1.3 : 1)),
      },
      quantity: 1,
      priceModifier,
      isRareItem,
      available: true,
    });
  }

  return items;
}

export function buyItem(
  state: GameState,
  playerId: string,
  itemIndex: number
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players.find(p => p.id === playerId);
  const shopItem = newState.shop.items[itemIndex];

  if (!player || !shopItem || !shopItem.available) {
    throw new Error('Invalid purchase');
  }

  if (player.gold < shopItem.equipment.currentPrice) {
    throw new Error('Not enough gold');
  }

  player.gold -= shopItem.equipment.currentPrice;
  player.backpack.push({ ...shopItem.equipment });
  player.stats.itemsBought++;
  
  shopItem.available = false;
  newState.turn.actionsThisTurn.purchases++;
  newState.updatedAt = Date.now();

  return newState;
}

export function sellItem(
  state: GameState,
  playerId: string,
  itemIndex: number
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players.find(p => p.id === playerId);
  
  if (!player || itemIndex < 0 || itemIndex >= player.backpack.length) {
    throw new Error('Invalid sale');
  }

  const item = player.backpack[itemIndex];
  let sellPrice = Math.floor(item.basePrice * GAME_CONSTANTS.SELL_PRICE_RATIO);

  if (item.type === 'consumable') {
    sellPrice = Math.floor(item.basePrice * GAME_CONSTANTS.SELL_CONSUMABLE_RATIO);
  }

  player.gold += sellPrice;
  player.backpack.splice(itemIndex, 1);
  player.stats.itemsSold++;
  newState.turn.actionsThisTurn.sales++;
  newState.updatedAt = Date.now();

  return newState;
}

export function generateDriftBottle(
  playerId: string,
  guaranteedRarity?: Rarity
): DriftBottle {
  return {
    id: uuidv4(),
    ownerId: playerId,
    opened: false,
    guaranteedRarity,
  };
}

export function openDriftBottle(
  state: GameState,
  playerId: string,
  bottleId: string
): { newState: GameState; equipment: Equipment } {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players.find(p => p.id === playerId);
  const bottleIndex = newState.driftBottles.findIndex(b => b.id === bottleId && !b.opened);

  if (!player || bottleIndex === -1) {
    throw new Error('Invalid bottle');
  }

  const bottle = newState.driftBottles[bottleIndex];
  let selectedRarity = Rarity.COMMON;

  if (bottle.guaranteedRarity) {
    selectedRarity = bottle.guaranteedRarity;
  } else {
    const hasLuckyCharm = player.equipment.economy?.effects.some(e => e.type === 'lucky_bottle');
    const luckyBonus = hasLuckyCharm ? 5 : 0;

    const roll = Math.random() * 100;
    let cumulative = 0;

    for (const config of RARITY_CONFIG) {
      const probability = config.baseProbability * 100 + (config.luckyBonus + luckyBonus) * 100;
      cumulative += probability;
      if (roll < cumulative) {
        selectedRarity = config.rarity;
        break;
      }
    }
  }

  const pool: Equipment[] = [
    ...WEAPONS.filter(w => w.rarity === selectedRarity),
    ...DEFENSE_ITEMS.filter(d => d.rarity === selectedRarity),
    ...ECONOMY_ITEMS.filter(e => e.rarity === selectedRarity),
    ...CONSUMABLES.filter(c => c.rarity === selectedRarity),
  ];

  if (pool.length === 0) {
    const fallbackPool = [
      ...WEAPONS.filter(w => w.rarity === Rarity.COMMON),
      ...DEFENSE_ITEMS.filter(d => d.rarity === Rarity.COMMON),
    ];
    pool.push(...fallbackPool);
  }

  const equipment = { ...pool[Math.floor(Math.random() * pool.length)] };
  equipment.currentPrice = equipment.basePrice;

  player.backpack.push(equipment);
  bottle.opened = true;
  player.stats.bottlesOpened++;
  newState.updatedAt = Date.now();

  return { newState, equipment };
}

export function refreshShop(state: GameState, playerId: string): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players.find(p => p.id === playerId);

  if (!player) {
    throw new Error('Player not found');
  }

  if (player.gold < newState.shop.refreshCost) {
    throw new Error('Not enough gold');
  }

  player.gold -= newState.shop.refreshCost;
  newState.shop.items = generateShopItems(newState.turn.currentTurn);
  newState.shop.refreshCount++;
  newState.shop.refreshCost *= 2;
  newState.updatedAt = Date.now();

  return newState;
}

export function restoreConqueredIslands(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const currentTurn = newState.turn.currentTurn;

  newState.islands.forEach(island => {
    if (island.conquestInfo && island.ownerId) {
      const turnsSinceConquest = currentTurn - island.conquestInfo.turnConquered;
      
      if (turnsSinceConquest >= island.conquestInfo.restoreTurns) {
        island.shield.currentHp = island.conquestInfo.originalMaxHp;
        island.shield.maxHp = island.conquestInfo.originalMaxHp;
        delete island.conquestInfo;
      }
    }
  });

  newState.updatedAt = Date.now();
  return newState;
}

export function applyActiveEffects(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  newState.players.forEach(player => {
    if (player.activeEffects && player.activeEffects.length > 0) {
      player.activeEffects = player.activeEffects.filter(effect => {
        effect.remainingTurns--;
        return effect.remainingTurns > 0;
      });
    }
    
    if (player.equipment.economy && player.equipment.economy.effects) {
      player.equipment.economy.effects.forEach(effect => {
        if (effect.durationInTurns && effect.durationInTurns > 0) {
          const existingEffect = player.activeEffects?.find(
            e => e.type === effect.type && e.source === player.equipment.economy?.id
          );
          
          if (!existingEffect) {
            player.activeEffects = player.activeEffects || [];
            player.activeEffects.push({
              type: effect.type,
              value: effect.value,
              remainingTurns: effect.durationInTurns,
              source: player.equipment.economy!.id,
            });
          }
        }
      });
    }
    
    if (player.equipment.defense) {
      player.equipment.defense.forEach(defenseItem => {
        if (defenseItem.effects) {
          defenseItem.effects.forEach(effect => {
            if (effect.durationInTurns && effect.durationInTurns > 0) {
              const existingEffect = player.activeEffects?.find(
                e => e.type === effect.type && e.source === defenseItem.id
              );
              
              if (!existingEffect) {
                player.activeEffects = player.activeEffects || [];
                player.activeEffects.push({
                  type: effect.type,
                  value: effect.value,
                  remainingTurns: effect.durationInTurns,
                  source: defenseItem.id,
                });
              }
            }
          });
        }
      });
    }
  });

  newState.updatedAt = Date.now();
  return newState;
}

export function hasActiveEffect(player: Player, effectType: string): boolean {
  return player.activeEffects?.some(e => e.type === effectType) || false;
}

export function getActiveEffectValue(player: Player, effectType: string): number {
  const effects = player.activeEffects?.filter(e => e.type === effectType) || [];
  return effects.reduce((total, e) => total + e.value, 0);
}