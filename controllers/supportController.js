const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

// @desc    모든 고객지원 티켓 조회
// @route   GET /api/admin/support
// @access  Private/Admin
exports.getTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      status,
      priority
    } = req.query;

    const query = {};

    // 검색 필터
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // 티켓 타입 필터
    if (type) {
      query.type = type;
    }

    // 상태 필터
    if (status) {
      query.status = status;
    }

    // 우선순위 필터
    if (priority) {
      query.priority = priority;
    }

    const skip = (page - 1) * limit;
    const total = await SupportTicket.countDocuments(query);

    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email')
      .populate('assignedTo', 'name')
      .populate('relatedMovie', 'title')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GetTickets Error:', error);
    res.status(500).json({
      success: false,
      message: '티켓 목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    티켓 상세 조회
// @route   GET /api/admin/support/:id
// @access  Private/Admin
exports.getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'name email avatar')
      .populate('assignedTo', 'name email')
      .populate('relatedMovie', 'title poster')
      .populate('responses.author', 'name avatar role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '티켓을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('GetTicket Error:', error);
    res.status(500).json({
      success: false,
      message: '티켓 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    티켓 상태 업데이트
// @route   PUT /api/admin/support/:id/status
// @access  Private/Admin
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상태입니다'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '티켓을 찾을 수 없습니다'
      });
    }

    ticket.status = status;
    await ticket.save();

    res.json({
      success: true,
      message: '티켓 상태가 업데이트되었습니다',
      data: ticket
    });
  } catch (error) {
    console.error('UpdateStatus Error:', error);
    res.status(500).json({
      success: false,
      message: '티켓 상태 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    티켓 우선순위 업데이트
// @route   PUT /api/admin/support/:id/priority
// @access  Private/Admin
exports.updatePriority = async (req, res) => {
  try {
    const { priority } = req.body;

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 우선순위입니다'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '티켓을 찾을 수 없습니다'
      });
    }

    ticket.priority = priority;
    await ticket.save();

    res.json({
      success: true,
      message: '티켓 우선순위가 업데이트되었습니다',
      data: ticket
    });
  } catch (error) {
    console.error('UpdatePriority Error:', error);
    res.status(500).json({
      success: false,
      message: '티켓 우선순위 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    티켓 담당자 할당
// @route   PUT /api/admin/support/:id/assign
// @access  Private/Admin
exports.assignTicket = async (req, res) => {
  try {
    const { adminId } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '티켓을 찾을 수 없습니다'
      });
    }

    // 관리자 확인
    if (adminId) {
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: '유효한 관리자가 아닙니다'
        });
      }
      ticket.assignedTo = adminId;
    } else {
      ticket.assignedTo = null;
    }

    // 상태 자동 변경
    if (ticket.status === 'open' && adminId) {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    res.json({
      success: true,
      message: adminId ? '티켓이 할당되었습니다' : '티켓 할당이 해제되었습니다',
      data: ticket
    });
  } catch (error) {
    console.error('AssignTicket Error:', error);
    res.status(500).json({
      success: false,
      message: '티켓 할당 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    티켓에 응답 추가
// @route   POST /api/admin/support/:id/responses
// @access  Private/Admin
exports.addResponse = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '응답 내용을 입력해주세요'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '티켓을 찾을 수 없습니다'
      });
    }

    ticket.responses.push({
      author: req.user.id,
      content
    });

    // 상태 자동 변경
    if (ticket.status === 'open') {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    // 응답과 함께 populate된 티켓 반환
    await ticket.populate('responses.author', 'name avatar role');

    res.status(201).json({
      success: true,
      message: '응답이 추가되었습니다',
      data: ticket
    });
  } catch (error) {
    console.error('AddResponse Error:', error);
    res.status(500).json({
      success: false,
      message: '응답 추가 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    스포일러 신고 처리
// @route   PUT /api/admin/support/:id/spoiler-action
// @access  Private/Admin
exports.handleSpoilerReport = async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'blind', 'reject'

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '티켓을 찾을 수 없습니다'
      });
    }

    if (ticket.type !== 'spoiler') {
      return res.status(400).json({
        success: false,
        message: '스포일러 신고 티켓이 아닙니다'
      });
    }

    // 응답 추가
    ticket.responses.push({
      author: req.user.id,
      content: `[${action === 'blind' ? '블라인드 처리' : '신고 반려'}] ${reason || ''}`
    });

    ticket.status = 'resolved';
    await ticket.save();

    res.json({
      success: true,
      message: action === 'blind' ? '스포일러가 블라인드 처리되었습니다' : '신고가 반려되었습니다',
      data: ticket
    });
  } catch (error) {
    console.error('HandleSpoilerReport Error:', error);
    res.status(500).json({
      success: false,
      message: '스포일러 신고 처리 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    티켓 삭제
// @route   DELETE /api/admin/support/:id
// @access  Private/Admin
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '티켓을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '티켓이 삭제되었습니다'
    });
  } catch (error) {
    console.error('DeleteTicket Error:', error);
    res.status(500).json({
      success: false,
      message: '티켓 삭제 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    고객지원 통계
// @route   GET /api/admin/support/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    // 총 티켓 수
    const totalTickets = await SupportTicket.countDocuments();

    // 상태별 티켓 수
    const statusCounts = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // 타입별 티켓 수
    const typeCounts = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // 우선순위별 티켓 수
    const priorityCounts = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // 오늘 생성된 티켓
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTickets = await SupportTicket.countDocuments({
      createdAt: { $gte: today }
    });

    // 미할당 티켓
    const unassignedTickets = await SupportTicket.countDocuments({
      assignedTo: null,
      status: { $ne: 'closed' }
    });

    res.json({
      success: true,
      data: {
        totalTickets,
        todayTickets,
        unassignedTickets,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        typeCounts: typeCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        priorityCounts: priorityCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('GetStats Error:', error);
    res.status(500).json({
      success: false,
      message: '통계 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

module.exports = exports;
