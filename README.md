# 실시간 P2P 가위바위보 게임

<p align="center">
  <img alt="가위바위보 게임 로고" src="https://cdn-icons-png.flaticon.com/512/6832/6832051.png" width="200">
</p>

<p align="center">
  PeerJS를 활용한 실시간 P2P 가위바위보 게임
</p>

## 📋 목차
- [실시간 P2P 가위바위보 게임](#실시간-p2p-가위바위보-게임)
  - [📋 목차](#-목차)
  - [📝 프로젝트 개요](#-프로젝트-개요)
  - [✨ 주요 기능](#-주요-기능)
  - [🚀 설치 및 실행 방법](#-설치-및-실행-방법)
    - [사전 요구 사항](#사전-요구-사항)
    - [설치 과정](#설치-과정)
  - [🎮 게임 플레이 방법](#-게임-플레이-방법)
    - [게임 호스트하기](#게임-호스트하기)
    - [게임 참가하기](#게임-참가하기)
    - [게임 진행](#게임-진행)
  - [🛠️ 기술 스택](#️-기술-스택)
  - [🧩 주요 구현 사항](#-주요-구현-사항)
    - [P2P 연결 관리](#p2p-연결-관리)
    - [실시간 게임 로직](#실시간-게임-로직)
    - [암호화된 초대 링크](#암호화된-초대-링크)
    - [라이선스](#라이선스)
    - [기여하기](#기여하기)

## 📝 프로젝트 개요

이 프로젝트는 서버 없이 브라우저 간 P2P 통신을 활용한 실시간 가위바위보 게임입니다. 사용자들은 암호화된 링크를 통해 서로 게임에 초대하고 실시간으로 가위바위보 대결을 즐길 수 있습니다.

중앙 서버를 거치지 않고 플레이어 간 직접 통신을 하기 때문에 빠른 응답 속도와 프라이버시가 보장됩니다.

## ✨ 주요 기능

- **P2P 실시간 통신**: 중앙 서버 없이 플레이어 간 직접 연결
- **암호화된 초대 링크**: 안전한 게임 초대 시스템
- **즉각적인 결과 표시**: 양쪽 플레이어에게 동시에 결과 표시
- **직관적인 UI/UX**: 게임 상태와 선택 사항을 시각적으로 표현
- **다크 모드 지원**: 시스템 설정에 따른 다크/라이트 모드 전환
- **반응형 디자인**: 다양한 화면 크기에 최적화

## 🚀 설치 및 실행 방법

### 사전 요구 사항
- Node.js 14.0.0 이상
- npm 또는 yarn

### 설치 과정

1. 저장소 클론하기
```bash
git clone https://github.com/your-username/rock-paper-scissors-p2p.git
cd rock-paper-scissors-p2p
```

2. 의존성 설치하기
```bash
npm install
# 또는
yarn install
```

3. 개발 서버 실행하기
```bash
npm run dev
# 또는
yarn dev
```

4. 브라우저에서 `http://localhost:3000` 접속하기

## 🎮 게임 플레이 방법

### 게임 호스트하기
1. 메인 화면에서 '새 게임 만들기' 버튼을 클릭합니다.
2. 생성된 게임 링크를 복사하여 상대방에게 공유합니다.
3. 상대방이 연결될 때까지 기다립니다.

### 게임 참가하기
1. 호스트가 공유한 링크를 통해 접속합니다.
2. 자동으로 호스트와 연결됩니다.

### 게임 진행
1. 연결이 완료되면 가위(✌️), 바위(✊), 보(✋) 중 하나를 선택합니다.
2. 상대방도 선택을 완료하면 게임 결과가 표시됩니다.
3. '다시 하기' 버튼을 눌러 새 게임을 시작할 수 있습니다.

## 🛠️ 기술 스택

- **[Next.js](https://nextjs.org/)** - React 프레임워크
- **[TypeScript](https://www.typescriptlang.org/)** - 정적 타입 지원
- **[PeerJS](https://peerjs.com/)** - WebRTC 기반 P2P 통신 라이브러리
- **[TailwindCSS](https://tailwindcss.com/)** - 유틸리티 기반 CSS 프레임워크
- **[Shadcn UI](https://ui.shadcn.com/)** - 재사용 가능한 UI 컴포넌트
- **[Nanoid](https://github.com/ai/nanoid)** - 고유 ID 생성 라이브러리

## 🧩 주요 구현 사항

### P2P 연결 관리
```typescript
// PeerJS를 활용한 P2P 연결 초기화
useEffect(() => {
  try {
    const newPeer = createPeer();
    
    newPeer.on("open", (id) => {
      setPeerId(id);
      setPeer(newPeer);
    });

    // ... 연결 및 오류 처리 코드 ...
  } catch (error) {
    setErrorMessage(`PeerJS 초기화 오류: ${error instanceof Error ? error.message : String(error)}`);
  }
}, []);
```

### 실시간 게임 로직
```typescript
// 가위바위보 결과 계산
const calculateGameResult = (player: GameChoice, opponent: GameChoice): GameResult => {
  if (!player || !opponent) {
    return { playerChoice: player, opponentChoice: opponent, winner: null };
  }

  let winner: "player" | "opponent" | "draw" | null = null;

  if (player === opponent) {
    winner = "draw";
  } else if (
    (player === "rock" && opponent === "scissors") ||
    (player === "paper" && opponent === "rock") ||
    (player === "scissors" && opponent === "paper")
  ) {
    winner = "player";
  } else {
    winner = "opponent";
  }

  return { playerChoice: player, opponentChoice: opponent, winner };
};
```

### 암호화된 초대 링크
```typescript
// 게임 링크 생성
const createGame = () => {
  if (peer) {
    const gameId = nanoid(8);
    const encodedPeerId = encodeBase64(peerId);
    const url = `${window.location.origin}?game=${gameId}&peerId=${encodedPeerId}`;
    
    // ... 링크 생성 및 상태 관리 코드 ...
  }
};
```

---

### 라이선스
MIT

### 기여하기
이슈를 제보하거나 PR을 보내주시면 검토 후 반영하겠습니다.
