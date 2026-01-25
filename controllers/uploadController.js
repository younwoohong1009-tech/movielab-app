const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// 업로드 디렉토리 생성
const uploadDir = process.env.UPLOAD_DIR || './uploads';

// 디렉토리 생성 함수
const ensureDir = async (dir) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const subDir = req.query.type || 'general'; // poster, video, subtitle, product, etc.
    const fullPath = path.join(uploadDir, subDir);
    await ensureDir(fullPath);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// 파일 필터
const fileFilter = (req, file, cb) => {
  // 허용된 확장자
  const allowedExts = {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    video: ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
    subtitle: ['.srt', '.vtt'],
    document: ['.pdf', '.doc', '.docx']
  };

  const ext = path.extname(file.originalname).toLowerCase();
  const type = req.query.type || 'general';

  // 타입별 확장자 체크
  if (type === 'poster' || type === 'product') {
    if (allowedExts.image.includes(ext)) {
      return cb(null, true);
    }
  } else if (type === 'video') {
    if (allowedExts.video.includes(ext)) {
      return cb(null, true);
    }
  } else if (type === 'subtitle') {
    if (allowedExts.subtitle.includes(ext)) {
      return cb(null, true);
    }
  } else {
    // general - 모든 타입 허용
    const allExts = Object.values(allowedExts).flat();
    if (allExts.includes(ext)) {
      return cb(null, true);
    }
  }

  cb(new Error(`허용되지 않은 파일 형식입니다: ${ext}`));
};

// Multer 설정
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 * 1024 // 5GB
  }
});

// @desc    단일 파일 업로드
// @route   POST /api/admin/upload
// @access  Private/Admin
exports.uploadSingle = (req, res) => {
  const uploadHandler = upload.single('file');

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: '파일 업로드 중 오류가 발생했습니다',
        error: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '파일을 선택해주세요'
      });
    }

    const fileUrl = `/uploads/${req.query.type || 'general'}/${req.file.filename}`;

    res.json({
      success: true,
      message: '파일이 업로드되었습니다',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        path: req.file.path
      }
    });
  });
};

// @desc    다중 파일 업로드
// @route   POST /api/admin/upload/multiple
// @access  Private/Admin
exports.uploadMultiple = (req, res) => {
  const uploadHandler = upload.array('files', 10); // 최대 10개

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: '파일 업로드 중 오류가 발생했습니다',
        error: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '파일을 선택해주세요'
      });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${req.query.type || 'general'}/${file.filename}`,
      path: file.path
    }));

    res.json({
      success: true,
      message: `${files.length}개의 파일이 업로드되었습니다`,
      data: files
    });
  });
};

// @desc    청크 업로드 (대용량 파일)
// @route   POST /api/admin/upload/chunk
// @access  Private/Admin
exports.uploadChunk = async (req, res) => {
  try {
    const { filename, chunkIndex, totalChunks } = req.body;
    const chunk = req.file;

    if (!chunk || !filename || chunkIndex === undefined || !totalChunks) {
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다'
      });
    }

    const chunksDir = path.join(uploadDir, 'chunks', filename);
    await ensureDir(chunksDir);

    // 청크 저장
    const chunkPath = path.join(chunksDir, `chunk-${chunkIndex}`);
    await fs.rename(chunk.path, chunkPath);

    // 모든 청크가 업로드되었는지 확인
    const uploadedChunks = await fs.readdir(chunksDir);

    if (uploadedChunks.length === parseInt(totalChunks)) {
      // 모든 청크 병합
      const finalPath = path.join(uploadDir, req.query.type || 'video', filename);
      await ensureDir(path.dirname(finalPath));

      const writeStream = require('fs').createWriteStream(finalPath);

      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunksDir, `chunk-${i}`);
        const chunkBuffer = await fs.readFile(chunkPath);
        writeStream.write(chunkBuffer);
        await fs.unlink(chunkPath); // 청크 삭제
      }

      writeStream.end();

      // 청크 디렉토리 삭제
      await fs.rmdir(chunksDir);

      return res.json({
        success: true,
        message: '파일 업로드가 완료되었습니다',
        data: {
          filename,
          url: `/uploads/${req.query.type || 'video'}/${filename}`,
          completed: true
        }
      });
    }

    res.json({
      success: true,
      message: `청크 ${parseInt(chunkIndex) + 1}/${totalChunks} 업로드됨`,
      data: {
        filename,
        chunkIndex: parseInt(chunkIndex),
        totalChunks: parseInt(totalChunks),
        completed: false
      }
    });
  } catch (error) {
    console.error('UploadChunk Error:', error);
    res.status(500).json({
      success: false,
      message: '청크 업로드 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    파일 삭제
// @route   DELETE /api/admin/upload/:filename
// @access  Private/Admin
exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const type = req.query.type || 'general';
    const filePath = path.join(uploadDir, type, filename);

    await fs.unlink(filePath);

    res.json({
      success: true,
      message: '파일이 삭제되었습니다'
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        message: '파일을 찾을 수 없습니다'
      });
    }

    console.error('DeleteFile Error:', error);
    res.status(500).json({
      success: false,
      message: '파일 삭제 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

// @desc    업로드된 파일 목록
// @route   GET /api/admin/upload/list
// @access  Private/Admin
exports.listFiles = async (req, res) => {
  try {
    const type = req.query.type || 'general';
    const dirPath = path.join(uploadDir, type);

    await ensureDir(dirPath);
    const files = await fs.readdir(dirPath);

    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(dirPath, filename);
        const stats = await fs.stat(filePath);
        return {
          filename,
          size: stats.size,
          url: `/uploads/${type}/${filename}`,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
    );

    res.json({
      success: true,
      data: fileDetails
    });
  } catch (error) {
    console.error('ListFiles Error:', error);
    res.status(500).json({
      success: false,
      message: '파일 목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
};

module.exports = exports;
