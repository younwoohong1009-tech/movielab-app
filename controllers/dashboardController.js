const Movie = require('../models/Movie');
const User = require('../models/User');
const Order = require('../models/Order');

// 대시보드 통계
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalMembers,
      totalMovies,
      totalRevenue,
      recentOrders,
      topMovies
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ membershipStatus: 'active' }),
      Movie.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .populate('items.productId', 'name'),
      Movie.find({ status: 'published' })
        .sort({ viewCount: -1 })
        .limit(5)
        .select('title thumbnail viewCount')
    ]);

    // 월별 매출 데이터 (최근 6개월)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 서버 상태 (모의 데이터)
    const serverStatus = {
      api: { status: 'healthy', responseTime: 45 },
      streaming: { status: 'healthy', bandwidth: 87 },
      database: { status: 'healthy', connections: 42 },
      cdn: { status: 'healthy', hitRate: 94 }
    };

    res.json({
      stats: {
        totalUsers,
        totalMembers,
        totalMovies,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders,
      topMovies,
      monthlyRevenue,
      serverStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 활동 피드
exports.getActivityFeed = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // 최근 주문
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2)
      .populate('userId', 'name');

    // 최근 등록된 영화
    const recentMovies = await Movie.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2);

    // 활동 통합
    const activities = [
      ...recentOrders.map(order => ({
        type: 'order',
        message: `${order.userId?.name || 'User'} placed order ${order.orderNumber}`,
        timestamp: order.createdAt,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount
        }
      })),
      ...recentMovies.map(movie => ({
        type: 'movie',
        message: `New movie added: ${movie.title}`,
        timestamp: movie.createdAt,
        data: {
          movieId: movie._id,
          title: movie.title,
          thumbnail: movie.thumbnail
        }
      }))
    ];

    // 시간순 정렬
    activities.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      activities: activities.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
