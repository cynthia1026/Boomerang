// 날짜 배열 생성
export const generateDates = (start, end) => {
  if (!start || !end) return ['8.17 월', '8.18 화'];
  const dates = [];
  const curr = new Date(start);
  const endDate = new Date(end);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  
  while (curr <= endDate) {
    dates.push(`${curr.getMonth() + 1}.${curr.getDate()} ${days[curr.getDay()]}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

// 30분 단위 시간 배열 생성
export const generateTimes = (start, end) => {
  // 기본값 (데이터 없을 시)
  if (!start || !end) return ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'];
  
  const times = [];
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  let currHour = startHour;
  let currMin = startMin < 30 ? 0 : 30; // 30분 단위로 보정

  while (currHour < endHour || (currHour === endHour && currMin <= endMin)) {
    const timeString = `${String(currHour).padStart(2, '0')}:${String(currMin).padStart(2, '0')}`;
    times.push(timeString);
    
    currMin += 30;
    if (currMin >= 60) {
      currMin = 0;
      currHour++;
    }
  }
  return times;
};