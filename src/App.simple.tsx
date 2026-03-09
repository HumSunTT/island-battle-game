import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>🏝️ 岛屿争夺战</h1>
      <p>React 应用测试</p>
      <button onClick={() => setCount(count + 1)}>
        点击次数: {count}
      </button>
    </div>
  );
}

export default App;
