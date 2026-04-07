const mongoose = require('mongoose');
const { Schema } = mongoose;

const alphaUserSchema = new Schema({
  nickname: { type: String, required: true, maxlength: 20, trim: true },
  phoneHash: { type: String, required: true, unique: true },
  dailyVotesUsed: { type: Number, default: 0 },
  dailyVoteReset: { type: Date, default: Date.now },
  totalVotes: { type: Number, default: 0 },
  votedCardTypes: [{ type: String, enum: ['D','H','O','S','T','B','P','R'] }],
  cardIssued: { type: Boolean, default: false },
  issuedCardType: { type: String, enum: ['D','H','O','S','T','B','P','R'] },
  createdAt: { type: Date, default: Date.now },
});

alphaUserSchema.methods.checkDailyReset = function () {
  const now = new Date();
  if (now.toDateString() !== this.dailyVoteReset.toDateString()) {
    this.dailyVotesUsed = 0;
    this.dailyVoteReset = now;
  }
};

alphaUserSchema.methods.canVote = function (maxDaily = 10) {
  this.checkDailyReset();
  return this.dailyVotesUsed < maxDaily;
};

alphaUserSchema.index({ phoneHash: 1 });
alphaUserSchema.index({ totalVotes: -1 });

module.exports = mongoose.model('AlphaUser', alphaUserSchema);
