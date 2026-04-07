/**
 * PROJECT ALPHABET DROP — Category Mapper (핵심 매핑 로직)
 *
 * 외부 검색 API(카카오/네이버)의 업종 카테고리를
 * 현대카드 알파벳 8종(D,H,O,S,T,B,P,R)으로 자동 분류합니다.
 *
 * 매핑 우선순위:
 *   1) 카카오 category_group_code (가장 정확)
 *   2) 카카오 category_name 키워드 매칭 (세분류)
 *   3) 네이버 category 문자열 키워드 매칭
 *   4) 직접 업종명/가맹점명 키워드 폴백
 */

const { CARD_TYPES } = require('../config/cardTypes');

// ─────────────────────────────────────────────
// 1) 카카오 category_group_code 매핑 (1차 필터)
// ─────────────────────────────────────────────
const KAKAO_GROUP_MAP = {
  'FD6': 'D',   // 음식점
  'CE7': 'D',   // 카페
  'HP8': 'H',   // 병원
  'PM9': 'H',   // 약국
  'OL7': 'O',   // 주유소/충전소
  'MT1': 'S',   // 대형마트
  'CS2': 'R',   // 편의점 → Routine(일상반복)
  'AT4': 'T',   // 관광명소
  'AD5': 'T',   // 숙박
  'CT1': 'S',   // 문화시설
  'AG2': 'S',   // 중개업소 → Shopping 폴백
  'PK6': 'O',   // 주차장 → Oil(차량)
  'SC4': 'H',   // 학교
  'AC5': 'H',   // 학원
  'BK9': 'P',   // 은행 → Pay
  'SW8': 'T',   // 지하철역 → Travel
};

// ─────────────────────────────────────────────
// 2) 키워드 → 카드타입 매핑 (2차 상세 분류)
//    카테고리명 또는 가맹점명에서 키워드 탐색
// ─────────────────────────────────────────────
const KEYWORD_RULES = [
  // ── D: 외식/배달 ──
  { keywords: ['음식점', '식당', '레스토랑', '맛집', '한식', '중식', '일식', '양식',
    '분식', '치킨', '피자', '햄버거', '패스트푸드', '족발', '보쌈', '곱창',
    '삼겹살', '고기', '초밥', '회', '국밥', '찌개', '라멘', '우동', '파스타',
    '스테이크', '브런치', '뷔페', '술집', '호프', '이자카야', '포차', '바(Bar)',
    '카페', '커피', '디저트', '빵집', '베이커리', '아이스크림', '떡', '죽',
    '배달', '요기요', '배민', '쿠팡이츠', 'delivery'], card: 'D' },

  // ── H: 교육/병원 ──
  { keywords: ['병원', '의원', '치과', '한의원', '피부과', '안과', '이비인후과',
    '정형외과', '내과', '외과', '산부인과', '소아과', '비뇨기과', '신경과',
    '정신과', '성형외과', '약국', '의료', '건강검진', '검진센터',
    '학교', '학원', '교습소', '과외', '입시', '어학원', '영어', '수학',
    '코딩', '피아노', '미술학원', '태권도', '유치원', '어린이집', '대학',
    '도서관', '교육', '학습', '인강', '강의', '자격증'], card: 'H' },

  // ── O: 주유 ──
  { keywords: ['주유소', '주유', 'GS칼텍스', 'SK에너지', 'S-OIL', '현대오일',
    '알뜰주유', '충전소', '전기차충전', 'EV충전', '세차', '세차장',
    '정비소', '카센터', '오토', '타이어', '엔진오일', 'LPG'], card: 'O' },

  // ── S: 쇼핑 ──
  { keywords: ['마트', '이마트', '홈플러스', '코스트코', '트레이더스', '롯데마트',
    '백화점', '롯데백화점', '현대백화점', '신세계', '갤러리아', '아울렛',
    '쇼핑몰', '쇼핑', '무신사', '지그재그', '에이블리', '29CM', 'W컨셉',
    '다이소', '올리브영', '가전', '전자', '하이마트', '전자랜드',
    '가구', '이케아', '한샘', '인테리어', '생활용품', '문구',
    '쿠팡', '11번가', 'G마켓', '옥션', 'SSG', '네이버쇼핑'], card: 'S' },

  // ── T: 여행 ──
  { keywords: ['여행', '항공', '대한항공', '아시아나', '제주항공', '진에어',
    '호텔', '모텔', '리조트', '펜션', '게스트하우스', '에어비앤비',
    '야놀자', '여기어때', '렌터카', '렌트카', '고속버스', 'KTX', 'SRT',
    '기차', '터미널', '공항', '면세점', '투어', '관광', '테마파크',
    '놀이공원', '워터파크', '스키장', '캠핑', '글램핑'], card: 'T' },

  // ── B: 뷰티/패션/헬스 ──
  { keywords: ['미용실', '헤어', '네일', '네일샵', '왁싱', '피부관리', '에스테틱',
    '뷰티', '화장품', '코스메틱', '향수', '스킨케어', '메이크업',
    '패션', '의류', '옷', '자라', 'ZARA', 'H&M', '유니클로', '나이키', 'Nike',
    '아디다스', '뉴발란스', '스트릿', '편집샵', '브랜드',
    '헬스', '피트니스', '짐', 'GYM', '요가', '필라테스', '크로스핏',
    'PT', '퍼스널트레이닝', '스포츠', '골프', '수영', '댄스',
    '안경', '렌즈', '시계', '주얼리', '악세서리'], card: 'B' },

  // ── P: 페이/간편결제 ──
  { keywords: ['페이', 'pay', '간편결제', '카카오페이', '네이버페이', '토스',
    '삼성페이', '애플페이', '제로페이', '페이코', 'PAYCO',
    '은행', '금융', '증권', '보험', '저축', 'ATM',
    '송금', '환전', '결제', '핀테크'], card: 'P' },

  // ── R: 구독/반복결제 (일상루틴) ──
  { keywords: ['편의점', 'CU', 'GS25', '세븐일레븐', '이마트24', '미니스톱',
    '구독', '멤버십', '정기결제', '넷플릭스', 'Netflix', '유튜브프리미엄',
    '스포티파이', '왓챠', '티빙', '쿠팡플레이', '디즈니플러스',
    '통신', 'SKT', 'KT', 'LG유플러스', '알뜰폰',
    '공과금', '전기', '가스', '수도', '관리비', '아파트',
    '세탁', '클리닝', '코인세탁', '택배', '우체국',
    '반복', '일상', '생필품', '세제', '휴지'], card: 'R' },
];

// ─────────────────────────────────────────────
// 메인 매핑 함수
// ─────────────────────────────────────────────

/**
 * 외부 API 응답 데이터를 알파벳 카드 타입으로 매핑
 *
 * @param {Object} place - 검색 API 응답의 장소 객체
 * @param {string} [place.category_group_code] - 카카오 카테고리 그룹 코드
 * @param {string} [place.category_name]       - 카카오 전체 카테고리 경로 (예: "음식점 > 한식 > 육류,고기")
 * @param {string} [place.category]            - 네이버 카테고리 문자열
 * @param {string} [place.place_name]          - 장소명
 * @returns {{ cardType: string, confidence: 'high'|'medium'|'low', matchedBy: string }}
 */
function mapToAlphabetCard(place) {
  const {
    category_group_code,
    category_name = '',
    category = '',
    place_name = '',
  } = place;

  // ── PASS 1: 카카오 그룹코드 직접 매핑 (confidence: high) ──
  if (category_group_code && KAKAO_GROUP_MAP[category_group_code]) {
    const cardType = KAKAO_GROUP_MAP[category_group_code];

    // 그룹코드가 있어도 키워드로 더 정확한 분류 시도
    // 예: category_group_code=FD6(음식점)이지만 "배달" 키워드가 있으면 여전히 D
    //     category_group_code=MT1(마트)이지만 "올리브영"이면 B(뷰티)
    const refinedType = refineByKeyword(category_name + ' ' + place_name);
    if (refinedType && refinedType !== cardType) {
      // 키워드 매칭이 그룹코드와 다르면 키워드 우선
      return {
        cardType: refinedType,
        confidence: 'high',
        matchedBy: `group:${category_group_code}→keyword_override`,
      };
    }

    return {
      cardType,
      confidence: 'high',
      matchedBy: `group:${category_group_code}`,
    };
  }

  // ── PASS 2: 카테고리명 키워드 매칭 (confidence: medium) ──
  const searchText = [category_name, category, place_name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const keywordMatch = refineByKeyword(searchText);
  if (keywordMatch) {
    return {
      cardType: keywordMatch,
      confidence: 'medium',
      matchedBy: 'keyword',
    };
  }

  // ── PASS 3: 폴백 → S(쇼핑) 기본값 (confidence: low) ──
  return {
    cardType: 'S',
    confidence: 'low',
    matchedBy: 'fallback',
  };
}

/**
 * 텍스트에서 키워드를 탐색하여 카드 타입 반환
 * @param {string} text
 * @returns {string|null}
 */
function refineByKeyword(text) {
  const lowerText = text.toLowerCase();

  // 가장 많은 키워드가 히트한 카드 타입 선정 (가중 스코어)
  let bestMatch = null;
  let bestScore = 0;

  for (const rule of KEYWORD_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        // 긴 키워드일수록 더 specific → 높은 가중치
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule.card;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

/**
 * 배치 매핑: 검색 결과 배열 전체를 한번에 매핑
 * @param {Array} places - 장소 객체 배열
 * @returns {Array} 카드 타입이 추가된 장소 배열
 */
function mapPlacesToCards(places) {
  return places.map((place) => {
    const mapping = mapToAlphabetCard(place);
    return {
      ...place,
      ...mapping,
      cardInfo: CARD_TYPES[mapping.cardType],
    };
  });
}

/**
 * 특정 카드 타입의 장소만 필터링
 * @param {Array} places - 장소 객체 배열
 * @param {string} cardType - 'D'|'H'|'O'|'S'|'T'|'B'|'P'|'R'
 * @returns {Array}
 */
function filterByCardType(places, cardType) {
  return mapPlacesToCards(places).filter((p) => p.cardType === cardType);
}

module.exports = {
  mapToAlphabetCard,
  mapPlacesToCards,
  filterByCardType,
  refineByKeyword,
  KAKAO_GROUP_MAP,
  KEYWORD_RULES,
};
