// 숨고르기 완료 화면에서 캐릭터가 말풍선으로 건네는 응원 한마디.
// 이 앱은 "일하다 과열됐을 때 잠깐 숨 돌리는" 용도 → 짧은 휴식·머리 식히기·재충전을
// 다독이는 귀여운 말투로.

export const HOO_ENCOURAGEMENTS: readonly string[] = [
  '잠깐 멈춘 거, 진짜 잘했어용 🫶',
  '일하느라 애썼어요, 토닥토닥',
  '뜨거워진 머리 잠깐 식히기 🧊',
  '딱 1분만 쉬어가도 돼용',
  '바쁜 와중에 쉬는 나, 칭찬해 🐥',
  '급한 마음 잠깐 내려놓기',
  '잠깐 쉰다고 일 안 도망가요!',
  '열심히 달렸으니 멈춰도 돼용',
  '어깨 힘 빼고, 후— 토닥',
  '다시 집중할 힘 충전 중 🔋',
  '이 짧은 쉼이 큰 차이를 만들어요',
  '한숨 돌렸으면 그걸로 충분해용',
  '머리 식었으면 또 가볍게 가요!',
  '오늘도 열일 중인 나, 멋져요 ✨',
  '잠깐의 쉼표, 아주 잘 골랐어요',
  '천천히 숨 한번, 이제 좀 살겠죵 😮‍💨',
];

function clamp01(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(0.999999, Math.max(0, value));
}

// random([0,1))으로 메시지를 고른다. previous를 주면 같은 말이 연속으로 나오지 않게 한 칸 비켜준다.
export function pickHooEncouragement(random: number, previous?: string | null): string {
  const total = HOO_ENCOURAGEMENTS.length;
  let index = Math.floor(clamp01(random) * total);

  if (previous && HOO_ENCOURAGEMENTS[index] === previous && total > 1) {
    index = (index + 1) % total;
  }

  return HOO_ENCOURAGEMENTS[index];
}

// 앱에서 매번 새 응원을 뽑을 때 쓰는 편의 함수.
export function pickRandomHooEncouragement(previous?: string | null): string {
  return pickHooEncouragement(Math.random(), previous);
}
