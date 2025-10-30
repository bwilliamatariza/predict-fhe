import { useWallet } from '../hooks/useWallet';
import '../styles/Header.css';

interface HeaderProps {
  currentView: 'browse' | 'create' | 'about';
  onNavigate: (view: 'browse' | 'create' | 'about') => void;
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  const { account, isConnected, isCorrectNetwork, connect, disconnect, switchToSepolia, error } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* Logo 区域 */}
          <div className="header-logo">
            <span className="header-logo-icon">🔮</span>
            <div className="header-logo-text">
              <h1 className="header-logo-title">预测市场</h1>
              <span className="header-logo-subtitle">FHE 全同态加密</span>
            </div>
          </div>

          {/* 导航区域 */}
          <nav className="header-nav">
            <button 
              onClick={() => onNavigate('browse')}
              className={`nav-link ${currentView === 'browse' ? 'active' : ''}`}
            >
              预测市场
            </button>
            <button 
              onClick={() => onNavigate('create')}
              className={`nav-link ${currentView === 'create' ? 'active' : ''}`}
            >
              创建市场
            </button>
            <button 
              onClick={() => onNavigate('about')}
              className={`nav-link ${currentView === 'about' ? 'active' : ''}`}
            >
              关于
            </button>
          </nav>

          {/* 钱包连接区域 */}
          <div className="wallet-section">
            {/* 网络状态 */}
            {isConnected && (
              <div className={`network-badge ${!isCorrectNetwork ? 'wrong-network' : ''}`}>
                <span className="network-dot"></span>
                {isCorrectNetwork ? 'Sepolia' : '错误网络'}
              </div>
            )}

            {/* 连接/断开按钮 */}
            {!isConnected ? (
              <button onClick={connect} className="connect-button">
                <span className="connect-button-icon">👛</span>
                <span className="connect-button-text">连接钱包</span>
              </button>
            ) : !isCorrectNetwork ? (
              <button onClick={switchToSepolia} className="switch-network-button">
                ⚠️ 切换到 Sepolia
              </button>
            ) : (
              <div className="address-container">
                <div className="address-badge">
                  <span className="wallet-icon">💼</span>
                  {formatAddress(account!)}
                </div>
                <button onClick={disconnect} className="disconnect-button">
                  断开
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 错误提示横幅 */}
      {error && (
        <div className="wallet-error">
          <div className="wallet-error-title">⚠️ 钱包错误</div>
          <div className="wallet-error-message">{error}</div>
        </div>
      )}
    </>
  );
}
