import React from 'react';
import { Player, Island, Equipment, Rarity } from '../types/game';

interface PlayerDetailModalProps {
  player: Player;
  islands: Island[];
  onClose: () => void;
}

const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.COMMON]: '#9CA3AF',
  [Rarity.RARE]: '#3B82F6',
  [Rarity.EPIC]: '#A855F7',
  [Rarity.LEGENDARY]: '#F59E0B',
};

const RARITY_NAMES: Record<Rarity, string> = {
  [Rarity.COMMON]: '普通',
  [Rarity.RARE]: '稀有',
  [Rarity.EPIC]: '史诗',
  [Rarity.LEGENDARY]: '传说',
};

export function PlayerDetailModal({ player, islands, onClose }: PlayerDetailModalProps) {
  const playerIslands = islands.filter(i => i.ownerId === player.id);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '25px',
          paddingBottom: '20px',
          borderBottom: '2px solid #f0f0f0',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: player.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: 'white',
            fontWeight: 'bold',
          }}>
            {player.name[0]}
          </div>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>{player.name}</h2>
            <div style={{ fontSize: '18px', color: '#F59E0B', fontWeight: 'bold' }}>
              💰 {player.gold} 金币
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#667eea', marginBottom: '15px', fontSize: '18px' }}>
            ⚔️ 当前装备
          </h3>
          
          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '15px',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#666', marginRight: '10px' }}>🗡️ 武器:</span>
              {player.equipment.weapon ? (
                <span style={{ fontWeight: 'bold' }}>
                  {player.equipment.weapon.icon} {player.equipment.weapon.name}
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '12px',
                    color: RARITY_COLORS[player.equipment.weapon.rarity],
                    background: RARITY_COLORS[player.equipment.weapon.rarity] + '20',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    {RARITY_NAMES[player.equipment.weapon.rarity]}
                  </span>
                  <span style={{ marginLeft: '8px', color: '#F44336' }}>
                    攻击: {player.equipment.weapon.attack}
                  </span>
                </span>
              ) : (
                <span style={{ color: '#999' }}>无</span>
              )}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#666', marginRight: '10px' }}>🛡️ 防御:</span>
              {player.equipment.defense.length > 0 ? (
                player.equipment.defense.map((item, idx) => (
                  <span key={idx} style={{ fontWeight: 'bold', marginRight: '10px' }}>
                    {item.icon} {item.name}
                    <span style={{
                      marginLeft: '4px',
                      fontSize: '12px',
                      color: RARITY_COLORS[item.rarity],
                    }}>
                      ({RARITY_NAMES[item.rarity]})
                    </span>
                  </span>
                ))
              ) : (
                <span style={{ color: '#999' }}>无</span>
              )}
            </div>

            <div>
              <span style={{ color: '#666', marginRight: '10px' }}>💰 经济:</span>
              {player.equipment.economy ? (
                <span style={{ fontWeight: 'bold' }}>
                  {player.equipment.economy.icon} {player.equipment.economy.name}
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '12px',
                    color: RARITY_COLORS[player.equipment.economy.rarity],
                  }}>
                    {RARITY_NAMES[player.equipment.economy.rarity]}
                  </span>
                </span>
              ) : (
                <span style={{ color: '#999' }}>无</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#667eea', marginBottom: '15px', fontSize: '18px' }}>
            🎒 背包 ({player.backpack.length}/6)
          </h3>
          
          {player.backpack.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            }}>
              {player.backpack.map((item, idx) => (
                <div key={idx} style={{
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: `2px solid ${RARITY_COLORS[item.rarity]}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '5px' }}>{item.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              背包是空的
            </div>
          )}
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#667eea', marginBottom: '15px', fontSize: '18px' }}>
            🏝️ 拥有的岛屿 ({playerIslands.length})
          </h3>
          
          {playerIslands.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {playerIslands.map(island => (
                <div key={island.id} style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>
                      {island.name}
                    </span>
                    <span style={{ color: '#F59E0B', fontSize: '14px' }}>
                      💰 {island.goldPerTurn}/回合
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      防护罩: {island.shield.currentHp}/{island.shield.maxHp}
                    </div>
                    <div style={{
                      height: '4px',
                      width: '80px',
                      background: '#e0e0e0',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      marginTop: '4px',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(island.shield.currentHp / island.shield.maxHp) * 100}%`,
                        background: island.shield.currentHp > 60 ? '#4CAF50' : 
                                   island.shield.currentHp > 30 ? '#FF9800' : '#F44336',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              没有岛屿
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#667eea', marginBottom: '15px', fontSize: '18px' }}>
            📊 统计数据
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
          }}>
            <div style={{
              padding: '12px',
              background: '#e3f2fd',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {player.stats.islandsConquered}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>征服岛屿</div>
            </div>
            
            <div style={{
              padding: '12px',
              background: '#ffebee',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
                {player.stats.islandsLost}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>失去岛屿</div>
            </div>
            
            <div style={{
              padding: '12px',
              background: '#fff3e0',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                {player.stats.totalDamageDealt}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>造成伤害</div>
            </div>
            
            <div style={{
              padding: '12px',
              background: '#f3e5f5',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
                {player.stats.bottlesOpened}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>开启漂流瓶</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: '#f5f5f5',
            color: '#333',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          关闭
        </button>
      </div>
    </div>
  );
}