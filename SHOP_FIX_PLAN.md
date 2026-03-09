# 🛠️ 商店问题修复方案

## 问题分析

### 问题1: 商店刷新失效
**原因**: `generateShopItems` 函数中，当物品池为空时使用 `continue`，导致商品数量不足

**位置**: `src/utils/gameLogic.ts` - 第180行
```typescript
if (available.length === 0) continue;  // ❌ 导致商品数量不足
```

### 问题2: 刷新金额未翻倍
**原因**: 刷新价格固定为50金币，未实现递增

**位置**: `src/game/useGameState.ts` - `refreshShopItems` 函数

### 问题3: 购买按钮失效
**原因**: 可能是索引问题或UI交互问题

---

## 修复方案

### 修复1: 改进商品生成逻辑
```typescript
// 修改 generateShopItems 函数
const itemCount = 6;  // 固定6个商品

// 当池子为空时，使用备选方案
if (available.length === 0) {
  const fallbackPool = allEquipment.filter(e => !usedIds.has(e.id));
  if (fallbackPool.length > 0) {
    // 从所有装备中随机选择
  }
}
```

### 修复2: 实现刷新价格翻倍
```typescript
// 在 GameState 中记录刷新价格
shop: {
  items: [],
  refreshCount: 0,
  maxRefreshPerTurn: 3,
  refreshCost: 50,  // 初始价格
}

// 每次刷新后更新价格
const newRefreshCost = state.shop.refreshCost * 2;
```

### 修复3: 修复购买索引问题
```typescript
// 确保使用正确的索引
const actualIndex = gameState.shop.items.findIndex(
  item => item.equipment.id === selectedItem.item.id
);
```

---

## 具体实现步骤

### 步骤1: 修改商品生成逻辑

编辑 `src/utils/gameLogic.ts`:

```typescript
export function generateShopItems(turn: number, forceRare: boolean = false): ShopItem[] {
  const items: ShopItem[] = [];
  const allEquipment: Equipment[] = [
    ...WEAPONS,
    ...DEFENSE_ITEMS,
    ...ECONOMY_ITEMS,
    ...CONSUMABLES,
  ];

  const itemCount = 6;  // 固定6个商品
  const usedIds = new Set<string>();

  for (let i = 0; i < itemCount; i++) {
    let pool: Equipment[];
    
    // 15%概率出现稀有商品
    if (forceRare || Math.random() < 0.15) {
      pool = allEquipment.filter(e => 
        e.rarity === Rarity.EPIC || e.rarity === Rarity.LEGENDARY
      );
    } else {
      pool = allEquipment.filter(e => 
        e.rarity === Rarity.COMMON || e.rarity === Rarity.RARE
      );
    }

    // 过滤已使用的物品
    let available = pool.filter(e => !usedIds.has(e.id));
    
    // 如果池子为空，从所有装备中选择
    if (available.length === 0) {
      available = allEquipment.filter(e => !usedIds.has(e.id));
    }
    
    // 如果还是为空，跳出循环
    if (available.length === 0) break;

    const equipment = available[Math.floor(Math.random() * available.length)];
    usedIds.add(equipment.id);

    const priceModifier = 0.8 + Math.random() * 0.4;
    const isRareItem = equipment.rarity === Rarity.EPIC || equipment.rarity === Rarity.LEGENDARY;

    items.push({
      equipment: {
        ...equipment,
        currentPrice: Math.floor(equipment.basePrice * priceModifier * (isRareItem ? 1.3 : 1)),
      },
      quantity: 1,
      priceModifier,
      isRareItem,
      available: true,
    });
  }

  return items;
}
```

### 步骤2: 实现刷新价格翻倍

编辑 `src/game/useGameState.ts`:

```typescript
const refreshShopItems = useCallback(() => {
  if (!gameState) return false;

  const currentPlayer = getCurrentPlayer(gameState);
  const refreshCost = gameState.shop.refreshCost;

  if (currentPlayer.gold < refreshCost) {
    return false;
  }

  try {
    const newState = refreshShop(gameState, currentPlayer.id);
    
    // 计算新的刷新价格（翻倍）
    const newRefreshCost = newState.shop.refreshCost * 2;
    
    setGameState({
      ...newState,
      shop: {
        ...newState.shop,
        refreshCost: newRefreshCost,
      },
    });
    
    return true;
  } catch (error) {
    console.error('Refresh shop failed:', error);
    return false;
  }
}, [gameState]);
```

### 步骤3: 修复购买按钮问题

编辑 `src/App.tsx`:

```typescript
// 在ItemGrid中传递正确的索引
<ItemGrid
  items={gameState.shop.items.filter(i => i.available).map(i => i.equipment)}
  onItemClick={(item, displayIndex) => {
    // 找到真实的商店索引
    const actualIndex = gameState.shop.items.findIndex(
      shopItem => shopItem.equipment.id === item.id && shopItem.available
    );
    
    if (actualIndex !== -1) {
      setSelectedItem({ 
        item, 
        context: 'shop', 
        index: actualIndex  // 使用真实索引
      });
    }
  }}
  showPrice={true}
/>
```

---

## 测试验证

### 测试步骤
1. ✅ 启动游戏
2. ✅ 打开商店，查看是否有6个商品
3. ✅ 刷新商店，确认价格从50→100→200递增
4. ✅ 购买商品，确认购买成功
5. ✅ 多次刷新，验证价格翻倍逻辑

### 预期结果
- 商店始终显示6个商品
- 刷新价格正确翻倍
- 购买功能正常

---

**文档版本**: v1.0  
**创建时间**: 2026-03-07