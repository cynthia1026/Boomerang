import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../api/roomApi';
import '../styles/방생성.css';

// 12시간제 -> 24시간제 "HH:mm" 변환 유틸
const to24Hour = (ampm, hour, minute) => {
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${minute}`;
};

export default function CreateRoom() {
  const navigate = useNavigate();

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const [formData, setFormData] = useState({
    roomName: '',
    headcount: '',
    startDate: '',
    endDate: '',
  });

  // 시작 시간 분할 상태 (기본값: 오전 09:00)
  const [startAmpm, setStartAmpm] = useState('AM');
  const [startHour, setStartHour] = useState('9');
  const [startMin, setStartMin] = useState('00');

  // 종료 시간 분할 상태 (기본값: 오후 06:00)
  const [endAmpm, setEndAmpm] = useState('PM');
  const [endHour, setEndHour] = useState('6');
  const [endMin, setEndMin] = useState('00');

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'startDate' && newData.endDate && value > newData.endDate) {
        newData.endDate = value;
      }
      if (field === 'endDate' && newData.startDate && value < newData.startDate) {
        alert('종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
        return prev;
      }
      return newData;
    });
  };

  const handleOpenPicker = (ref) => {
    if (ref.current) {
      if (ref.current.showPicker) {
        ref.current.showPicker();
      } else {
        ref.current.focus();
      }
    }
  };

  const handleCreateRoom = async () => {
    const startTime24 = to24Hour(startAmpm, startHour, startMin);
    const endTime24 = to24Hour(endAmpm, endHour, endMin);

    if (!formData.roomName.trim()) return alert('방 이름을 입력해주세요.');
    if (!formData.headcount || parseInt(formData.headcount, 10) <= 0) return alert('참여 인원을 1명 이상 입력해주세요.');
    if (!formData.startDate || !formData.endDate) return alert('약속 날짜를 선택해주세요.');
    if (startTime24 >= endTime24) return alert('종료 시간은 시작 시간 이후여야 합니다.');

    try {
      setLoading(true);

      const newRoom = await createRoom({
        room_name: formData.roomName,
        headcount: parseInt(formData.headcount, 10),
        start_date: formData.startDate,
        end_date: formData.endDate,
        start_time: startTime24,
        end_time: endTime24
      });

      navigate(`/room/${newRoom.id}/result`);
    } catch (error) {
      console.error('방 생성 오류:', error);
      alert('방 생성에 실패했습니다. Supabase 연동 설정을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 1시 ~ 12시 옵션 배열
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));

  return (
    <div className="create-room-container">
      <h1 className="logo-title">TimeUs</h1>

      <div className="form-wrapper">
        {/* 방 이름 */}
        <div className="form-item">
          <label className="form-label">방 이름을 정해주세요</label>
          <input
            type="text"
            className="form-input"
            placeholder="예: 프로젝트 회의"
            value={formData.roomName}
            onChange={(e) => handleChange('roomName', e.target.value)}
          />
        </div>

        {/* 참여 인원 */}
        <div className="form-item">
          <label className="form-label">약속 참여 인원을 알려주세요</label>
          <input
            type="number"
            className="form-input"
            placeholder="숫자만 입력"
            value={formData.headcount}
            onChange={(e) => handleChange('headcount', e.target.value)}
          />
        </div>

        {/* 날짜 선택 */}
        <div className="form-item">
          <label className="form-label">날짜를 골라주세요</label>
          <div className="range-box">
            <div className="input-with-icon" onClick={() => handleOpenPicker(startDateRef)}>
              <input
                ref={startDateRef}
                type="date"
                className="form-input date-input"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>
            <span className="tilde">~</span>
            <div className="input-with-icon" onClick={() => handleOpenPicker(endDateRef)}>
              <input
                ref={endDateRef}
                type="date"
                min={formData.startDate}
                className="form-input date-input"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 시간대 선택 (AM/PM + 시 + 분) */}
        <div className="form-item">
          <label className="form-label">시간대를 골라주세요</label>
          
          <div className="time-select-wrapper">
            {/* 시작 시간 묶음 */}
            <div className="time-picker-group">
              <select className="time-select-part" value={startAmpm} onChange={(e) => setStartAmpm(e.target.value)}>
                <option value="AM">오전</option>
                <option value="PM">오후</option>
              </select>
              <select className="time-select-part" value={startHour} onChange={(e) => setStartHour(e.target.value)}>
                {hours.map((h) => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
              <select className="time-select-part" value={startMin} onChange={(e) => setStartMin(e.target.value)}>
                <option value="00">00분</option>
                <option value="30">30분</option>
              </select>
            </div>

            <span className="tilde">~</span>

            {/* 종료 시간 묶음 */}
            <div className="time-picker-group">
              <select className="time-select-part" value={endAmpm} onChange={(e) => setEndAmpm(e.target.value)}>
                <option value="AM">오전</option>
                <option value="PM">오후</option>
              </select>
              <select className="time-select-part" value={endHour} onChange={(e) => setEndHour(e.target.value)}>
                {hours.map((h) => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
              <select className="time-select-part" value={endMin} onChange={(e) => setEndMin(e.target.value)}>
                <option value="00">00분</option>
                <option value="30">30분</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="submit-btn"
        onClick={handleCreateRoom}
        disabled={loading}
      >
        {loading ? '생성 중...' : '방 생성하기'}
      </button>
    </div>
  );
}