import '../styles/About.css';

export function About() {
  return (
    <div className="about-container">
      {/* 顶部横幅 */}
      <div className="about-hero">
        <div className="hero-glow"></div>
        <div className="hero-icon">🔮</div>
        <h1 className="hero-title">关于预测市场</h1>
        <p className="hero-subtitle">
          基于全同态加密技术的去中心化预测市场平台
        </p>
      </div>

      {/* 主要内容 */}
      <div className="about-content">
        {/* 项目介绍 */}
        <section className="about-section">
          <div className="section-header">
            <span className="section-icon">💡</span>
            <h2 className="section-title">什么是预测市场？</h2>
          </div>
          <div className="section-body">
            <p className="section-text">
              预测市场是一个去中心化的平台，允许用户创建和参与各种预测。通过区块链技术和全同态加密（FHE），
              我们确保所有投票在结算前完全保密，同时保持透明和公平。
            </p>
            <div className="highlight-box">
              <div className="highlight-item">
                <span className="highlight-icon">🔒</span>
                <div className="highlight-content">
                  <h3>完全隐私保护</h3>
                  <p>使用 FHE 技术加密所有投票，确保在结算前无人知晓结果</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">⚡</span>
                <div className="highlight-content">
                  <h3>即时透明结算</h3>
                  <p>基于智能合约自动结算，所有过程透明可验证</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🌐</span>
                <div className="highlight-content">
                  <h3>完全去中心化</h3>
                  <p>无需中心化服务器，所有数据存储在区块链上</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FHE 技术介绍 */}
        <section className="about-section">
          <div className="section-header">
            <span className="section-icon">🔐</span>
            <h2 className="section-title">全同态加密（FHE）技术</h2>
          </div>
          <div className="section-body">
            <p className="section-text">
              全同态加密（Fully Homomorphic Encryption）是一种革命性的加密技术，
              允许在加密数据上直接进行计算，而无需解密。这意味着智能合约可以在不知道具体投票内容的情况下进行统计和结算。
            </p>
            <div className="tech-features">
              <div className="tech-feature">
                <div className="tech-number">01</div>
                <div className="tech-content">
                  <h4>加密投票</h4>
                  <p>用户的投票在本地使用 FHE 加密</p>
                </div>
              </div>
              <div className="tech-feature">
                <div className="tech-number">02</div>
                <div className="tech-content">
                  <h4>链上计算</h4>
                  <p>智能合约直接对加密数据进行累加</p>
                </div>
              </div>
              <div className="tech-feature">
                <div className="tech-number">03</div>
                <div className="tech-content">
                  <h4>安全解密</h4>
                  <p>结算时通过去中心化预言机安全解密</p>
                </div>
              </div>
              <div className="tech-feature">
                <div className="tech-number">04</div>
                <div className="tech-content">
                  <h4>透明验证</h4>
                  <p>所有参与者都可以验证结果的正确性</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 如何使用 */}
        <section className="about-section">
          <div className="section-header">
            <span className="section-icon">📖</span>
            <h2 className="section-title">如何使用</h2>
          </div>
          <div className="section-body">
            <div className="steps-container">
              <div className="step-item">
                <div className="step-badge">
                  <span className="step-number">1</span>
                </div>
                <div className="step-content">
                  <h3 className="step-title">连接钱包</h3>
                  <p className="step-description">
                    点击右上角"连接钱包"按钮，使用 MetaMask 连接到 Sepolia 测试网
                  </p>
                </div>
              </div>
              
              <div className="step-arrow">→</div>

              <div className="step-item">
                <div className="step-badge">
                  <span className="step-number">2</span>
                </div>
                <div className="step-content">
                  <h3 className="step-title">创建或参与</h3>
                  <p className="step-description">
                    创建新的预测市场或浏览现有市场进行投注
                  </p>
                </div>
              </div>

              <div className="step-arrow">→</div>

              <div className="step-item">
                <div className="step-badge">
                  <span className="step-number">3</span>
                </div>
                <div className="step-content">
                  <h3 className="step-title">加密投票</h3>
                  <p className="step-description">
                    选择 YES 或 NO，您的投票将使用 FHE 技术加密
                  </p>
                </div>
              </div>

              <div className="step-arrow">→</div>

              <div className="step-item">
                <div className="step-badge">
                  <span className="step-number">4</span>
                </div>
                <div className="step-content">
                  <h3 className="step-title">等待结算</h3>
                  <p className="step-description">
                    预测结束后，任何人都可以触发结算，查看最终结果
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 联系方式 */}
        <section className="about-section about-footer">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="footer-icon">🔮</span>
              <span className="footer-brand">预测市场</span>
            </div>
            <p className="footer-text">
              基于 Zama fhEVM 技术构建的去中心化预测市场平台
            </p>
            <div className="footer-links">
              <a href="https://github.com/zama-ai/fhevm" target="_blank" rel="noopener noreferrer" className="footer-link">
                <span>📚</span>
                <span>Zama 文档</span>
              </a>
              <a href="https://docs.zama.ai/fhevm" target="_blank" rel="noopener noreferrer" className="footer-link">
                <span>🔐</span>
                <span>fhEVM</span>
              </a>
              <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer" className="footer-link">
                <span>🔍</span>
                <span>区块浏览器</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

