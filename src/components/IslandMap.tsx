import React from 'react';
import { GameState, Island } from '../types/game';

interface IslandMapProps {
  gameState: GameState;
  selectedIslandId: string | null;
  onIslandClick: (islandId: string) => void;
  currentPlayerId: string;
}

const ISLAND_SIZE = 80;

export function IslandMap({
  gameState, 
  selectedIslandId, 
  onIslandClick,
  currentPlayerId 
}: IslandMapProps) {
  const viewBoxWidth = 1800;
  const viewBoxHeight = 1000;
  const centerX = viewBoxWidth / 2;
  const centerY = viewBoxHeight / 2;
  const scale = 40;
  
  const quadrantCenters = [
    { x: centerX + viewBoxWidth * 0.25, y: centerY - viewBoxHeight * 0.35 },
    { x: centerX - viewBoxWidth * 0.25, y: centerY - viewBoxHeight * 0.35 },
    { x: centerX - viewBoxWidth * 0.25, y: centerY + viewBoxHeight * 0.35 },
    { x: centerX + viewBoxWidth * 0.25, y: centerY + viewBoxHeight * 0.35 },
  ];

  const getIslandScreenPosition = (island: Island) => {
    const isCenter = island.position.x === 0 && island.position.y === 0;
    if (isCenter) {
      return { x: centerX, y: centerY };
    }
    
    let quadrantIndex = 0;
    if (island.position.x < 0 && island.position.y < 0) quadrantIndex = 1;
    else if (island.position.x < 0 && island.position.y >= 0) quadrantIndex = 2;
    else if (island.position.x >= 0 && island.position.y >= 0) quadrantIndex = 3;
    
    const quadrantCenter = quadrantCenters[quadrantIndex];
    return {
      x: quadrantCenter.x + (island.position.x - Math.sign(island.position.x) * 10) * scale,
      y: quadrantCenter.y + (island.position.y - Math.sign(island.position.y || 1) * 7) * scale,
    };
  };

  const getPlayerColor = (ownerId: string | null) => {
    if (!ownerId) return '#CCCCCC';
    const player = gameState.players.find(p => p.id === ownerId);
    return player?.color || '#CCCCCC';
  };

  const getIslandSize = (island: Island) => {
    const isCenter = island.position.x === 0 && island.position.y === 0;
    if (isCenter) {
      return { width: 180, height: 180 };
    }
    const hpRatio = island.shield.maxHp / 100;
    return {
      width: ISLAND_SIZE * Math.sqrt(hpRatio),
      height: ISLAND_SIZE * Math.sqrt(hpRatio)
    };
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/pic/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <svg 
        width="100%" 
        height="100%"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="islandShadow">
            <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {gameState.connections.map((conn, index) => {
          const fromIsland = gameState.islands.find(i => i.id === conn.from);
          const toIsland = gameState.islands.find(i => i.id === conn.to);
          
          if (!fromIsland || !toIsland) return null;

          const fromPos = getIslandScreenPosition(fromIsland);
          const toPos = getIslandScreenPosition(toIsland);
          
          const fromOwned = fromIsland.ownerId === currentPlayerId;
          const toOwned = toIsland.ownerId === currentPlayerId;
          const isConnected = fromOwned || toOwned;

          return (
            <line
              key={`conn-${index}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke={isConnected ? '#FFD700' : '#FFFFFF'}
              strokeWidth={isConnected ? 3 : 2}
              strokeOpacity={isConnected ? 0.8 : 0.3}
              strokeDasharray={isConnected ? '0' : '8,4'}
              filter={isConnected ? 'url(#glow)' : undefined}
            />
          );
        })}

        {gameState.islands.map(island => {
          const isSelected = selectedIslandId === island.id;
          const { width, height } = getIslandSize(island);
          const screenPos = getIslandScreenPosition(island);
          const ownerColor = getPlayerColor(island.ownerId);
          const isOwned = island.ownerId === currentPlayerId;
          const shieldPercent = (island.shield.currentHp / island.shield.maxHp) * 100;
          const isCenter = island.position.x === 0 && island.position.y === 0;
          
          let shieldColor = '#4CAF50';
          if (shieldPercent < 30) shieldColor = '#F44336';
          else if (shieldPercent < 60) shieldColor = '#FF9800';

          return (
            <g 
              key={island.id}
              onClick={() => onIslandClick(island.id)}
              style={{ cursor: 'pointer' }}
            >
              {isSelected && (
                <circle
                  cx={screenPos.x}
                  cy={screenPos.y}
                  r={width / 2 + 8}
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth={4}
                  filter="url(#glow)"
                />
              )}
              
              {island.ownerId && (
                <circle
                  cx={screenPos.x}
                  cy={screenPos.y}
                  r={width / 2 + 4}
                  fill="none"
                  stroke={ownerColor}
                  strokeWidth={3}
                  opacity={0.6}
                />
              )}
              
              <image
                href={`/pic/${island.image}`}
                x={screenPos.x - width / 2}
                y={screenPos.y - height / 2}
                width={width}
                height={height}
                filter="url(#islandShadow)"
              />
              
              {isCenter && (
                <text
                  x={screenPos.x}
                  y={screenPos.y - height / 2 - 15}
                  textAnchor="middle"
                  fill="#FFD700"
                  fontSize="14"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  ⭐ 核心 ⭐
                </text>
              )}

              <circle
                cx={screenPos.x + width / 3}
                cy={screenPos.y - height / 3}
                r={10}
                fill={shieldColor}
                stroke="#FFFFFF"
                strokeWidth={2}
              />

              <text
                x={screenPos.x + width / 2 + 10}
                y={screenPos.y - 8}
                textAnchor="start"
                dominantBaseline="middle"
                fill="#DDA0DD"
                fontSize="16"
                fontWeight="bold"
                style={{ pointerEvents: 'none', textShadow: '2px 2px 4px rgba(0,0,0,1)' }}
              >
                {island.name.length > 5 ? island.name.slice(0, 5) + '..' : island.name}
              </text>
              
              <text
                x={screenPos.x + width / 2 + 10}
                y={screenPos.y + 10}
                textAnchor="start"
                fill="#FFFFFF"
                fontSize="12"
                fontWeight="bold"
                style={{ pointerEvents: 'none', textShadow: '1px 1px 1px rgba(0,0,0,0.8)' }}
              >
                {island.shield.currentHp}/{island.shield.maxHp}
              </text>
              
              <text
                x={screenPos.x + width / 2 + 10}
                y={screenPos.y + 28}
                textAnchor="start"
                fill="#FFD700"
                fontSize="13"
                fontWeight="bold"
                style={{ pointerEvents: 'none', textShadow: '1px 1px 1px rgba(0,0,0,0.8)' }}
              >
                💰{island.goldPerTurn}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}