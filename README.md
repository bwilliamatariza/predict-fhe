# 🔐 SecretPredict - 加密预测市场

基于 Zama FHEVM（全同态加密虚拟机）构建的去中心化预测市场平台。用户可以在保持投票选择完全加密的情况下参与预测市场，直到预测结束后才解密统计结果。

## ✨ 核心特性

- **🔒 隐私保护**: 使用全同态加密（FHE）技术，投票选择在链上保持加密状态
- **⛓️ 去中心化**: 基于以太坊 Sepolia 测试网部署的智能合约
- **🎯 简单易用**: 直观的 Web 界面，支持创建和参与预测市场
- **💰 公平透明**: 每单位投注固定为 0.0001 ETH，结算后自动解密结果
- **🔐 Zama FHEVM**: 使用 Zama 的全同态加密技术保证计算过程的隐私性

## 🏗️ 技术架构

### 智能合约层
- **Solidity 0.8.24**: 使用最新的 Solidity 版本
- **@fhevm/solidity**: Zama 提供的 FHE 运算库
- **Hardhat**: 智能合约开发、测试和部署框架

### 前端层
- **React + TypeScript**: 现代化的前端框架
- **Vite**: 快速的构建工具
- **Ethers.js v6**: 以太坊交互库
- **@zama-fhe/relayer-sdk**: 加密数据中继服务

### 核心功能

#### 1. 创建预测市场
```solidity
function createPrediction(
    string calldata name,
    string calldata content,
    uint64 endTime
) external returns (uint256 id)
```

#### 2. 加密投注
```solidity
function placeBet(
    uint256 id,
    externalEbool encYes,    // 加密的选择（是/否）
    bytes calldata inputProof,
    uint32 units                // 投注单位数
) external payable
```

#### 3. 结算与解密
```solidity
function settle(uint256 id) external
```

## 📦 项目结构

```
Predict/
├── contracts/              # 智能合约
│   └── SecretPredict.sol  # 主合约
├── deploy/                # 部署脚本
│   └── deploy.ts
├── tasks/                 # Hardhat 任务
│   ├── accounts.ts
│   └── SecretPredict.ts
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── components/   # React 组件
│   │   │   ├── Header.tsx
│   │   │   ├── PredictApp.tsx
│   │   │   ├── CreatePrediction.tsx
│   │   │   ├── PredictionList.tsx
│   │   │   └── About.tsx
│   │   ├── hooks/       # 自定义 Hooks
│   │   ├── config/      # 配置文件
│   │   └── workers/     # Web Workers
│   └── package.json
├── types/                # TypeScript 类型定义
├── hardhat.config.ts     # Hardhat 配置
└── package.json
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- npm >= 7.0.0
- MetaMask 钱包（配置到 Sepolia 测试网）

### 1. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# Infura API Key (用于连接 Sepolia 网络)
INFURA_API_KEY=your_infura_api_key

# 部署账户私钥
PRIVATE_KEY=your_private_key

# Etherscan API Key (用于合约验证)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. 编译智能合约

```bash
npm run compile
```

### 4. 部署到 Sepolia 测试网

```bash
npm run deploy:sepolia
```

### 5. 启动前端应用

```bash
npm run frontend:dev
```

访问 `http://localhost:5173` 即可使用应用。

## 📝 使用说明

### 创建预测市场

1. 连接 MetaMask 钱包（确保在 Sepolia 测试网）
2. 点击"创建预测"按钮
3. 填写预测标题、描述和结束时间
4. 提交交易并等待确认

### 参与投注

1. 浏览可用的预测市场
2. 选择您的预测结果（是/否）
3. 输入投注单位数（每单位 0.0001 ETH）
4. 确认交易（您的选择将被加密）

### 查看结果

1. 等待预测市场结束
2. 任何人都可以触发"结算"操作
3. 系统会请求解密服务解密投票统计
4. 解密完成后，结果将显示在链上

## 🔧 开发命令

```bash
# 编译合约
npm run compile

# 运行测试
npm test

# 代码格式化
npm run prettier:write

# 代码检查
npm run lint

# 清理构建文件
npm run clean

# 生成 TypeScript 类型
npm run typechain

# 前端开发服务器
npm run frontend:dev
```

## 🔐 FHE 技术说明

### 什么是全同态加密（FHE）？

全同态加密允许在加密数据上直接进行计算，而无需先解密。这意味着：

1. **隐私保护**: 用户的投票选择在区块链上始终保持加密
2. **可验证计算**: 尽管数据加密，但仍可执行加法等运算
3. **延迟解密**: 只有在预测结束后才解密最终统计结果

### SecretPredict 中的 FHE 应用

```solidity
// 加密的投票选择（ebool）
ebool choice = FHE.fromExternal(encYes, inputProof);

// 在加密数据上执行条件选择
euint32 incYes = FHE.select(choice, unitsEnc, FHE.asEuint32(0));
euint32 incNo = FHE.select(choice, FHE.asEuint32(0), unitsEnc);

// 在加密数据上执行加法
p.yesTotalEnc = FHE.add(p.yesTotalEnc, incYes);
p.noTotalEnc = FHE.add(p.noTotalEnc, incNo);
```

## 🛡️ 安全特性

- ✅ 使用 Zama 官方审计的 FHE 库
- ✅ 解密请求需要验证签名
- ✅ 只有在预测结束后才能触发解密
- ✅ 智能合约防重入保护
- ✅ 严格的访问控制机制

## 📊 合约接口

### 主要函数

| 函数 | 说明 | 访问控制 |
|------|------|----------|
| `createPrediction` | 创建新的预测市场 | 公开 |
| `placeBet` | 参与投注（加密选择） | 公开 |
| `settle` | 请求解密并结算 | 公开（需等待结束时间） |
| `getPrediction` | 查询预测信息 | 视图函数 |
| `allowAccessToEncryptedTotals` | 授权访问加密数据 | 公开 |

### 事件

- `PredictionCreated`: 预测市场创建
- `BetPlaced`: 投注已下注
- `DecryptionRequested`: 解密请求已提交
- `PredictionSettled`: 预测已结算

## 🌐 网络配置

### Sepolia 测试网

- **Chain ID**: 11155111
- **RPC**: `https://sepolia.infura.io/v3/{INFURA_API_KEY}`
- **浏览器**: https://sepolia.etherscan.io

### 获取测试 ETH

- [Sepolia Faucet 1](https://sepoliafaucet.com/)
- [Sepolia Faucet 2](https://www.alchemy.com/faucets/ethereum-sepolia)

## 📚 相关资源

- [Zama FHEVM 文档](https://docs.zama.ai/fhevm)
- [Hardhat 文档](https://hardhat.org/docs)
- [Ethers.js 文档](https://docs.ethers.org/v6/)
- [Solidity 文档](https://docs.soliditylang.org/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

BSD-3-Clause-Clear

## ⚠️ 免责声明

本项目仅用于学习和演示目的，部署在测试网络上。请勿在生产环境中使用未经审计的代码。

---

**Built with ❤️ using Zama FHEVM**

