const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const NETWORK_META = {
  baseSepolia: { explorer: "https://sepolia.basescan.org", label: "Base Sepolia" },
  ogTestnet:   { explorer: "https://chainscan-galileo.0g.ai", label: "0G Galileo Testnet" },
  ogMainnet:   { explorer: "https://chainscan.0g.ai",          label: "0G Aristotle Mainnet" },
  localhost:   { explorer: "",                                  label: "Localhost" },
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  const meta = NETWORK_META[networkName] || { explorer: "", label: networkName };

  console.log("=========================================");
  console.log(" Aegis.0G — Contract Deployment");
  console.log("=========================================");
  console.log("Network:    ", meta.label);
  console.log("Chain ID:   ", chainId.toString());
  console.log("Deployer:   ", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:    ", hre.ethers.formatEther(balance), "(native)");
  if (balance === 0n) {
    throw new Error("Deployer has no native token — fund the wallet first");
  }

  // 1. Deploy AUSDC
  console.log("\n[1/2] Deploying AUSDC...");
  const AUSDC = await hre.ethers.getContractFactory("AUSDC");
  const ausdc = await AUSDC.deploy();
  await ausdc.waitForDeployment();
  const ausdcAddress = await ausdc.getAddress();
  const ausdcTxHash = ausdc.deploymentTransaction().hash;
  console.log("  AUSDC:      ", ausdcAddress);
  console.log("  Tx:         ", ausdcTxHash);

  // Wait for a couple confirmations to avoid nonce flake on slow RPCs
  console.log("  Waiting for 2 confirmations...");
  await ausdc.deploymentTransaction().wait(2);

  // 2. Deploy AegisVault (relayer = deployer)
  console.log("\n[2/2] Deploying AegisVault...");
  const AegisVault = await hre.ethers.getContractFactory("AegisVault");
  const vault = await AegisVault.deploy(ausdcAddress, deployer.address);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  const vaultTxHash = vault.deploymentTransaction().hash;
  console.log("  AegisVault: ", vaultAddress);
  console.log("  Tx:         ", vaultTxHash);

  // Persist deployment record (merged per-network)
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  let existing = { networks: {} };
  if (fs.existsSync(deploymentPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
      if (raw.networks) existing = raw;
      else if (raw.network) {
        // migrate legacy single-network shape
        existing = { networks: { [raw.network]: raw } };
      }
    } catch {
      // ignore parse errors, treat as fresh
    }
  }

  existing.networks[networkName] = {
    network: networkName,
    label: meta.label,
    chainId: chainId.toString(),
    explorer: meta.explorer,
    deployer: deployer.address,
    relayer: deployer.address,
    deploymentTime: new Date().toISOString(),
    contracts: {
      ausdc: {
        address: ausdcAddress,
        name: "Aegis USD",
        symbol: "A-USDC",
        decimals: 6,
        txHash: ausdcTxHash,
      },
      aegisVault: {
        address: vaultAddress,
        ausdcToken: ausdcAddress,
        relayer: deployer.address,
        txHash: vaultTxHash,
      },
    },
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(existing, null, 2));
  console.log("\nSaved deployment to:", deploymentPath);

  console.log("\n=========================================");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("=========================================");
  console.log("AUSDC:        ", ausdcAddress);
  console.log("AegisVault:   ", vaultAddress);
  console.log("Relayer:      ", deployer.address);
  if (meta.explorer) {
    console.log("AUSDC tx:     ", `${meta.explorer}/tx/${ausdcTxHash}`);
    console.log("Vault tx:     ", `${meta.explorer}/tx/${vaultTxHash}`);
  }
  console.log("=========================================");
  console.log("\nServer env:");
  console.log(`VAULT_CONTRACT_ADDRESS=${vaultAddress}`);
  console.log(`USDC_ADDRESS=${ausdcAddress}`);
  console.log("\nClient env:");
  console.log(`VITE_AEGIS_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`VITE_AUSDC_ADDRESS=${ausdcAddress}`);
  console.log("=========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
