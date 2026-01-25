const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '이름은 필수입니다'],
        trim: true
    },
    email: {
        type: String,
        required: [true, '이메일은 필수입니다'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, '올바른 이메일 형식이 아닙니다']
    },
    password: {
        type: String,
        required: [true, '비밀번호는 필수입니다'],
        minlength: 6,
        select: false
    },
    avatar: {
        type: String,
        default: 'https://via.placeholder.com/100'
    },
    role: {
        type: String,
        enum: ['user', 'membership', 'curator', 'admin', 'super_admin'],
        default: 'user'
    },
    membership: {
        plan: {
            type: String,
            enum: ['monthly', 'yearly'],
            default: null
        },
        startDate: Date,
        endDate: Date,
        status: {
            type: String,
            enum: ['active', 'expired', 'cancelled'],
            default: null
        },
        autoRenewal: {
            type: Boolean,
            default: true
        }
    },
    stats: {
        watchTime: {
            type: Number,
            default: 0
        },
        moviesWatched: {
            type: Number,
            default: 0
        },
        commentsCount: {
            type: Number,
            default: 0
        },
        collectionsCount: {
            type: Number,
            default: 0
        },
        likesGiven: {
            type: Number,
            default: 0
        },
        followersCount: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    },
    lastLoginAt: Date,
    refreshToken: {
        type: String,
        select: false
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'membership.status': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if membership is active
userSchema.methods.hasActiveMembership = function() {
    if (!this.membership || !this.membership.endDate) return false;
    return this.membership.status === 'active' && new Date(this.membership.endDate) > new Date();
};

// Check if user is curator
userSchema.methods.isCurator = function() {
    return ['curator', 'admin', 'super_admin'].includes(this.role);
};

module.exports = mongoose.model('User', userSchema);
