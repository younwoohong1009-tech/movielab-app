/* ═══════════════════════════════════════════════════════════
   PROJECT ALPHABET DROP — React SPA Application
   Hype Gamified Voting Platform for Hyundai Alphabet Cards
   ═══════════════════════════════════════════════════════════ */

const { useState, useEffect, useRef, useCallback } = React;
const { motion, AnimatePresence, useAnimation } = window.Motion || {};

// ── Card Type Config (matching actual plate designs) ──
const CARDS = {
  D: { letter:'D', label:'외식/배달', bg:'#1B1F6B', accent:'#F5B731', desc:'맛집·배달·카페' },
  H: { letter:'H', label:'교육/병원', bg:'#1B2054', accent:'#E8673A', desc:'병원·학원·자기계발' },
  O: { letter:'O', label:'주유', bg:'#6BB8E8', accent:'#4A5F1A', desc:'주유소·충전소·차량관리' },
  S: { letter:'S', label:'쇼핑', bg:'#FF3B1D', accent:'#7BD4A0', desc:'온오프라인·백화점·마트' },
  T: { letter:'T', label:'여행', bg:'#C4996B', accent:'#1A6B7A', desc:'항공·호텔·교통' },
  B: { letter:'B', label:'뷰티/패션', bg:'#FFBF00', accent:'#E83020', desc:'화장품·의류·헬스' },
  P: { letter:'P', label:'페이', bg:'#3CC8C8', accent:'#5A1028', desc:'간편결제·핀테크' },
  R: { letter:'R', label:'구독/일상', bg:'#E040E0', accent:'#00D050', desc:'편의점·구독·반복결제' },
};

// ── Mock Leaderboard Data ──
function generateMockData() {
  const merchants = [
    { id:'m1', name:'몽탄 성수', region:'성수동', cardType:'D', voteCount:847 },
    { id:'m2', name:'현대백화점 압구정본점', region:'압구정동', cardType:'S', voteCount:792 },
    { id:'m3', name:'올리브영 강남역점', region:'강남역', cardType:'B', voteCount:731 },
    { id:'m4', name:'무신사 스탠다드 성수', region:'성수동', cardType:'S', voteCount:688 },
    { id:'m5', name:'CU 망원점', region:'망원동', cardType:'R', voteCount:654 },
    { id:'m6', name:'오모카세 한남', region:'한남동', cardType:'D', voteCount:623 },
    { id:'m7', name:'나이키 홍대', region:'홍대입구', cardType:'B', voteCount:598 },
    { id:'m8', name:'준오헤어 청담', region:'청담동', cardType:'B', voteCount:567 },
    { id:'m9', name:'롯데월드 어드벤처', region:'잠실동', cardType:'T', voteCount:534 },
    { id:'m10', name:'강남세브란스', region:'강남역', cardType:'H', voteCount:512 },
    { id:'m11', name:'연남서가', region:'연남동', cardType:'D', voteCount:489 },
    { id:'m12', name:'GS칼텍스 한남주유소', region:'한남동', cardType:'O', voteCount:456 },
    { id:'m13', name:'토스 팝업스토어', region:'여의도동', cardType:'P', voteCount:423 },
    { id:'m14', name:'홍대 포차거리', region:'홍대입구', cardType:'D', voteCount:401 },
    { id:'m15', name:'필라테스 라운지 합정', region:'합정동', cardType:'B', voteCount:378 },
  ];

  const regions = [
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

  return { merchants, regions };
}

// ── Number Rolling Animation Component ──
function RollingNumber({ value, duration = 600 }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;
    prevRef.current = value;

    const start = performance.now();
    const diff = value - prev;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(prev + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return React.createElement('span', null, display.toLocaleString());
}

// ── Card Badge Component ──
function CardBadge({ cardType, size = 'sm' }) {
  const card = CARDS[cardType];
  if (!card) return null;
  const fontSize = size === 'lg' ? '13px' : '11px';
  const padding = size === 'lg' ? '4px 10px' : '3px 8px';

  return React.createElement('span', {
    className: 'card-badge',
    style: { background: card.bg, color: card.accent, fontSize, padding }
  },
    React.createElement('span', { className: 'letter' }, card.letter),
    ' ',
    card.label
  );
}

// ── Card Chip Filter ──
function CardChips({ selected, onSelect }) {
  return React.createElement('div', { className: 'card-chips' },
    React.createElement('button', {
      className: 'card-chip' + (selected === 'all' ? ' active' : ''),
      style: selected === 'all' ? { background: '#FF6B00', borderColor: 'transparent', color: '#000' } : {},
      onClick: () => onSelect('all')
    }, 'ALL'),
    ...Object.entries(CARDS).map(([key, card]) =>
      React.createElement('button', {
        key,
        className: 'card-chip' + (selected === key ? ' active' : ''),
        style: selected === key ? { background: card.bg, borderColor: 'transparent', color: card.accent } : {},
        onClick: () => onSelect(key)
      }, card.letter + ' ' + card.label)
    )
  );
}

// ── Vote Float Effect ──
function VoteFloat({ x, y, text, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return React.createElement('div', {
    className: 'vote-float',
    style: { left: x + 'px', top: y + 'px' }
  }, text);
}

// ── Nudge Popup Component ──
function NudgePopup({ cardType, targetName, onClose }) {
  const [timer, setTimer] = useState(180); // 3 minutes
  const card = CARDS[cardType] || CARDS.D;

  useEffect(() => {
    const iv = setInterval(() => {
      setTimer(t => {
        if (t <= 0) { clearInterval(iv); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

  return React.createElement('div', { className: 'nudge-overlay', onClick: (e) => { if (e.target === e.currentTarget) onClose(); } },
    React.createElement('div', { className: 'nudge-sheet' },
      // Card Visual
      React.createElement('div', {
        className: 'nudge-card-visual',
        style: { background: card.bg, color: card.accent }
      }, card.letter),

      // Timer
      React.createElement('div', { className: 'nudge-timer' }, timeStr),
      React.createElement('div', { className: 'nudge-timer-label' }, '즉시 발급 남은 시간'),

      // Title
      React.createElement('div', { className: 'nudge-title' },
        React.createElement('span', { className: 'highlight' }, targetName),
        ' 구역에',
        React.createElement('br'),
        React.createElement('span', { style: { color: '#FF6B00' } }, '40% 할인 BOMB'),
        '이',
        React.createElement('br'),
        '투하되기 직전입니다'
      ),

      // Description
      React.createElement('div', { className: 'nudge-desc' },
        '지금 당장 알파벳 ', card.letter, ' 카드를 장전하세요.',
        React.createElement('br'),
        '발급 즉시 ', card.label, ' 카테고리 전 가맹점 40% 혜택!'
      ),

      // CTA Button
      React.createElement('button', {
        className: 'nudge-cta',
        onClick: () => { alert('카드 발급 페이지로 이동! (프로토타입)'); onClose(); }
      }, '⚡ 3분 즉시 발급 →'),

      // Close
      React.createElement('button', {
        className: 'nudge-close',
        onClick: onClose
      }, '다음에 할게요')
    )
  );
}

// ── Live Vote Feed ──
function VoteFeed({ items }) {
  return React.createElement('div', { className: 'vote-feed' },
    items.slice(0, 3).map((item, i) =>
      React.createElement('div', { key: item.id || i, className: 'feed-item', style: { animationDelay: i * 100 + 'ms' } },
        React.createElement('span', { className: 'voter' }, item.voter),
        ' → ',
        React.createElement('span', { className: 'target' }, item.target),
        ' DROP!'
      )
    )
  );
}

// ── Search Component ──
function SearchSection({ data, onVote }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    const matched = data.merchants.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.region.toLowerCase().includes(q)
    ).slice(0, 8);
    setResults(matched);
  }, [query, data.merchants]);

  return React.createElement('div', { className: 'search-results' },
    React.createElement('div', { className: 'search-container' },
      React.createElement('input', {
        type: 'text',
        className: 'search-input',
        placeholder: '가맹점 또는 동네를 검색하세요',
        value: query,
        onChange: (e) => setQuery(e.target.value)
      }),
      React.createElement('span', { className: 'search-icon' }, '🔍')
    ),
    results.length > 0 && results.map((item, i) => {
      const card = CARDS[item.cardType];
      return React.createElement('div', {
        key: item.id,
        className: 'search-result-item',
        style: { animationDelay: i * 50 + 'ms' }
      },
        React.createElement('div', {
          className: 'sr-card-icon',
          style: { background: card.bg, color: card.accent }
        }, card.letter),
        React.createElement('div', { className: 'sr-info' },
          React.createElement('div', { className: 'sr-name' }, item.name),
          React.createElement('div', { className: 'sr-category' },
            item.region, ' · ', card.label
          )
        ),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
          React.createElement('span', { className: 'sr-votes' }, item.voteCount),
          React.createElement('button', {
            className: 'drop-btn',
            onClick: (e) => { e.stopPropagation(); onVote(item, e); }
          }, '💣 DROP')
        )
      );
    })
  );
}

// ── Leaderboard Item ──
function LeaderboardItem({ item, rank, type, onVote, justVotedId }) {
  const card = CARDS[item.cardType || item.topCardType];
  const isTop3 = rank <= 3;
  const isJustVoted = justVotedId === item.id;
  const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';

  return React.createElement('div', {
    className: 'lb-item' + (isJustVoted ? ' just-voted' : ''),
  },
    // Rank
    React.createElement('div', { className: 'lb-rank ' + rankClass },
      rank === 1 ? '👑' : rank
    ),

    // Card Icon
    card && React.createElement('div', {
      style: {
        width: 38, height: 38, borderRadius: 8,
        background: card.bg, color: card.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 900, flexShrink: 0
      }
    }, card.letter),

    // Info
    React.createElement('div', { className: 'lb-info' },
      React.createElement('div', { className: 'lb-name' }, item.name),
      React.createElement('div', { className: 'lb-meta' },
        type === 'merchant'
          ? React.createElement(React.Fragment, null,
              React.createElement('span', null, item.region),
              React.createElement(CardBadge, { cardType: item.cardType })
            )
          : React.createElement('span', null, item.district)
      )
    ),

    // Votes + Drop
    React.createElement('div', { className: 'lb-right' },
      React.createElement('div', { className: 'lb-votes' },
        React.createElement(RollingNumber, { value: item.voteCount })
      ),
      React.createElement('button', {
        className: 'drop-btn' + (isJustVoted ? ' voted' : ''),
        style: { fontSize: 11, padding: '6px 14px' },
        onClick: (e) => onVote(item, e)
      }, isJustVoted ? '✓ DONE' : '💣 DROP')
    )
  );
}

// ── Main App ──
function App() {
  const [data, setData] = useState(generateMockData);
  const [tab, setTab] = useState('merchant'); // merchant | region
  const [cardFilter, setCardFilter] = useState('all');
  const [floats, setFloats] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeCard, setNudgeCard] = useState('D');
  const [nudgeTarget, setNudgeTarget] = useState('');
  const [justVotedId, setJustVotedId] = useState(null);
  const [totalVotes, setTotalVotes] = useState(18432);
  const [liveUsers, setLiveUsers] = useState(2847);
  const voteCount = useRef(0);

  // Simulate real-time vote fluctuations
  useEffect(() => {
    const iv = setInterval(() => {
      setData(prev => {
        const newData = { ...prev };
        const list = tab === 'merchant' ? [...newData.merchants] : [...newData.regions];

        // Random vote bumps
        const bumpCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < bumpCount; i++) {
          const idx = Math.floor(Math.random() * list.length);
          list[idx] = { ...list[idx], voteCount: list[idx].voteCount + Math.floor(Math.random() * 5) + 1 };
        }

        // Re-sort by votes
        list.sort((a, b) => b.voteCount - a.voteCount);

        if (tab === 'merchant') newData.merchants = list;
        else newData.regions = list;

        return newData;
      });

      setTotalVotes(v => v + Math.floor(Math.random() * 8) + 1);
      setLiveUsers(v => v + Math.floor(Math.random() * 5) - 2);

      // Random feed item
      if (Math.random() > 0.5) {
        const names = ['DROPPER_A3F', 'HYPER_9K2', 'BOMB_X7', 'ALPHA_Q1', 'NEON_Z4', 'FIRE_M8'];
        const targets = ['성수동', '올리브영', '몽탄', '홍대', '무신사', '강남역'];
        setFeedItems(prev => [{
          id: Date.now(),
          voter: names[Math.floor(Math.random() * names.length)],
          target: targets[Math.floor(Math.random() * targets.length)]
        }, ...prev].slice(0, 5));
      }
    }, 2000);

    return () => clearInterval(iv);
  }, [tab]);

  // Handle Vote
  const handleVote = useCallback((item, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - 20;
    const y = rect.top - 10;

    // Float effect
    const floatId = Date.now();
    setFloats(prev => [...prev, { id: floatId, x, y, text: '+1 💣' }]);

    // Update vote count
    setData(prev => {
      const newData = { ...prev };
      const list = tab === 'merchant' ? [...newData.merchants] : [...newData.regions];
      const idx = list.findIndex(i => i.id === item.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], voteCount: list[idx].voteCount + 1 };
        list.sort((a, b) => b.voteCount - a.voteCount);
      }
      if (tab === 'merchant') newData.merchants = list;
      else newData.regions = list;
      return newData;
    });

    setTotalVotes(v => v + 1);
    setJustVotedId(item.id);
    setTimeout(() => setJustVotedId(null), 1500);

    // Screen shake
    document.body.style.animation = 'shake 0.3s ease-out';
    setTimeout(() => { document.body.style.animation = ''; }, 300);

    // Flash effect
    document.body.style.animation = 'bombFlash 0.5s ease-out';
    setTimeout(() => { document.body.style.animation = ''; }, 500);

    // Feed item
    setFeedItems(prev => [{
      id: Date.now(),
      voter: 'YOU',
      target: item.name
    }, ...prev].slice(0, 5));

    // Nudge after every 3rd vote
    voteCount.current += 1;
    if (voteCount.current % 3 === 0) {
      setTimeout(() => {
        setNudgeCard(item.cardType || item.topCardType || 'D');
        setNudgeTarget(item.name || item.region || '');
        setShowNudge(true);
      }, 800);
    }
  }, [tab]);

  // Filter leaderboard
  const getFilteredList = () => {
    const list = tab === 'merchant' ? data.merchants : data.regions;
    if (cardFilter === 'all') return list;
    return list.filter(item =>
      (item.cardType || item.topCardType) === cardFilter
    );
  };

  const filtered = getFilteredList();

  return React.createElement(React.Fragment, null,
    // Scanline overlay
    React.createElement('div', { className: 'scanline-overlay' }),

    // Header
    React.createElement('header', { className: 'header' },
      React.createElement('div', { className: 'header-inner' },
        React.createElement('div', { className: 'logo' },
          'ALPHABET',
          React.createElement('span', null, ' DROP')
        ),
        React.createElement('div', { className: 'stats-pill' },
          React.createElement('span', { className: 'live' },
            React.createElement(RollingNumber, { value: liveUsers }),
            ' LIVE'
          ),
          React.createElement('span', null,
            React.createElement(RollingNumber, { value: totalVotes }),
            ' DROPS'
          )
        )
      )
    ),

    // Main Content
    React.createElement('main', { className: 'app-container' },
      // Hero
      React.createElement('section', { className: 'hero' },
        React.createElement('h1', { className: 'hero-title' },
          React.createElement('span', { className: 'glitch' }, '혜택'),
          ' 쟁탈전'
        ),
        React.createElement('p', { className: 'hero-sub' },
          '투표하고 ',
          React.createElement('strong', null, '40% 할인 BOMB'),
          '을 떨어뜨려라'
        )
      ),

      // Tab Bar
      React.createElement('div', { className: 'tab-bar' },
        React.createElement('button', {
          className: 'tab-btn' + (tab === 'merchant' ? ' active' : ''),
          onClick: () => setTab('merchant')
        }, '🏪 가맹점 배틀'),
        React.createElement('button', {
          className: 'tab-btn' + (tab === 'region' ? ' active' : ''),
          onClick: () => setTab('region')
        }, '📍 동네 배틀')
      ),

      // Search
      React.createElement(SearchSection, { data, onVote: handleVote }),

      // Card Filter Chips
      React.createElement(CardChips, { selected: cardFilter, onSelect: setCardFilter }),

      // Section Title
      React.createElement('div', { className: 'section-title' },
        tab === 'merchant' ? '🔥 REAL-TIME MERCHANT RANKING' : '🔥 REAL-TIME REGION RANKING'
      ),

      // Leaderboard
      React.createElement('div', { className: 'leaderboard' },
        filtered.map((item, i) =>
          React.createElement(LeaderboardItem, {
            key: item.id,
            item,
            rank: i + 1,
            type: tab,
            onVote: handleVote,
            justVotedId
          })
        )
      )
    ),

    // Live Vote Feed
    React.createElement(VoteFeed, { items: feedItems }),

    // Float Effects
    floats.map(f =>
      React.createElement(VoteFloat, {
        key: f.id,
        x: f.x,
        y: f.y,
        text: f.text,
        onDone: () => setFloats(prev => prev.filter(ff => ff.id !== f.id))
      })
    ),

    // Nudge Popup
    showNudge && React.createElement(NudgePopup, {
      cardType: nudgeCard,
      targetName: nudgeTarget,
      onClose: () => setShowNudge(false)
    }),

    // Bottom Nav
    React.createElement('nav', { className: 'bottom-nav' },
      React.createElement('div', { className: 'bottom-nav-inner' },
        React.createElement('button', { className: 'nav-item active' },
          React.createElement('span', { className: 'nav-icon' }, '🏆'),
          'RANKING'
        ),
        React.createElement('button', { className: 'nav-item' },
          React.createElement('span', { className: 'nav-icon' }, '🗺️'),
          'MAP'
        ),
        React.createElement('button', { className: 'nav-item' },
          React.createElement('span', { className: 'nav-icon' }, '💳'),
          'MY CARD'
        ),
        React.createElement('button', { className: 'nav-item' },
          React.createElement('span', { className: 'nav-icon' }, '👤'),
          'PROFILE'
        )
      )
    )
  );
}

// ── Mount ──
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
