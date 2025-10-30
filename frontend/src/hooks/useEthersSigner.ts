import { useWallet } from './useWallet';

export function useEthersSigner() {
  const { signer } = useWallet();
  return signer;
}