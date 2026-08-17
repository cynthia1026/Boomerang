// utils/ranking.js

/**
 * @param {Array} schedules - DB에서 가져온 schedules 배열
 * @returns {Array} 가장 많은 사람이 가능한 시간대 순으로 정렬된 랭킹 리스트
 */
export function calculateBestTimes(schedules) {
  const timeCounts = {};

  // 모든 참여자의 가능 시간 슬롯을 순회하며 시간대별 득표수 계산
  schedules.forEach((schedule) => {
    const { user_name, time_slots } = schedule;

    time_slots.forEach((slot) => {
      // slot 구조: { start: "2026-08-15 14:00", end: "2026-08-15 18:00" }
      const key = `${slot.start} ~ ${slot.end}`;

      if (!timeCounts[key]) {
        timeCounts[key] = {
          time: key,
          count: 0,
          users: [],
        };
      }

      timeCounts[key].count += 1;
      timeCounts[key].users.push(user_name);
    });
  });

  // 득표수가 높은 순서대로 정렬
  const sortedRanking = Object.values(timeCounts).sort(
    (a, b) => b.count - a.count
  );

  return sortedRanking; // TOP 1, 2, 3 추출용
}