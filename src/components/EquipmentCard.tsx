import React from 'react';
import { Equipment, Rarity, EquipmentType } from '../types/game';

interface EquipmentCardProps {
  equipment: Equipment;
  onClick?: () => void;
  disabled?: boolean;
  showPrice?: boolean;
  compact?: boolean;
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

export function EquipmentCard({
  equipment,
  onClick,
  disabled = false,
  showPrice = true,
  compact = false,
}: EquipmentCardProps) {
  const borderColor = RARITY_COLORS[equipment.rarity];

const getEquipmentStats = () => {
    switch (equipment.type) {
      case EquipmentType.WEAPON:
        return `攻击: ${equipment.attack}`;
      case EquipmentType.DEFENSE:
        return equipment.shieldHpBonus 
          ? `防护+${equipment.shieldHpBonus}` 
          : equipment.effects.map(e => e.type).join(', ');
      case EquipmentType.ECONOMY:
        return equipment.permanent ? '永久' : `剩余${equipment.remainingUses}次`;
      case EquipmentType.CONSUMABLE:
        return `剩余${equipment.remainingUses}次`;
      default:
        return '';
    }
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          border: `2px solid ${borderColor}`,
          borderRadius: '8px',
          padding: '8px',
          background: disabled ? '#F3F4F6' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: '24px' }}>{equipment.icon}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{equipment.name}</div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>{getEquipmentStats()}</div>
        </div>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        border: `3px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '16px',
        background: disabled ? '#F3F4F6' : 'white',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.2s',
        minWidth: '200px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '32px' }}>{equipment.icon}</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{equipment.name}</div>
          <div style={{ fontSize: '12px', color: borderColor, fontWeight: 'bold' }}>
            {RARITY_NAMES[equipment.rarity]}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '14px', color: '#4B5563', marginBottom: '8px' }}>
        {equipment.description}
      </div>

      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
        {getEquipmentStats()}
      </div>

      {showPrice && (
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#F59E0B',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          💰 {equipment.currentPrice}
        </div>
      )}
    </div>
  );
}