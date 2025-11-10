import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_RPC_URL } from '../config/network';

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
const SEPOLIA_CHAIN_NAME = 'Sepolia Testnet';

export interface WalletState {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  chainId: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    account: null,
    provider: null,
    signer: null,
    chainId: null,
    isConnected: false,
    isCorrectNetwork: false,
  });

  const [error, setError] = useState<string | null>(null);

  // 检查是否已连接
  const checkConnection = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('请安装 MetaMask 或其他以太坊钱包');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();
      const chainId = '0x' + network.chainId.toString(16);

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const account = await signer.getAddress();
        
        setWalletState({
          account,
          provider,
          signer,
          chainId,
          isConnected: true,
          isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID,
        });
      }
    } catch (err: any) {
      console.error('检查连接失败:', err);
      setError(err.message);
    }
  };

  // 连接钱包
  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('请安装 MetaMask 或其他以太坊钱包');
      return;
    }

    try {
      setError(null);
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 请求账户权限
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = '0x' + network.chainId.toString(16);

      setWalletState({
        account,
        provider,
        signer,
        chainId,
        isConnected: true,
        isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID,
      });

      // 如果不在 Sepolia 网络，提示切换
      if (chainId !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia();
      }
    } catch (err: any) {
      console.error('连接钱包失败:', err);
      setError(err.message);
    }
  };

  // 断开连接
  const disconnect = () => {
    setWalletState({
      account: null,
      provider: null,
      signer: null,
      chainId: null,
      isConnected: false,
      isCorrectNetwork: false,
    });
  };

  // 切换到 Sepolia 网络
  const switchToSepolia = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // 如果网络不存在，添加它
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: SEPOLIA_CHAIN_NAME,
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'SEP',
                  decimals: 18,
                },
                rpcUrls: [SEPOLIA_RPC_URL],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError: any) {
          console.error('添加 Sepolia 网络失败:', addError);
          setError('无法添加 Sepolia 网络');
        }
      } else {
        console.error('切换网络失败:', switchError);
        setError('切换到 Sepolia 网络失败');
      }
    }
  };

  // 监听账户和网络变化
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        checkConnection();
      }
    };

    const handleChainChanged = () => {
      // 网络改变时重新加载页面（推荐做法）
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // 初始检查连接状态
    checkConnection();

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return {
    ...walletState,
    connect,
    disconnect,
    switchToSepolia,
    error,
  };
}

// 类型声明
declare global {
  interface Window {
    ethereum?: any;
  }
}

