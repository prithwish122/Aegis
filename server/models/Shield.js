const mongoose = require('mongoose');

const shieldSchema = new mongoose.Schema({
  user: { type: String, required: true, index: true, lowercase: true },
  depositAmount: { type: Number, required: true },
  asset: { type: String, required: true },
  assetName: { type: String, required: true },
  durationMonths: { type: Number, required: true },
  yieldSource: { type: String },
  yieldApy: { type: Number },
  exposureBudget: { type: Number, default: 0 },
  entryPrice: { type: Number },
  positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', default: null },
  status: { type: String, enum: ['active', 'settled', 'cancelled'], default: 'active', index: true },
  settleAt: { type: Date },
  closePrice: { type: Number, default: null },
  exposurePayout: { type: Number, default: null },
  totalReturn: { type: Number, default: null },
  ensSubname: { type: String, default: null },

  // Legacy storage (Fileverse / content hash) — kept for back-compat with old records
  fileverseDocHash: { type: String, default: null },

  // 0G Storage — canonical going forward
  storageProvider: { type: String, enum: ['zerog', 'fileverse', 'hash', null], default: null },
  storageRootHash: { type: String, default: null, index: true },
  storageTxHash: { type: String, default: null },

  // 0G Compute — TEE-verified inference proof for the recommendation that produced this shield
  teeInferenceProvider: { type: String, default: null },
  teeInferenceSignature: { type: String, default: null },
  teeInferenceVerified: { type: Boolean, default: false },
  teeInferenceModel: { type: String, default: null },

  // 0G Chain — on-chain shield index returned by AegisVault.createShield
  onChainIdx: { type: Number, default: null },
  onChainTxHash: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  settledAt: { type: Date, default: null },
});

module.exports = mongoose.model('Shield', shieldSchema);
