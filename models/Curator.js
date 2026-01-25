const mongoose = require('mongoose');

const curatorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  specialties: [{
    type: String
  }],
  collectionsCount: {
    type: Number,
    default: 0
  },
  followersCount: {
    type: Number,
    default: 0
  },
  isMonthlyFeatured: {
    type: Boolean,
    default: false
  },
  featuredAt: Date,
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 인덱스
curatorSchema.index({ userId: 1 });
curatorSchema.index({ isMonthlyFeatured: 1 });

module.exports = mongoose.model('Curator', curatorSchema);
