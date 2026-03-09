import React from 'react';
import { Island, Player } from '../types/game';

interface IslandCardProps {
  island: Island;
  owner: Player | null;
  isSelected: boolean;
  onClick: () => void;
}

const ISLAND_FEATURES = [
  { type: 'palm', emoji: '🌴', position: { x: 25, y: 30 } },
  { type: 'palm2', emoji: '🌴', position: { x: 70, y: 25 } },
  { type: 'coconut', emoji: '🥥', position: { x: 50, y: 20 } },
  { type: 'tree', emoji: '🌳', position: { x: 35, y: 35 } },
  { type: 'flower', emoji: '🌺', position: { x: 60, y: 45 } },
  { type: 'sunflower', emoji: '🌻', position: { x: 25, y: 50 } },
  { type: 'bird', emoji: '🦜', position: { x: 75, y: 15 } },
  { type: 'crab', emoji: '🦀', position: { x: 40, y: 65 } },
  { type: 'turtle', emoji: '🐢', position: { x: 55, y: 70 } },
  { type: 'volcano', emoji: '🌋', position: { x: 50, y: 30 } },
  { type: 'mountain', emoji: '⛰️', position: { x: 45, y: 25 } },
  { type: 'beach', emoji: '🏖️', position: { x: 30, y: 60 } },
  { type: 'boat', emoji: '⛵', position: { x: 80, y: 55 } },
  { type: 'dolphin', emoji: '🐬', position: { x: 15, y: 80 } },
  { type: 'seagull', emoji: '🕊️', position: { x: 70, y: 10 } },
  { type: 'fish', emoji: '🐠', position: { x: 20, y: 75 } },
  { type: 'shell', emoji: '🐚', position: { x: 65, y: 65 } },
  { type: 'umbrella', emoji: '⛱️', position: { x: 40, y: 40 } },
  { type: 'surfer', emoji: '🏄', position: { x: 75, y: 70 } },
  { type: 'wave', emoji: '🌊', position: { x: 10, y: 85 } },
];

function getIslandFeatures(islandId: string) {
  const hash = islandId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const features: { emoji: string; x: number; y: number; size: number }[] = [];
  
  const numFeatures = 2 + (hash % 3);
  const usedTypes = new Set<string>();
  
  for (let i = 0; i < numFeatures; i++) {
    const featureIndex = (hash + i * 7) % ISLAND_FEATURES.length;
    const feature = ISLAND_FEATURES[featureIndex];
    
    if (!usedTypes.has(feature.type)) {
      usedTypes.add(feature.type);
      const offsetX = ((hash + i * 13) % 20) - 10;
      const offsetY = ((hash + i * 17) % 15) - 7;
      const size = 18 + ((hash + i * 3) % 12);
      
      features.push({
        emoji: feature.emoji,
        x: feature.position.x + offsetX,
        y: feature.position.y + offsetY,
        size,
      });
    }
  }
  
  return features;
}

function getIslandShape(islandId: string) {
  const hash = islandId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const shapes = [
    'M30,25 Q45,5 70,20 Q90,35 85,55 Q80,75 55,80 Q25,78 15,55 Q5,35 30,25',
    'M20,30 Q35,10 65,15 Q85,20 90,50 Q88,70 60,80 Q30,82 12,60 Q0,40 20,30',
    'M25,20 Q50,5 75,15 Q95,25 90,55 Q85,78 50,85 Q15,80 10,50 Q8,30 25,20',
    'M35,15 Q55,5 70,20 Q88,35 80,60 Q70,80 45,82 Q20,78 15,50 Q12,28 35,15',
    'M40,10 Q65,5 75,25 Q85,45 78,65 Q65,85 40,82 Q15,78 15,50 Q15,25 40,10',
    'M20,25 Q40,8 70,15 Q90,28 85,55 Q78,78 50,85 Q18,82 10,50 Q5,30 20,25',
    'M45,8 Q70,12 80,35 Q88,55 75,75 Q55,88 35,80 Q10,70 12,45 Q15,20 45,8',
    'M30,18 Q55,5 80,22 Q95,40 85,62 Q72,82 45,85 Q18,80 12,50 Q8,28 30,18',
  ];
  return shapes[hash % shapes.length];
}

function getIslandColors(islandId: string) {
  const hash = islandId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorSets = [
    { sand: '#F4E4C1', dark: '#D4C4A1', water: '#87CEEB' },
    { sand: '#FFE4B5', dark: '#DEB887', water: '#98D8E8' },
    { sand: '#FFECD2', dark: '#F0D9B5', water: '#89CFF0' },
    { sand: '#F5DEB3', dark: '#DEB887', water: '#B0E0E6' },
    { sand: '#FAEBD7', dark: '#D2B48C', water: '#ADD8E6' },
    { sand: '#FFEFD5', dark: '#FFE4B5', water: '#87CEFA' },
  ];
  return colorSets[hash % colorSets.length];
}

function getIslandSize(islandId: string) {
  const hash = islandId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseSize = 200;
  const variation = (hash % 30) - 15;
  return {
    width: baseSize + variation,
    height: baseSize + variation * 0.7,
    scale: 1 + (hash % 10) / 20,
  };
}

export function IslandCard({ island, owner, isSelected, onClick }: IslandCardProps) {
  const shape = getIslandShape(island.id);
  const colors = getIslandColors(island.id);
  const features = getIslandFeatures(island.id);
  const size = getIslandSize(island.id);
  const shieldPercent = (island.shield.currentHp / island.shield.maxHp) * 100;
  
  let shieldColor = '#4CAF50';
  if (shieldPercent < 30) shieldColor = '#F44336';
  else if (shieldPercent < 60) shieldColor = '#FF9800';

  return (
    <div
      className={`island-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        width: `${size.width}px`,
        padding: '15px',
        background: 'linear-gradient(180deg, rgba(135,206,235,0.3) 0%, rgba(255,255,255,0.95) 50%)',
        borderRadius: '20px',
        boxShadow: isSelected 
          ? '0 12px 40px rgba(102, 126, 234, 0.5), 0 0 0 3px #667eea' 
          : '0 8px 24px rgba(0,0,0,0.15)',
        border: isSelected ? '3px solid #667eea' : '2px solid rgba(255,255,255,0.5)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'visible',
        backdropFilter: 'blur(5px)',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '140px' }}>
        <svg
          viewBox="0 0 100 100"
          style={{
            width: '100%',
            height: '100%',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          }}
        >
          <defs>
            <linearGradient id={`sand-${island.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.sand} />
              <stop offset="100%" stopColor={colors.dark} />
            </linearGradient>
            <linearGradient id={`water-${island.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4A90D9" stopOpacity="0.3" />
            </linearGradient>
            <filter id={`shadow-${island.id}`}>
              <feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          <path
            d="M-5,95 Q0,85 20,90 Q50,80 80,90 Q100,85 105,95 L105,105 L-5,105 Z"
            fill={`url(#water-${island.id})`}
          />
          
          <path
            d={shape}
            fill={`url(#sand-${island.id})`}
            stroke={colors.dark}
            strokeWidth="1"
            filter={`url(#shadow-${island.id})`}
          />
          
          <path
            d={shape}
            fill="rgba(255,255,255,0.2)"
            opacity="0.5"
          />
          
          <ellipse cx="50" cy="75" rx="25" ry="8" fill="rgba(0,100,0,0.15)" />
        </svg>
        
        {features.map((feature, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${feature.x}%`,
              top: `${feature.y}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${feature.size}px`,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}
          >
            {feature.emoji}
          </div>
        ))}
        
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontWeight: 'bold',
          fontSize: '12px',
          color: '#333',
          textShadow: '0 1px 3px rgba(255,255,255,0.9)',
          textAlign: 'center',
          backgroundColor: 'rgba(255,255,255,0.85)',
          padding: '4px 8px',
          borderRadius: '8px',
          maxWidth: '80%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {island.name}
        </div>
      </div>

      {owner && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          padding: '6px 10px',
          background: owner.color + '25',
          borderRadius: '10px',
          border: `2px solid ${owner.color}40`,
        }}>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: owner.color,
            boxShadow: `0 0 6px ${owner.color}`,
          }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#444' }}>
            {owner.name}
          </span>
        </div>
      )}

      <div style={{ marginTop: '10px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}>
          <span style={{ fontSize: '12px', color: '#666' }}>🛡️ 防护罩</span>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 'bold',
            color: shieldColor,
          }}>
            {island.shield.currentHp}/{island.shield.maxHp}
          </span>
        </div>
        <div style={{
          height: '10px',
          background: 'linear-gradient(90deg, #e0e0e0, #f5f5f5)',
          borderRadius: '5px',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            height: '100%',
            width: `${shieldPercent}%`,
            background: `linear-gradient(90deg, ${shieldColor}, ${shieldColor}cc)`,
            borderRadius: '5px',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 5px ' + shieldColor + '80',
          }} />
        </div>
      </div>

      <div style={{
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        fontSize: '14px',
        color: '#DAA520',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #FFF8DC, #FFE4B5)',
        padding: '6px 12px',
        borderRadius: '10px',
      }}>
        <span>💰</span>
        <span>{island.goldPerTurn}</span>
        <span style={{ fontSize: '11px', color: '#888', fontWeight: 'normal' }}>/回合</span>
      </div>
    </div>
  );
}