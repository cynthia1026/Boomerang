import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRoomDetails } from '../api/roomApi';
import { generateDates, generateTimes } from '../utils/schedule';
import '../styles/우선순위.css';

const parseToMinutes = (timeStr) => {
  const [datePart, , timePart] = timeStr.split(' ');
  const [month, day] = datePart.split('.').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return (month * 31 * 24 * 60) + (day * 24 * 60) + (hour * 60) + (minute || 0);
};

export default function Priority() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]); 
  const [sortOption, setSortOption] = useState('count'); 
  const [minCount, setMinCount] = useState(1); 
  const [allUsers, setAllUsers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchAndCalculateRanking = async () => {
      try {
        const { room, schedules } = await getRoomDetails(roomId);
        const DATES = generateDates(room.start_date, room.end_date);
        const TIMES = generateTimes(room.start_time, room.end_time);

        const uniqueUsers = [...new Set(schedules.map(s => s.user_name))];
        setAllUsers(uniqueUsers);

        const timeCounts = {};
        
        schedules.forEach((sched) => {
          const slots = typeof sched.time_slots === 'string' ? JSON.parse(sched.time_slots) : sched.time_slots;
          
          slots.forEach(slotKey => {
            const [dIdx, tIdx] = slotKey.split('-').map(Number);
            const startTime = TIMES[tIdx];
            const endTime = TIMES[tIdx + 1] || '24:00'; 
            const startStr = `${DATES[dIdx]} ${startTime}`;
            const endStr = `${DATES[dIdx]} ${endTime}`;
            const key = `${startStr} ~ ${endStr}`;

            if (!timeCounts[key]) {
              timeCounts[key] = {
                time: key,
                startStr,
                endStr,
                count: 0,
                users: [],
                startMins: parseToMinutes(startStr),
                duration: 30
              };
            }
            timeCounts[key].count += 1;
            timeCounts[key].users.push(sched.user_name);
          });
        });

        let processedData = Object.values(timeCounts);

        if (selectedUsers.length > 0) {
          processedData = processedData.filter(item => 
            selectedUsers.every(user => item.users.includes(user))
          );
        }

        if (minCount > 1) {
          processedData = processedData.filter(item => item.count >= minCount);
        }

        processedData.sort((a, b) => {
          if (sortOption === 'count') {
            if (b.count !== a.count) return b.count - a.count;
            return a.startMins - b.startMins;
          } else if (sortOption === 'earliest') {
            return a.startMins - b.startMins;
          } else if (sortOption === 'duration') {
            if (b.duration !== a.duration) return b.duration - a.duration;
            return b.count - a.count;
          }
          return 0;
        });

        setRankingData(processedData);
      } catch (error) {
        console.error("랭킹 데이터 계산 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateRanking();
  }, [roomId, selectedUsers, sortOption, minCount]);

  const toggleUser = (user) => {
    setSelectedUsers(prev => prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]);
  };

  if (loading) return <div>랭킹 계산 중...</div>;

  return (
    <div className="priority-container">
      {/* 상단 로고 및 상단 뒤로가기 버튼 영역 */}
      <div className="priority-top-nav">
        <h1 className="logo-title" style={{ margin: 0 }}>TimeUs</h1>
      </div>
      
      <div className="priority-header" style={{ marginTop: '24px' }}>
        <h2 className="priority-title">가능한 시간 우선순위</h2>
        <p className="priority-sub">가장 많은 인원이 겹치는 시간대입니다.</p>
      </div>

      {/* 필터 아코디언 */}
      <div className="filter-section">
        <button className="filter-toggle-btn" onClick={() => setIsFilterOpen(!isFilterOpen)}>
          <span>검색 · 필터</span><span className={`toggle-icon ${isFilterOpen ? 'open' : ''}`}>▲</span>
        </button>

        {isFilterOpen && (
          <div className="filter-content">
            <div className="filter-group">
              <label className="filter-label">참여자 (해당 인원이 포함된 시간만)</label>
              <div className="filter-btn-row">
                {allUsers.map(user => (
                  <button key={user} className={`filter-chip ${selectedUsers.includes(user) ? 'active' : ''}`} onClick={() => toggleUser(user)}>{user}</button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">정렬</label>
              <div className="sort-radio-group">
                <label className={`sort-radio-label ${sortOption === 'count' ? 'active' : ''}`}><input type="radio" name="sort" value="count" checked={sortOption === 'count'} onChange={(e) => setSortOption(e.target.value)} /><span className="radio-custom"></span>인원 많은 순</label>
                <label className={`sort-radio-label ${sortOption === 'earliest' ? 'active' : ''}`}><input type="radio" name="sort" value="earliest" checked={sortOption === 'earliest'} onChange={(e) => setSortOption(e.target.value)} /><span className="radio-custom"></span>빠른 시간 순</label>
                <label className={`sort-radio-label ${sortOption === 'duration' ? 'active' : ''}`}><input type="radio" name="sort" value="duration" checked={sortOption === 'duration'} onChange={(e) => setSortOption(e.target.value)} /><span className="radio-custom"></span>오래 만날 수 있는 순</label>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">최소 인원</label>
              <div className="filter-btn-row">
                <button className={`filter-chip ${minCount === 1 ? 'active-dark' : ''}`} onClick={() => setMinCount(1)}>전체</button>
                <button className={`filter-chip ${minCount === 2 ? 'active-dark' : ''}`} onClick={() => setMinCount(2)}>2명+</button>
                <button className={`filter-chip ${minCount === 3 ? 'active-dark' : ''}`} onClick={() => setMinCount(3)}>3명+</button>
                <button className={`filter-chip ${minCount === 4 ? 'active-dark' : ''}`} onClick={() => setMinCount(4)}>4명+</button>
              </div>
            </div>
          </div>
        )}
      </div>

     {/* 랭킹 목록 */}
      <div className="ranking-list">
        {/* 전체 rankingData 중 펼침 여부에 따라 3개 또는 최대 10개만 슬라이스해서 렌더링 */}
        {rankingData.slice(0, isExpanded ? 10 : 3).map((item, index) => (
          <div key={index} className={`ranking-card ${index === 0 ? 'top-rank' : ''}`}>
            <div className="rank-badge">{index + 1}위</div>
            <div className="rank-info">
              <div className="rank-time">{item.time} ({item.duration}분)</div>
              <div className="rank-count"><span className="count-number">{item.count}명</span> 참여 가능</div>
              <div className="rank-users">{item.users.join(', ')}</div>
            </div>
          </div>
        ))}
        {rankingData.length === 0 && <div className="no-data">조건에 맞는 등록된 일정이 없습니다.</div>}

        {/* 결과가 3개를 초과할 때만 더보기 버튼 표시 */}
        {rankingData.length > 3 && (
          <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? '접기 ▲' : `10위까지 보기 (${rankingData.length > 10 ? 10 : rankingData.length}개) ▼`}
          </button>
        )}
      </div>
      {/* 하단 뒤로가기 버튼 */}
      <button className="back-btn" onClick={() => navigate(-1)}>결과 화면으로 돌아가기</button>
    </div>
  );
}
