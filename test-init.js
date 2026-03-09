// 简单测试游戏初始化
const { initializeGame } = require('./src/game/gameInit');

try {
  console.log('Testing game initialization...');
  const gameState = initializeGame(['Player1', 'Player2']);
  console.log('Game initialized successfully!');
  console.log('Islands count:', gameState.islands.length);
  console.log('Players count:', gameState.players.length);
  console.log('Connections count:', gameState.connections.length);
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
