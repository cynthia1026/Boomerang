import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Table from '../layouts/Table';
import { getRoomDetails } from '../api/roomApi';
import { generateDates, generateTimes } from '../utils/schedule';
import '../styles/결과.css';

// 30분 뒤 시간 계산
const add30Minutes = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  let nextM = m + 30;
  let nextH = h;
  if (nextM >= 60) {
    nextH += 1;
    nextM = 0;
  }
  return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// 날짜/구간별 텍스트 변환 함수
const formatGroupedTimeRanges = (timeLabels) => {
  if (!timeLabels || !Array.isArray(timeLabels) || timeLabels.length === 0) return [];

  const dateMap = {};
  timeLabels.forEach((label) => {
    const parts = String(label).trim().split(' ');
    if (parts.length >= 3) {
      const dateKey = `${parts[0]} ${parts[1]}`;
      const timeVal = parts[2];
      if (!dateMap[dateKey]) dateMap[dateKey] = [];
      dateMap[dateKey].push(timeVal);
    } else {
      if (!dateMap['기타']) dateMap['기타'] = [];
      dateMap['기타'].push(label);
    }
  });

  const resultLines = [];
  Object.keys(dateMap).forEach((dateKey) => {
    const times = Array.from(new Set(dateMap[dateKey])).sort(
      (a, b) => timeToMinutes(a) - timeToMinutes(b)
    );

    const ranges = [];
    let start = times[0];
    let prev = times[0];

    for (let i = 1; i < times.length; i++) {
      const current = times[i];
      if (timeToMinutes(current) === timeToMinutes(prev) + 30) {
        prev = current;
      } else {
        ranges.push(`${start} ~ ${add30Minutes(prev)}`);
        start = current;
        prev = current;
      }
    }
    if (start) {
      ranges.push(`${start} ~ ${add30Minutes(prev)}`);
    }

    resultLines.push({
      date: dateKey,
      timeString: ranges.join(', ')
    });
  });

  return resultLines;
};

export default function Result() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [DATES, setDates] = useState([]);
  const [TIMES, setTimes] = useState([]);
  
  const [roomInfo, setRoomInfo] = useState({ headcount: 0 });
  const [participants, setParticipants] = useState([]);
  const [scheduleMatrix, setScheduleMatrix] = useState([]); 
  const [roomNotes, setRoomNotes] = useState([]);

  // ★ 선택된(클릭된) 메모 ID 및 해당 시간 라벨 Set
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [highlightedTimeLabels, setHighlightedTimeLabels] = useState(new Set());

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { room, schedules, notes } = await getRoomDetails(roomId);
        
        const datesArr = generateDates(room.start_date, room.end_date);
        const timesArr = generateTimes(room.start_time, room.end_time);
        
        setDates(datesArr);
        setTimes(timesArr);
        setRoomInfo(room || { headcount: 0 });
        setRoomNotes(notes || []);

        const uniqueUsers = [...new Set((schedules || []).map(s => s.user_name))];
        setParticipants(uniqueUsers);

        const matrix = Array(timesArr.length).fill(0).map(() => Array(datesArr.length).fill(0));
        
        (schedules || []).forEach(sched => {
          let slots = [];
          try {
            slots = typeof sched.time_slots === 'string' ? JSON.parse(sched.time_slots) : sched.time_slots;
          } catch (e) {
            slots = [];
          }
          if (Array.isArray(slots)) {
            slots.forEach(slotKey => {
              const [dIdx, tIdx] = slotKey.split('-').map(Number);
              if (matrix[tIdx] !== undefined && matrix[tIdx][dIdx] !== undefined) {
                matrix[tIdx][dIdx] += 1;
              }
            });
          }
        });
        
        setScheduleMatrix(matrix);
      } catch (err) {
        console.error("결과 조회 실패:", err);
      }
    };
    fetchResults();
  }, [roomId]);

  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCellBgColor = (count) => {
    if (!count || count === 0) return '#ffffff';
    const ratio = count / (roomInfo.headcount || 1);
    if (ratio <= 0.3) return '#e0e0e0';
    if (ratio <= 0.6) return '#b5b5b5';
    return '#777777'; 
  };

  // ★ 비고 카드 클릭 토글 핸들러
  const handleNoteClick = (note) => {
    if (selectedNoteId === note.id) {
      // 이미 선택된 걸 다시 누르면 해제
      setSelectedNoteId(null);
      setHighlightedTimeLabels(new Set());
    } else {
      let parsedLabels = [];
      try {
        parsedLabels = typeof note.time_labels === 'string' ? JSON.parse(note.time_labels) : note.time_labels;
      } catch (e) {
        parsedLabels = [];
      }
      setSelectedNoteId(note.id);
      setHighlightedTimeLabels(new Set(parsedLabels));
    }
  };

  return (
    <div className="result-container">
      {/* 상단 헤더 */}
      <div className="result-top-header">
        <h1 className="logo-title">TimeUs</h1>
        <button 
          type="button" 
          className="new-room-btn" 
          onClick={() => navigate('/room')}
        >
          + 새 약속 만들기
        </button>
      </div>
      
      <section className="status-section">
        <div className="section-header">
          <h2 className="section-title">실시간 참여 현황</h2>
          <span className="count-badge">{participants.length}/{roomInfo.headcount}</span>
        </div>
        <div className="user-tag-list">
          {participants.map((name, idx) => (
            <div key={idx} className="user-tag">{name}</div>
          ))}
        </div>
      </section>

      <div className="divider" />

      <section className="schedule-section">
        <div className="section-header">
          <h2 className="section-title">실시간 등록 현황</h2>
          <button className="register-btn" onClick={() => navigate(`/room/${roomId}/login`)}>등록하기</button>
        </div>

        {/* 표 렌더링 */}
        <Table 
          dates={DATES} 
          times={TIMES} 
          renderSlot={(dateIdx, timeIdx) => {
            const rowData = scheduleMatrix[timeIdx] || [];
            const count = rowData[dateIdx] || 0;
            const currentSlotLabel = `${DATES[dateIdx]} ${TIMES[timeIdx]}`;
            const isHighlighted = highlightedTimeLabels.has(currentSlotLabel);

            return (
              <td 
                key={dateIdx} 
                className={`base-table-slot result-slot ${isHighlighted ? 'note-highlighted' : ''}`} 
                style={{ 
                  backgroundColor: isHighlighted ? '#ffeb3b' : getCellBgColor(count),
                }} 
              />
            );
          }} 
        />
      </section>

      {/* 비고 (메모) 섹션 */}
      {roomNotes.length > 0 && (
        <>
          <div className="divider" />
          <section className="notes-section">
            <div className="section-header">
              <h2 className="section-title">비고 (메모)</h2>
              <span style={{ fontSize: '12px', color: '#888' }}>클릭 시 해당 시간 강조</span>
            </div>
            <div className="result-notes-list">
              {roomNotes.map((n) => {
                let parsedLabels = [];
                try {
                  parsedLabels = typeof n.time_labels === 'string' ? JSON.parse(n.time_labels) : n.time_labels;
                } catch (e) {
                  parsedLabels = [];
                }
                const formattedGroups = formatGroupedTimeRanges(parsedLabels);
                const isSelected = selectedNoteId === n.id;

                return (
                  <div 
                    key={n.id} 
                    className={`result-note-item ${isSelected ? 'selected-note' : ''}`}
                    onClick={() => handleNoteClick(n)}
                  >
                    <div className="result-note-header">
                      <span className="note-author">{n.user_name}</span>
                      <div className="note-time-detailed">
                        {formattedGroups.map((grp, gIdx) => (
                          <div key={gIdx}>
                            <strong>{grp.date}</strong> {grp.timeString}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="note-content">{n.content}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <div className="bottom-action-bar">
        <button type="button" className="priority-btn" onClick={() => navigate(`/room/${roomId}/priority`)}>
          우선순위 보기
        </button>
        
        <button type="button" className="share-btn" onClick={() => setShowShareModal(true)} aria-label="공유하기">
          <svg className="share-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
          </svg>
        </button>
      </div>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">약속 초대 링크</h3>
            <p className="modal-desc">링크를 복사하여 친구들에게 공유해보세요.</p>
            
            <div className="url-copy-box">
              <input type="text" readOnly value={currentUrl} className="url-input" />
              <button type="button" onClick={handleCopyLink} className="copy-btn">
                {copied ? '복사됨!' : '복사'}
              </button>
            </div>

            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowShareModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
