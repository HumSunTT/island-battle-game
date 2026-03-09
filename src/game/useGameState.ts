import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  GameConfig,
  AttackResult,
  Equipment,
  GamePhase,
  GameStatus,
} from '../types/game';
import {
  initializeGame,
  calculateIncome,
  checkVictory,
  checkDefeat,
  getCurrentPlayer,
} from './gameInit';
import {
  attackIsland,
  conquerIsland,
  generateShopItems,
  buyItem,
  sellItem,
  generateDriftBottle,
  openDriftBottle,
  refreshShop,
  restoreConqueredIslands,
  applyActiveEffects,
} from '../utils/gameLogic';
import { makeAIDecision, executeAIDecision } from '../utils/aiPlayer';

const SAVE_KEY = 'island_battle_save';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startNewGame = useCallback((playerNames: string[], config?: Partial<GameConfig>) => {
    const newGame = initializeGame(playerNames, config);
    newGame.shop.items = generateShopItems(1);
    setGameState(newGame);
  }, []);

  const loadGame = useCallback(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        setGameState(parsed);
        return true;
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
    return false;
  }, []);

  const saveGame = useCallback(() => {
    if (!gameState) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }, [gameState]);

  const attack = useCallback((
    targetIslandId: string,
    weapon: Equipment
  ): AttackResult | null => {
    if (!gameState) return null;

    try {
      const { newState, result } = attackIsland(
        gameState,
        getCurrentPlayer(gameState).id,
        targetIslandId,
        weapon as any
      );
      setGameState(newState);
      return result;
    } catch (error) {
      console.error('Attack failed:', error);
      return null;
    }
  }, [gameState]);

  const conquer = useCallback((targetIslandId: string) => {
    if (!gameState) return false;

    try {
      const newState = conquerIsland(
        gameState,
        getCurrentPlayer(gameState).id,
        targetIslandId,
        gameState.turn.currentTurn
      );
      
      const winnerId = checkVictory(newState);
      const defeatedIds = checkDefeat(newState);
      
      if (winnerId) {
        newState.winnerId = winnerId;
        newState.status = 'finished' as GameStatus;
      }
      
      setGameState(newState);
      
      return true;
    } catch (error) {
      console.error('Conquer failed:', error);
      return false;
    }
  }, [gameState]);

  const purchaseItem = useCallback((itemIndex: number) => {
    if (!gameState) return false;

    try {
      const newState = buyItem(gameState, getCurrentPlayer(gameState).id, itemIndex);
      setGameState(newState);
      return true;
    } catch (error) {
      console.error('Purchase failed:', error);
      return false;
    }
  }, [gameState]);

  const sellItemFromBackpack = useCallback((itemIndex: number) => {
    if (!gameState) return false;

    try {
      const newState = sellItem(gameState, getCurrentPlayer(gameState).id, itemIndex);
      setGameState(newState);
      return true;
    } catch (error) {
      console.error('Sell failed:', error);
      return false;
    }
  }, [gameState]);

  const equipItem = useCallback((itemIndex: number): boolean => {
    if (!gameState) return false;

    setGameState(prev => {
      if (!prev) return null;

      const currentPlayer = getCurrentPlayer(prev);
      const item = currentPlayer.backpack[itemIndex];
      
      if (!item) return prev;

      const newState = JSON.parse(JSON.stringify(prev)) as GameState;
      const player = newState.players.find(p => p.id === currentPlayer.id);
      
      if (!player) return prev;

      switch (item.type) {
        case 'weapon':
          if (player.equipment.weapon) {
            player.backpack.push(player.equipment.weapon);
          }
          player.equipment.weapon = item;
          break;
        case 'defense':
          if (player.equipment.defense.length >= 2) {
            player.backpack.push(player.equipment.defense.shift()!);
          }
          player.equipment.defense.push(item);
          break;
        case 'economy':
          if (player.equipment.economy) {
            player.backpack.push(player.equipment.economy);
          }
          player.equipment.economy = item;
          break;
        case 'consumable':
          return prev;
      }

      player.backpack.splice(itemIndex, 1);
      newState.updatedAt = Date.now();
      
      return newState;
    });

    return true;
  }, [gameState]);

  const useConsumable = useCallback((
    itemIndex: number,
    targetIslandId: string
  ): boolean => {
    if (!gameState) return false;

    try {
      setGameState(prev => {
        if (!prev) return null;

        const currentPlayer = getCurrentPlayer(prev);
        const item = currentPlayer.backpack[itemIndex];

        if (!item || item.type !== 'consumable') return prev;

        const targetIsland = prev.islands.find(i => i.id === targetIslandId);
        if (!targetIsland || targetIsland.ownerId !== currentPlayer.id) return prev;

        const newState = JSON.parse(JSON.stringify(prev)) as GameState;
        const player = newState.players.find(p => p.id === currentPlayer.id);
        const island = newState.islands.find(i => i.id === targetIslandId);

        if (!player || !island) return prev;

        const consumable = item as any;
        if (consumable.effect && consumable.effect.type === 'self_repair') {
          const healAmount = consumable.effect.value;
          island.shield.currentHp = Math.min(
            island.shield.maxHp,
            island.shield.currentHp + healAmount
          );
        }

        player.backpack.splice(itemIndex, 1);
        newState.updatedAt = Date.now();

        return newState;
      });

      return true;
    } catch (error) {
      console.error('Use consumable failed:', error);
      return false;
    }
  }, [gameState]);

  const openBottle = useCallback((bottleId: string): Equipment | null => {
    if (!gameState) return null;

    try {
      const { newState, equipment } = openDriftBottle(
        gameState,
        getCurrentPlayer(gameState).id,
        bottleId
      );
      setGameState(newState);
      return equipment;
    } catch (error) {
      console.error('Open bottle failed:', error);
      return null;
    }
  }, [gameState]);

  const refreshShopItems = useCallback(() => {
    if (!gameState) return false;

    try {
      const newState = refreshShop(gameState, getCurrentPlayer(gameState).id);
      setGameState(newState);
      return true;
    } catch (error) {
      console.error('Refresh shop failed:', error);
      return false;
    }
  }, [gameState]);

  const endTurn = useCallback(() => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;

      const currentPlayerIndex = prev.turn.currentPlayerIndex;
      const newPlayerIndex = (currentPlayerIndex + 1) % prev.players.length;
      const isNewRound = newPlayerIndex === 0;
      const newTurn = isNewRound ? prev.turn.currentTurn + 1 : prev.turn.currentTurn;
      
      const currentPlayer = prev.players[currentPlayerIndex];
      const nextPlayer = prev.players[newPlayerIndex];
      
      let income = 0;
      let baseIncome = 0;
      let bonusMultiplier = 1;
      let hasDoubleIncome = false;
      let islandCount = 0;
      
      const newPlayers = prev.players.map((player, index) => {
        if (index === currentPlayerIndex) {
          const playerIslands = prev.islands.filter(island => island.ownerId === player.id);
          islandCount = playerIslands.length;
          baseIncome = playerIslands.reduce((total, island) => total + island.goldPerTurn, 0);
          bonusMultiplier = player.equipment.economy?.effects.some(e => e.type === 'gold_bonus')
            ? (player.equipment.economy?.effects.find(e => e.type === 'gold_bonus')?.value || 0) / 100 + 1
            : 1;
          hasDoubleIncome = player.equipment.economy?.effects.some(e => e.type === 'double_income') || false;
          income = Math.floor(baseIncome * bonusMultiplier);
          if (hasDoubleIncome) {
            income *= 2;
          }
          return {
            ...player,
            gold: player.gold + income,
            hasCollectedIncome: true,
          };
        }
        return player;
      });
      
      const finalPlayers = isNewRound 
        ? newPlayers.map(p => ({ ...p, hasCollectedIncome: false }))
        : newPlayers;

      const newBottle = generateDriftBottle(nextPlayer.id);

      const newShopItems = generateShopItems(newTurn);

      let newState: GameState = {
        ...prev,
        players: finalPlayers,
        lastIncome: income > 0 ? {
          playerId: currentPlayer.id,
          baseIncome,
          bonusMultiplier,
          hasDoubleIncome,
          totalIncome: income,
          islandCount,
        } : prev.lastIncome,
        shop: {
          ...prev.shop,
          items: newShopItems,
          refreshCount: 0,
          refreshCost: 50,
        },
        turn: {
          ...prev.turn,
          currentTurn: newTurn,
          currentPlayerIndex: newPlayerIndex,
          phase: 'action' as GamePhase,
          phaseTimeRemaining: prev.config.turnDuration,
          actionsThisTurn: {
            attacks: 0,
            itemsUsed: 0,
            purchases: 0,
            sales: 0,
          },
        },
        driftBottles: [...prev.driftBottles, newBottle],
        updatedAt: Date.now(),
      };

      newState = restoreConqueredIslands(newState);
      newState = applyActiveEffects(newState);

      const winnerId = checkVictory(newState);
      if (winnerId) {
        newState.winnerId = winnerId;
        newState.status = 'finished' as GameStatus;
      }

      return newState;
    });
  }, [gameState]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;

    const currentPlayer = getCurrentPlayer(gameState);
    
    if (currentPlayer.isAI && gameState.turn.phase !== 'settlement') {
      const aiActionTimer = setTimeout(() => {
        const decision = makeAIDecision(gameState, currentPlayer);
        
        if (decision.type !== 'pass') {
          setGameState(prev => {
            if (!prev) return null;
            return executeAIDecision(prev, decision, currentPlayer);
          });
        }
        
        setTimeout(() => {
          endTurn();
        }, 500);
      }, 1000);

      return () => clearTimeout(aiActionTimer);
    }
  }, [gameState?.turn.currentPlayerIndex, gameState?.turn.phase, gameState?.status]);

  return {
    gameState,
    startNewGame,
    loadGame,
    saveGame,
    attack,
    conquer,
    purchaseItem,
    sellItemFromBackpack,
    equipItem,
    useConsumable,
    openBottle,
    refreshShopItems,
    endTurn,
  };
}