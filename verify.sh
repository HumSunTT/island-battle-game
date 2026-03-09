#!/bin/bash

echo "🏝️ 岛屿争夺战 - 项目验证脚本"
echo "================================"

echo ""
echo "1. 检查项目结构..."
if [ -f "package.json" ]; then
    echo "✅ package.json 存在"
else
    echo "❌ package.json 缺失"
    exit 1
fi

if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json 存在"
else
    echo "❌ tsconfig.json 缺失"
    exit 1
fi

if [ -f "vite.config.ts" ]; then
    echo "✅ vite.config.ts 存在"
else
    echo "❌ vite.config.ts 缺失"
    exit 1
fi

if [ -f "index.html" ]; then
    echo "✅ index.html 存在"
else
    echo "❌ index.html 缺失"
    exit 1
fi

echo ""
echo "2. 检查源代码文件..."
required_files=(
    "src/main.tsx"
    "src/App.tsx"
    "src/types/game.ts"
    "src/game/gameInit.ts"
    "src/game/useGameState.ts"
    "src/utils/gameLogic.ts"
    "src/data/equipment.ts"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 缺失"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    exit 1
fi

echo ""
echo "3. 检查依赖安装..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules 存在"
    
    if [ -d "node_modules/react" ]; then
        echo "✅ React 已安装"
    else
        echo "⚠️  React 未安装，请运行: npm install"
    fi
    
    if [ -d "node_modules/typescript" ]; then
        echo "✅ TypeScript 已安装"
    else
        echo "⚠️  TypeScript 未安装，请运行: npm install"
    fi
else
    echo "⚠️  node_modules 不存在，请运行: npm install"
fi

echo ""
echo "================================"
echo "✅ 项目结构验证完成！"
echo ""
echo "下一步操作："
echo "1. 安装依赖: npm install"
echo "2. 启动开发服务器: npm run dev"
echo "3. 构建生产版本: npm run build"
echo ""