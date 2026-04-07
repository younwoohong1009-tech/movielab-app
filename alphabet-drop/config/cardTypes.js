/**
 * PROJECT ALPHABET DROP — Card Type Configuration
 * 현대카드 알파벳카드 8종의 컬러 시스템 및 카테고리 매핑 정의
 * 실제 카드 플레이트 디자인 기반 정확한 컬러값 적용
 */

const CARD_TYPES = {
  D: {
    letter: 'D',
    name: 'Dining',
    label: '외식/배달',
    description: '맛집, 배달, 카페까지 먹는 모든 순간',
    bgColor: '#1B1F6B',      // 딥 네이비
    accentColor: '#F5B731',   // 골드 옐로우
    gradient: 'linear-gradient(135deg, #1B1F6B 0%, #2A2F8A 100%)',
    emoji: '🍽️',
  },
  H: {
    letter: 'H',
    name: 'Health & Education',
    label: '교육/병원',
    description: '병원비, 학원비, 자기계발 투자',
    bgColor: '#1B2054',      // 다크 네이비
    accentColor: '#E8673A',   // 오렌지
    gradient: 'linear-gradient(135deg, #1B2054 0%, #2C3270 100%)',
    emoji: '🏥',
  },
  O: {
    letter: 'O',
    name: 'Oil & Gas',
    label: '주유',
    description: '주유소, 충전소, 차량 관리',
    bgColor: '#6BB8E8',      // 스카이 블루
    accentColor: '#4A5F1A',   // 올리브 그린
    gradient: 'linear-gradient(135deg, #6BB8E8 0%, #89CCF0 100%)',
    emoji: '⛽',
  },
  S: {
    letter: 'S',
    name: 'Shopping',
    label: '쇼핑',
    description: '온·오프라인 쇼핑, 백화점, 마트',
    bgColor: '#FF3B1D',      // 레드
    accentColor: '#7BD4A0',   // 민트 그린
    gradient: 'linear-gradient(135deg, #FF3B1D 0%, #FF5533 100%)',
    emoji: '🛍️',
  },
  T: {
    letter: 'T',
    name: 'Travel',
    label: '여행',
    description: '항공, 호텔, 여행사, 교통',
    bgColor: '#C4996B',      // 탄/골드
    accentColor: '#1A6B7A',   // 틸
    gradient: 'linear-gradient(135deg, #C4996B 0%, #D4A97B 100%)',
    emoji: '✈️',
  },
  B: {
    letter: 'B',
    name: 'Beauty & Fashion',
    label: '뷰티/패션/헬스',
    description: '화장품, 의류, 헬스장, 뷰티 살롱',
    bgColor: '#FFBF00',      // 옐로우
    accentColor: '#E83020',   // 레드
    gradient: 'linear-gradient(135deg, #FFBF00 0%, #FFD040 100%)',
    emoji: '💄',
  },
  P: {
    letter: 'P',
    name: 'Pay',
    label: '페이/간편결제',
    description: '네이버페이, 카카오페이, 간편결제',
    bgColor: '#3CC8C8',      // 시안
    accentColor: '#5A1028',   // 버건디
    gradient: 'linear-gradient(135deg, #3CC8C8 0%, #50DCD0 100%)',
    emoji: '💳',
  },
  R: {
    letter: 'R',
    name: 'Routine',
    label: '구독/반복결제',
    description: '편의점, 구독 서비스, 일상 반복 소비',
    bgColor: '#E040E0',      // 마젠타
    accentColor: '#00D050',   // 그린
    gradient: 'linear-gradient(135deg, #E040E0 0%, #F060F0 100%)',
    emoji: '🔄',
  },
};

const CARD_LIST = Object.values(CARD_TYPES);
const CARD_LETTERS = Object.keys(CARD_TYPES);

module.exports = { CARD_TYPES, CARD_LIST, CARD_LETTERS };
