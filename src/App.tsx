import { useState, useEffect } from 'react';
import { useGameState } from './game/useGameState';
import { Equipment } from './types/game';
import { IslandDetailModal } from './components/IslandDetailModal';
import { ItemGrid, ItemDetail } from './components/ItemGrid';
import { IslandMap } from './components/IslandMap';
import { getAllEquipment } from './data/equipment';
import './App.css';

function App() {
  const {
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
  } = useGameState();

  const [playerNames, setPlayerNames] = useState<string[]>(['玩家1', '玩家2']);
  const [selectedIslandId, setSelectedIslandId] = useState<string | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  const [showBottles, setShowBottles] = useState(false);
  const [showItemGuide, setShowItemGuide] = useState(false);
  const [showIslandSelector, setShowIslandSelector] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [selectedItemForUse, setSelectedItemForUse] = useState<{ item: Equipment; index: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ item: Equipment; context: 'shop' | 'backpack' | 'bottle'; index: number } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotificationMsg = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  useEffect(() => {
    if (gameState?.lastIncome) {
      setShowIncomeModal(true);
    }
  }, [gameState?.lastIncome?.playerId, gameState?.lastIncome?.totalIncome]);

  if (!gameState) {
    return (
      <div className="setup-screen">
        <h1>🏝️ 岛屿争夺战</h1>
        <div className="player-setup">
          <h2>玩家设置</h2>
          {playerNames.map((name, index) => (
            <input
              key={index}
              type="text"
              value={name}
              onChange={(e) => {
                const newNames = [...playerNames];
                newNames[index] = e.target.value;
                setPlayerNames(newNames);
              }}
              placeholder={`玩家${index + 1}`}
            />
          ))}
          <button
            onClick={() => setPlayerNames([...playerNames, `玩家${playerNames.length + 1}`])}
            disabled={playerNames.length >= 4}
          >
            添加玩家
          </button>
        </div>
        <div className="setup-actions">
          <button onClick={() => startNewGame(playerNames)}>开始新游戏</button>
          <button onClick={loadGame}>继续游戏</button>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.turn.currentPlayerIndex];
  const selectedIsland = selectedIslandId ? gameState.islands.find(i => i.id === selectedIslandId) : null;
  const selectedIslandOwner = selectedIsland ? gameState.players.find(p => p.id === selectedIsland.ownerId) : null;

  const currentPlayerBottles = gameState.driftBottles.filter(b => 
    !b.opened && b.ownerId === currentPlayer.id
  );

  const canAttackIsland = (islandId: string) => {
    const island = gameState.islands.find(i => i.id === islandId);
    if (!island || island.ownerId === currentPlayer.id || !currentPlayer.equipment.weapon) {
      return false;
    }
    
    const isAdjacentToPlayerIsland = gameState.connections.some(conn => {
      const isConnected = (conn.from === islandId && currentPlayer.islandIds.includes(conn.to)) ||
                          (conn.to === islandId && currentPlayer.islandIds.includes(conn.from));
      return isConnected;
    });
    
    return isAdjacentToPlayerIsland;
  };

  return (
    <div className="game-container">
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#4CAF50',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 2000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {notification}
        </div>
      )}

      <header className="game-header">
        <div className="header-left">
          <h1>🏝️ 岛屿争夺战</h1>
          <div className="turn-badge">
            回合 {gameState.turn.currentTurn}
          </div>
        </div>
        
        <div className="header-center">
          <div className="current-player" style={{ borderColor: currentPlayer.color }}>
            <div className="player-avatar" style={{ background: currentPlayer.color }}>
              {currentPlayer.name[0]}
            </div>
            <div className="player-info">
              <div className="player-name">{currentPlayer.name}</div>
              <div className="player-gold">
                {(() => {
                  const baseIsland = gameState.islands.find(i => i.id === currentPlayer.islandIds[0]);
                  return baseIsland ? `❤️ ${baseIsland.shield.currentHp}/${baseIsland.shield.maxHp}` : '';
                })()} | 💰 {currentPlayer.gold}
              </div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <button className="icon-btn" onClick={() => setShowShop(true)} title="商店">
            🏪
          </button>
          <button className="icon-btn" onClick={() => setShowBackpack(true)} title="背包">
            🎒 {currentPlayer.backpack.length > 0 && <span className="badge">{currentPlayer.backpack.length}</span>}
          </button>
          <button className="icon-btn" onClick={() => setShowBottles(true)} title="漂流瓶">
            🍾 {currentPlayerBottles.length > 0 && <span className="badge">{currentPlayerBottles.length}</span>}
          </button>
          <button className="icon-btn" onClick={() => setShowItemGuide(true)} title="道具图鉴">
            📖
          </button>
          <button className="icon-btn" onClick={saveGame} title="保存">
            💾
          </button>
          <button className="end-turn-btn" onClick={endTurn}>
            结束回合 →
          </button>
        </div>
      </header>

      <main className="game-main">
        <IslandMap
          gameState={gameState}
          selectedIslandId={selectedIslandId}
          onIslandClick={setSelectedIslandId}
          currentPlayerId={currentPlayer.id}
        />
      </main>

      {selectedIsland && (
        <IslandDetailModal
          island={selectedIsland}
          owner={selectedIslandOwner || null}
          currentPlayer={currentPlayer}
          canAttack={!!canAttackIsland(selectedIsland.id)}
          onClose={() => setSelectedIslandId(null)}
          onAttack={(weapon) => {
            const result = attack(selectedIsland.id, weapon);
            if (result) {
              showNotificationMsg(`造成 ${result.damage} 点伤害!`);
              if (result.isCritical) showNotificationMsg('暴击!');
              if (result.counterDamage) {
                showNotificationMsg(`岛屿反击，你受到 ${result.counterDamage} 点伤害!`);
              }
            }
          }}
          onConquer={() => {
            if (conquer(selectedIsland.id)) {
              showNotificationMsg('成功占领岛屿!');
              setSelectedIslandId(null);
            }
          }}
        />
      )}

      {showShop && (
        <div className="modal" onClick={() => setShowShop(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏪 商店</h2>
              <div className="player-gold-display">
                💰 {currentPlayer.gold}
              </div>
            </div>
            <ItemGrid
              items={gameState.shop.items.map(i => i.available ? i.equipment : null)}
              onItemClick={(item, index) => {
                if (item && gameState.shop.items[index].available) {
                  setSelectedItem({ item, context: 'shop', index });
                }
              }}
              showPrice={true}
            />
            <div className="modal-actions">
              <button onClick={() => {
                try {
                  if (refreshShopItems()) {
                    showNotificationMsg('商店已刷新!');
                  }
                } catch (error) {
                  showNotificationMsg(`刷新失败: ${error.message}`);
                }
              }} disabled={currentPlayer.gold < gameState.shop.refreshCost}>
                🔄 刷新商店 ({gameState.shop.refreshCost}金币)
              </button>
              <button onClick={() => setShowShop(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showBackpack && (
        <div className="modal" onClick={() => setShowBackpack(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎒 背包</h2>
              <div className="player-gold-display">
                💰 {currentPlayer.gold}
              </div>
            </div>
            <ItemGrid
              items={currentPlayer.backpack}
              onItemClick={(item, index) => {
                if (item.type === 'consumable') {
                  setSelectedItemForUse({ item, index });
                  setShowIslandSelector(true);
                }
              }}
              onItemAction={(item, index) => {
                if (item.type === 'consumable') {
                  setSelectedItemForUse({ item, index });
                  setShowIslandSelector(true);
                } else {
                  if (equipItem(index)) {
                    showNotificationMsg(`装备成功!`);
                  }
                }
              }}
              actionLabel="装备"
            />
            <div className="modal-actions">
              <button onClick={() => setShowBackpack(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showBottles && (
        <div className="modal" onClick={() => setShowBottles(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🍾 漂流瓶</h2>
              <span>{currentPlayerBottles.length} 个未开启</span>
            </div>
            <div className="bottles-grid">
              {currentPlayerBottles.map((bottle) => (
                <button
                  key={bottle.id}
                  className="bottle-item"
                  onClick={() => {
                    const item = openBottle(bottle.id);
                    if (item) {
                      setSelectedItem({ item, context: 'bottle', index: 0 });
                      showNotificationMsg(`获得 ${item.name}!`);
                    }
                  }}
                >
                  <span className="bottle-icon">🍾</span>
                  <span className="bottle-text">点击开启</span>
                </button>
              ))}
              {currentPlayerBottles.length === 0 && (
                <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                  暂无漂流瓶，回合结束后可获得
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowBottles(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showItemGuide && (
        <div className="modal" onClick={() => setShowItemGuide(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📖 道具图鉴</h2>
              <button onClick={() => setShowItemGuide(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px', width: '60px', textAlign: 'center' }}>编号</th>
                    <th style={{ padding: '10px', width: '120px', textAlign: 'center' }}>名称</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>介绍</th>
                  </tr>
                </thead>
                <tbody>
                  {getAllEquipment().map((item, index) => {
                    let effectDetails = '';
                    
                    if (item.type === 'weapon' && 'attack' in item) {
                      const effects: string[] = [];
                      effects.push(`攻击力:${item.attack}`);
                      if (item.criticalChance) effects.push(`暴击率:${item.criticalChance}%`);
                      if (item.effects) {
                        item.effects.forEach(e => {
                          if (e.type === 'penetration') effects.push(`穿透(无视${e.value}%减伤)`);
                          if (e.type === 'splash') effects.push(`溅射(${e.value}%伤害波及相邻岛屿)`);
                          if (e.type === 'guaranteed_crit') effects.push(`必定暴击`);
                        });
                      }
                      effectDetails = effects.join(' | ');
                    }
                    
                    if (item.type === 'defense' && 'effects' in item && item.effects) {
                      const effects: string[] = [];
                      item.effects.forEach(e => {
                        if (e.type === 'damage_reduction') effects.push(`减伤${e.value}%`);
                        if (e.type === 'self_repair') effects.push(`每回合恢复${e.value}HP`);
                        if (e.type === 'reflect') effects.push(`反弹${e.value}%伤害`);
                        if (e.type === 'stealth') effects.push(`隐形${e.durationInTurns}回合(无法被攻击)`);
                      });
                      effectDetails = effects.join(' | ');
                    }
                    
                    if (item.type === 'economy' && 'effects' in item && item.effects) {
                      const effects: string[] = [];
                      item.effects.forEach(e => {
                        if (e.type === 'gold_bonus') effects.push(`金币产出+${e.value}%`);
                        if (e.type === 'double_income') effects.push(`下回合金币翻倍`);
                        if (e.type === 'lucky_bottle') effects.push(`漂流瓶稀有度提升`);
                        if (e.type === 'extra_attack') effects.push(`额外攻击${e.value}次`);
                        if (e.type === 'free_refresh') effects.push(`商店刷新免费`);
                        if (e.type === 'rare_shop') effects.push(`商店必出稀有道具`);
                      });
                      effectDetails = effects.join(' | ');
                    }
                    
                    if (item.type === 'consumable' && 'effect' in item) {
                      const e = item.effect;
                      if (e.type === 'self_repair') {
                        effectDetails = e.value >= 9999 ? `护盾恢复至满HP` : `恢复${e.value}点护盾HP`;
                      }
                    }
                    
                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedItem({ item, context: 'shop', index: 0 })}
                        style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      >
                        <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{index + 1}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ marginRight: '8px', fontSize: '18px' }}>{item.icon}</span>
                          <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                        </td>
                        <td style={{ padding: '12px', color: '#333' }}>
                          <div>{item.description}</div>
                          <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>{effectDetails}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowItemGuide(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showIslandSelector && selectedItemForUse && (
        <div className="modal" onClick={() => setShowIslandSelector(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏝️ 选择目标岛屿</h2>
              <span>{selectedItemForUse.item.name}</span>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {gameState.islands
                .filter(island => island.ownerId === currentPlayer.id)
                .map(island => (
                  <button
                    key={island.id}
                    onClick={() => {
                      try {
                        if (useConsumable(selectedItemForUse.index, island.id)) {
                          showNotificationMsg(`已对 ${island.name} 使用 ${selectedItemForUse.item.name}!`);
                          setShowIslandSelector(false);
                          setSelectedItemForUse(null);
                        }
                      } catch (error) {
                        showNotificationMsg(`使用失败: ${error.message}`);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      margin: '8px 0',
                      background: '#f5f5f5',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{island.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      HP: {island.shield.currentHp}/{island.shield.maxHp}
                    </div>
                  </button>
                ))}
            </div>
            <div className="modal-actions">
              <button onClick={() => {
                setShowIslandSelector(false);
                setSelectedItemForUse(null);
              }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <ItemDetail
          item={selectedItem.item}
          onClose={() => setSelectedItem(null)}
          onAction={
            selectedItem.context === 'shop'
              ? () => {
                  try {
                    if (purchaseItem(selectedItem.index)) {
                      showNotificationMsg(`购买成功!`);
                      setSelectedItem(null);
                    }
                  } catch (error) {
                    showNotificationMsg(`购买失败: ${error.message}`);
                  }
                }
              : undefined
          }
          actionLabel={selectedItem.context === 'shop' ? '购买' : undefined}
          showPrice={selectedItem.context === 'shop'}
        />
      )}

      {gameState.lastIncome && showIncomeModal && (
        <div className="modal" onClick={() => setShowIncomeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '20px', color: '#4CAF50' }}>💰 金币收益</h2>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💵</div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#F59E0B',
              marginBottom: '20px' 
            }}>
              +{gameState.lastIncome.totalIncome} 金币
            </div>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '12px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>岛屿数量:</span>
                <span>{gameState.lastIncome.islandCount} 个</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>基础收益:</span>
                <span>{gameState.lastIncome.baseIncome} 金币</span>
              </div>
              {gameState.lastIncome.bonusMultiplier > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>收益加成:</span>
                  <span style={{ color: '#4CAF50' }}>x{gameState.lastIncome.bonusMultiplier.toFixed(1)}</span>
                </div>
              )}
              {gameState.lastIncome.hasDoubleIncome && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>双倍收益:</span>
                  <span style={{ color: '#9C27B0' }}>已激活</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowIncomeModal(false)}
              style={{ width: '100%' }}
            >
              确定
            </button>
          </div>
        </div>
      )}

      {gameState.winnerId && (
        <div className="modal">
          <div className="modal-content victory">
            <div className="victory-icon">🏆</div>
            <h2>游戏结束!</h2>
            <p className="winner-name">
              {gameState.players.find(p => p.id === gameState.winnerId)?.name} 获胜!
            </p>
            <button onClick={() => window.location.reload()}>重新开始</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;