const express = require('express');
const router = express.Router();
const yieldShieldEngine = require('../engine/yieldShieldEngine');
const priceEngine = require('../engine/priceEngine');
const { MARKETS } = require('../config/markets');
const PriceHistory = require('../models/PriceHistory');
const agentBearerAuth = require('../middleware/agentBearerAuth');

// GET /rates — current yield rates
router.get('/rates', (req, res) => {
  const rates = yieldShieldEngine.getBestYield();
  res.json({ rates });
});

// GET /assets — shield-eligible markets with prices
router.get('/assets', (req, res) => {
  const eligible = MARKETS.filter((m) => m.shieldEligible).map((market) => {
    const priceData = priceEngine.getPrice(market.id);
    return {
      id: market.id,
      name: market.name,
      category: market.category,
      emoji: market.emoji,
      price: priceData ? priceData.price : null,
      change24h: priceData ? priceData.change24h : null,
    };
  });
  res.json({ assets: eligible });
});

// POST /simulate — projection
router.post('/simulate', agentBearerAuth({ action: 'simulate' }), (req, res) => {
  try {
    const { depositAmount, asset, durationMonths } = req.body;
    if (!depositAmount || !asset || !durationMonths) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const projection = yieldShieldEngine.getProjection({
      depositAmount: Number(depositAmount),
      asset,
      durationMonths: Number(durationMonths),
    });
    res.json({ projection });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /prepare — upload doc to 0G Storage, return on-chain args for AegisVault.createShield.
// Frontend calls this BEFORE the on-chain tx so it has the rootHash to pass into the contract.
router.post('/prepare', agentBearerAuth({ action: 'prepare' }), async (req, res) => {
  try {
    const {
      address,
      depositAmount,
      asset,
      durationMonths,
      teeInferenceSignature,
      teeInferenceProvider,
      teeInferenceModel,
    } = req.body || {};
    if (!address || !depositAmount || !asset || !durationMonths) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const prep = await yieldShieldEngine.prepareShield({
      address,
      depositAmount: Number(depositAmount),
      asset,
      durationMonths: Number(durationMonths),
      teeInferenceSignature: teeInferenceSignature || null,
      teeInferenceProvider: teeInferenceProvider || null,
      teeInferenceModel: teeInferenceModel || null,
    });
    res.json({ success: true, prepare: prep });
  } catch (err) {
    console.error('[yield-shield/prepare]', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /activate — create a shield (server-side: upload doc to 0G Storage,
// persist Shield record with TEE inference proof + on-chain tx hash from the
// frontend's `AegisVault.createShield` call).
router.post('/activate', agentBearerAuth({ action: 'activate' }), async (req, res) => {
  try {
    const {
      address,
      depositAmount,
      asset,
      durationMonths,
      // Optional — pass-through from the frontend recommend step:
      teeInferenceSignature,
      teeInferenceProvider,
      teeInferenceModel,
      teeInferenceVerified,
      // Optional — pass-through from the frontend on-chain createShield call:
      onChainTxHash,
      onChainIdx,
    } = req.body;
    if (!address || !depositAmount || !asset || !durationMonths) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Two activation modes:
    // 1. Frontend already called /prepare and submitted the on-chain tx — it sends
    //    the prepare-result back as `prepare` along with on-chain confirmation. Use
    //    `persistShield` to avoid re-uploading the doc.
    // 2. Legacy callers (WhatsApp / Elsa agent) call /activate with just the
    //    intent fields — use the full `createShield` flow (uploads + persists).
    const { prepare } = req.body;
    let shield;
    if (prepare && prepare.rootHash) {
      shield = await yieldShieldEngine.persistShield({
        address,
        depositAmount: Number(depositAmount),
        asset,
        durationMonths: Number(durationMonths),
        storageProvider: prepare.storageProvider,
        storageRootHash: prepare.rootHash,
        storageTxHash: prepare.storageTxHash,
        yieldApy: prepare.yieldApy,
        yieldSource: prepare.yieldSource,
        exposureBudget: prepare.exposureBudget,
        entryPrice: prepare.entryPrice,
        assetName: prepare.assetName,
        onChainTxHash: onChainTxHash || null,
        onChainIdx: typeof onChainIdx === 'number' ? onChainIdx : null,
        teeInferenceSignature: teeInferenceSignature || null,
        teeInferenceProvider: teeInferenceProvider || null,
        teeInferenceModel: teeInferenceModel || null,
        teeInferenceVerified: teeInferenceVerified === true,
      });
    } else {
      shield = await yieldShieldEngine.createShield({
        address,
        depositAmount: Number(depositAmount),
        asset,
        durationMonths: Number(durationMonths),
        teeInferenceSignature: teeInferenceSignature || null,
        teeInferenceProvider: teeInferenceProvider || null,
        teeInferenceModel: teeInferenceModel || null,
        teeInferenceVerified: teeInferenceVerified === true,
      });
      if (onChainTxHash || typeof onChainIdx === 'number') {
        shield.onChainTxHash = onChainTxHash || null;
        shield.onChainIdx = typeof onChainIdx === 'number' ? onChainIdx : null;
        await shield.save();
      }
    }
    res.json({ success: true, shield });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /settle/:id — settle a shield
router.post('/settle/:id', async (req, res) => {
  try {
    const shield = await yieldShieldEngine.settleShield(req.params.id);
    res.json({ success: true, shield });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /active/:address — active shields
router.get('/active/:address', async (req, res) => {
  try {
    const shields = await yieldShieldEngine.getActiveShields(req.params.address);
    res.json({ shields });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /history/:address — settled shields
router.get('/history/:address', async (req, res) => {
  try {
    const shields = await yieldShieldEngine.getShieldHistory(req.params.address);
    res.json({ shields });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /doc/:rootHash — fetch a shield agreement document from 0G Storage
router.get('/doc/:rootHash', async (req, res) => {
  try {
    const zeroGStorageService = require('../services/zeroGStorageService');
    const { rootHash } = req.params;
    if (!rootHash || rootHash.length < 4) {
      return res.status(400).json({ error: 'Invalid rootHash' });
    }
    if (!zeroGStorageService.isConfigured()) {
      return res.status(503).json({ error: '0G Storage not configured on this server' });
    }
    const doc = await zeroGStorageService.fetchShieldDoc(rootHash);
    if (!doc) {
      return res.status(404).json({ error: 'Shield doc not found' });
    }
    res.json({ rootHash, ...doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /backtest/:asset — generate backtest data
router.get('/backtest/:asset', async (req, res) => {
  try {
    const { asset } = req.params;
    const history = await PriceHistory.find({ marketId: asset })
      .sort({ timestamp: 1 })
      .limit(365)
      .lean();

    if (history.length < 2) {
      return res.json({ asset, backtest: [], message: 'Insufficient price history' });
    }

    const backtestResults = [];
    const depositAmount = 1000;
    const durationMonths = 3;

    for (let i = 0; i < history.length - 1; i += 30) {
      const entry = history[i];
      const exitIdx = Math.min(i + 90, history.length - 1);
      const exit = history[exitIdx];

      const priceChange = (exit.price - entry.price) / entry.price;
      const yieldEarned = depositAmount * 0.05 * (durationMonths / 12);
      const exposureBudget = yieldEarned;
      const exposureReturn = Math.max(exposureBudget * priceChange, -exposureBudget);

      backtestResults.push({
        entryDate: entry.timestamp,
        exitDate: exit.timestamp,
        entryPrice: entry.price,
        exitPrice: exit.price,
        priceChange: +(priceChange * 100).toFixed(2),
        yieldEarned: +yieldEarned.toFixed(2),
        exposureReturn: +exposureReturn.toFixed(2),
        totalReturn: +(depositAmount + yieldEarned + exposureReturn).toFixed(2),
      });
    }

    res.json({ asset, backtest: backtestResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
