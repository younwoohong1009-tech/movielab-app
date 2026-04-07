const Merchant = require('../models/Merchant');
const Region = require('../models/Region');
const Vote = require('../models/Vote');
const AlphaUser = require('../models/AlphaUser');
const { mapToAlphabetCard } = require('../utils/categoryMapper');
const { CARD_TYPES } = require('../config/cardTypes');

// ── 검색 (Mock 카카오 API + 자동 카드 매핑) ──
exports.search = async (req, res) => {
  try {
    const { query, type = 'merchant' } = req.query;
    if (!query) return res.status(400).json({ error: 'query 파라미터 필요' });

    if (type === 'region') {
      const regions = await Region.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { district: { $regex: query, $options: 'i' } },
        ],
      })
        .sort({ voteCount: -1 })
        .limit(20)
        .lean();

      return res.json({
        results: regions.map((r) => ({
          ...r,
          topCardInfo: r.topCardType ? CARD_TYPES[r.topCardType] : null,
        })),
        total: regions.length,
      });
    }

    // 가맹점 검색
    const merchants = await Merchant.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
        { regionName: { $regex: query, $options: 'i' } },
      ],
    })
      .sort({ voteCount: -1 })
      .limit(30)
      .lean();

    const results = merchants.map((m) => ({
      ...m,
      cardInfo: CARD_TYPES[m.cardType],
    }));

    res.json({ results, total: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── 투표 (DROP!) ──
exports.vote = async (req, res) => {
  try {
    const { targetType, targetId, userId } = req.body;

    if (!targetType || !targetId) {
      return res.status(400).json({ error: 'targetType, targetId 필요' });
    }

    // 간이 유저 (프로토타입: userId 없으면 자동 생성)
    let user;
    if (userId) {
      user = await AlphaUser.findById(userId);
    }
    if (!user) {
      user = await AlphaUser.create({
        nickname: `DROPPER_${Date.now().toString(36).toUpperCase()}`,
        phoneHash: `mock_${Date.now()}`,
      });
    }

    // 일일 투표 제한 체크
    user.checkDailyReset();
    if (user.dailyVotesUsed >= 10) {
      return res.status(429).json({
        error: '오늘 투표 횟수를 모두 사용했습니다. 내일 다시 DROP하세요!',
        dailyLimit: 10,
        used: user.dailyVotesUsed,
      });
    }

    let target, cardType;

    if (targetType === 'merchant') {
      target = await Merchant.findById(targetId);
      if (!target) return res.status(404).json({ error: '가맹점을 찾을 수 없습니다' });
      cardType = target.cardType;
      target.voteCount += 1;
      await target.save();

      // 해당 지역 투표수도 증가
      if (target.regionId) {
        await Region.findByIdAndUpdate(target.regionId, {
          $inc: { voteCount: 1, [`cardDistribution.${cardType}`]: 1 },
        });
      }
    } else {
      target = await Region.findById(targetId);
      if (!target) return res.status(404).json({ error: '지역을 찾을 수 없습니다' });
      cardType = target.topCardType || 'S';
      target.voteCount += 1;
      await target.save();
    }

    // 투표 기록
    const vote = await Vote.create({
      userId: user._id,
      targetType,
      merchantId: targetType === 'merchant' ? targetId : undefined,
      regionId: targetType === 'region' ? targetId : target.regionId,
      cardType,
      targetName: target.name,
      voteCountAt: target.voteCount,
    });

    // 유저 투표 카운트 업데이트
    user.dailyVotesUsed += 1;
    user.totalVotes += 1;
    if (!user.votedCardTypes.includes(cardType)) {
      user.votedCardTypes.push(cardType);
    }
    await user.save();

    // Socket.IO 브로드캐스트 (서버에서 io 참조)
    const io = req.app.get('io');
    if (io) {
      io.emit('vote:new', {
        targetType,
        targetId,
        targetName: target.name,
        cardType,
        voteCount: target.voteCount,
        voterNickname: user.nickname,
        timestamp: Date.now(),
      });
    }

    res.status(201).json({
      vote,
      target: {
        id: target._id,
        name: target.name,
        voteCount: target.voteCount,
        cardType,
        cardInfo: CARD_TYPES[cardType],
      },
      user: {
        id: user._id,
        nickname: user.nickname,
        dailyVotesUsed: user.dailyVotesUsed,
        dailyRemaining: 10 - user.dailyVotesUsed,
        totalVotes: user.totalVotes,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── 리더보드 ──
exports.leaderboard = async (req, res) => {
  try {
    const { type = 'merchant', cardType, limit = 20 } = req.query;

    if (type === 'region') {
      const query = {};
      const regions = await Region.find(query)
        .sort({ voteCount: -1 })
        .limit(Number(limit))
        .lean();

      // 순위 및 delta 계산
      const ranked = regions.map((r, i) => ({
        ...r,
        rank: i + 1,
        topCardInfo: r.topCardType ? CARD_TYPES[r.topCardType] : null,
      }));

      return res.json({ leaderboard: ranked, type: 'region' });
    }

    // 가맹점 리더보드
    const query = cardType ? { cardType } : {};
    const merchants = await Merchant.find(query)
      .sort({ voteCount: -1 })
      .limit(Number(limit))
      .lean();

    const ranked = merchants.map((m, i) => ({
      ...m,
      rank: i + 1,
      cardInfo: CARD_TYPES[m.cardType],
    }));

    res.json({ leaderboard: ranked, type: 'merchant', cardType: cardType || 'all' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── 카드 타입 목록 ──
exports.cardTypes = (req, res) => {
  res.json({ cardTypes: CARD_TYPES });
};

// ── 실시간 통계 ──
exports.stats = async (req, res) => {
  try {
    const [totalVotes, totalMerchants, totalRegions, totalUsers] = await Promise.all([
      Vote.countDocuments(),
      Merchant.countDocuments(),
      Region.countDocuments(),
      AlphaUser.countDocuments(),
    ]);

    // 카드별 투표 수
    const cardVotes = await Vote.aggregate([
      { $group: { _id: '$cardType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalVotes,
      totalMerchants,
      totalRegions,
      totalUsers,
      cardVotes: cardVotes.reduce((acc, cv) => {
        acc[cv._id] = cv.count;
        return acc;
      }, {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
