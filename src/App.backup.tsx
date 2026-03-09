import { useState } from 'react';
import { useGameState } from './game/useGameState';
import { Equipment } from './types/game';
import { IslandCard } from './components/IslandCard';
import { IslandDetailModal } from './components/IslandDetailModal';
import { ItemGrid, ItemDetail } from './components/ItemGrid';
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
    openBottle,
    refreshShopItems,
    endTurn,
  } = useGameState();

  const [playerNames, setPlayerNames] = useState<string[]>(['玩家1', '玩家2']);
  const [selectedIslandId, setSelectedIslandId] = useState<string | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  const [showBottles, setShowBottles] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ item: Equipment; context: 'shop' | 'backpack' | 'bottle'; index: number } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotificationMsg = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

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
    !b.opened && gameState.turn.currentTurn > 0
  );

  const canAttackIsland = (islandId: string) => {
    const island = gameState.islands.find(i => i.id === islandId);
    return island && island.ownerId !== currentPlayer.id && currentPlayer.equipment.weapon;
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
              <div className="player-gold">💰 {currentPlayer.gold}</div>
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
          <button className="icon-btn" onClick={saveGame} title="保存">
            💾
          </button>
          <button className="end-turn-btn" onClick={endTurn}>
            结束回合 →
          </button>
        </div>
      </header>

      <main className="game-main">
        <div className="islands-container">
          {gameState.islands.map((island) => {
            const owner = gameState.players.find(p => p.id === island.ownerId);
            return (
              <IslandCard
                key={island.id}
                island={island}
                owner={owner || null}
                isSelected={selectedIslandId === island.id}
                onClick={() => setSelectedIslandId(island.id)}
              />
            );
          })}
        </div>
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
              items={gameState.shop.items.filter(i => i.available).map(i => i.equipment)}
              onItemClick={(item, index) => setSelectedItem({ item, context: 'shop', index })}
              showPrice={true}
            />
            <div className="modal-actions">
              <button onClick={() => {
                if (refreshShopItems()) {
                  showNotificationMsg('商店已刷新!');
                }
              }} disabled={currentPlayer.gold < 50}>
                🔄 刷新商店 (50金币)
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
              onItemClick={(item, index) => setSelectedItem({ item, context: 'backpack', index })}
              actionLabel="出售"
              onItemAction={(item, index) => {
                if (sellItemFromBackpack(index)) {
                  showNotificationMsg(`已出售 ${item.name}`);
                }
              }}
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

      {selectedItem && (
        <ItemDetail
          item={selectedItem.item}
          onClose={() => setSelectedItem(null)}
          onAction={
            selectedItem.context === 'shop'
              ? () => {
                  if (purchaseItem(selectedItem.index)) {
                    showNotificationMsg(`购买成功!`);
                    setSelectedItem(null);
                  }
                }
              : undefined
          }
          actionLabel={selectedItem.context === 'shop' ? '购买' : undefined}
          showPrice={selectedItem.context === 'shop'}
        />
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