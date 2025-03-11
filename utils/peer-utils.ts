import { Peer } from 'peerjs';

/**
 * 새로운 Peer 인스턴스를 생성하고 반환합니다.
 * 이 함수는 브라우저 환경에서만 호출되어야 합니다.
 */
export const createPeer = () => {
  // 브라우저 환경인지 확인
  if (typeof window === 'undefined') {
    throw new Error('PeerJS는 브라우저 환경에서만 사용할 수 있습니다.');
  }
  
  return new Peer();
};

/**
 * URL 파라미터에서 게임 ID와 Peer ID를 추출합니다.
 */
export const extractGameParams = () => {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get('game');
  const peerId = params.get('peerId');
  
  return { gameId, peerId };
};

/**
 * 공유 가능한 게임 링크를 생성합니다.
 */
export const createGameLink = (gameId: string, peerId: string) => {
  if (typeof window === 'undefined') return '';
  
  return `${window.location.origin}?game=${gameId}&peerId=${peerId}`;
};

/**
 * base64로 암호화된 값을 디코딩합니다.
 */
export const decodeBase64 = (base64String: string) => {
  try {
    return atob(base64String);
  } catch (e) {
    console.error('디코딩 오류:', e);
    return '';
  }
};

/**
 * 문자열을 base64로 인코딩합니다.
 */
export const encodeBase64 = (str: string) => {
  try {
    return btoa(str);
  } catch (e) {
    console.error('인코딩 오류:', e);
    return '';
  }
}; 