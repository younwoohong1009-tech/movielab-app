const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    모든 주문 조회
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentStatus,
      startDate,
      endDate
    } = req.query;

    const query = {};

    // 검색 필터 (주문번호, 사용자 이름)
    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { user: { $in: users.map(u => u._id) } }
      ];
    }

    // 주문 상태 필터
    if (status) {
      query.orderStatus = status;
    }

    // 결제 상태 필터
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // 날짜 범위 필터
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GetOrders Error:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    주문 상세 조회
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('GetOrder Error:', error);
    res.status(500).json({
      success: false,
      message: '주문 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    주문 상태 업데이트
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber, courier, notes } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 상태 업데이트
    if (orderStatus) order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier) order.courier = courier;
    if (notes) order.notes = notes;

    await order.save();

    res.json({
      success: true,
      message: '주문 상태가 업데이트되었습니다',
      data: order
    });
  } catch (error) {
    console.error('UpdateOrderStatus Error:', error);
    res.status(500).json({
      success: false,
      message: '주문 상태 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    주문 결제 상태 업데이트
// @route   PUT /api/admin/orders/:id/payment-status
// @access  Private/Admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 결제 상태입니다'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.json({
      success: true,
      message: '결제 상태가 업데이트되었습니다',
      data: order
    });
  } catch (error) {
    console.error('UpdatePaymentStatus Error:', error);
    res.status(500).json({
      success: false,
      message: '결제 상태 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    주문 취소
// @route   PUT /api/admin/orders/:id/cancel
// @access  Private/Admin
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 이미 배송된 주문은 취소 불가
    if (order.orderStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        message: '배송 완료된 주문은 취소할 수 없습니다'
      });
    }

    order.orderStatus = 'cancelled';
    order.notes = `취소 사유: ${reason || '관리자에 의한 취소'}`;
    
    // 재고 복구
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    await order.save();

    res.json({
      success: true,
      message: '주문이 취소되었습니다',
      data: order
    });
  } catch (error) {
    console.error('CancelOrder Error:', error);
    res.status(500).json({
      success: false,
      message: '주문 취소 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    배송 정보 업데이트
// @route   PUT /api/admin/orders/:id/shipping
// @access  Private/Admin
exports.updateShipping = async (req, res) => {
  try {
    const { trackingNumber, courier } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    order.trackingNumber = trackingNumber;
    order.courier = courier;
    order.orderStatus = 'shipped';

    await order.save();

    res.json({
      success: true,
      message: '배송 정보가 업데이트되었습니다',
      data: order
    });
  } catch (error) {
    console.error('UpdateShipping Error:', error);
    res.status(500).json({
      success: false,
      message: '배송 정보 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    주문 통계
// @route   GET /api/admin/orders/stats
// @access  Private/Admin
exports.getOrderStats = async (req, res) => {
  try {
    // 총 주문 수
    const totalOrders = await Order.countDocuments();

    // 상태별 주문 수
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // 결제 상태별 주문 수
    const paymentCounts = await Order.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // 오늘 주문 수
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });

    // 이번 주 매출
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weeklyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        weeklyRevenue: weeklyRevenue[0]?.total || 0,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        paymentCounts: paymentCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('GetOrderStats Error:', error);
    res.status(500).json({
      success: false,
      message: '주문 통계 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    주문 삭제 (관리 목적)
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '주문이 삭제되었습니다'
    });
  } catch (error) {
    console.error('DeleteOrder Error:', error);
    res.status(500).json({
      success: false,
      message: '주문 삭제 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

module.exports = exports;
