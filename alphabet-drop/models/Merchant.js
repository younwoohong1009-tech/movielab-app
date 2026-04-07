const mongoose = require('mongoose');
const { Schema } = mongoose;

const merchantSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  roadAddress: { type: String },
  phone: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  categoryRaw: { type: String },
  categoryGroup: { type: String },
  cardType: {
    type: String,
    enum: ['D','H','O','S','T','B','P','R'],
    required: true,
    index: true,
  },
  regionId: { type: Schema.Types.ObjectId, ref: 'Region', index: true },
  regionName: { type: String },
  voteCount: { type: Number, default: 0, index: true },
  rank: { type: Number, default: 0 },
  rankDelta: { type: Number, default: 0 },
  externalId: { type: String, unique: true, sparse: true },
  thumbnailUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

merchantSchema.index({ location: '2dsphere' });
merchantSchema.index({ cardType: 1, voteCount: -1 });
merchantSchema.index({ regionId: 1, voteCount: -1 });
merchantSchema.index({ name: 'text', address: 'text' });

module.exports = mongoose.model('Merchant', merchantSchema);
