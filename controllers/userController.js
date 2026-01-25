const User = require('../models/User');
const Curator = require('../models/Curator');

// @desc    모든 사용자 조회
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      membership,
      isActive
    } = req.query;

    const query = {};

    // 검색 필터
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // 역할 필터
    if (role) {
      query.role = role;
    }

    // 멤버십 필터
    if (membership) {
      query.membership = membership;
    }

    // 활성 상태 필터
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip)
      .select('-password');

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GetUsers Error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    사용자 상세 조회
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('watchHistory.movie', 'title poster')
      .populate('favorites', 'title poster');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('GetUser Error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    사용자 생성
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { email, password, name, role, membership } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 이메일입니다'
      });
    }

    const user = await User.create({
      email,
      password,
      name,
      role: role || 'user',
      membership: membership || 'none'
    });

    res.status(201).json({
      success: true,
      message: '사용자가 생성되었습니다',
      data: user
    });
  } catch (error) {
    console.error('CreateUser Error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 생성 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    사용자 수정
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 비밀번호는 별도로 처리
    if (password) {
      user.password = password;
      await user.save();
    }

    // 다른 필드 업데이트
    Object.assign(user, updateData);
    await user.save();

    res.json({
      success: true,
      message: '사용자 정보가 수정되었습니다',
      data: user
    });
  } catch (error) {
    console.error('UpdateUser Error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 수정 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    사용자 삭제
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '사용자가 삭제되었습니다'
    });
  } catch (error) {
    console.error('DeleteUser Error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 삭제 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    사용자 활성/비활성 토글
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private/Admin
exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `사용자가 ${user.isActive ? '활성화' : '비활성화'}되었습니다`,
      data: user
    });
  } catch (error) {
    console.error('ToggleActive Error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상태 변경 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    멤버십 연장
// @route   PUT /api/admin/users/:id/extend-membership
// @access  Private/Admin
exports.extendMembership = async (req, res) => {
  try {
    const { days, membership } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 멤버십 타입 설정
    if (membership) {
      user.membership = membership;
    }

    // 만료일 계산
    const now = new Date();
    const currentExpiry = user.membershipExpiry || now;
    const extendFrom = currentExpiry > now ? currentExpiry : now;
    
    user.membershipExpiry = new Date(extendFrom.getTime() + (days * 24 * 60 * 60 * 1000));
    
    await user.save();

    res.json({
      success: true,
      message: `멤버십이 ${days}일 연장되었습니다`,
      data: {
        membership: user.membership,
        membershipExpiry: user.membershipExpiry
      }
    });
  } catch (error) {
    console.error('ExtendMembership Error:', error);
    res.status(500).json({
      success: false,
      message: '멤버십 연장 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    큐레이터로 승격
// @route   POST /api/admin/users/:id/promote-curator
// @access  Private/Admin
exports.promoteToCurator = async (req, res) => {
  try {
    const { displayName, bio, expertise } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 이미 큐레이터인지 확인
    const existingCurator = await Curator.findOne({ user: user._id });
    if (existingCurator) {
      return res.status(400).json({
        success: false,
        message: '이미 큐레이터입니다'
      });
    }

    // 사용자 역할 변경
    user.role = 'curator';
    await user.save();

    // 큐레이터 프로필 생성
    const curator = await Curator.create({
      user: user._id,
      displayName: displayName || user.name,
      bio: bio || '',
      expertise: expertise || [],
      avatar: user.avatar
    });

    res.json({
      success: true,
      message: '큐레이터로 승격되었습니다',
      data: {
        user,
        curator
      }
    });
  } catch (error) {
    console.error('PromoteToCurator Error:', error);
    res.status(500).json({
      success: false,
      message: '큐레이터 승격 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    사용자 시청 기록 조회
// @route   GET /api/admin/users/:id/watch-history
// @access  Private/Admin
exports.getWatchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('watchHistory.movie', 'title poster runtime');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: user.watchHistory
    });
  } catch (error) {
    console.error('GetWatchHistory Error:', error);
    res.status(500).json({
      success: false,
      message: '시청 기록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    사용자 통계 조회
// @route   GET /api/admin/users/:id/stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 총 시청 영화 수
    const totalWatched = user.watchHistory.length;

    // 즐겨찾기 수
    const totalFavorites = user.favorites.length;

    // 완료율 계산
    const completedMovies = user.watchHistory.filter(h => h.progress >= 90).length;
    const completionRate = totalWatched > 0 
      ? ((completedMovies / totalWatched) * 100).toFixed(1)
      : 0;

    // 총 시청 시간 (분)
    const Movie = require('../models/Movie');
    const watchedMovies = await Movie.find({
      _id: { $in: user.watchHistory.map(h => h.movie) }
    }).select('runtime');
    
    const totalWatchTime = watchedMovies.reduce((sum, movie) => sum + movie.runtime, 0);

    res.json({
      success: true,
      data: {
        totalWatched,
        totalFavorites,
        completionRate: `${completionRate}%`,
        totalWatchTime: `${Math.floor(totalWatchTime / 60)}시간 ${totalWatchTime % 60}분`
      }
    });
  } catch (error) {
    console.error('GetUserStats Error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 통계 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

module.exports = exports;
