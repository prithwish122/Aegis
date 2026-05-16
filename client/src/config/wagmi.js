import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

// 0G Aristotle Mainnet (chain id 16661)
export const ogMainnet = {
  id: 16661,
  name: '0G Aristotle',
  network: 'og-aristotle',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_ZG_MAINNET_RPC || 'https://evmrpc.0g.ai'] },
    public: { http: ['https://evmrpc.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Chainscan', url: 'https://chainscan.0g.ai' },
  },
  testnet: false,
};

// 0G Galileo Testnet (chain id 16602)
export const ogTestnet = {
  id: 16602,
  name: '0G Galileo Testnet',
  network: 'og-galileo',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_ZG_TESTNET_RPC || 'https://evmrpc-testnet.0g.ai'] },
    public: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Galileo Chainscan', url: 'https://chainscan-galileo.0g.ai' },
  },
  testnet: true,
};

const network = (import.meta.env.VITE_NETWORK || 'testnet').toLowerCase();
const primaryChain = network === 'mainnet' ? ogMainnet : ogTestnet;
const secondaryChain = network === 'mainnet' ? ogTestnet : ogMainnet;

export const chains = [primaryChain, secondaryChain];
export const ACTIVE_CHAIN = primaryChain;
export const EXPLORER_BASE = primaryChain.blockExplorers.default.url;

export const config = getDefaultConfig({
  appName: 'Aegis.0G',
  projectId:
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
    'YOUR_32_CHAR_PROJECT_ID_HERE',
  chains,
  transports: {
    [ogMainnet.id]: http(import.meta.env.VITE_ZG_MAINNET_RPC || 'https://evmrpc.0g.ai'),
    [ogTestnet.id]: http(import.meta.env.VITE_ZG_TESTNET_RPC || 'https://evmrpc-testnet.0g.ai'),
  },
});
