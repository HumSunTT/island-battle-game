import { GameState, Player, Island, AIDecision, Equipment, Rarity } from '../types/game';
import { getCurrentPlayer } from '../game/gameInit';

export function evaluateIslandThreat(island: Island, aiPlayer: Player, state: GameState): number {
  if (island.ownerId === aiPlayer.id) {
    return 0;
  }

  let score = 50;

  const shieldRatio = island.shield.currentHp / island.shield.maxHp;
  if (shieldRatio < 0.3) {
    score += 30;
  } else if (shieldRatio < 0.5) {
    score += 15;
  }

  if (island.ownerId) {
    score += 20;
  }

  const owner = state.players.find(p => p.id === island.ownerId);
  if (owner && owner.islandIds.length === 1) {
    score += 25;
  }

  return score;
}

export function selectBestWeapon(player: Player): Equipment | null {
  const weapons = player.backpack.filter(
    item => item.type === 'weapon'
  );

  if (weapons.length === 0) {
    return player.equipment.weapon;
  }

  weapons.sort((a, b) => {
    if ('attack' in a && 'attack' in b) {
      return b.attack - a.attack;
    }
    return 0;
  });

  return weapons[0];
}

export function shouldBuyItem(player: Player, item: Equipment, state: GameState): boolean {
  if (player.gold < item.currentPrice) {
    return false;
  }

  if (player.backpack.length >= 6) {
    return false;
  }

  if (item.type === 'weapon') {
    return !player.equipment.weapon || player.backpack.filter(i => i.type === 'weapon').length < 2;
  }

  if (item.type === 'economy') {
    return !player.equipment.economy;
  }

  if (item.type === 'defense') {
    return player.equipment.defense.length < 2;
  }

  return item.rarity === Rarity.EPIC || item.rarity === Rarity.LEGENDARY;
}

export function makeAIDecision(state: GameState, aiPlayer: Player): AIDecision {
  const currentPlayer = getCurrentPlayer(state);

  if (currentPlayer.id !== aiPlayer.id) {
    return { type: 'pass', priority: 0, params: {} };
  }

  switch (state.turn.phase) {
    case 'shop': {
      const affordableItems = state.shop.items
        .filter(item => item.available && shouldBuyItem(aiPlayer, item.equipment, state))
        .sort((a, b) => {
          const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
          return rarityOrder[b.equipment.rarity] - rarityOrder[a.equipment.rarity];
        });

      if (affordableItems.length > 0) {
        return {
          type: 'buy',
          priority: 100,
          params: { itemIndex: state.shop.items.indexOf(affordableItems[0]) },
        };
      }

      return { type: 'pass', priority: 50, params: {} };
    }

    case 'action': {
      const targetIslands = state.islands
        .filter(island => island.ownerId !== aiPlayer.id)
        .map(island => ({
          island,
          score: evaluateIslandThreat(island, aiPlayer, state),
        }))
        .sort((a, b) => b.score - a.score);

      if (targetIslands.length === 0) {
        return { type: 'pass', priority: 0, params: {} };
      }

      const target = targetIslands[0].island;

      if (target.shield.currentHp === 0) {
        return {
          type: 'conquer',
          priority: 200,
          params: { islandId: target.id },
        };
      }

      const weapon = selectBestWeapon(aiPlayer);
      if (weapon) {
        return {
          type: 'attack',
          priority: 150,
          params: { islandId: target.id, weaponId: weapon.id },
        };
      }

      return { type: 'pass', priority: 30, params: {} };
    }

    default:
      return { type: 'pass', priority: 0, params: {} };
  }
}

export function executeAIDecision(
  state: GameState,
  decision: AIDecision,
  aiPlayer: Player
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  switch (decision.type) {
    case 'buy': {
      const itemIndex = decision.params.itemIndex as number;
      if (
        itemIndex >= 0 &&
        itemIndex < newState.shop.items.length &&
        newState.shop.items[itemIndex].available
      ) {
        const item = newState.shop.items[itemIndex];
        const player = newState.players.find(p => p.id === aiPlayer.id);
        if (player && player.gold >= item.equipment.currentPrice) {
          player.gold -= item.equipment.currentPrice;
          player.backpack.push(item.equipment);
          player.stats.itemsBought++;
          newState.shop.items[itemIndex].available = false;
        }
      }
      break;
    }

    case 'attack': {
      const islandId = decision.params.islandId as string;
      const weaponId = decision.params.weaponId as string;
      const targetIsland = newState.islands.find(i => i.id === islandId);
      const weapon = aiPlayer.equipment.weapon?.id === weaponId
        ? aiPlayer.equipment.weapon
        : aiPlayer.backpack.find(
            item => item.id === weaponId && item.type === 'weapon'
          ) as Equipment | undefined;

      if (targetIsland && weapon && 'attack' in weapon) {
        targetIsland.shield.currentHp = Math.max(
          0,
          targetIsland.shield.currentHp - weapon.attack
        );
        const player = newState.players.find(p => p.id === aiPlayer.id);
        if (player) {
          player.backpack = player.backpack.filter(i => i.id !== weaponId);
          if (player.equipment.weapon?.id === weaponId) {
            player.equipment.weapon = null;
          }
        }
      }
      break;
    }

    case 'conquer': {
      const islandId = decision.params.islandId as string;
      const targetIsland = newState.islands.find(i => i.id === islandId);
      const player = newState.players.find(p => p.id === aiPlayer.id);

      if (targetIsland && targetIsland.shield.currentHp === 0 && player) {
        const previousOwner = newState.players.find(p => p.id === targetIsland.ownerId);
        if (previousOwner) {
          previousOwner.islandIds = previousOwner.islandIds.filter(id => id !== islandId);
          previousOwner.stats.islandsLost++;
        }

        targetIsland.ownerId = aiPlayer.id;
        player.islandIds.push(islandId);
        player.stats.islandsConquered++;

        targetIsland.shield = {
          type: 'basic',
          maxHp: 50,
          currentHp: 50,
          damageReductionPercent: 0,
          selfRepairPerTurn: 0,
        };
      }
      break;
    }
  }

  newState.updatedAt = Date.now();
  return newState;
}