# ❓ 자주 묻는 질문 (FAQ)

## 💰 비용 관련

### Q: 정말 무료인가요?
**A: 네! 100% 무료입니다.**
- Railway: 월 500시간 무료 (하루 16시간 이상!)
- MongoDB: 512MB 영구 무료
- GitHub: 영구 무료

### Q: 신용카드가 필요한가요?
**A: 아니요!**
- 모든 서비스가 신용카드 없이 사용 가능
- 단, Railway는 추가 시간 원하면 필요 (무료 범위로 충분함)

### Q: 나중에 돈이 청구될까요?
**A: 아니요!**
- 무료 플랜 범위 내에서는 절대 청구 안됨
- 업그레이드는 본인이 직접 해야만 가능

---

## 🚀 배포 관련

### Q: Railway 대신 다른 서비스도 되나요?
**A: 네! Render.com도 가능합니다.**

**Render.com 배포:**
1. https://render.com 접속
2. "New +" → "Web Service"
3. GitHub 연결 → movielab 선택
4. 환경 변수 동일하게 설정
5. "Create Web Service"

### Q: 배포 후 사이트가 안 열려요
**A: 2가지 확인:**
1. **첫 접속은 30초 정도 걸림** (기다려보세요)
2. **Railway 로그 확인:**
   - Deployments 탭에서 에러 확인
   - 보통 환경 변수 문제

### Q: "Application Error" 나와요
**A: 환경 변수 확인:**
```
MONGODB_URI - MongoDB 연결 문자열 정확한지 확인
NODE_ENV - production 입력했는지
JWT_SECRET - 아무 문자열이나 입력
```

---

## 🔐 로그인 관련

### Q: 로그인이 안돼요
**A: 2가지 경우:**

**1. 데이터가 없는 경우:**
```
Railway에서 npm run seed 실행
(배포가이드 4-2 참고)
```

**2. 비밀번호가 틀린 경우:**
```
정확한 계정:
이메일: admin@movielab.com
비밀번호: admin123
```

### Q: 비밀번호를 바꾸고 싶어요
**A: 로그인 후:**
1. 우측 상단 프로필 클릭
2. "설정" 메뉴
3. "비밀번호 변경"

---

## 💾 데이터 관련

### Q: 영화를 추가하면 저장되나요?
**A: 네! MongoDB에 영구 저장됩니다.**

### Q: 데이터가 사라질까요?
**A: 아니요!**
- MongoDB 무료 플랜은 영구 보관
- 512MB까지 무료 (영화 수천개 가능)

### Q: 초기 데이터를 넣고 싶어요
**A: 시드 명령어 실행:**
```
Railway 대시보드 → ... → Run a command
입력: npm run seed
```

**생성되는 데이터:**
- 영화 5개
- 사용자 4명
- 주문 3개

---

## 🌐 URL 관련

### Q: URL을 바꿀 수 있나요?
**A: 네!**

**Railway에서:**
1. Settings → Domains
2. Custom Domain 클릭
3. 본인 도메인 연결 가능

**또는 Railway 무료 도메인:**
```
https://your-name.up.railway.app
(your-name 부분을 원하는 이름으로 변경 가능)
```

### Q: URL을 공유해도 되나요?
**A: 네! 자유롭게 공유하세요.**
- 전 세계 어디서나 접속 가능
- 로그인 정보만 알려주면 됨

---

## ⚡ 성능 관련

### Q: 사이트가 느려요
**A: 정상입니다!**
- **첫 접속:** 30초 정도 (절전 모드에서 깨어남)
- **이후 접속:** 빠름
- **5분 미사용:** 다시 절전

### Q: 절전 모드를 끄고 싶어요
**A: 유료 플랜 필요:**
- Hobby Plan: $5/월
- 24시간 항상 켜짐

### Q: 무료로 항상 켜둘 수 있나요?
**A: 핑 서비스 사용:**
- UptimeRobot.com (무료)
- 5분마다 사이트 접속해서 깨워줌

---

## 🛠 수정 관련

### Q: 코드를 수정하고 싶어요
**A: GitHub에서 수정:**
1. GitHub 저장소 접속
2. 파일 클릭 → 연필 아이콘
3. 수정 후 Commit
4. Railway가 자동으로 재배포!

### Q: 프론트엔드 디자인을 바꾸고 싶어요
**A: public/index.html 수정:**
- CSS 색상 변경
- 로고 변경
- 텍스트 변경

---

## 📱 모바일 관련

### Q: 모바일에서도 되나요?
**A: 네! 반응형입니다.**
- 스마트폰 브라우저에서 접속 가능
- 테블릿도 최적화됨

### Q: 앱으로 만들 수 있나요?
**A: PWA로 가능:**
- 모바일 브라우저에서 접속
- "홈 화면에 추가"
- 앱처럼 사용 가능

---

## 🔒 보안 관련

### Q: 안전한가요?
**A: 네!**
- HTTPS 자동 적용
- 비밀번호 암호화
- JWT 토큰 인증

### Q: 다른 사람이 접속할 수 있나요?
**A: 로그인 필요:**
- 로그인 정보 없이는 접근 불가
- 계정 권한 관리 가능

---

## 🆘 긴급 상황

### Q: 사이트가 완전히 죽었어요!
**A: 재배포:**
1. Railway 대시보드
2. Deployments 탭
3. 최신 배포 클릭
4. "Redeploy" 버튼

### Q: 데이터가 다 날아갔어요!
**A: MongoDB 확인:**
1. MongoDB Atlas 로그인
2. Browse Collections
3. 데이터 확인
4. 필요시 seed 재실행

### Q: GitHub 비밀번호를 잊었어요
**A: 재설정:**
1. https://github.com/password_reset
2. 이메일로 링크 받기

---

## 📞 추가 도움

### 공식 문서
- Railway: https://docs.railway.app
- MongoDB: https://docs.mongodb.com
- GitHub: https://docs.github.com

### 커뮤니티
- Railway Discord: https://discord.gg/railway
- MongoDB Forum: https://community.mongodb.com

---

## ✨ 팁

### 1. 북마크 저장
```
Railway 대시보드
MongoDB Atlas 대시보드
본인 GitHub 저장소
```

### 2. 비밀번호 관리
```
MongoDB 비밀번호
Railway 로그인 정보
관리자 계정 정보
→ 안전한 곳에 메모!
```

### 3. 정기 확인
```
주 1회 접속해서 절전 모드 방지
월 1회 Railway 사용량 확인
```

---

**더 궁금한 점이 있으면 배포가이드.md를 참고하세요!** 📚
