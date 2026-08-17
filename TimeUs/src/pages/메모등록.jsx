import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Table from '../layouts/Table';
import { getRoomDetails, saveUserNotes } from '../api/roomApi';
import { generateDates, generateTimes } from '../utils/schedule';
import '../styles/메모등록.css';

export default function AddNote() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  const [DATES, setDates] = useState([]);
  const [TIMES, setTimes] = useState([]);
  
  const [note, setNote] = useState('');
  const [savedNotes, setSavedNotes] = useState([]); 

  const [fixedSlots, setFixedSlots] = useState(new Set());
  const [noteSlots, setNoteSlots] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const { room } = await getRoomDetails(roomId);
        setDates(generateDates(room.start_date, room.end_date));
        setTimes(generateTimes(room.start_time, room.end_time));
        
        const sessionSlots = JSON.parse(sessionStorage.getItem('fixedSlots') || '[]');
        setFixedSlots(new Set(sessionSlots));

        const prevNotes = JSON.parse(sessionStorage.getItem('existingNotes') || '[]');
        if (prevNotes.length > 0) {
          setSavedNotes(prevNotes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomData();
  }, [roomId]);

  const isDragging = useRef(false);
  const dragAction = useRef(true);

  const toggleNoteSlot = (key, forcedAction = null) => {
    // ★ 선택 안 된(불가능한) 시간은 클릭/드래그 무시
    if (!fixedSlots.has(key)) return false; 

    const newNoteSlots = new Set(noteSlots);
    const shouldAdd = forcedAction !== null ? forcedAction : !newNoteSlots.has(key);
    if (shouldAdd) newNoteSlots.add(key); else newNoteSlots.delete(key);
    setNoteSlots(newNoteSlots);
    return shouldAdd;
  };

  const handleSlotMouseDown = (key) => { 
    if (!fixedSlots.has(key)) return; // 불가능한 시간이면 작동안함
    isDragging.current = true; 
    dragAction.current = !noteSlots.has(key); 
    toggleNoteSlot(key, dragAction.current); 
  };
  const handleSlotMouseEnter = (key) => { 
    if (!isDragging.current) return; 
    toggleNoteSlot(key, dragAction.current); 
  };
  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const td = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)?.closest('td');
    if (td?.dataset?.slotKey) toggleNoteSlot(td.dataset.slotKey, dragAction.current);
  };

  const handleSaveNoteLocally = () => {
    if (!note.trim()) return alert('메모 내용을 입력해주세요.');
    if (noteSlots.size === 0) return alert('메모를 남길 시간을 표에서 드래그해주세요.');

    const slotArray = Array.from(noteSlots).sort();
    const timeLabels = slotArray.map(key => {
      const [dIdx, tIdx] = key.split('-');
      return `${DATES[dIdx]} ${TIMES[tIdx]}`;
    });

    setSavedNotes(prev => [...prev, { id: Date.now(), text: note, timeLabels }]);
    setNote('');
    setNoteSlots(new Set()); 
  };

  const handleComplete = async () => {
    const userName = sessionStorage.getItem('userName') || '익명';
    
    try {
      setLoading(true);
      const dbNotes = savedNotes.map(n => ({
        room_id: roomId,
        user_name: userName,
        content: n.text,
        time_labels: JSON.stringify(n.timeLabels)
      }));

      await saveUserNotes(roomId, userName, dbNotes);
    } catch (err) {
      console.error("메모 저장 실패:", err);
    } finally {
      setLoading(false);
      navigate(`/room/${roomId}/result`);
    }
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="note-page-wrapper" onMouseUp={() => (isDragging.current = false)} onTouchEnd={() => (isDragging.current = false)} onTouchMove={handleTouchMove}>
      <div className="note-container">
        <h1 className="logo-title">TimeUs</h1>
        <div className="note-header">
          <h2 className="note-title">비고</h2>
          <button className="skip-btn" onClick={handleComplete}>건너뛰기</button>
        </div>

        <Table dates={DATES} times={TIMES} renderSlot={(dIdx, tIdx, key) => {
            const isFixed = fixedSlots.has(key);
            const isNote = noteSlots.has(key);
            let bgColor = '#ffffff'; // 선택 안된 시간
            if (isNote) bgColor = '#777777'; 
            else if (isFixed) bgColor = '#b5b5b5'; 
            
            return (
              <td 
                key={dIdx} 
                data-slot-key={key} 
                className="base-table-slot" 
                // 선택 불가능한 칸은 마우스 커서를 다르게 표시
                style={{ backgroundColor: bgColor, cursor: isFixed ? 'pointer' : 'not-allowed' }} 
                onMouseDown={() => handleSlotMouseDown(key)} 
                onMouseEnter={() => handleSlotMouseEnter(key)} 
                onTouchStart={() => handleSlotMouseDown(key)} 
              />
            )
        }} />

        <div className="input-box-wrapper">
          <div className="input-row">
            <input type="text" className="note-input" placeholder="드래그 후 메모 입력" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="button" className="save-note-btn" onClick={handleSaveNoteLocally}>저장</button>
          </div>
          {savedNotes.length > 0 && (
            <div className="saved-notes-list">
              {savedNotes.map(n => (
                <div key={n.id} className="saved-note-item">
                  {/* ★ '외 n개' 대신 모든 시간대를 쉼표로 연결해서 표시 */}
                  <div className="note-time-badge" style={{ wordBreak: 'keep-all', lineHeight: '1.4' }}>
                    {n.timeLabels.join(', ')}
                  </div>
                  <div className="note-text-content">{n.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="next-btn" onClick={handleComplete} disabled={loading}>다음</button>
      </div>
    </div>
  );
}
