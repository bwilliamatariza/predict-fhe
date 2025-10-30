import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import '../styles/PredictionList.css';

type Prediction = {
  id: number;
  creator: string;
  name: string;
  content: string;
  endTime: bigint;
  yesEnc: `0x${string}`;
  noEnc: `0x${string}`;
  yes: number;
  no: number;
  settled: boolean;
  pending: boolean;
};

export function PredictionList() {
  const { provider } = useWallet();
  const signer = useEthersSigner();
  const [ethSigner, setEthSigner] = useState<ethers.Signer | null>(null);
  const contract = useMemo(() => {
    if (!ethSigner) return null;
    if (!CONTRACT_ADDRESS || CONTRACT_ABI.length === 0) return null;
    try {
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethSigner);
    } catch {
      return null;
    }
  }, [ethSigner]);
  const [instance, setInstance] = useState<any>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [betting, setBetting] = useState<Record<number, boolean>>({});
  const [settling, setSettling] = useState<Record<number, boolean>>({});
  const [unitsMap, setUnitsMap] = useState<Record<number, number>>({});
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});
  const [votedPredictions, setVotedPredictions] = useState<Set<number>>(new Set());

  const [count, setCount] = useState(0);

  // Fetch total predictions count
  const fetchCount = async () => {
    if (!provider || !CONTRACT_ADDRESS || CONTRACT_ABI.length === 0) {
      console.log('⏭️  [数据] 跳过获取预测数量（Provider 或配置缺失）');
      return;
    }
    try {
      console.log('📊 [数据] 获取预测总数...');
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const total = await readContract.totalPredictions();
      console.log(`✅ [数据] 预测总数: ${total}`);
      setCount(Number(total));
    } catch (e) {
      console.error('❌ [数据] 获取预测数量失败:', e);
    }
  };

  // Fetch all prediction items
  const fetchItems = async (): Promise<Prediction[]> => {
    if (!provider || !CONTRACT_ADDRESS || CONTRACT_ABI.length === 0) {
      console.log('⏭️  [数据] 跳过获取预测列表（Provider 或配置缺失）');
      return [];
    }
    const out: Prediction[] = [];
    try {
      console.log(`📚 [数据] 开始获取 ${count} 个预测...`);
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const startTime = Date.now();
      
      for (let i = 0; i < count; i++) {
        const p: any = await readContract.getPrediction(i);
        out.push({
          id: i,
          creator: p[0],
          name: p[1],
          content: p[2],
          endTime: p[3],
          yesEnc: p[4],
          noEnc: p[5],
          yes: Number(p[6]),
          no: Number(p[7]),
          settled: p[8],
          pending: p[9],
        });
        console.log(`  ✓ [数据] 加载预测 #${i}: ${p[1]}`);
      }
      console.log(`✅ [数据] 加载完成，耗时: ${Date.now() - startTime}ms`);
    } catch (e) {
      console.error('❌ [数据] 获取预测列表失败:', e);
    }
    return out;
  };

  const [data, setData] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  const reload = async () => {
    console.log('🔄 [数据] 重新加载预测列表...');
    setLoading(true);
    try { 
      const items = await fetchItems();
      setData(items);
    } finally { 
      setLoading(false); 
    }
  };

  // Fetch count on provider change
  useEffect(() => {
    fetchCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // Auto-load on mount and when prediction count changes
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Set signer
  useEffect(() => {
    setEthSigner(signer);
  }, [signer]);

  // 从 localStorage 加载已投票记录
  useEffect(() => {
    const stored = localStorage.getItem('votedPredictions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setVotedPredictions(new Set(parsed));
      } catch (e) {
        console.error('加载投票记录失败:', e);
      }
    }
  }, []);

  // 每秒更新当前时间，实现实时倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 初始化主线程 SDK（从 UMD）
  useEffect(() => {
    console.log('🔧 [主线程] 初始化 Zama SDK...');
    
    const initMainSDK = async () => {
      try {
        // UMD SDK 应该已经加载到 window 对象
        const win = window as any;
        console.log('🔍 [主线程] 查找 UMD SDK...');
        console.log('📊 [主线程] window 对象键（前30个）:', Object.keys(win).slice(0, 30));
        
        // 尝试多个可能的全局变量名
        const possibleNames = [
          'RelayerSDK',
          'ZamaSDK', 
          'FhevmSDK',
          'relayerSDK',
          'fhevm',
        ];
        
        let SDK = null;
        for (const name of possibleNames) {
          if (win[name]) {
            console.log(`✅ [主线程] 找到 SDK at window.${name}`);
            SDK = win[name];
            break;
          }
        }
        
        if (!SDK) {
          console.warn('⚠️  [主线程] 未找到 UMD SDK，尝试直接从 window 搜索...');
          // 智能搜索：查找包含 initSDK 的对象
          for (const key of Object.keys(win)) {
            if (win[key] && typeof win[key] === 'object' && win[key].initSDK) {
              console.log(`✅ [主线程] 智能找到 SDK at window.${key}`);
              SDK = win[key];
              break;
            }
          }
        }
        
        if (!SDK) {
          console.error('❌ [主线程] 完全找不到 SDK');
          console.log('💡 [主线程] 可用的全局对象:', Object.keys(win).filter(k => 
            typeof win[k] === 'object' && win[k] !== null && !k.startsWith('webkit')
          ));
          return;
        }
        
        console.log('📊 [主线程] SDK 对象内容:', Object.keys(SDK));
        
        const { initSDK, createInstance, SepoliaConfig } = SDK;
        
        if (!initSDK || !createInstance || !SepoliaConfig) {
          console.error('❌ [主线程] SDK 导出不完整:', {
            hasInitSDK: !!initSDK,
            hasCreateInstance: !!createInstance,
            hasSepoliaConfig: !!SepoliaConfig,
          });
          return;
        }
        
        console.log('📦 [主线程] 调用 initSDK()...');
        const startTime = Date.now();
        await initSDK();
        console.log(`✅ [主线程] initSDK() 完成，耗时: ${Date.now() - startTime}ms`);
        
        console.log('🔐 [主线程] 创建 FHE 实例...');
        const instanceStart = Date.now();
        const fheInstance = await createInstance(SepoliaConfig);
        console.log(`✅ [主线程] FHE 实例创建完成，耗时: ${Date.now() - instanceStart}ms`);
        
        setInstance(fheInstance);
        setSdkReady(true);
        console.log('🎉 [主线程] SDK 初始化完成！');
        
      } catch (error) {
        console.error('❌ [主线程] SDK 初始化失败:', error);
      }
    };
    
    // 延迟一点确保 UMD 脚本已加载
    const timer = setTimeout(initMainSDK, 500);
    return () => clearTimeout(timer);
  }, []);

  // Worker 已禁用 - 使用主线程 SDK（更稳定）
  // Setup encryption worker once
  // useEffect(() => {
  //   console.log('🚀 [主线程] Worker 已禁用，使用主线程 SDK');
  // }, []);

  const placeBet = (id: number, yes: boolean) => {
    const units = unitsMap[id] ?? 1;
    console.log(`\n💰 [投注] 开始投注流程 - ID: ${id}, 选择: ${yes ? 'YES' : 'NO'}, 单位: ${units}`);
    
    // 检查是否已经投过票
    if (votedPredictions.has(id)) {
      alert('您已经对这个预测投过票了！');
      return;
    }
    
    if (!ethSigner) { 
      console.error('❌ [投注] 钱包未连接');
      alert('请先连接钱包'); 
      return; 
    }
    if (!CONTRACT_ADDRESS || CONTRACT_ABI.length===0) { 
      console.error('❌ [投注] 合约配置缺失');
      alert('合约配置缺失'); 
      return; 
    }
    if (!Number.isFinite(units) || units <= 0) { 
      console.error('❌ [投注] 单位数量无效:', units);
      alert('单位必须 > 0'); 
      return; 
    }

    console.log(`ℹ️  [投注] SDK 状态: ${sdkReady ? '就绪✅' : '未就绪❌'}, 实例: ${instance ? '可用✅' : '不可用❌'}`);
    
    if (!sdkReady || !instance) {
      console.error('❌ [投注] SDK 未就绪');
      alert('加密服务初始化中，请稍候...');
      return;
    }
    
    setBetting(prev => ({ ...prev, [id]: true }));
    setStatusMap(prev => ({ ...prev, [id]: '正在加密...' }));

    // Schedule heavy work to next macrotask so UI can paint immediately
    setTimeout(async () => {
      const overallStart = Date.now();
      try {
        console.log('👤 [投注] 获取用户地址...');
        const userAddress = await ethSigner.getAddress();
        console.log('✅ [投注] 用户地址:', userAddress);
        
        // 使用主线程 SDK 加密
        console.log('🔐 [投注] 使用主线程 SDK 加密...');
        const encryptStart = Date.now();
        
        console.log('📝 [投注] 创建加密输入缓冲区...');
        const buffer = instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
        console.log('📝 [投注] 添加布尔值:', yes);
        buffer.addBool(yes);
        
        console.log('⚡ [投注] 开始加密...');
        const encrypted = await Promise.race([
          buffer.encrypt(),
          new Promise((_, rej) => setTimeout(() => {
            console.error('⏱️ [投注] 加密超时 (30秒)');
            rej(new Error('Encryption timeout'));
          }, 30_000)),
        ]);
        console.log(`✅ [投注] 加密完成，耗时: ${Date.now() - encryptStart}ms`);

        console.log('📝 [投注] 准备发送区块链交易...');
        const c = contract ?? new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethSigner);
        const value = BigInt(units) * 100000000000000n; // 0.0001 ETH per unit
        console.log(`💸 [投注] 交易金额: ${value} wei (${units} 单位 × 0.0001 ETH)`);
        
        setStatusMap(prev => ({ ...prev, [id]: '发送交易...' }));
        console.log('📤 [投注] 调用合约 placeBet()...');
        const txStart = Date.now();
        const tx = await c.placeBet(id, (encrypted as any).handles[0], (encrypted as any).inputProof, units, { value });
        console.log('✅ [投注] 交易已发送:', tx.hash);
        
        setStatusMap(prev => ({ ...prev, [id]: '等待确认...' }));
        console.log('⏳ [投注] 等待交易确认...');
        const receipt = await tx.wait();
        console.log(`✅ [投注] 交易已确认！区块: ${receipt.blockNumber}, Gas: ${receipt.gasUsed}, 耗时: ${Date.now() - txStart}ms`);
        
        setStatusMap(prev => ({ ...prev, [id]: '' }));
        
        // 保存投票记录到 localStorage
        const newVoted = new Set(votedPredictions);
        newVoted.add(id);
        setVotedPredictions(newVoted);
        localStorage.setItem('votedPredictions', JSON.stringify(Array.from(newVoted)));
        
        console.log('🔄 [投注] 重新加载预测列表...');
        await reload();
        console.log(`🎉 [投注] 投注完成！总耗时: ${Date.now() - overallStart}ms\n`);
      } catch (e:any) {
        console.error('❌ [投注] 投注失败:', e);
        alert(e?.message || '投注失败');
      } finally {
        setBetting(prev => ({ ...prev, [id]: false }));
        setStatusMap(prev => ({ ...prev, [id]: '' }));
      }
    }, 0);
  };

  const settle = async (id: number) => {
    if (!signer) return alert('Connect wallet');
    if (!CONTRACT_ADDRESS || CONTRACT_ABI.length===0) return alert('Contract config missing');
    try {
      setSettling(prev => ({ ...prev, [id]: true }));
      const s = await signer;
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
      const tx = await contract.settle(id);
      await tx.wait();
      await reload();
    } catch (e) {
      console.error(e);
      alert('Settle failed');
    } finally {
      setSettling(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="prediction-container">
      {/* 顶部横幅 */}
      <div className="predictions-banner">
        <div className="banner-content">
          <div className="banner-icon-wrapper">
            <div className="banner-icon">🎯</div>
            <div className="banner-glow"></div>
          </div>
          <div className="banner-text">
            <h2 className="banner-title">探索预测市场</h2>
            <p className="banner-subtitle">
              所有投票使用 FHE 技术加密，完全保护隐私 · 去中心化 · 透明可验证
            </p>
          </div>
        </div>
        <button
          onClick={reload}
          className={`refresh-button ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
          <span className="refresh-text">{loading ? '加载中' : '刷新数据'}</span>
        </button>
      </div>

      {/* 空状态 */}
      {data.length === 0 && (
        <div className="empty-state-modern">
          <div className="empty-glow"></div>
          <div className="empty-icon-wrapper">
            <div className="empty-icon">🔮</div>
          </div>
          <h3 className="empty-title">暂无活跃预测</h3>
          <p className="empty-description">
            成为第一个创建预测市场的先行者
          </p>
          <div className="empty-features">
            <div className="empty-feature">
              <span>🔒</span>
              <span>隐私保护</span>
            </div>
            <div className="empty-feature">
              <span>⚡</span>
              <span>即时结算</span>
            </div>
            <div className="empty-feature">
              <span>💎</span>
              <span>公平透明</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {data.map((p) => {
          const ended = Number(p.endTime) <= currentTime;
          const isBetting = !!betting[p.id];
          const isSettling = !!settling[p.id];
          const hasVoted = votedPredictions.has(p.id);
          const timeLeft = Number(p.endTime) - currentTime;
          
          // 格式化剩余时间为 时:分:秒
          const timeLeftFormatted = timeLeft > 0
            ? (() => {
                const hours = Math.floor(timeLeft / 3600);
                const minutes = Math.floor((timeLeft % 3600) / 60);
                const seconds = timeLeft % 60;
                return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
              })()
            : '已结束';

          return (
            <div key={p.id} className="prediction-card">
              <div className="prediction-card-header">
                <div className="prediction-main-content">
                  <div className="prediction-info">
                    <h4 className="prediction-name">{p.name}</h4>
                    <p className="prediction-description">{p.content}</p>
                  </div>

                  <div className="prediction-stats">
                    <span className={`status-badge ${
                      p.settled ? 'status-settled' : ended ? 'status-ended' : 'status-active'
                    }`}>
                      {p.settled ? '✅ 已结算' : ended ? '⏰ 已结束' : '🔥 进行中'}
                    </span>

                    {p.settled ? (
                      <div className="prediction-results">
                        <div className="results-label">结果</div>
                        <div className="results-values">
                          <span className="result-yes">YES: {p.yes}</span>
                          <span className="result-no">NO: {p.no}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="prediction-encrypted">
                        <div className="encrypted-label">投票加密中</div>
                        <div className="encrypted-value">
                          <span>🔒</span>
                          <span>隐藏</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="prediction-timeline">
                  <span className="timeline-info">
                    <span>⏱️</span>
                    <span>{ended ? '结束于' : '结束于'}: {new Date(Number(p.endTime) * 1000).toLocaleString()}</span>
                  </span>
                  {!ended && (
                    <span className="timeline-remaining">
                      剩余 {timeLeftFormatted}
                    </span>
                  )}
                </div>
              </div>
              
              {!p.settled && (
                <div className="prediction-card-footer">
                  <div className="betting-controls">
                    <div className="betting-settings">
                      <div className="units-control">
                        <label className="units-label">投注单位:</label>
                        <input
                          className="units-input"
                          type="number"
                          min={1}
                          value={unitsMap[p.id] ?? 1}
                          onChange={(e) => setUnitsMap(prev => ({ ...prev, [p.id]: parseInt(e.target.value || '1') }))}
                          disabled={isBetting || isSettling}
                        />
                        <span className="units-price">@ 0.0001 ETH/单位</span>
                      </div>

                      {statusMap[p.id] && (
                        <div className="betting-status">
                          <div className="status-spinner"></div>
                          <span>{statusMap[p.id]}</span>
                        </div>
                      )}
                    </div>

                    <div className="betting-actions">
                      {hasVoted && !ended && (
                        <div className="voted-notice">
                          ✅ 您已投票
                        </div>
                      )}
                      
                      <button
                        onClick={() => placeBet(p.id, true)}
                        disabled={isBetting || isSettling || hasVoted || ended}
                        className="bet-button bet-yes"
                      >
                        {isBetting ? (
                          <>
                            <span className="spinner"></span>
                            <span>投注中...</span>
                          </>
                        ) : (
                          <>
                            <span>👍</span>
                            <span>投注 YES</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => placeBet(p.id, false)}
                        disabled={isBetting || isSettling || hasVoted || ended}
                        className="bet-button bet-no"
                      >
                        {isBetting ? (
                          <>
                            <span className="spinner"></span>
                            <span>投注中...</span>
                          </>
                        ) : (
                          <>
                            <span>👎</span>
                            <span>投注 NO</span>
                          </>
                        )}
                      </button>

                      {ended && (
                        <button
                          onClick={() => settle(p.id)}
                          disabled={isBetting || isSettling}
                          className="bet-button bet-settle"
                        >
                          {isSettling ? (
                            <>
                              <span className="spinner"></span>
                              <span>结算中...</span>
                            </>
                          ) : (
                            <>
                              <span>⚖️</span>
                              <span>结算</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.length > 0 && (
        <div className="info-banner">
          <div className="info-items">
            <div className="info-item">
              <span className="info-icon">💰</span>
              <span className="info-text">价格: 0.0001 ETH/单位</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <span className="info-text">所有投票完全加密</span>
            </div>
            <div className="info-item">
              <span className="info-icon">⚡</span>
              <span className="info-text">由 FHE 技术驱动</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
