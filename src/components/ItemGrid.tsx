import React from 'react';
import { Equipment, Rarity, EquipmentType } from '../types/game';

interface ItemGridProps {
  items: Equipment[];
  onItemClick?: (item: Equipment, index: number) => void;
  onItemAction?: (item: Equipment, index: number) => void;
  actionLabel?: string;
  emptyMessage?: string;
  showPrice?: boolean;
  disabled?: boolean;
  maxItems?: number;
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

const TYPE_ICONS: Record<EquipmentType, string> = {
  [EquipmentType.WEAPON]: '⚔️',
  [EquipmentType.DEFENSE]: '🛡️',
  [EquipmentType.ECONOMY]: '💰',
  [EquipmentType.CONSUMABLE]: '🧪',
};

export function ItemGrid({
  items,
  onItemClick,
  onItemAction,
  actionLabel,
  emptyMessage = '暂无道具',
  showPrice,
  disabled,
  maxItems = 10,
}: ItemGridProps) {
  const slots = Array(maxItems).fill(null);
  items.forEach((item, index) => {
    if (index < maxItems) slots[index] = item;
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '12px',
      padding: '16px',
      maxHeight: '600px',
      overflowY: 'auto',
    }}>
      {slots.map((item, index) => (
        <div
          key={index}
          onClick={() => item && onItemClick?.(item, index)}
          style={{
            aspectRatio: '1',
            background: item ? 'white' : '#f5f5f5',
            borderRadius: '12px',
            border: item ? `3px solid ${RARITY_COLORS[item.rarity]}` : '2px dashed #ddd',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            cursor: item && !disabled ? 'pointer' : 'default',
            transition: 'all 0.2s',
            position: 'relative',
            boxShadow: item ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {item ? (
            <>
              <div style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                fontSize: '10px',
                color: '#666',
                fontWeight: 'bold',
              }}>
                #{index + 1}
              </div>
              
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                fontSize: '12px',
                color: RARITY_COLORS[item.rarity],
                fontWeight: 'bold',
              }}>
                {TYPE_ICONS[item.type]}
              </div>
              
              <div style={{
                fontSize: '32px',
                marginBottom: '4px',
              }}>
                {item.icon}
              </div>
              
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#333',
                lineHeight: '1.2',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
              }}>
                {item.name}
              </div>
              
              {showPrice && (
                <div style={{
                  fontSize: '12px',
                  color: '#F59E0B',
                  fontWeight: 'bold',
                  marginTop: '2px',
                }}>
                  💰{item.currentPrice}
                </div>
              )}
              
              {item.type === EquipmentType.WEAPON && 'durability' in item && (
                <div style={{
                  fontSize: '10px',
                  color: item.durability < 5 ? '#F44336' : '#666',
                  marginTop: '2px',
                }}>
                  耐久: {item.durability}
                </div>
              )}
              
              {onItemAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemAction(item, index);
                  }}
                  disabled={disabled}
                  style={{
                    marginTop: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    background: item.type === EquipmentType.CONSUMABLE ? '#10B981' : 
                               item.type === EquipmentType.WEAPON ? '#F59E0B' :
                               item.type === EquipmentType.DEFENSE ? '#3B82F6' : '#8B5CF6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {item.type === EquipmentType.CONSUMABLE ? '使用' : 
                   item.type === EquipmentType.WEAPON ? '装备' :
                   item.type === EquipmentType.DEFENSE ? '装备' : '装备'}
                </button>
              )}
            </>
          ) : (
            <div style={{
              color: '#ccc',
              fontSize: '24px',
            }}>
              +
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface ItemDetailProps {
  item: Equipment;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
  showPrice?: boolean;
}

export function ItemDetail({ item, onClose, onAction, actionLabel = '使用', showPrice = false }: ItemDetailProps) {
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
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: `4px solid ${RARITY_COLORS[item.rarity]}`,
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '10px',
          }}>
            {item.icon}
          </div>
          <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>{item.name}</h2>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: RARITY_COLORS[item.rarity] + '20',
            color: RARITY_COLORS[item.rarity],
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            {RARITY_NAMES[item.rarity]}
          </div>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <p style={{ margin: '0 0 15px 0', color: '#666', lineHeight: '1.6' }}>
            {item.description}
          </p>

          {item.type === EquipmentType.WEAPON && 'attack' in item && (
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>攻击力:</span>
                <span style={{ fontWeight: 'bold', color: '#F44336' }}>{item.attack}</span>
              </div>
              {'criticalChance' in item && item.criticalChance && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>暴击率:</span>
                  <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{item.criticalChance}%</span>
                </div>
              )}
            </div>
          )}

          {item.type === EquipmentType.DEFENSE && item.effects && (
            <div style={{ display: 'grid', gap: '8px' }}>
              {item.effects.map((effect, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{effect.type}:</span>
                  <span style={{ fontWeight: 'bold' }}>{effect.value}{effect.type.includes('reduction') || effect.type.includes('bonus') ? '%' : ''}</span>
                </div>
              ))}
            </div>
          )}

          {item.type === EquipmentType.ECONOMY && item.effects && (
            <div style={{ display: 'grid', gap: '8px' }}>
              {item.effects.map((effect, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{effect.type}:</span>
                  <span style={{ fontWeight: 'bold' }}>+{effect.value}%</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>类型:</span>
                <span style={{ fontWeight: 'bold' }}>{item.permanent ? '永久' : `消耗品 (${item.remainingUses}次)`}</span>
              </div>
            </div>
          )}
        </div>

        {showPrice && (
          <div style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#F59E0B',
            marginBottom: '20px',
          }}>
            💰 {item.currentPrice}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          {onAction && (
            <button
              onClick={onAction}
              style={{
                flex: 1,
                padding: '12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              {actionLabel}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1,
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
    </div>
  );
}