"use client";

import dynamic from "next/dynamic";

// PeerJS는 클라이언트 사이드에서만 동작하므로 dynamic import 사용
const RockPaperScissorsGame = dynamic(
  () => import("@/components/game/RockPaperScissors"),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-[80vh]">
      <RockPaperScissorsGame />
    </div>
  );
}
