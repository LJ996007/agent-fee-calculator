# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

这是一个基于 Vite + React + TypeScript + Tailwind 的招标代理服务费计算器应用。该应用实现了中国计价格[2002]1980号文标准的阶梯式费率计算，支持三种服务类型（货物、服务、工程）的代理费计算，并提供下浮折扣功能。

技术栈：
- **前端框架**: React 18.3.1
- **构建工具**: Vite 5.4.0
- **类型系统**: TypeScript 5.6.2
- **样式方案**: Tailwind CSS 3.4.10
- **图标库**: Lucide React
- **语言**: 中文界面

## 常用命令

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# TypeScript 类型检查
tsc -b

# 生产构建
npm run build

# 预览生产构建产物
npm run preview
```

开发服务器默认运行在 http://localhost:5173/

## 代码架构

### 核心组件

**src/AgentFeeCalculator.tsx** - 主要计算器组件
- 包含完整的用户界面和业务逻辑
- 实现了分段累计费率计算算法
- 支持三种服务类型选择（货物招标、服务招标、工程招标）
- 支持万元/元单位切换
- 支持自定义下浮折扣
- 提供费用明细展开/收起功能

### 辅助文件

**src/main.tsx** - 应用入口点
- React 根组件挂载

**src/App.tsx** - 根组件
- 简单包装了 AgentFeeCalculator

**src/index.css** - 全局样式
- Tailwind CSS 基础样式导入

### 配置文件

**vite.config.ts** - Vite 配置
- 使用 @vitejs/plugin-react 插件

**tsconfig.json** - TypeScript 配置
- ESNext 模块系统
- React JSX 支持

**tailwind.config.js** - Tailwind 配置
- 仅包含默认配置

## 业务逻辑要点

### 费率阶梯 (TIERS)
- 100万元以下
- 100-500万元
- 500-1000万元
- 1000-5000万元
- 5000万元-1亿元
- 1-10亿元
- 10亿元以上

### 服务类型费率 (RATES)
- 类型1 (货物): [1.50%, 1.10%, 0.80%, 0.50%, 0.25%, 0.05%, 0.01%]
- 类型2 (服务): [1.50%, 0.80%, 0.45%, 0.25%, 0.10%, 0.05%, 0.01%]
- 类型3 (工程): [1.00%, 0.70%, 0.55%, 0.35%, 0.20%, 0.05%, 0.01%]

### 计算方法
采用分段累计计算法，将中标金额按阶梯区间分段，每段按对应费率计算后累加。

## 文件结构

```
src/
├── main.tsx                    # 应用入口
├── App.tsx                     # 根组件
├── index.css                   # 全局样式
└── AgentFeeCalculator.tsx      # 主计算器组件
```

## 注意事项

1. **未跟踪文件**: pages_index.tsx 存在于根目录，与 AgentFeeCalculator.tsx 内容相同，但未被 Git 跟踪
2. **单一组件架构**: 应用整体较为简单，所有业务逻辑集中在一个组件中
3. **中文字符格式化**: 使用 Intl.NumberFormat 对货币和数字进行中文本地化格式化
4. **响应式设计**: 界面使用 Tailwind 的响应式类，支持移动端和桌面端

## 开发建议

- 主要功能扩展应直接在 src/AgentFeeCalculator.tsx 中进行
- 如需模块化，可考虑将计算逻辑提取到独立工具函数中
- 费率表和阶梯配置位于文件顶部常量定义，便于维护
- UI 状态使用 React useState 管理，计算结果使用 useMemo 缓存优化
