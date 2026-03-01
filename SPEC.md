# taan-basketball-api — 後端 API 製作規格

## 專案概覽

大安ㄍㄤㄍㄤ好籃球聯盟後端 API，取代目前 Google Sheets 直讀架構，提供認證、權限管理、資料 CRUD 與公開查詢 API。

---

## 技術選型

| 層級 | 技術 | 理由 |
|------|------|------|
| **Runtime** | Node.js + TypeScript | 前端已用 Node（TG bot），TS 加型別安全 |
| **框架** | Fastify | 比 Express 快 2-3x，內建 schema validation、plugin 架構 |
| **ORM** | Prisma | 自動 migration、型別生成、直覺 query API |
| **資料庫** | PostgreSQL | 關聯資料多（隊伍↔球員↔比賽↔數據），JSON 欄位彈性大 |
| **認證** | JWT (access + refresh token) | 前端是靜態站，JWT 無狀態適合 |
| **密碼** | bcrypt | 業界標準 |
| **Validation** | Zod | Schema 驗證，與 Fastify 整合良好 |
| **部署** | Docker Compose（PostgreSQL + API） | 一鍵啟動，開發/生產一致 |

---

## 專案結構

```
taan-basketball-api/
├── prisma/
│   ├── schema.prisma              # 資料庫 schema
│   ├── migrations/                # 自動生成
│   └── seed.ts                    # 初始資料（SUPER_ADMIN 帳號）
├── src/
│   ├── app.ts                     # Fastify 主程式
│   ├── config.ts                  # 環境變數（dotenv）
│   ├── plugins/
│   │   ├── auth.ts                # JWT 驗證 plugin
│   │   └── rbac.ts                # 角色權限檢查 plugin
│   ├── routes/
│   │   ├── auth.ts                # 登入/登出/refresh
│   │   ├── public/                # 公開 API（每頁一檔）
│   │   │   ├── home.ts
│   │   │   ├── schedule.ts
│   │   │   ├── standings.ts
│   │   │   ├── boxscore.ts
│   │   │   ├── leaders.ts
│   │   │   ├── roster.ts
│   │   │   ├── dragon.ts
│   │   │   ├── stats.ts
│   │   │   ├── hof.ts
│   │   │   └── rotation.ts
│   │   └── admin/                 # 管理 API（每資源一檔）
│   │       ├── seasons.ts
│   │       ├── teams.ts
│   │       ├── players.ts
│   │       ├── weeks.ts
│   │       ├── games.ts
│   │       ├── boxscore.ts
│   │       ├── attendance.ts
│   │       ├── duties.ts
│   │       ├── dragon.ts
│   │       ├── announcements.ts
│   │       └── users.ts
│   ├── services/                  # 業務邏輯層
│   │   ├── auth.service.ts
│   │   ├── season.service.ts
│   │   ├── team.service.ts
│   │   ├── player.service.ts
│   │   ├── schedule.service.ts
│   │   ├── game.service.ts
│   │   ├── boxscore.service.ts
│   │   ├── attendance.service.ts
│   │   ├── duty.service.ts
│   │   ├── dragon.service.ts
│   │   ├── standings.service.ts
│   │   ├── leaders.service.ts
│   │   └── stats-calculator.ts   # 衍生數據計算引擎
│   ├── utils/
│   │   ├── errors.ts              # 自定義錯誤類別
│   │   └── pagination.ts          # 分頁工具
│   └── types/
│       └── index.ts               # 共用 TypeScript 型別
├── scripts/
│   └── migrate-from-sheets.ts     # Google Sheets → DB 遷移腳本
├── tests/
│   ├── auth.test.ts
│   ├── public-api.test.ts
│   └── admin-api.test.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── tsconfig.json
├── package.json
└── SPEC.md                        # 本文件
```

---

## 資料庫 Schema（Prisma）

### 使用者與權限

```prisma
model User {
  id            Int       @id @default(autoincrement())
  username      String    @unique
  email         String?   @unique
  passwordHash  String
  displayName   String
  role          Role      @default(VIEWER)
  playerId      Int?      @unique
  player        Player?   @relation(fields: [playerId], references: [id])
  refreshTokens RefreshToken[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

enum Role {
  SUPER_ADMIN   // 所有權限
  ADMIN         // 賽務管理、數據輸入
  TEAM_CAPTAIN  // 管理自己隊伍的出席、排班
  PLAYER        // 查看個人數據、修改個人資料
  VIEWER        // 只能看公開資料
}
```

### 賽季

```prisma
model Season {
  id          Int       @id @default(autoincrement())
  number      Int       @unique          // 第 N 屆
  name        String?
  startDate   DateTime?
  endDate     DateTime?
  isCurrent   Boolean   @default(false)
  weeks       Week[]
  teamSeasons TeamSeason[]
  standings   Standing[]
  dragonScores DragonScore[]
  createdAt   DateTime  @default(now())
}
```

### 隊伍

```prisma
model Team {
  id          Int       @id @default(autoincrement())
  code        String    @unique          // "red","black","blue","green","yellow","white"
  name        String                     // "紅隊"
  shortName   String                     // "紅"
  color       String                     // "#e53935"
  barColor    String?
  textColor   String?
  teamSeasons TeamSeason[]
  createdAt   DateTime  @default(now())
}

model TeamSeason {
  id        Int      @id @default(autoincrement())
  teamId    Int
  team      Team     @relation(fields: [teamId], references: [id])
  seasonId  Int
  season    Season   @relation(fields: [seasonId], references: [id])
  players   PlayerSeason[]
  homeGames Game[]   @relation("HomeTeam")
  awayGames Game[]   @relation("AwayTeam")

  @@unique([teamId, seasonId])
}
```

### 球員

```prisma
model Player {
  id            Int       @id @default(autoincrement())
  name          String
  avatarUrl     String?
  phone         String?
  isReferee     Boolean   @default(false)
  user          User?
  playerSeasons PlayerSeason[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model PlayerSeason {
  id            Int       @id @default(autoincrement())
  playerId      Int
  player        Player    @relation(fields: [playerId], references: [id])
  teamSeasonId  Int
  teamSeason    TeamSeason @relation(fields: [teamSeasonId], references: [id])
  jerseyNumber  Int?
  isCaptain     Boolean   @default(false)
  attendance    Attendance[]
  playerStats   PlayerGameStat[]
  dragonScore   DragonScore?
  dutyRecords   DutyRecord[]

  @@unique([playerId, teamSeasonId])
}
```

### 賽程

```prisma
model Week {
  id        Int       @id @default(autoincrement())
  seasonId  Int
  season    Season    @relation(fields: [seasonId], references: [id])
  weekNum   Int
  date      DateTime
  phase     Phase
  venue     String
  type      WeekType  @default(GAME)
  reason    String?
  games     Game[]
  attendance Attendance[]

  @@unique([seasonId, weekNum])
}

enum Phase {
  PRESEASON   // 熱身賽
  REGULAR     // 例行賽
  PLAYOFF     // 季後賽
}

enum WeekType {
  GAME
  SUSPENDED
}

model Game {
  id            Int       @id @default(autoincrement())
  weekId        Int
  week          Week      @relation(fields: [weekId], references: [id])
  gameNum       Int
  homeTeamId    Int
  homeTeam      TeamSeason @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeamId    Int
  awayTeam      TeamSeason @relation("AwayTeam", fields: [awayTeamId], references: [id])
  homeScore     Int?
  awayScore     Int?
  status        GameStatus @default(UPCOMING)
  scheduledTime String?
  recorder      String?
  playerStats   PlayerGameStat[]
  duties        DutyRecord[]

  @@unique([weekId, gameNum])
}

enum GameStatus {
  UPCOMING
  LIVE
  FINISHED
}
```

### 比賽數據（Boxscore）

```prisma
model PlayerGameStat {
  id              Int       @id @default(autoincrement())
  gameId          Int
  game            Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  playerSeasonId  Int
  playerSeason    PlayerSeason @relation(fields: [playerSeasonId], references: [id])
  isHome          Boolean
  played          Boolean   @default(true)
  fg2Made         Int       @default(0)
  fg2Miss         Int       @default(0)
  fg3Made         Int       @default(0)
  fg3Miss         Int       @default(0)
  ftMade          Int       @default(0)
  ftMiss          Int       @default(0)
  pts             Int       @default(0)   // = fg2Made*2 + fg3Made*3 + ftMade
  oreb            Int       @default(0)
  dreb            Int       @default(0)
  treb            Int       @default(0)   // = oreb + dreb
  ast             Int       @default(0)
  blk             Int       @default(0)
  stl             Int       @default(0)
  tov             Int       @default(0)
  pf              Int       @default(0)

  @@unique([gameId, playerSeasonId])
}
```

### 出席紀錄

```prisma
model Attendance {
  id              Int       @id @default(autoincrement())
  weekId          Int
  week            Week      @relation(fields: [weekId], references: [id])
  playerSeasonId  Int
  playerSeason    PlayerSeason @relation(fields: [playerSeasonId], references: [id])
  status          AttStatus @default(UNKNOWN)

  @@unique([weekId, playerSeasonId])
}

enum AttStatus {
  PRESENT   // 出席
  ABSENT    // 請假
  AWOL      // 曠賽
  UNKNOWN   // 尚未舉行
}
```

### 輪值

```prisma
model DutyRecord {
  id              Int       @id @default(autoincrement())
  gameId          Int
  game            Game      @relation(fields: [gameId], references: [id])
  playerSeasonId  Int
  playerSeason    PlayerSeason @relation(fields: [playerSeasonId], references: [id])
  dutyType        DutyType

  @@unique([gameId, playerSeasonId, dutyType])
}

enum DutyType {
  REFEREE
  COURT
  PHOTO
  EQUIPMENT
  DATA
}
```

### 積分龍虎榜

```prisma
model DragonScore {
  id              Int       @id @default(autoincrement())
  seasonId        Int
  season          Season    @relation(fields: [seasonId], references: [id])
  playerSeasonId  Int
  playerSeason    PlayerSeason @relation(fields: [playerSeasonId], references: [id])
  attPoints       Int       @default(0)
  dutyPoints      Int       @default(0)
  mopPoints       Int       @default(0)
  playoffPoints   Int?
  totalPoints     Int       @default(0)

  @@unique([seasonId, playerSeasonId])
}
```

### 戰績

```prisma
model Standing {
  id              Int       @id @default(autoincrement())
  seasonId        Int
  season          Season    @relation(fields: [seasonId], references: [id])
  teamSeasonId    Int
  wins            Int       @default(0)
  losses          Int       @default(0)
  pct             Float     @default(0)
  streak          Int       @default(0)
  rank            Int?

  @@unique([seasonId, teamSeasonId])
}
```

### 公告

```prisma
model Announcement {
  id          Int       @id @default(autoincrement())
  title       String
  content     String
  authorId    Int
  isPinned    Boolean   @default(false)
  publishedAt DateTime  @default(now())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## 權限矩陣

| 功能 | SUPER_ADMIN | ADMIN | TEAM_CAPTAIN | PLAYER | VIEWER |
|------|:-----------:|:-----:|:------------:|:------:|:------:|
| 管理使用者帳號 | O | — | — | — | — |
| 管理賽季/隊伍 | O | — | — | — | — |
| 建立/編輯賽程 | O | O | — | — | — |
| 輸入比賽數據 | O | O | — | — | — |
| 輸入出席紀錄 | O | O | 自己隊 | — | — |
| 管理輪值排班 | O | O | — | — | — |
| 管理龍虎榜積分 | O | O | — | — | — |
| 管理球員（增刪改） | O | O | 自己隊 | — | — |
| 發布公告 | O | O | — | — | — |
| 編輯個人資料 | O | O | O | O | — |
| 查看公開資料 | O | O | O | O | O |

---

## API 端點

### 認證

```
POST   /api/auth/login           # { username, password } → { accessToken, refreshToken }
POST   /api/auth/refresh          # { refreshToken } → { accessToken }
POST   /api/auth/logout           # 撤銷 refresh token
GET    /api/auth/me               # 取得目前登入者資訊
```

### 公開 API（給前端靜態站，取代 Google Sheets）

```
GET    /api/public/home           # 首頁摘要
GET    /api/public/schedule       # 賽程（含所有週次）
GET    /api/public/standings      # 戰績榜
GET    /api/public/boxscore       # 對戰數據
GET    /api/public/leaders        # 領先榜
GET    /api/public/roster         # 球員名單 + 出席
GET    /api/public/dragon         # 龍虎榜
GET    /api/public/stats          # 歷史數據統計
GET    /api/public/hof            # 名人堂
GET    /api/public/rotation       # 輪值排班
```

公開 API 的 response 格式必須與目前前端 JSON 結構完全一致，讓前端只需改 fetch URL。

### 管理 API（需認證 + 權限）

```
# 賽季
GET    /api/admin/seasons
POST   /api/admin/seasons
PATCH  /api/admin/seasons/:id

# 隊伍
GET    /api/admin/teams
POST   /api/admin/teams
PATCH  /api/admin/teams/:id

# 球員
GET    /api/admin/players
POST   /api/admin/players
PATCH  /api/admin/players/:id
DELETE /api/admin/players/:id
POST   /api/admin/players/:id/assign-team

# 賽程
GET    /api/admin/weeks
POST   /api/admin/weeks
PATCH  /api/admin/weeks/:id
POST   /api/admin/weeks/:id/games

# 比賽
GET    /api/admin/games/:id
PATCH  /api/admin/games/:id
POST   /api/admin/games/:id/boxscore
PATCH  /api/admin/games/:id/boxscore/:statId

# 出席
POST   /api/admin/attendance/batch
PATCH  /api/admin/attendance/:id

# 輪值
POST   /api/admin/duties/batch
DELETE /api/admin/duties/:id

# 積分
POST   /api/admin/dragon/recalculate
PATCH  /api/admin/dragon/:id

# 公告
GET    /api/admin/announcements
POST   /api/admin/announcements
PATCH  /api/admin/announcements/:id
DELETE /api/admin/announcements/:id

# 使用者管理（SUPER_ADMIN only）
GET    /api/admin/users
POST   /api/admin/users
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id
```

---

## 認證流程

### 登入

```
Client → POST /api/auth/login { username, password }
Server → 驗證密碼（bcrypt.compare）
       → 簽發 accessToken (JWT, 15 min)
       → 簽發 refreshToken (隨機字串, 7 days, 存 DB)
       → 回傳 { accessToken, refreshToken, user }
```

### Token Refresh

```
Client → POST /api/auth/refresh { refreshToken }
Server → 查 DB 確認 token 存在且未過期
       → 刪除舊 refreshToken
       → 簽發新 accessToken + 新 refreshToken
       → 回傳 { accessToken, refreshToken }
```

### 受保護路由

```
Client → GET /api/admin/... { Authorization: Bearer <accessToken> }
Server → @fastify/jwt 驗證 → 解析 role
       → RBAC plugin 檢查 role 是否有權限
       → TEAM_CAPTAIN 額外檢查 teamSeasonId 是否為自己隊伍
```

---

## 衍生數據計算邏輯

### Standing（戰績）— 從 Game 自動算出

```
每次 Game.status 變更為 FINISHED 時觸發：
1. 掃描該 season 所有 FINISHED 的 Game
2. 按 teamSeasonId 匯總 wins / losses
3. pct = wins / (wins + losses)
4. streak = 連續最近相同結果的場次數
5. rank = 依 pct 降序排名
6. 寫入 Standing 表（upsert）
```

### DragonScore（龍虎榜）— 從 Attendance + DutyRecord 算出

```
觸發時機：出席或輪值資料更新時
1. attPoints = 該球員 PRESENT 的週數 × 每週出席積分
2. dutyPoints = DutyRecord 數量 × 每次輪值積分
3. mopPoints = 手動輸入（拖地）
4. totalPoints = att + duty + mop + (playoffPoints || 0)
```

### Leaders（領先榜）— 從 PlayerGameStat 算出

```
PPG = 總得分 / 出賽場次
RPG = 總籃板 / 出賽場次
APG = 總助攻 / 出賽場次
...以此類推
EFF = (PTS + REB + AST + STL + BLK - (FGA-FGM) - (FTA-FTM) - TOV) / GP
```

---

## 資料遷移策略

### 遷移腳本 `scripts/migrate-from-sheets.ts`

```
1. 讀取 Google Sheets API（或現有 data/*.json）
2. 建立 Season (25)
3. 建立 6 個 Team
4. 建立 6 個 TeamSeason
5. 從 roster 資料建立所有 Player + PlayerSeason
6. 從 schedule 資料建立 Week + Game
7. 從 boxscore 資料建立 PlayerGameStat
8. 從 roster 出席資料建立 Attendance
9. 從 rotation 資料建立 DutyRecord
10. 從 dragon 資料建立 DragonScore
11. 從 standings 資料建立 Standing
```

### 前端切換

`api.js` 的 `ApiConfig` 新增 `USE_BACKEND` flag：

```
優先級：Backend API → Google Sheets → Static JSON → Mock Data
```

---

## 環境變數（.env.example）

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=postgresql://taan:password@localhost:5432/taan_basketball

# JWT
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google Sheets（遷移用）
GOOGLE_SHEET_ID=15GWnfG8yWa7DbPkLY8N3HSs7kBFHCa_l2oYx9Ye8H5c
GOOGLE_API_KEY=AIzaSyC5F-TCj4KzsifU3PoNUl5HPvFvRv7TST4

# CORS
CORS_ORIGIN=http://localhost:8765
```

---

## 實作順序

| Phase | 內容 | 預估 |
|-------|------|------|
| **0** | 專案初始化 + DB schema + Docker | 1-2 天 |
| **1** | 認證系統 (JWT + RBAC + seed) | 2-3 天 |
| **2** | 核心 CRUD (Season → Team → Player → Week → Game) | 3-5 天 |
| **3** | 賽務數據 (Boxscore / Attendance / Duty) | 3-5 天 |
| **4** | 衍生計算 (Standing / Leaders / Dragon) | 2-3 天 |
| **5** | 公開 API（對齊前端 JSON 格式） | 2-3 天 |
| **6** | 資料遷移腳本 (Sheets → DB) | 1-2 天 |
