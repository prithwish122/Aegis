require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const {
  DEPLOYER_PRIVATE_KEY,
  BASE_SEPOLIA_RPC,
  ZG_TESTNET_RPC,
  ZG_MAINNET_RPC,
} = process.env;

const accounts =
  DEPLOYER_PRIVATE_KEY && DEPLOYER_PRIVATE_KEY.length === 64
    ? [`0x${DEPLOYER_PRIVATE_KEY}`]
    : DEPLOYER_PRIVATE_KEY && DEPLOYER_PRIVATE_KEY.startsWith("0x")
      ? [DEPLOYER_PRIVATE_KEY]
      : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts,
      chainId: 84532,
    },
    ogTestnet: {
      url: ZG_TESTNET_RPC || "https://evmrpc-testnet.0g.ai",
      accounts,
      chainId: 16602,
    },
    ogMainnet: {
      url: ZG_MAINNET_RPC || "https://evmrpc.0g.ai",
      accounts,
      chainId: 16661,
    },
  },
};
