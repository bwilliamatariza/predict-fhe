import { useState } from 'react';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useWallet } from '../hooks/useWallet';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contracts';
import { ethers } from 'ethers';
import '../styles/CreatePrediction.css';

export function CreatePrediction({ onCreated }: { onCreated?: () => void }) {
  const signer = useEthersSigner();
  const { isConnected, isCorrectNetwork } = useWallet();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [durationMins, setDurationMins] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const submit = async () => {
    if (!isConnected) return alert('请先连接钱包');
    if (!isCorrectNetwork) return alert('请切换到 Sepolia 测试网');
    if (!signer) return alert('钱包未就绪');
    if (!CONTRACT_ADDRESS || CONTRACT_ABI.length === 0) return alert('合约配置缺失');
    if (!name || !content) return alert('请填写所有字段');

    setSubmitting(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const end = Math.floor(Date.now() / 1000) + durationMins * 60;
      const tx = await contract.createPrediction(name, content, end);
      await tx.wait();
      
      // 显示成功弹窗
      setShowSuccessModal(true);
      
      // 3秒后自动关闭弹窗
      setTimeout(() => {
        setShowSuccessModal(false);
        onCreated && onCreated();
      }, 3000);
      
      setName(''); setContent('');
    } catch (e: any) {
      console.error(e);
      alert('创建失败: ' + (e?.message || '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* 成功弹窗 */}
      {showSuccessModal && (
        <div className="success-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-wrapper">
              <div className="success-icon">
                <svg viewBox="0 0 52 52" className="success-checkmark">
                  <circle className="success-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                  <path className="success-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
            </div>
            <h3 className="success-title">创建成功！</h3>
            <p className="success-message">
              您的预测市场已成功创建并上链
            </p>
            <div className="success-features">
              <div className="success-feature">
                <span className="feature-icon">🔒</span>
                <span>完全加密</span>
              </div>
              <div className="success-feature">
                <span className="feature-icon">⚡</span>
                <span>即时生效</span>
              </div>
              <div className="success-feature">
                <span className="feature-icon">🌐</span>
                <span>链上存储</span>
              </div>
            </div>
            <button 
              className="success-close-btn"
              onClick={() => setShowSuccessModal(false)}
            >
              确定
            </button>
          </div>
        </div>
      )}
    
      <div className="create-prediction-container">
        <div className="create-prediction-card">
        <div className="create-header">
          <div className="create-header-icon">✨</div>
          <h2 className="create-header-title">创建新预测</h2>
          <p className="create-header-subtitle">
            创建一个预测市场，让其他人参与。所有投票都经过加密处理，保护隐私。
          </p>
        </div>

        <div className="create-body">
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📝</span>
              <span>预测标题</span>
            </label>
            <input
              className="form-input"
              placeholder="例如：比特币会在2024年底达到$100k吗？"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <div className="form-help">
              💡 使用清晰、简洁的标题来描述你的预测
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📄</span>
              <span>详细描述</span>
            </label>
            <textarea
              className="form-input form-textarea"
              placeholder="提供详细的背景信息和解决标准..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
            />
            <div className="form-help">
              💡 包含足够的细节，让参与者理解预测的条件和结果判断标准
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">⏰</span>
              <span>持续时间</span>
            </label>
            <div className="duration-group">
              <div className="duration-input-wrapper">
                <input
                  className="form-input duration-input"
                  type="number"
                  value={durationMins}
                  min={1}
                  onChange={e => setDurationMins(parseInt(e.target.value || '0'))}
                />
                <span className="duration-unit">分钟</span>
              </div>
              <div className="preview-time">
                <div className="preview-label">结束时间</div>
                <div className="preview-value">
                  {new Date(Date.now() + durationMins * 60 * 1000).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="form-help">
              💡 设置合理的时间窗口，让足够多的人参与投票
            </div>
          </div>

          <div className="feature-highlights">
            <div className="highlights-title">✨ 特性亮点</div>
            <div className="highlights-list">
              <div className="highlight-item">
                <span className="highlight-icon">🔒</span>
                <span>完全隐私保护</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">⚡</span>
                <span>FHE 加密技术</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🌐</span>
                <span>去中心化执行</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">💎</span>
                <span>透明可验证</span>
              </div>
            </div>
          </div>
        </div>

        <div className="create-footer">
          <div className="footer-info">
            <span>🛡️</span>
            <span>所有数据将存储在区块链上</span>
          </div>
          <div className="footer-actions">
            <button
              onClick={submit}
              disabled={submitting || !name.trim() || !content.trim()}
              className="btn-create"
            >
              {submitting ? (
                <>
                  <span className="create-spinner"></span>
                  <span>创建中...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>创建预测</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

