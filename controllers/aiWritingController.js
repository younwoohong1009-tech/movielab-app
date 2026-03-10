const Anthropic = require('@anthropic-ai/sdk');
const Movie = require('../models/Movie');

// Anthropic 클라이언트는 요청 시 초기화 (API 키 런타임 체크)
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다');
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ==================== 프롬프트 빌더 ====================

function buildSynopsisPrompt(movie) {
  const lines = [
    `당신은 무비랩(MovieLAB) 예술 영화 독립 플랫폼의 전문 영화 큐레이터입니다.`,
    `아래 영화 정보를 바탕으로 한국어로 매력적인 시놉시스를 작성해주세요.\n`,
    `[영화 정보]`,
    `- 제목: ${movie.titleKr}${movie.titleEn ? ` (${movie.titleEn})` : ''}`,
    `- 감독: ${movie.director}`,
    `- 개봉년도: ${movie.year}`,
  ];

  if (movie.runtime) lines.push(`- 러닝타임: ${movie.runtime}분`);
  if (movie.genres?.length) lines.push(`- 장르: ${movie.genres.join(', ')}`);
  if (movie.country) lines.push(`- 국가: ${movie.country}`);
  if (movie.cast?.length) lines.push(`- 주요 출연진: ${movie.cast.slice(0, 5).join(', ')}`);
  if (movie.rating) lines.push(`- 관람등급: ${movie.rating}`);
  if (movie.synopsis) {
    lines.push(`\n[기존 시놉시스 (참고하여 개선해주세요)]\n${movie.synopsis}`);
  }

  lines.push(`
[작성 지침]
- 3~4문단, 총 250~400자 내외
- 핵심 서사와 정서적 분위기를 전달하되 주요 반전/결말은 제외
- 독립·예술 영화 플랫폼에 어울리는 세련된 문체
- 영화의 미학적 특성과 감독 연출 스타일을 자연스럽게 언급
- 관객의 감상 욕구를 자극하는 인상적인 마무리 문장

시놉시스:`);

  return lines.join('\n');
}

function buildReviewPrompt(movie, reviewStyle) {
  const styleGuides = {
    curator: {
      name: '큐레이터 추천사',
      guide: '영화를 직접 본 큐레이터가 독자에게 따뜻하게 추천하는 1인칭 큐레이터 노트. 개인적 감상과 예술적 가치를 함께 담아주세요.',
      length: '300~500자',
    },
    critical: {
      name: '비평 리뷰',
      guide: '심층적인 영화 분석과 비평. 서사 구조, 연출 기법, 주제 의식, 사회문화적 맥락을 다루며 전문 영화 잡지 수준의 깊이로 작성해주세요.',
      length: '500~700자',
    },
    editorial: {
      name: '에디터리얼',
      guide: '세련된 라이프스타일 매거진 스타일의 영화 소개문. 감각적인 문장과 이미지로 영화의 분위기를 독자에게 전달해주세요.',
      length: '300~500자',
    },
  };

  const style = styleGuides[reviewStyle] || styleGuides.curator;

  const lines = [
    `당신은 무비랩(MovieLAB) 예술 영화 독립 플랫폼의 전문 영화 평론가입니다.`,
    `아래 영화 정보를 바탕으로 [${style.name}] 형식의 한국어 글을 작성해주세요.\n`,
    `[영화 정보]`,
    `- 제목: ${movie.titleKr}${movie.titleEn ? ` (${movie.titleEn})` : ''}`,
    `- 감독: ${movie.director}`,
    `- 개봉년도: ${movie.year}`,
  ];

  if (movie.runtime) lines.push(`- 러닝타임: ${movie.runtime}분`);
  if (movie.genres?.length) lines.push(`- 장르: ${movie.genres.join(', ')}`);
  if (movie.country) lines.push(`- 국가: ${movie.country}`);
  if (movie.cast?.length) lines.push(`- 주요 출연진: ${movie.cast.slice(0, 5).join(', ')}`);
  if (movie.synopsis) lines.push(`- 시놉시스: ${movie.synopsis}`);

  lines.push(`
[작성 지침]
- 글쓰기 스타일: ${style.guide}
- 분량: ${style.length}
- 예술 영화 애호가 독자를 대상으로 작성
- 제목, 소제목 없이 본문만 작성

${style.name}:`);

  return lines.join('\n');
}

// ==================== SSE 헬퍼 ====================

function setupSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx 버퍼링 비활성화
}

function sendSSEData(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sendSSEDone(res) {
  res.write('data: [DONE]\n\n');
  res.end();
}

// ==================== 영화 정보 조회 헬퍼 ====================

async function resolveMovie(movieId, movieData) {
  if (movieId) {
    const movie = await Movie.findById(movieId);
    if (!movie) throw Object.assign(new Error('영화를 찾을 수 없습니다'), { status: 404 });
    return movie;
  }
  if (movieData) return movieData;
  throw Object.assign(new Error('movieId 또는 movieData가 필요합니다'), { status: 400 });
}

// ==================== 컨트롤러 ====================

// @desc    AI 시놉시스 스트리밍 생성
// @route   POST /api/admin/ai-writing/synopsis
// @access  Private/Admin
exports.generateSynopsis = async (req, res) => {
  try {
    const { movieId, movieData } = req.body;
    const movie = await resolveMovie(movieId, movieData);
    const client = getClient();

    setupSSE(res);

    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: buildSynopsisPrompt(movie) }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        sendSSEData(res, { text: event.delta.text });
      }
    }

    sendSSEDone(res);
  } catch (error) {
    console.error('GenerateSynopsis Error:', error);
    if (!res.headersSent) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'AI 시놉시스 생성 중 오류가 발생했습니다',
      });
    } else {
      sendSSEData(res, { error: error.message });
      res.end();
    }
  }
};

// @desc    AI 리뷰 스트리밍 생성
// @route   POST /api/admin/ai-writing/review
// @access  Private/Admin
exports.generateReview = async (req, res) => {
  try {
    const { movieId, movieData, reviewStyle = 'curator' } = req.body;
    const movie = await resolveMovie(movieId, movieData);
    const client = getClient();

    const validStyles = ['curator', 'critical', 'editorial'];
    const style = validStyles.includes(reviewStyle) ? reviewStyle : 'curator';

    setupSSE(res);

    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: buildReviewPrompt(movie, style) }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        sendSSEData(res, { text: event.delta.text });
      }
    }

    sendSSEDone(res);
  } catch (error) {
    console.error('GenerateReview Error:', error);
    if (!res.headersSent) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'AI 리뷰 생성 중 오류가 발생했습니다',
      });
    } else {
      sendSSEData(res, { error: error.message });
      res.end();
    }
  }
};

// @desc    생성된 시놉시스를 영화에 저장
// @route   PUT /api/admin/ai-writing/save/:movieId
// @access  Private/Admin
exports.saveToMovie = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '저장할 내용이 없습니다' });
    }

    const movie = await Movie.findByIdAndUpdate(
      req.params.movieId,
      { synopsis: content.trim() },
      { new: true }
    );

    if (!movie) {
      return res.status(404).json({ success: false, message: '영화를 찾을 수 없습니다' });
    }

    res.json({ success: true, message: '시놉시스가 저장되었습니다', data: { synopsis: movie.synopsis } });
  } catch (error) {
    console.error('SaveToMovie Error:', error);
    res.status(500).json({
      success: false,
      message: '저장 중 오류가 발생했습니다',
      error: error.message,
    });
  }
};
