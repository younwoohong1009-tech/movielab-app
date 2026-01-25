const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  membershipPrice: {
    type: Number,
    min: 0
  },
  autoMembershipDiscount: {
    type: Boolean,
    default: false
  },
  discountPercentage: {
    type: Number,
    default: 25,
    min: 0,
    max: 100
  },
  images: [{
    url: String,
    alt: String
  }],
  category: {
    type: String,
    enum: ['poster', 'book', 'merchandise', 'clothing', 'other'],
    default: 'other'
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  relatedMovies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie'
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'soldout', 'discontinued'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 인덱스
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ status: 1, featured: -1 });
productSchema.index({ category: 1 });

// 가상 필드: 실제 판매가 계산
productSchema.virtual('finalPrice').get(function() {
  if (this.membershipPrice) return this.membershipPrice;
  if (this.autoMembershipDiscount) {
    return this.price * (1 - this.discountPercentage / 100);
  }
  return this.price;
});

module.exports = mongoose.model('Product', productSchema);
