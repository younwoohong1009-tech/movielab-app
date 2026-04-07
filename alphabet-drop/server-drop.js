/**
 * PROJECT ALPHABET DROP — Standalone Server
 * 프로토타입 독립 실행 서버
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 정적 파일
app.use(express.static(path.join(__dirname, 'public')));

// API (Mock — DB 없이 인메모리)
const { CARD_TYPES } = require('./config/cardTypes');
const { mapToAlphabetCard } = require('./utils/categoryMapper');

// ── In-Memory Data Store ──
const MERCHANTS = [
  { id:'m1', name:'몽탄 성수', region:'성수동', address:'서울 성동구 성수동', cardType:'D', voteCount:847 },
  { id:'m2', name:'현대백화점 압구정본점', region:'압구정동', address:'서울 강남구 압구정동', cardType:'S', voteCount:792 },
  { id:'m3', name:'올리브영 강남역점', region:'강남역', address:'서울 강남구 강남역', cardType:'B', voteCount:731 },
  { id:'m4', name:'무신사 스탠다드 성수', region:'성수동', address:'서울 성동구 성수동', cardType:'S', voteCount:688 },
  { id:'m5', name:'CU 망원점', region:'망원동', address:'서울 마포구 망원동', cardType:'R', voteCount:654 },
  { id:'m6', name:'오모카세 한남', region:'한남동', address:'서울 용산구 한남동', cardType:'D', voteCount:623 },
  { id:'m7', name:'나이키 홍대', region:'홍대입구', address:'서울 마포구 홍대입구', cardType:'B', voteCount:598 },
  { id:'m8', name:'준오헤어 청담', region:'청담동', address:'서울 강남구 청담동', cardType:'B', voteCount:567 },
  { id:'m9', name:'롯데월드 어드벤처', region:'잠실동', address:'서울 송파구 잠실동', cardType:'T', voteCount:534 },
  { id:'m10', name:'강남세브란스', region:'강남역', address:'서울 강남구 강남역', cardType:'H', voteCount:512 },
  { id:'m11', name:'연남서가', region:'연남동', address:'서울 마포구 연남동', cardType:'D', voteCount:489 },
  { id:'m12', name:'GS칼텍스 한남주유소', region:'한남동', address:'서울 용산구 한남동', cardType:'O', voteCount:456 },
  { id:'m13', name:'토스 팝업스토어', region:'여의도동', address:'서울 영등포구 여의도동', cardType:'P', voteCount:423 },
  { id:'m14', name:'홍대 포차거리', region:'홍대입구', address:'서울 마포구 홍대입구', cardType:'D', voteCount:401 },
  { id:'m15', name:'필라테스 라운지 합정', region:'합정동', address:'서울 마포구 합정동', cardType:'B', voteCount:378 },
  { id:'m16', name:'도산분식', region:'압구정동', address:'서울 강남구 압구정동', cardType:'D', voteCount:345 },
  { id:'m17', name:'세븐일레븐 서촌점', region:'서촌', address:'서울 종로구 서촌', cardType:'R', voteCount:312 },
  { id:'m18', name:'건대 커먼그라운드', region:'건대입구', address:'서울 광진구 건대입구', cardType:'S', voteCount:298 },
  { id:'m19', name:'카카오페이 제휴 성수카페', region:'성수동', address:'서울 성동구 성수동', cardType:'P', voteCount:276 },
  { id:'m20', name:'SK에너지 여의도', region:'여의도동', address:'서울 영등포구 여의도동', cardType:'O', voteCount:254 },
];

const REGIONS = [
  { id:'r1', name:'성수동', district:'성동구', voteCount:2340, topCardType:'D' },
  { id:'r2', name:'압구정동', district:'강남구', voteCount:2180, topCardType:'S' },
  { id:'r3', name:'홍대입구', district:'마포구', voteCount:1950, topCardType:'B' },
  { id:'r4', name:'강남역', district:'강남구', voteCount:1820, topCardType:'H' },
  { id:'r5', name:'한남동', district:'용산구', voteCount:1690, topCardType:'D' },
  { id:'r6', name:'이태원동', district:'용산구', voteCount:1540, topCardType:'T' },
  { id:'r7', name:'연남동', district:'마포구', voteCount:1430, topCardType:'D' },
  { id:'r8', name:'잠실동', district:'송파구', voteCount:1380, topCardType:'T' },
  { id:'r9', name:'망원동', district:'마포구', voteCount:1250, topCardType:'R' },
  { id:'r10', name:'청담동', district:'강남구', voteCount:1190, topCardType:'B' },
  { id:'r11', name:'여의도동', district:'영등포구', voteCount:1050, topCardType:'P' },
  { id:'r12', name:'익선동', district:'종로구', voteCount:980, topCardType:'R' },
];

// ── API Endpoints ──

app.get('/api/alphabet/search', (req, res) => {
  const { query, type = 'merchant' } = req.query;
  if (!query) return res.json({ results: [], total: 0 });

  const q = query.toLowerCase();
  if (type === 'region') {
    const results = REGIONS.filter(r =>
      r.name.includes(q) || r.district.includes(q)
    ).sort((a, b) => b.voteCount - a.voteCount);
    return res.json({ results, total: results.length });
  }

  const results = MERCHANTS.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.region.includes(q) ||
    m.address.includes(q)
  ).sort((a, b) => b.voteCount - a.voteCount);
  res.json({ results: results.map(m => ({ ...m, cardInfo: CARD_TYPES[m.cardType] })), total: results.length });
});

app.post('/api/alphabet/vote', (req, res) => {
  const { targetType, targetId } = req.body;

  if (targetType === 'merchant') {
    const m = MERCHANTS.find(x => x.id === targetId);
    if (!m) return res.status(404).json({ error: 'Not found' });
    m.voteCount += 1;
    return res.json({ target: { ...m, cardInfo: CARD_TYPES[m.cardType] } });
  }

  const r = REGIONS.find(x => x.id === targetId);
  if (!r) return res.status(404).json({ error: 'Not found' });
  r.voteCount += 1;
  res.json({ target: r });
});

app.get('/api/alphabet/leaderboard', (req, res) => {
  const { type = 'merchant', cardType, limit = 20 } = req.query;

  if (type === 'region') {
    const sorted = [...REGIONS].sort((a, b) => b.voteCount - a.voteCount).slice(0, Number(limit));
    return res.json({ leaderboard: sorted.map((r, i) => ({ ...r, rank: i + 1 })), type: 'region' });
  }

  let list = [...MERCHANTS];
  if (cardType && cardType !== 'all') list = list.filter(m => m.cardType === cardType);
  const sorted = list.sort((a, b) => b.voteCount - a.voteCount).slice(0, Number(limit));
  res.json({ leaderboard: sorted.map((m, i) => ({ ...m, rank: i + 1, cardInfo: CARD_TYPES[m.cardType] })), type: 'merchant' });
});

app.get('/api/alphabet/card-types', (req, res) => {
  res.json({ cardTypes: CARD_TYPES });
});

app.get('/api/alphabet/stats', (req, res) => {
  const totalVotes = MERCHANTS.reduce((s, m) => s + m.voteCount, 0) + REGIONS.reduce((s, r) => s + r.voteCount, 0);
  res.json({ totalVotes, totalMerchants: MERCHANTS.length, totalRegions: REGIONS.length });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'drop.html'));
});

// ── Start ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  💣 ALPHABET DROP — Server Running           ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  🌐 http://localhost:${PORT}                    ║`);
  console.log(`║  📡 API: /api/alphabet/*                     ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});
