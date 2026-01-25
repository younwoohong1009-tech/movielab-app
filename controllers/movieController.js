const Movie = require('../models/Movie');
const Product = require('../models/Product');

// @desc    모든 영화 조회 (필터링, 정렬, 페이지네이션)
// @route   GET /api/admin/movies
// @access  Private/Admin
exports.getMovies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      genre,
      year,
      quality,
      rating,
      sortBy = '-createdAt'
    } = req.query;

    // 쿼리 빌더
    const query = {};

    // 검색 필터
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { originalTitle: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } }
      ];
    }

    // 장르 필터
    if (genre) {
      query.genre = genre;
    }

    // 연도 필터
    if (year) {
      query.year = parseInt(year);
    }

    // 화질 필터
    if (quality) {
      query.quality = quality;
    }

    // 관람등급 필터
    if (rating) {
      query.rating = rating;
    }

    // 페이지네이션
    const skip = (page - 1) * limit;

    // 총 개수
    const total = await Movie.countDocuments(query);

    // 영화 조회
    const movies = await Movie.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('relatedProducts', 'name price images');

    res.json({
      success: true,
      data: movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GetMovies Error:', error);
    res.status(500).json({
      success: false,
      message: '영화 목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    영화 상세 조회
// @route   GET /api/admin/movies/:id
// @access  Private/Admin
exports.getMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('relatedProducts');

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: '영화를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error('GetMovie Error:', error);
    res.status(500).json({
      success: false,
      message: '영화 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    영화 생성
// @route   POST /api/admin/movies
// @access  Private/Admin
exports.createMovie = async (req, res) => {
  try {
    const movie = await Movie.create(req.body);

    res.status(201).json({
      success: true,
      message: '영화가 등록되었습니다',
      data: movie
    });
  } catch (error) {
    console.error('CreateMovie Error:', error);
    res.status(500).json({
      success: false,
      message: '영화 등록 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    영화 수정
// @route   PUT /api/admin/movies/:id
// @access  Private/Admin
exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: '영화를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '영화가 수정되었습니다',
      data: movie
    });
  } catch (error) {
    console.error('UpdateMovie Error:', error);
    res.status(500).json({
      success: false,
      message: '영화 수정 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    영화 삭제
// @route   DELETE /api/admin/movies/:id
// @access  Private/Admin
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: '영화를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '영화가 삭제되었습니다'
    });
  } catch (error) {
    console.error('DeleteMovie Error:', error);
    res.status(500).json({
      success: false,
      message: '영화 삭제 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    영화 Featured 설정
// @route   PUT /api/admin/movies/:id/featured
// @access  Private/Admin
exports.toggleFeatured = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: '영화를 찾을 수 없습니다'
      });
    }

    movie.isFeatured = !movie.isFeatured;
    await movie.save();

    res.json({
      success: true,
      message: `영화가 ${movie.isFeatured ? '추천' : '일반'}으로 설정되었습니다`,
      data: movie
    });
  } catch (error) {
    console.error('ToggleFeatured Error:', error);
    res.status(500).json({
      success: false,
      message: '영화 설정 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    영화에 상품 연결
// @route   PUT /api/admin/movies/:id/products
// @access  Private/Admin
exports.linkProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: '영화를 찾을 수 없습니다'
      });
    }

    // 상품 존재 여부 확인
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: '일부 상품을 찾을 수 없습니다'
      });
    }

    movie.relatedProducts = productIds;
    await movie.save();

    res.json({
      success: true,
      message: '상품이 연결되었습니다',
      data: movie
    });
  } catch (error) {
    console.error('LinkProducts Error:', error);
    res.status(500).json({
      success: false,
      message: '상품 연결 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    IMDb 데이터로 영화 정보 자동 채우기
// @route   POST /api/admin/movies/autofill
// @access  Private/Admin
exports.autofillFromIMDb = async (req, res) => {
  try {
    const { imdbId } = req.body;

    if (!imdbId) {
      return res.status(400).json({
        success: false,
        message: 'IMDb ID를 입력해주세요'
      });
    }

    // 실제로는 OMDb API 또는 TMDB API를 호출
    // 여기서는 시뮬레이션
    const mockData = {
      title: '영화 제목',
      originalTitle: 'Original Title',
      director: '감독명',
      year: 2023,
      runtime: 120,
      genre: ['드라마', '스릴러'],
      country: '한국',
      language: '한국어',
      synopsis: '영화 줄거리...',
      imdbRating: 8.5,
      poster: 'https://via.placeholder.com/300x450'
    };

    res.json({
      success: true,
      message: 'IMDb 데이터를 불러왔습니다',
      data: mockData
    });
  } catch (error) {
    console.error('AutofillFromIMDb Error:', error);
    res.status(500).json({
      success: false,
      message: 'IMDb 데이터 불러오기 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    영화 조회수 증가
// @route   PUT /api/admin/movies/:id/views
// @access  Private/Admin
exports.incrementViews = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: '영화를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: { views: movie.views }
    });
  } catch (error) {
    console.error('IncrementViews Error:', error);
    res.status(500).json({
      success: false,
      message: '조회수 업데이트 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

module.exports = exports;
