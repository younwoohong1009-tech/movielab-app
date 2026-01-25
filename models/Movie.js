const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    titleKr: {
        type: String,
        required: [true, '한글 제목은 필수입니다'],
        trim: true
    },
    titleEn: {
        type: String,
        trim: true
    },
    director: {
        type: String,
        required: [true, '감독은 필수입니다']
    },
    year: {
        type: Number,
        required: [true, '개봉년도는 필수입니다'],
        min: 1900,
        max: new Date().getFullYear() + 2
    },
    runtime: {
        type: Number,
        min: 0
    },
    genres: [{
        type: String,
        enum: ['드라마', 'SF', '스릴러', '코미디', '액션', '로맨스', '공포', '다큐멘터리', '애니메이션', '판타지']
    }],
    rating: {
        type: String,
        enum: ['전체관람가', '12세 관람가', '15세 관람가', '청소년 관람불가'],
        default: '15세 관람가'
    },
    country: {
        type: String,
        default: '한국'
    },
    synopsis: {
        type: String
    },
    cast: [{
        type: String
    }],
    poster: {
        type: String
    },
    background: {
        type: String
    },
    thumbnail: {
        type: String
    },
    videos: {
        main4k: String,
        mainFhd: String,
        trailer: String
    },
    subtitles: [{
        language: {
            type: String,
            enum: ['ko', 'en', 'ja', 'zh']
        },
        url: String
    }],
    has4k: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    relatedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    metadata: {
        imdbId: String,
        tmdbId: String
    }
}, {
    timestamps: true
});

// Indexes
movieSchema.index({ titleKr: 'text', titleEn: 'text', director: 'text' });
movieSchema.index({ year: -1 });
movieSchema.index({ status: 1 });
movieSchema.index({ views: -1 });

// Virtual for URL
movieSchema.virtual('url').get(function() {
    return `/movies/${this._id}`;
});

module.exports = mongoose.model('Movie', movieSchema);
