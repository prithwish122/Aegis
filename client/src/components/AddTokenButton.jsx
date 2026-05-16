import { useState } from 'react';
import { useAccount } from 'wagmi';
import { AUSDC_ADDRESS } from '../config/contracts';

/**
 * Adds the A-USDC token to the user's wallet (MetaMask et al.) via EIP-747.
 * Falls back gracefully if the wallet doesn't support wallet_watchAsset.
 */
export default function AddTokenButton({ className = '', label = 'Add A-USDC to wallet' }) {
  const { connector, isConnected } = useAccount();
  const [state, setState] = useState('idle'); // idle | adding | added | error
  const [err, setErr] = useState('');

  const add = async () => {
    if (!AUSDC_ADDRESS) {
      setErr('A-USDC address not configured');
      setState('error');
      return;
    }
    setState('adding');
    setErr('');
    try {
      // Get the underlying EIP-1193 provider from wagmi's connector, with a fallback to window.ethereum
      let provider = null;
      try {
        if (connector?.getProvider) provider = await connector.getProvider();
      } catch (_) {}
      if (!provider && typeof window !== 'undefined') provider = window.ethereum;
      if (!provider?.request) throw new Error('No EIP-1193 wallet provider available');

      const result = await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: AUSDC_ADDRESS,
            symbol: 'A-USDC',
            decimals: 6,
          },
        },
      });
      setState(result ? 'added' : 'idle');
    } catch (e) {
      setErr(e?.shortMessage || e?.message || 'Failed to add token');
      setState('error');
    }
  };

  if (!isConnected) return null;

  return (
    <button
      type="button"
      onClick={add}
      disabled={state === 'adding'}
      className={
        'inline-flex items-center gap-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-panel)] px-3 py-1.5 text-xs font-medium text-[var(--t-text)] hover:border-[var(--t-blue)] hover:text-[var(--t-blue)] transition-colors disabled:opacity-50 ' +
        className
      }
      title={err || 'Adds A-USDC to MetaMask / your connected wallet'}
    >
      {state === 'adding' && <span className="shield-loader w-3 h-3" />}
      {state === 'added' ? '✓ Added' : state === 'error' ? 'Retry add' : label}
    </button>
  );
}
