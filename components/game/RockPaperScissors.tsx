"use client";

import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { Button } from "../ui/button";
import { Peer, DataConnection } from "peerjs";
import { createPeer, encodeBase64, decodeBase64, extractGameParams } from "@/utils/peer-utils";

type GameChoice = "rock" | "paper" | "scissors" | null;
type GameState = "waiting" | "connecting" | "connected" | "playing" | "result";

interface GameResult {
  playerChoice: GameChoice;
  opponentChoice: GameChoice;
  winner: "player" | "opponent" | "draw" | null;
}

export default function RockPaperScissors() {
  // 상태 관리
  const [peerId, setPeerId] = useState<string>("");
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [opponentId, setOpponentId] = useState<string>("");
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [playerChoice, setPlayerChoice] = useState<GameChoice>(null);
  const [opponentChoice, setOpponentChoice] = useState<GameChoice>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [connectionUrl, setConnectionUrl] = useState<string>("");

  // 게임 초기화
  useEffect(() => {
    try {
      const newPeer = createPeer();
      
      newPeer.on("open", (id) => {
        setPeerId(id);
        setPeer(newPeer);
      });

      newPeer.on("connection", (connection) => {
        setConn(connection);
        setGameState("connected");
        setupConnectionListeners(connection);
      });

      newPeer.on("error", (err) => {
        setErrorMessage(`연결 오류: ${err.message}`);
      });

      return () => {
        if (newPeer) {
          newPeer.destroy();
        }
      };
    } catch (error) {
      setErrorMessage(`PeerJS 초기화 오류: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // 연결 리스너 설정
  const setupConnectionListeners = (connection: DataConnection) => {
    connection.on("open", () => {
      setGameState("connected");
    });

    connection.on("data", (data: any) => {
      handleDataReceived(data);
    });

    connection.on("close", () => {
      setGameState("waiting");
      setConn(null);
      setOpponentChoice(null);
      setPlayerChoice(null);
      setGameResult(null);
    });

    connection.on("error", (err) => {
      setErrorMessage(`연결 오류: ${err}`);
    });
  };

  // 데이터 수신 처리
  const handleDataReceived = (data: any) => {
    if (data.type === "choice") {
      setOpponentChoice(data.choice);
      
      if (playerChoice) {
        const result = calculateGameResult(playerChoice, data.choice);
        setGameResult(result);
        setGameState("result");
        
        // 결과를 상대방에게도 전송
        if (conn) {
          conn.send({
            type: "result",
            result: {
              // 상대방 관점에서는 playerChoice와 opponentChoice가 반대로 적용되어야 함
              playerChoice: data.choice,  // 상대방의 선택이 상대방에게는 playerChoice
              opponentChoice: playerChoice, // 내 선택이 상대방에게는 opponentChoice
              winner: result.winner === "player" ? "opponent" : 
                     result.winner === "opponent" ? "player" : 
                     result.winner // draw는 그대로
            }
          });
        }
      }
    } else if (data.type === "result") {
      // 상대방으로부터 결과를 수신
      setGameResult(data.result);
      setGameState("result");
    } else if (data.type === "reset") {
      resetGame();
    }
  };

  // URL에서 게임 ID와 Peer ID 파싱
  useEffect(() => {
    const params = extractGameParams();
    
    if (params?.gameId && params?.peerId) {
      // URL에서 게임 ID가 확인되면 이 사용자는 게스트 또는 URL을 공유한 호스트입니다.
      if (params.peerId) {
        try {
          const decodedPeerId = decodeBase64(params.peerId);
          setOpponentId(decodedPeerId);
          
          // 자신이 호스트로서 생성한 URL인지 확인
          if (peer && peerId && decodedPeerId === peerId) {
            setIsHost(true);
            setConnectionUrl(window.location.href);
          }
          // 다른 사람의 게임에 참가하는 경우 - 자동으로 연결 시도
          else if (peer && decodedPeerId && decodedPeerId !== peerId) {
            const connection = peer.connect(decodedPeerId);
            setConn(connection);
            setGameState("connecting");
            setupConnectionListeners(connection);
          }
        } catch (error) {
          setErrorMessage("잘못된 링크입니다. 올바른 게임 링크를 사용해주세요.");
        }
      }
    }
  }, [peer, peerId]);

  // 게임 호스트 생성
  const createGame = () => {
    if (peer) {
      const gameId = nanoid(8);
      // Peer ID를 암호화하여 URL에 포함
      const encodedPeerId = encodeBase64(peerId);
      const url = `${window.location.origin}?game=${gameId}&peerId=${encodedPeerId}`;
      setConnectionUrl(url);
      setIsHost(true);
      
      // 히스토리에 새 상태 추가하여 브라우저 히스토리 관리
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('game', gameId);
        newUrl.searchParams.set('peerId', encodedPeerId);
        window.history.pushState({}, '', newUrl.toString());
        
        // URL이 이미 변경되었으므로 추가 이동은 필요 없음
        // 현재 페이지에서 상태만 업데이트
        setGameState("waiting");
      }
    }
  };

  // 게임 참가
  const joinGame = () => {
    if (peer && opponentId) {
      const connection = peer.connect(opponentId);
      setConn(connection);
      setGameState("connecting");
      setupConnectionListeners(connection);
    } else {
      setErrorMessage("상대방 ID를 입력해주세요.");
    }
  };

  // 선택 전송
  const sendChoice = (choice: GameChoice) => {
    if (conn && choice) {
      setPlayerChoice(choice);
      conn.send({ type: "choice", choice });
      
      if (opponentChoice) {
        const result = calculateGameResult(choice, opponentChoice);
        setGameResult(result);
        setGameState("result");
        
        // 결과를 상대방에게도 전송
        conn.send({
          type: "result",
          result: {
            // 상대방 관점에서는 playerChoice와 opponentChoice가 반대로 적용되어야 함
            playerChoice: opponentChoice,  // 상대방의 선택이 상대방에게는 playerChoice
            opponentChoice: choice, // 내 선택이 상대방에게는 opponentChoice
            winner: result.winner === "player" ? "opponent" : 
                   result.winner === "opponent" ? "player" : 
                   result.winner // draw는 그대로
          }
        });
      }
    }
  };

  // 게임 결과 계산 (결과 평가 로직을 별도 함수로 분리)
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

  // 게임 결과 평가 (기존 함수는 단순하게 결과 설정만 담당)
  const evaluateGame = (player: GameChoice, opponent: GameChoice) => {
    const result = calculateGameResult(player, opponent);
    setGameResult(result);
    setGameState("result");
  };

  // 게임 리셋
  const resetGame = () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setGameResult(null);
    setGameState("connected");
    
    if (conn) {
      conn.send({ type: "reset" });
    }
  };

  // 선택 버튼 렌더링
  const renderChoiceButtons = () => (
    <div className="flex gap-4 justify-center mt-8">
      <Button 
        onClick={() => sendChoice("rock")} 
        disabled={gameState !== "connected" && gameState !== "playing"}
        className={`p-4 h-20 w-20 text-2xl ${playerChoice === "rock" ? "ring-4 ring-blue-500" : ""}`}
      >
        ✊
      </Button>
      <Button 
        onClick={() => sendChoice("paper")} 
        disabled={gameState !== "connected" && gameState !== "playing"}
        className={`p-4 h-20 w-20 text-2xl ${playerChoice === "paper" ? "ring-4 ring-blue-500" : ""}`}
      >
        ✋
      </Button>
      <Button 
        onClick={() => sendChoice("scissors")} 
        disabled={gameState !== "connected" && gameState !== "playing"}
        className={`p-4 h-20 w-20 text-2xl ${playerChoice === "scissors" ? "ring-4 ring-blue-500" : ""}`}
      >
        ✌️
      </Button>
    </div>
  );

  // 선택 정보 표시
  const renderChoiceInfo = () => {
    const choiceEmoji = {
      rock: "✊",
      paper: "✋",
      scissors: "✌️",
    };

    return (
      <div className="flex justify-center gap-10 mt-10">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">내 선택</h3>
          <div className={`w-24 h-24 flex items-center justify-center text-4xl border-2 rounded-lg ${playerChoice ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            {playerChoice ? choiceEmoji[playerChoice] : "?"}
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">상대방 선택</h3>
          <div className="w-24 h-24 flex items-center justify-center text-4xl border-2 border-gray-300 rounded-lg">
            {gameState === "result" && opponentChoice ? choiceEmoji[opponentChoice] : "?"}
          </div>
          {opponentChoice && gameState !== "result" && (
            <p className="text-sm text-gray-500 mt-1">선택 완료!</p>
          )}
        </div>
      </div>
    );
  };

  // 게임 결과 렌더링
  const renderGameResult = () => {
    if (!gameResult) return null;

    const resultText = {
      player: "승리했습니다! 🎉",
      opponent: "패배했습니다... 😢",
      draw: "무승부입니다 🤝",
    };

    const choiceEmoji = {
      rock: "✊",
      paper: "✋",
      scissors: "✌️",
    };

    // 항상 자신이 '내 선택'으로 표시되도록 함
    const myChoice = gameResult.playerChoice;
    const otherChoice = gameResult.opponentChoice;

    return (
      <div className="mt-8 p-6 border rounded-lg text-center">
        <h3 className="text-2xl font-bold mb-4">게임 결과</h3>
        <div className="flex justify-center gap-10 mb-6">
          <div className="text-center">
            <p className="mb-2 font-semibold">내 선택</p>
            <div className="w-28 h-28 flex items-center justify-center text-5xl border-2 border-blue-500 bg-blue-50 rounded-lg">
              {myChoice && choiceEmoji[myChoice]}
            </div>
          </div>
          <div className="text-center">
            <p className="mb-2 font-semibold">상대방 선택</p>
            <div className="w-28 h-28 flex items-center justify-center text-5xl border-2 border-red-500 bg-red-50 rounded-lg">
              {otherChoice && choiceEmoji[otherChoice]}
            </div>
          </div>
        </div>
        <p className="text-xl font-semibold mt-4">
          {gameResult.winner ? resultText[gameResult.winner] : ""}
        </p>
        <Button onClick={resetGame} className="mt-6 px-6">다시 하기</Button>
      </div>
    );
  };

  // 연결 URL 공유 UI
  const renderConnectionUrl = () => {
    if (!connectionUrl) return null;

    return (
      <div className="mt-6 p-6 border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-3">게임 링크가 생성되었습니다!</h3>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">아래 링크를 상대방에게 공유하여 게임에 초대하세요:</p>
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 border rounded-md break-all text-sm">
          {connectionUrl}
        </div>
        <Button 
          onClick={() => {
            navigator.clipboard.writeText(connectionUrl);
            // 복사 성공 알림
            setErrorMessage("링크가 클립보드에 복사되었습니다!");
            // 3초 후 메시지 제거
            setTimeout(() => setErrorMessage(""), 3000);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          링크 복사하기
        </Button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          이 페이지의 URL도 이미 게임 링크로 변경되었습니다.
        </p>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-3xl p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold text-center mb-10 text-gray-800 dark:text-gray-100">실시간 가위바위보 게임</h1>
      
      {errorMessage && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          {errorMessage}
        </div>
      )}

      {gameState === "waiting" && (
        <div className="flex flex-col gap-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">게임 생성하기</h2>
            <Button onClick={createGame} className="w-full">새 게임 만들기</Button>
            <p className="text-sm text-gray-500 mt-3">
              상대에게 링크를 공유하고 접속하면 자동으로 시작됩니다.
            </p>
          </div>
          
          {renderConnectionUrl()}
        </div>
      )}

      {(gameState === "connecting" || gameState === "connected") && (
        <div className="text-center">
          <p className="mb-6 text-lg">
            {gameState === "connecting" 
              ? "연결 중..." 
              : "연결되었습니다! 가위바위보 중 하나를 선택하세요."
            }
          </p>
          {renderChoiceButtons()}
          
          {renderChoiceInfo()}
        </div>
      )}

      {gameState === "result" && renderGameResult()}
    </div>
  );
} 