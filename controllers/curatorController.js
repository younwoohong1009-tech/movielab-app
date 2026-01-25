const Curator = require('../models/Curator');
const User = require('../models/User');
const Movie = require('../models/Movie');

// @desc    모든 큐레이터 조회
// @route   GET /api/admin/curators
// @access  Private/Admin
exports.getCurators = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isFeatured, isActive } = req.query;

    const query = {};

    if (search) {
      query.displayName = { $regex: search, $options: 'i' };
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;
    const total = await Curator.countDocuments(query);

    const curators = await Curator.find(query)
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    res.json({
      success: true,
      data: curators,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GetCurators Error:', error);
    res.status(500).json({
      success: false,
      message: '큐레이터 목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    큐레이터 상세 조회
// @route   GET /api/admin/curators/:id
// @access  Private/Admin
exports.getCurator = async (req, res) => {
  try {
    const curator = await Curator.findById(req.params.id)
      .populate('user', 'name email')
      .populate('collections.movies', 'title poster');

    if (!curator) {
      return res.status(404).json({
        success: false,
        message: '큐레이터를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: curator
    });
  } catch (error) {
    console.error('GetCurator Error:', error);
    res.status(500).json({
      success: false,
      message: '큐레이터 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    큐레이터 정보 수정
// @route   PUT /api/admin/curators/:id
// @access  Private/Admin
exports.updateCurator = async (req, res) => {
  try {
    const curator = await Curator.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!curator) {
      return res.status(404).json({
        success: false,
        message: '큐레이터를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '큐레이터 정보가 수정되었습니다',
      data: curator
    });
  } catch (error) {
    console.error('UpdateCurator Error:', error);
    res.status(500).json({
      success: false,
      message: '큐레이터 수정 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    큐레이터 Featured 토글
// @route   PUT /api/admin/curators/:id/featured
// @access  Private/Admin
exports.toggleFeatured = async (req, res) => {
  try {
    const curator = await Curator.findById(req.params.id);

    if (!curator) {
      return res.status(404).json({
        success: false,
        message: '큐레이터를 찾을 수 없습니다'
      });
    }

    curator.isFeatured = !curator.isFeatured;
    await curator.save();

    res.json({
      success: true,
      message: `큐레이터가 ${curator.isFeatured ? '추천 큐레이터로' : '일반 큐레이터로'} 설정되었습니다`,
      data: curator
    });
  } catch (error) {
    console.error('ToggleFeatured Error:', error);
    res.status(500).json({
      success: false,
      message: '큐레이터 설정 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    큐레이터 활성/비활성 토글
// @route   PUT /api/admin/curators/:id/toggle-active
// @access  Private/Admin
exports.toggleActive = async (req, res) => {
  try {
    const curator = await Curator.findById(req.params.id);

    if (!curator) {
      return res.status(404).json({
        success: false,
        message: '큐레이터를 찾을 수 없습니다'
      });
    }

    curator.isActive = !curator.isActive;
    await curator.save();

    res.json({
      success: true,
      message: `큐레이터가 ${curator.isActive ? '활성화' : '비활성화'}되었습니다`,
      data: curator
    });
  } catch (error) {
    console.error('ToggleActive Error:', error);
    res.status(500).json({
      success: false,
      message: '큐레이터 상태 변경 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    큐레이션 컬렉션 생성
// @route   POST /api/admin/curators/:id/collections
// @access  Private/Admin
exports.createCollection = async (req, res) => {
  try {
    const { title, description, movieIds, isPublic } = req.body;

    const curator = await Curator.findById(req.params.id);

    if (!curator) {
      return res.status(404).json({
        success: false,
        message: '큐레이터를 찾을 수 없습니다'
      });
    }

    // 영화 존재 여부 확인
    const movies = await Movie.find({ _id: { $in: movieIds } });
    if (movies.length !== movieIds.length) {
      return res.status(400).json({
        success: false,
        message: '일부 영화를 찾을 수 없습니다'
      });
    }

    curator.collections.push({
      title,
      description,
      movies: movieIds,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await curator.save();

    res.status(201).json({
      success: true,
      message: '컬렉션이 생성되었습니다',
      data: curator
    });
  } catch (error) {
    console.error('CreateCollection Error:', error);
    res.status(500).json({
      success: false,
      message: '컬렉션 생성 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    큐레이션 컬렉션 수정
// @route   PUT /api/admin/curators/:curatorId/collections/:collectionId
// @access  Private/Admin
exports.updateCollection = async (req, res) => {
  try {
    const { curatorId, collectionId } = req.params;
    const { title, description, movieIds, isPublic } = req.body;

    const curator = await Curator.findById(curatorId);

    if (!curator) {
      return res.status(404).json({
        success: false,
        message: '큐레이터를 찾을 수 없습니다'
      });
    }

    const collection = curator.collections.id(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: '컬렉션을 찾을 수 없습니다'
      });
    }

    // 업데이트
    if (title) collection.title = title;
    if (description) collection.description = description;
    if (movieIds) {
      // 영화 존재 여부 확인
      const movies = await Movie.find({ _id: { $in: movieIds } });
      if (movies.length !== movieIds.length) {
        return res.status(400).json({
          success: false,
          message: '일부 영화를 찾을 수 없습니다'
        });
      }
      collection.movies = movieIds;
    }
    if (isPublic !== undefined) collection.isPublic = isPublic;

    await curator.save();

    res.json({
      success: true,
      message: '컬렉션이 수정되었습니다',
      data: curator
    });
  } catch (error) {
    console.error('UpdateCollection Error:', error);
    res.status(500).json({
      success: false,
      message: '컬렉션 수정 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    큐레이션 컬렉션 삭제
// @route   DELETE /api/admin/curators/:curatorId/collections/:collectionId
// @access  Private/Admin
exports.deleteCollection = async (req, res) => {
  try {
    const { curatorId, collectionId } = req.params;

    const curator = await Curator.findById(curatorId);

    if (!curator) {
      return res.status(404).json({
        success: false,
        message: '큐레이터를 찾을 수 없습니다'
      });
    }

    const collection = curator.collections.id(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: '컬렉션을 찾을 수 없습니다'
      });
    }

    collection.remove();
    await curator.save();

    res.json({
      success: true,
      message: '컬렉션이 삭제되었습니다'
    });
  } catch (error) {
    console.error('DeleteCollection Error:', error);
    res.status(500).json({
      success: false,
      message: '컬렉션 삭제 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    큐레이터 권한 해제 (일반 사용자로 전환)
// @route   DELETE /api/admin/curators/:id
// @access  Private/Admin
exports.demoteCurator = async (req, res) => {
  try {
    const curator = await Curator.findById(req.params.id);

    if (!curator) {
      return res.status(404).json({
        success: false,
        message: '큐레이터를 찾을 수 없습니다'
      });
    }

    // 사용자 역할 변경
    const user = await User.findById(curator.user);
    if (user) {
      user.role = 'user';
      await user.save();
    }

    // 큐레이터 프로필 삭제 또는 비활성화
    curator.isActive = false;
    await curator.save();

    res.json({
      success: true,
      message: '큐레이터 권한이 해제되었습니다'
    });
  } catch (error) {
    console.error('DemoteCurator Error:', error);
    res.status(500).json({
      success: false,
      message: '큐레이터 권한 해제 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

module.exports = exports;
