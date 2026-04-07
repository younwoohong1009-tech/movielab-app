const mongoose = require('mongoose');
const { Schema } = mongoose;

const voteSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'AlphaUser', required: true, index: true },
  targetType: { type: String, enum: ['merchant', 'region'], required: true },
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant' },
  regionId: { type: Schema.Types.ObjectId, ref: 'Region' },
  cardType: { type: String, enum: ['D','H','O','S','T','B','P','R'], required: true },
  targetName: { type: String },
  targetRankAt: { type: Number },
  voteCountAt: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

voteSchema.index({ userId: 1, targetType: 1, merchantId: 1, createdAt: -1 });
voteSchema.index({ userId: 1, targetType: 1, regionId: 1, createdAt: -1 });
voteSchema.index({ createdAt: -1 });
voteSchema.index({ cardType: 1, createdAt: -1 });

module.exports = mongoose.model('Vote', voteSchema);
