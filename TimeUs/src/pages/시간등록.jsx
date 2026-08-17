import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Table from '../layouts/Table';
import { getRoomDetails, saveUserSchedule } from '../api/roomApi';
import { generateDates, generateTimes } from '../utils/schedule';
import '../styles/시간등록.css';

export default function AddSchedule() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  const [mode, setMode] = useState('available');
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  
  const [DATES, setDates] = useState([]);
  const [TIMES, setTimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { room } = await getRoomDetails(roomId);
        setDates(generateDates(room.start_date, room.end_date));
        setTimes(generateTimes(room.start_time, room.end_time));

        // 수정 모드인 경우: 기존에 선택했던 일정 복원
        const prevSlots = JSON.parse(sessionStorage.getItem('existingSlots') || '[]');
        if (prevSlots.length > 0) {
          setSelectedSlots(new Set(prevSlots));
        }
      } catch (error) {
        console.error("방 정보를 불러오지 못했습니다.", error);
        alert("잘못된 접근이거나 삭제된 방입니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  const isDragging = useRef(false);
  const dragAction = useRef(true);

  const handleSlotMouseDown = (key) => {
    isDragging.current = true;
    const newSlots = new Set(selectedSlots);
    if (newSlots.has(key)) { newSlots.delete(key); dragAction.current = false; } 
    else { newSlots.add(key); dragAction.current = true; }
    setSelectedSlots(newSlots);
  };
  const handleSlotMouseEnter = (key) => {
    if (!isDragging.current) return;
    const newSlots = new Set(selectedSlots);
    if (dragAction.current) newSlots.add(key); else newSlots.delete(key);
    setSelectedSlots(newSlots);
  };
  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const td = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('td');
    if (td?.dataset?.slotKey) {
      const key = td.dataset.slotKey;
      const newSlots = new Set(selectedSlots);
      if (dragAction.current) newSlots.add(key); else newSlots.delete(key);
      setSelectedSlots(newSlots);
    }
  };

  const handleNext = async () => {
    const userName = sessionStorage.getItem('userName');
    const userPin = sessionStorage.getItem('userPin');

    if (!userName || !userPin) {
      alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
      return navigate(`/room/${roomId}/login`);
    }

    let finalSlots = [];
    if (mode === 'unavailable') {
      for (let d = 0; d < DATES.length; d++) {
        for (let t = 0; t < TIMES.length; t++) {
          const key = `${d}-${t}`;
          if (!selectedSlots.has(key)) finalSlots.push(key);
        }
      }
    } else {
      finalSlots = Array.from(selectedSlots);
    }

    try {
      setLoading(true);
      await saveUserSchedule({
        roomId,
        userName,
        pin: userPin,
        timeSlots: finalSlots
      });

      sessionStorage.setItem('fixedSlots', JSON.stringify(finalSlots));
      navigate(`/room/${roomId}/note`);
    } catch (error) {
      console.error("일정 저장 실패:", error);
      alert("일정 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="schedule-container" onMouseUp={() => (isDragging.current = false)} onTouchEnd={() => (isDragging.current = false)} onTouchMove={handleTouchMove}>
      <h1 className="logo-title">TimeUs</h1>
      <div className="guide-section">
        <h2 className="guide-title">{sessionStorage.getItem('userName') || '참여자'} 님의 일정을</h2>
        <div className="toggle-row">
          <div className="toggle-switch">
            <button className={`toggle-btn ${mode === 'available' ? 'active' : ''}`} onClick={() => setMode('available')}>되는</button>
            <button className={`toggle-btn ${mode === 'unavailable' ? 'active' : ''}`} onClick={() => setMode('unavailable')}>안 되는</button>
          </div>
          <span className="guide-sub">시간으로 선택해 주세요.</span>
        </div>
      </div>

      <Table dates={DATES} times={TIMES} renderSlot={(dIdx, tIdx, key) => (
          <td key={dIdx} data-slot-key={key} className={`base-table-slot ${selectedSlots.has(key) ? 'selected' : ''}`} onMouseDown={() => handleSlotMouseDown(key)} onMouseEnter={() => handleSlotMouseEnter(key)} onTouchStart={() => handleSlotMouseDown(key)} style={{ backgroundColor: selectedSlots.has(key) ? '#cccccc' : '#ffffff' }} />
      )} />

      <button className="next-btn" onClick={handleNext} disabled={loading}>다음</button>
    </div>
  );
}