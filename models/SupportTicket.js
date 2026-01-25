const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['inquiry', 'bug', 'spoiler_report', 'account', 'payment', 'other'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedContent: {
    contentType: {
      type: String,
      enum: ['movie', 'comment', 'product', 'order', 'none'],
      default: 'none'
    },
    contentId: mongoose.Schema.Types.ObjectId
  },
  responses: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    isStaff: Boolean,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: String,
  resolvedAt: Date
}, {
  timestamps: true
});

// 인덱스
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: -1 });
supportTicketSchema.index({ ticketNumber: 1 });

// 티켓번호 자동 생성
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.ticketNumber = `TKT-${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
