/**
 * PROJECT ALPHABET DROP — Seed Data
 * 프로토타입용 서울 주요 동네 + 인기 가맹점 Mock 데이터
 */
const mongoose = require('mongoose');
const path = require('path');

// DB 연결
const connectDB = require('../config/database');

const Region = require('./models/Region');
const Merchant = require('./models/Merchant');
const { mapToAlphabetCard } = require('./utils/categoryMapper');

const REGIONS = [
  { name: '압구정동', district: '강남구', city: '서울' },
  { name: '성수동', district: '성동구', city: '서울' },
  { name: '한남동', district: '용산구', city: '서울' },
  { name: '홍대입구', district: '마포구', city: '서울' },
  { name: '이태원동', district: '용산구', city: '서울' },
  { name: '망원동', district: '마포구', city: '서울' },
  { name: '연남동', district: '마포구', city: '서울' },
  { name: '삼청동', district: '종로구', city: '서울' },
  { name: '익선동', district: '종로구', city: '서울' },
  { name: '을지로동', district: '중구', city: '서울' },
  { name: '여의도동', district: '영등포구', city: '서울' },
  { name: '잠실동', district: '송파구', city: '서울' },
  { name: '가로수길', district: '강남구', city: '서울' },
  { name: '청담동', district: '강남구', city: '서울' },
  { name: '서촌', district: '종로구', city: '서울' },
  { name: '북촌', district: '종로구', city: '서울' },
  { name: '강남역', district: '강남구', city: '서울' },
  { name: '건대입구', district: '광진구', city: '서울' },
  { name: '합정동', district: '마포구', city: '서울' },
  { name: '성북동', district: '성북구', city: '서울' },
];

const MERCHANTS = [
  // D: 외식/배달
  { name: '몽탄 성수', address: '서울 성동구 성수동', categoryRaw: '음식점 > 한식', categoryGroup: 'FD6', region: '성수동' },
  { name: '도산분식', address: '서울 강남구 압구정동', categoryRaw: '음식점 > 분식', categoryGroup: 'FD6', region: '압구정동' },
  { name: '오모카세 한남', address: '서울 용산구 한남동', categoryRaw: '음식점 > 일식 > 초밥', categoryGroup: 'FD6', region: '한남동' },
  { name: '을지OB베어', address: '서울 중구 을지로동', categoryRaw: '음식점 > 호프', categoryGroup: 'FD6', region: '을지로동' },
  { name: '연남서가', address: '서울 마포구 연남동', categoryRaw: '카페', categoryGroup: 'CE7', region: '연남동' },
  { name: '홍대 포차거리', address: '서울 마포구 홍대입구', categoryRaw: '음식점 > 포차', categoryGroup: 'FD6', region: '홍대입구' },
  { name: '잠실 롯데월드몰 푸드코트', address: '서울 송파구 잠실동', categoryRaw: '음식점 > 뷔페', categoryGroup: 'FD6', region: '잠실동' },

  // H: 교육/병원
  { name: '강남세브란스', address: '서울 강남구 강남역', categoryRaw: '병원 > 종합병원', categoryGroup: 'HP8', region: '강남역' },
  { name: '메가스터디 강남', address: '서울 강남구 강남역', categoryRaw: '학원 > 입시', categoryGroup: 'AC5', region: '강남역' },
  { name: '파고다어학원 종로', address: '서울 종로구 삼청동', categoryRaw: '학원 > 어학원', categoryGroup: 'AC5', region: '삼청동' },

  // O: 주유
  { name: 'GS칼텍스 한남주유소', address: '서울 용산구 한남동', categoryRaw: '주유소', categoryGroup: 'OL7', region: '한남동' },
  { name: 'SK에너지 여의도', address: '서울 영등포구 여의도동', categoryRaw: '주유소', categoryGroup: 'OL7', region: '여의도동' },

  // S: 쇼핑
  { name: '무신사 스탠다드 성수', address: '서울 성동구 성수동', categoryRaw: '쇼핑 > 의류', categoryGroup: 'MT1', region: '성수동' },
  { name: '현대백화점 압구정본점', address: '서울 강남구 압구정동', categoryRaw: '백화점', categoryGroup: 'MT1', region: '압구정동' },
  { name: '가로수길 편집샵', address: '서울 강남구 가로수길', categoryRaw: '쇼핑 > 편집샵', categoryGroup: 'MT1', region: '가로수길' },
  { name: '건대 커먼그라운드', address: '서울 광진구 건대입구', categoryRaw: '쇼핑몰', categoryGroup: 'MT1', region: '건대입구' },

  // T: 여행
  { name: '서울드래곤시티 호텔', address: '서울 용산구 한남동', categoryRaw: '숙박 > 호텔', categoryGroup: 'AD5', region: '한남동' },
  { name: '이태원 게스트하우스', address: '서울 용산구 이태원동', categoryRaw: '숙박 > 게스트하우스', categoryGroup: 'AD5', region: '이태원동' },
  { name: '롯데월드 어드벤처', address: '서울 송파구 잠실동', categoryRaw: '관광명소 > 테마파크', categoryGroup: 'AT4', region: '잠실동' },

  // B: 뷰티/패션/헬스
  { name: '준오헤어 청담', address: '서울 강남구 청담동', categoryRaw: '미용실', categoryGroup: 'FD6', region: '청담동', forceCard: 'B' },
  { name: '나이키 홍대', address: '서울 마포구 홍대입구', categoryRaw: '쇼핑 > 스포츠의류', categoryGroup: 'MT1', region: '홍대입구', forceCard: 'B' },
  { name: '필라테스 라운지 합정', address: '서울 마포구 합정동', categoryRaw: '스포츠 > 필라테스', categoryGroup: 'FD6', region: '합정동', forceCard: 'B' },
  { name: '올리브영 강남역점', address: '서울 강남구 강남역', categoryRaw: '화장품', categoryGroup: 'MT1', region: '강남역', forceCard: 'B' },

  // P: 페이/간편결제
  { name: '카카오페이 제휴 성수카페', address: '서울 성동구 성수동', categoryRaw: '카페 > 간편결제', categoryGroup: 'CE7', region: '성수동', forceCard: 'P' },
  { name: '토스 팝업스토어 여의도', address: '서울 영등포구 여의도동', categoryRaw: '금융 > 핀테크', categoryGroup: 'BK9', region: '여의도동' },

  // R: 구독/반복결제
  { name: 'CU 망원점', address: '서울 마포구 망원동', categoryRaw: '편의점', categoryGroup: 'CS2', region: '망원동' },
  { name: 'GS25 익선동점', address: '서울 종로구 익선동', categoryRaw: '편의점', categoryGroup: 'CS2', region: '익선동' },
  { name: '세븐일레븐 서촌점', address: '서울 종로구 서촌', categoryRaw: '편의점', categoryGroup: 'CS2', region: '서촌' },
];

async function seed() {
  try {
    await connectDB();
    console.log('🗑️  기존 Alphabet Drop 데이터 삭제...');
    await Promise.all([
      Region.deleteMany({}),
      Merchant.deleteMany({}),
      Vote.deleteMany({}),
    ]);

    // 지역 생성
    console.log('🌍 지역 데이터 생성...');
    const regionDocs = await Region.insertMany(
      REGIONS.map((r) => ({
        ...r,
        voteCount: Math.floor(Math.random() * 500) + 50,
        topCardType: ['D','S','B','R','T','H','P','O'][Math.floor(Math.random() * 8)],
      }))
    );

    const regionMap = {};
    regionDocs.forEach((r) => { regionMap[r.name] = r; });

    // 가맹점 생성 (카드 타입 자동 매핑)
    console.log('🏪 가맹점 데이터 생성 + 카드 자동 매핑...');
    const merchantDocs = [];
    for (const m of MERCHANTS) {
      const mapping = m.forceCard
        ? { cardType: m.forceCard, confidence: 'manual', matchedBy: 'force' }
        : mapToAlphabetCard({
            category_group_code: m.categoryGroup,
            category_name: m.categoryRaw,
            place_name: m.name,
          });

      const region = regionMap[m.region];
      merchantDocs.push({
        name: m.name,
        address: m.address,
        categoryRaw: m.categoryRaw,
        categoryGroup: m.categoryGroup,
        cardType: mapping.cardType,
        regionId: region?._id,
        regionName: m.region,
        voteCount: Math.floor(Math.random() * 300) + 10,
      });
    }

    await Merchant.insertMany(merchantDocs);

    // 지역별 가맹점 수 + 카드 분포 업데이트
    for (const region of regionDocs) {
      const merchants = await Merchant.find({ regionId: region._id });
      const dist = { D: 0, H: 0, O: 0, S: 0, T: 0, B: 0, P: 0, R: 0 };
      merchants.forEach((m) => { dist[m.cardType] = (dist[m.cardType] || 0) + 1; });

      const topCard = Object.entries(dist).sort((a, b) => b[1] - a[1])[0];
      await Region.findByIdAndUpdate(region._id, {
        merchantCount: merchants.length,
        cardDistribution: dist,
        topCardType: topCard[1] > 0 ? topCard[0] : 'S',
      });
    }

    const Vote = require('./models/Vote');

    console.log('✅ Seed 완료!');
    console.log(`   📍 지역: ${regionDocs.length}개`);
    console.log(`   🏪 가맹점: ${merchantDocs.length}개`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed 실패:', err);
    process.exit(1);
  }
}

seed();
