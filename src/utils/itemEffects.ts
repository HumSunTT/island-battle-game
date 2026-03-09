import { GameState, Player,
  Island, Equipment, Consumable, DefenseItem } from '../types/game';

export function useConsumable(
  state: GameState,
  playerId: string,
  itemIndex: number,
  targetIslandId: string
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players.find(p => p.id === playerId);
  const island = newState.islands.find(i => i.id === targetIslandId);

  if (!player || !island || island.ownerId !== playerId) {
    throw new Error('Invalid use of consumable');
  }

  if (itemIndex < 0 || itemIndex >= player.backpack.length) {
    throw new Error('Item not found in backpack');
  }

  const item = player.backpack[itemIndex] as Consumable;

  if (item.type !== 'consumable') {
    throw new Error('Item is not a consumable');
  }

  if (item.effect.type === 'self_repair') {
    const healAmount = item.effect.value;
    island.shield.currentHp = Math.min(
      island.shield.maxHp,
      island.shield.currentHp + healAmount
    );
  }

  player.backpack.splice(itemIndex, 1);
  newState.updatedAt = Date.now();

  return newState;
}

export function applyDefenseEffects(island: Island): void {
  let totalReduction = island.shield.damageReductionPercent;
  let totalRepair = island.shield.selfRepairPerTurn;

  island.defenseItems.forEach((item: DefenseItem) => {
    item.effects.forEach(effect => {
      if (effect.type === 'damage_reduction') {
        totalReduction += effect.value;
      }
      if (effect.type === 'self_repair') {
        totalRepair += effect.value;
      }
    });
  });

  island.shield.damageReductionPercent = Math.min(totalReduction, 75);
  island.shield.selfRepairPerTurn = totalRepair;
}

export function calculateDamageWithDefense(
  baseDamage: number,
  targetIsland: Island
): number {
  let damage = baseDamage;

  const totalReduction = targetIsland.shield.damageReductionPercent;

  if (totalReduction > 0) {
    damage = damage * (1 - totalReduction / 100);
  }

  return Math.floor(damage);
}

export function applySelfRepairAll(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  newState.islands.forEach(island => {
    if (island.ownerId && island.shield.selfRepairPerTurn > 0) {
      island.shield.currentHp = Math.min(
        island.shield.maxHp,
        island.shield.currentHp + island.shield.selfRepairPerTurn
      );
    }
  });

  return newState;
}