const express = require('express');
const router = express.Router();
const yieldShieldEngine = require('../engine/yieldShieldEngine');
const zeroGComputeService = require('../services/zeroGComputeService');
const { MARKETS } = require('../config/markets');
const agentBearerAuth = require('../middleware/agentBearerAuth');

/**
 * POST /api/ai/recommend-shield
 * Body: { concern: string, depositAmount?: number, durationMonths?: number }
 *
 * Asks 0G Compute (TEE-verified) for an asset recommendation, with silent
 * NIM and OpenAI fallbacks. Returns the same envelope the frontend expects,
 * augmented with TEE proof fields when 0G Compute served the request.
 */
router.post('/recommend-shield', agentBearerAuth({ action: 'recommend' }), async (req, res) => {
  try {
    const { concern, depositAmount = 1000, durationMonths = 3 } = req.body || {};
    if (!concern) {
      return res.status(400).json({ error: 'Missing concern field' });
    }

    const rec = await zeroGComputeService.recommendShield(concern);

    const asset = rec.asset || 'gold';
    const market = MARKETS.find((m) => m.id === asset);
    const projection = yieldShieldEngine.getProjection({
      depositAmount: Number(depositAmount),
      asset,
      durationMonths: Number(durationMonths),
    });

    res.json({
      recommendation: {
        asset,
        assetName: market ? market.name : asset,
        reason:
          rec.reason ||
          `Based on your concern about "${concern}", we recommend hedging with ${market ? market.name : asset}.`,
        projection,
        // Inference provenance — surface to the UI so judges can see verifiability
        providerUsed: rec.providerUsed,
        teeVerified: rec.teeVerified === true,
        teeProviderAddress: rec.teeProviderAddress || null,
        teeModel: rec.teeModel || null,
        teeChatId: rec.teeChatId || null,
      },
    });
  } catch (error) {
    console.error('[AI recommend-shield]', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
