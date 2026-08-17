import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Table from '../layouts/Table';
import { getRoomDetails } from '../api/roomApi';
import { generateDates, generateTimes } from '../utils/schedule';
import '../styles/결과.css';

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

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { room, schedules } = await getRoomDetails(roomId);
        
        const datesArr = generateDates(room.start_date, room.end_date);
        const timesArr = generateTimes(room.start_time, room.end_time);
        
        setDates(datesArr);
        setTimes(timesArr);
        setRoomInfo(room);

        // 중복 제거된 실제 참여자 이름 목록 추출
        const uniqueUsers = [...new Set(schedules.map(s => s.user_name))];
        setParticipants(uniqueUsers);

        // 2차원 배열(히트맵) 생성: [timeIndex][dateIndex] = 투표 수
        const matrix = Array(timesArr.length).fill(0).map(() => Array(datesArr.length).fill(0));
        
        schedules.forEach(sched => {
          const slots = typeof sched.time_slots === 'string' ? JSON.parse(sched.time_slots) : sched.time_slots;
          
          slots.forEach(slotKey => {
            const [dIdx, tIdx] = slotKey.split('-').map(Number);
            if (matrix[tIdx] !== undefined && matrix[tIdx][dIdx] !== undefined) {
              matrix[tIdx][dIdx] += 1;
            }
          });
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

  return (
    <div className="result-container">
      <h1 className="logo-title">TimeUs</h1>
      
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

        <Table 
          dates={DATES} 
          times={TIMES} 
          renderSlot={(dateIdx, timeIdx) => {
            const rowData = scheduleMatrix[timeIdx] || [];
            const count = rowData[dateIdx] || 0;
            return (
              <td 
                key={dateIdx} 
                className="base-table-slot result-slot" 
                style={{ backgroundColor: getCellBgColor(count) }} 
              />
            );
          }} 
        />
      </section>

      <div className="bottom-action-bar">
        <button type="button" className="priority-btn" onClick={() => navigate(`/room/${roomId}/priority`)}>
          우선순위 보기
        </button>
        
        {/* 공유 모달 열기 버튼 */}
        <button type="button" className="share-btn" onClick={() => setShowShareModal(true)} aria-label="공유하기">
          <svg className="share-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
          </svg>
        </button>
      </div>

      {/* 복원된 공유 팝업 모달 */}
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