const mongoose = require('mongoose');
const { Schema } = mongoose;

const regionSchema = new Schema({
  name: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, default: '서울' },
  voteCount: { type: Number, default: 0, index: true },
  rank: { type: Number, default: 0 },
  rankDelta: { type: Number, default: 0 },
  topCardType: { type: String, enum: ['D','H','O','S','T','B','P','R'] },
  cardDistribution: {
    D: { type: Number, default: 0 },
    H: { type: Number, default: 0 },
    O: { type: Number, default: 0 },
    S: { type: Number, default: 0 },
    T: { type: Number, default: 0 },
    B: { type: Number, default: 0 },
    P: { type: Number, default: 0 },
    R: { type: Number, default: 0 },
  },
  merchantCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

regionSchema.index({ city: 1, district: 1, name: 1 }, { unique: true });
regionSchema.index({ voteCount: -1 });

module.exports = mongoose.model('Region', regionSchema);
