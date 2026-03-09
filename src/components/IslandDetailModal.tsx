import React from 'react';
import { Island, Player, Equipment } from '../types/game';

interface IslandDetailModalProps {
  island: Island;
  owner: Player | null;
  onClose: () => void;
  onAttack?: (weapon: Equipment) => void;
  onConquer?: () => void;
  currentPlayer: Player;
  canAttack: boolean;
}

export function IslandDetailModal({
  island,
  owner,
  onClose,
  onAttack,
  onConquer,
  currentPlayer,
  canAttack,
}: IslandDetailModalProps) {
  const isOwnIsland = owner?.id === currentPlayer.id;
  const isConquerable = island.shield.currentHp === 0 && !isOwnIsland;

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
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '20px', color: '#333', textAlign: 'center' }}>
          🏝️ {island.name}
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>基本信息</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>拥有者:</span>
              <span style={{ fontWeight: 'bold', color: owner?.color || '#999' }}>
                {owner ? owner.name : '无'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>金币产出:</span>
              <span>💰 {island.goldPerTurn}/回合</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>攻击力:</span>
              <span style={{ color: '#F44336' }}>⚔️ {island.attack || Math.floor(Math.random() * 15) + 5}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>防御装备:</span>
              <span>🛡️ {island.defenseItems.length} 件</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>防护罩状态</h3>
          <div style={{
            height: '30px',
            background: '#e0e0e0',
            borderRadius: '15px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${(island.shield.currentHp / island.shield.maxHp) * 100}%`,
              background: island.shield.currentHp > 60 ? '#4CAF50' : island.shield.currentHp > 30 ? '#FF9800' : '#F44336',
              borderRadius: '15px',
              transition: 'width 0.3s',
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontWeight: 'bold',
              color: '#333',
            }}>
              {island.shield.currentHp} / {island.shield.maxHp} HP
            </div>
          </div>
          <div style={{ display: 'grid', gap: '8px', marginTop: '10px', fontSize: '14px' }}>
            <div>类型: {island.shield.type}</div>
            {island.shield.damageReductionPercent > 0 && (
              <div>减伤: {island.shield.damageReductionPercent}%</div>
            )}
            {island.shield.selfRepairPerTurn > 0 && (
              <div>自修复: {island.shield.selfRepairPerTurn} HP/回合</div>
            )}
          </div>
        </div>

        {island.defenseItems.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>防御装备</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {island.defenseItems.map((item, index) => (
                <div key={index} style={{
                  padding: '8px 12px',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}>
                  {item.icon} {item.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isOwnIsland && canAttack && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>攻击选项</h3>
            {currentPlayer.equipment.weapon ? (
              <div>
                <div style={{ marginBottom: '10px' }}>
                  当前武器: {currentPlayer.equipment.weapon.icon} {currentPlayer.equipment.weapon.name}
                  (攻击: {currentPlayer.equipment.weapon.attack})
                </div>
                <button
                  onClick={() => onAttack?.(currentPlayer.equipment.weapon!)}
                  disabled={!currentPlayer.equipment.weapon}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#F44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                  }}
                >
                  ⚔️ 攻击岛屿
                </button>
              </div>
            ) : (
              <p style={{ color: '#999' }}>请先装备武器</p>
            )}
          </div>
        )}

        {isConquerable && (
          <button
            onClick={onConquer}
            style={{
              width: '100%',
              padding: '12px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '10px',
            }}
          >
            🏴 占领岛屿
          </button>
        )}

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