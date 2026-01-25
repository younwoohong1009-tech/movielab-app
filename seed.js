require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Movie = require('./models/Movie');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Curator = require('./models/Curator');
const SupportTicket = require('./models/SupportTicket');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    console.log('🌱 Seeding database...');

    // 기존 데이터 삭제
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Curator.deleteMany({});
    await SupportTicket.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ========== 사용자 생성 ==========
    const users = await User.create([
      {
        email: 'admin@movielab.com',
        password: 'admin123',
        name: '관리자',
        role: 'admin',
        membership: 'premium',
        membershipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        email: 'minjun.kim@example.com',
        password: 'password123',
        name: '김민준',
        role: 'user',
        membership: 'premium',
        membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        email: 'seoyeon.lee@example.com',
        password: 'password123',
        name: '이서연',
        role: 'user',
        membership: 'basic'
      },
      {
        email: 'jihun.park@example.com',
        password: 'password123',
        name: '박지훈',
        role: 'curator',
        membership: 'premium',
        membershipExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log(`✅ Created ${users.length} users`);

    // ========== 영화 생성 ==========
    const movies = await Movie.create([
      {
        title: '기생충',
        originalTitle: 'Parasite',
        director: '봉준호',
        year: 2019,
        runtime: 132,
        genre: ['드라마', '스릴러'],
        country: '한국',
        language: '한국어',
        rating: '15',
        poster: 'https://via.placeholder.com/300x450/1a1a1a/e50914?text=기생충',
        synopsis: '전원 백수인 기택 가족은 막내아들 기우가 명문대생 친구의 소개로 박 사장 집의 가정교사로 들어가면서 운명이 바뀐다.',
        imdbRating: 8.6,
        quality: '4K',
        videoUrl: 'https://example.com/movies/parasite.mp4',
        views: 12500,
        likes: 9800,
        isFeatured: true
      },
      {
        title: '화양연화',
        originalTitle: 'In the Mood for Love',
        director: '왕가위',
        year: 2000,
        runtime: 98,
        genre: ['로맨스', '드라마'],
        country: '홍콩',
        language: '광둥어',
        rating: '15',
        poster: 'https://via.placeholder.com/300x450/1a1a1a/e50914?text=화양연화',
        synopsis: '1962년 홍콩. 신문사 편집자 차우와 비서 리잔은 같은 날 이웃으로 이사온다.',
        imdbRating: 8.1,
        quality: 'FHD',
        videoUrl: 'https://example.com/movies/mood.mp4',
        views: 8900,
        likes: 7200,
        isFeatured: true
      },
      {
        title: '올드보이',
        originalTitle: 'Oldboy',
        director: '박찬욱',
        year: 2003,
        runtime: 120,
        genre: ['액션', '스릴러', '미스터리'],
        country: '한국',
        language: '한국어',
        rating: '18',
        poster: 'https://via.placeholder.com/300x450/1a1a1a/e50914?text=올드보이',
        synopsis: '1988년, 평범한 회사원 오대수는 술에 취해 집에 가던 중 누군가에게 납치된다.',
        imdbRating: 8.4,
        quality: '4K',
        videoUrl: 'https://example.com/movies/oldboy.mp4',
        views: 11200,
        likes: 9100,
        isFeatured: false
      },
      {
        title: '트윈 픽스: 파이어 워크 위드 미',
        originalTitle: 'Twin Peaks: Fire Walk with Me',
        director: '데이비드 린치',
        year: 1992,
        runtime: 134,
        genre: ['미스터리', '드라마', '스릴러'],
        country: '미국',
        language: '영어',
        rating: '18',
        poster: 'https://via.placeholder.com/300x450/1a1a1a/e50914?text=트윈픽스',
        synopsis: '로라 파머의 죽음 일주일 전 이야기를 그린 영화.',
        imdbRating: 7.3,
        quality: 'FHD',
        videoUrl: 'https://example.com/movies/twin-peaks.mp4',
        views: 5600,
        likes: 4200
      },
      {
        title: '아멜리에',
        originalTitle: 'Le Fabuleux Destin d\'Amélie Poulain',
        director: '장 피에르 주네',
        year: 2001,
        runtime: 122,
        genre: ['로맨스', '코미디'],
        country: '프랑스',
        language: '프랑스어',
        rating: '12',
        poster: 'https://via.placeholder.com/300x450/1a1a1a/e50914?text=아멜리에',
        synopsis: '파리의 작은 카페에서 일하는 아멜리에는 우연히 발견한 작은 보물상자로 사람들을 행복하게 만들기로 결심한다.',
        imdbRating: 8.3,
        quality: 'FHD',
        videoUrl: 'https://example.com/movies/amelie.mp4',
        views: 9400,
        likes: 8100
      }
    ]);
    console.log(`✅ Created ${movies.length} movies`);

    // ========== 상품 생성 ==========
    const products = await Product.create([
      {
        name: '기생충 포스터 (A2)',
        description: '기생충 오리지널 포스터 A2 사이즈',
        category: 'poster',
        price: 45000,
        images: ['https://via.placeholder.com/400x600/1a1a1a/e50914?text=기생충+포스터'],
        stock: 50,
        relatedMovies: [movies[0]._id],
        membershipDiscount: 25,
        sales: 120
      },
      {
        name: '화양연화 블루레이 (한정판)',
        description: '화양연화 4K 리마스터 블루레이 한정판',
        category: 'bluray',
        price: 65000,
        originalPrice: 75000,
        images: ['https://via.placeholder.com/400x600/1a1a1a/e50914?text=화양연화+블루레이'],
        stock: 20,
        relatedMovies: [movies[1]._id],
        membershipDiscount: 25,
        sales: 45
      },
      {
        name: '올드보이 피규어',
        description: '올드보이 주인공 피규어 (15cm)',
        category: 'merchandise',
        price: 89000,
        images: ['https://via.placeholder.com/400x600/1a1a1a/e50914?text=올드보이+피규어'],
        stock: 15,
        relatedMovies: [movies[2]._id],
        membershipDiscount: 25,
        sales: 32
      },
      {
        name: '아트북: 왕가위 컬렉션',
        description: '왕가위 감독 작품 아트북 (양장본)',
        category: 'book',
        price: 55000,
        images: ['https://via.placeholder.com/400x600/1a1a1a/e50914?text=왕가위+아트북'],
        stock: 30,
        relatedMovies: [movies[1]._id],
        membershipDiscount: 25,
        sales: 67
      }
    ]);
    console.log(`✅ Created ${products.length} products`);

    // 영화에 상품 연결
    movies[0].relatedProducts = [products[0]._id];
    movies[1].relatedProducts = [products[1]._id, products[3]._id];
    movies[2].relatedProducts = [products[2]._id];
    await Promise.all(movies.map(m => m.save()));

    // ========== 주문 생성 ==========
    const orders = await Order.create([
      {
        orderNumber: 'ORD-26012501',
        user: users[1]._id,
        items: [
          {
            product: products[0]._id,
            name: products[0].name,
            price: products[0].price,
            quantity: 1
          }
        ],
        shippingAddress: {
          name: '김민준',
          phone: '010-1234-5678',
          address: '서울시 강남구 테헤란로 123',
          city: '서울',
          postalCode: '06234',
          country: '대한민국'
        },
        totalAmount: 45000,
        discount: 11250, // 25% 할인
        shippingFee: 3000,
        finalAmount: 36750,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        trackingNumber: '1234567890',
        courier: 'CJ대한통운'
      },
      {
        orderNumber: 'ORD-26012502',
        user: users[2]._id,
        items: [
          {
            product: products[1]._id,
            name: products[1].name,
            price: products[1].price,
            quantity: 1
          }
        ],
        shippingAddress: {
          name: '이서연',
          phone: '010-2345-6789',
          address: '서울시 마포구 상암동 456',
          city: '서울',
          postalCode: '03925',
          country: '대한민국'
        },
        totalAmount: 65000,
        discount: 0,
        shippingFee: 3000,
        finalAmount: 68000,
        paymentMethod: 'kakao',
        paymentStatus: 'paid',
        orderStatus: 'shipped',
        trackingNumber: '9876543210',
        courier: '로젠택배'
      },
      {
        orderNumber: 'ORD-26012503',
        user: users[1]._id,
        items: [
          {
            product: products[2]._id,
            name: products[2].name,
            price: products[2].price,
            quantity: 1
          }
        ],
        shippingAddress: {
          name: '김민준',
          phone: '010-1234-5678',
          address: '서울시 강남구 테헤란로 123',
          city: '서울',
          postalCode: '06234',
          country: '대한민국'
        },
        totalAmount: 89000,
        discount: 22250,
        shippingFee: 0, // 무료배송
        finalAmount: 66750,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'processing'
      }
    ]);
    console.log(`✅ Created ${orders.length} orders`);

    // ========== 큐레이터 생성 ==========
    const curators = await Curator.create([
      {
        user: users[3]._id,
        displayName: 'Mark Cousins',
        bio: '영화 역사가이자 평론가. 30년 경력의 영화 전문가.',
        expertise: ['아트시네마', '영화사', '다큐멘터리'],
        isFeatured: true,
        followers: 1250
      }
    ]);
    console.log(`✅ Created ${curators.length} curators`);

    // 큐레이터 컬렉션 추가
    curators[0].collections.push({
      title: '아시아 명작 선정',
      description: '아시아 영화의 걸작들을 모았습니다.',
      movies: [movies[0]._id, movies[1]._id, movies[2]._id],
      isPublic: true
    });
    await curators[0].save();

    // ========== 고객지원 티켓 생성 ==========
    const tickets = await SupportTicket.create([
      {
        ticketNumber: 'TICKET-000001',
        user: users[1]._id,
        type: 'inquiry',
        subject: '멤버십 결제 문의',
        content: '프리미엄 멤버십으로 업그레이드하고 싶습니다. 어떻게 하나요?',
        status: 'resolved',
        priority: 'medium',
        responses: [
          {
            author: users[0]._id,
            content: '안녕하세요. 프로필 > 멤버십 메뉴에서 업그레이드 가능합니다.'
          }
        ]
      },
      {
        ticketNumber: 'TICKET-000002',
        user: users[2]._id,
        type: 'spoiler',
        subject: '영화 "기생충" 리뷰에 스포일러 신고',
        content: '해당 리뷰에 중요한 스포일러가 포함되어 있습니다.',
        status: 'in-progress',
        priority: 'high',
        relatedMovie: movies[0]._id
      },
      {
        ticketNumber: 'TICKET-000003',
        user: users[1]._id,
        type: 'payment',
        subject: '주문 결제 실패',
        content: '주문 진행 중 결제가 실패했습니다. 확인 부탁드립니다.',
        status: 'open',
        priority: 'urgent'
      }
    ]);
    console.log(`✅ Created ${tickets.length} support tickets`);

    // 사용자에게 시청 기록 추가
    users[1].watchHistory.push(
      { movie: movies[0]._id, progress: 100 },
      { movie: movies[1]._id, progress: 65 },
      { movie: movies[4]._id, progress: 30 }
    );
    users[1].favorites.push(movies[0]._id, movies[2]._id);
    await users[1].save();

    console.log('');
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('='.repeat(60));
    console.log('🔐 Test Accounts:');
    console.log('='.repeat(60));
    console.log('Admin:');
    console.log('  Email: admin@movielab.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('User:');
    console.log('  Email: minjun.kim@example.com');
    console.log('  Password: password123');
    console.log('='.repeat(60));
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

// Run
connectDB().then(seedData);
