#!/bin/bash

echo "========================================="
echo "🏝️ 岛屿争夺战 - 诊断工具"
echo "========================================="
echo ""

echo "1. 检查服务器状态..."
if pgrep -f "vite" > /dev/null; then
    echo "✅ Vite 服务器正在运行"
    echo "   访问地址: http://localhost:3000"
else
    echo "❌ Vite 服务器未运行"
    echo "   启动命令: cd island-battle-game && npm run dev"
    exit 1
fi

echo ""
echo "2. 检查页面是否可访问..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ 页面可以访问 (HTTP $RESPONSE)"
else
    echo "❌ 页面无法访问 (HTTP $RESPONSE)"
    exit 1
fi

echo ""
echo "3. 检查主要文件..."
FILES=(
    "src/main.tsx"
    "src/App.tsx"
    "src/App.css"
    "src/index.css"
    "index.html"
)

for file in "${FILES[@]}"; do
    if [ -f "island-battle-game/$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 缺失"
    fi
done

echo ""
echo "4. 检查 React 和依赖..."
if [ -f "island-battle-game/node_modules/react/package.json" ]; then
    REACT_VERSION=$(grep '"version"' island-battle-game/node_modules/react/package.json | cut -d'"' -f4)
    echo "✅ React 已安装 (v$REACT_VERSION)"
else
    echo "❌ React 未安装"
    echo "   安装命令: cd island-battle-game && npm install"
fi

echo ""
echo "========================================="
echo "📋 故障排除步骤:"
echo "========================================="
echo ""
echo "如果页面只显示白屏，请按以下步骤操作:"
echo ""
echo "1. 打开浏览器开发者工具 (F12)"
echo "2. 切换到 Console 标签页"
echo "3. 查看是否有红色错误信息"
echo "4. 切换到 Network 标签页"
echo "5. 刷新页面 (Ctrl+R)"
echo "6. 检查是否有失败的请求 (红色)"
echo ""
echo "常见问题:"
echo "- 如果看到 'uuid' 相关错误: npm install uuid @types/uuid"
echo "- 如果看到模块导入错误: rm -rf node_modules package-lock.json && npm install"
echo "- 如果看到 TypeScript 错误: 检查 tsconfig.json 配置"
echo ""
echo "========================================="
echo "🌐 访问地址:"
echo "========================================="
echo ""
echo "本地: http://localhost:3000"
echo ""
echo "如果仍然无法访问，请将浏览器控制台的错误信息发给我"
echo "========================================="