import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserData } from '../api/roomApi';
import '../styles/로그인.css';

export default function Login() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return alert('이름을 입력해주세요.');
    if (pin.length !== 4) return alert('비밀번호 숫자 4자리를 입력해주세요.');

    try {
      setLoading(true);
      const cleanName = name.trim();

      // 기존 등록 여부 확인
      const { schedule, notes } = await getUserData(roomId, cleanName);

      if (schedule) {
        // 이미 등록된 참여자인 경우: 비밀번호 검증
        if (schedule.pin !== pin) {
          alert('이미 등록된 이름입니다. 비밀번호가 일치하지 않습니다.');
          return;
        }
        alert('기존 등록 정보를 불러옵니다. 일정을 수정하실 수 있습니다.');

        // 기존 일정 및 메모 복원용 세션 저장
        const slots = typeof schedule.time_slots === 'string'
          ? JSON.parse(schedule.time_slots)
          : schedule.time_slots;
        sessionStorage.setItem('existingSlots', JSON.stringify(slots));

        const userNotes = notes ? notes.map(n => ({
          id: n.id || Date.now() + Math.random(),
          text: n.content,
          timeLabels: typeof n.time_labels === 'string' ? JSON.parse(n.time_labels) : n.time_labels
        })) : [];
        sessionStorage.setItem('existingNotes', JSON.stringify(userNotes));
      } else {
        // 신규 참여자인 경우 세션 정리
        sessionStorage.removeItem('existingSlots');
        sessionStorage.removeItem('existingNotes');
      }

      sessionStorage.setItem('userName', cleanName);
      sessionStorage.setItem('userPin', pin);

      navigate(`/room/${roomId}/schedule`);
    } catch (err) {
      console.error('로그인 오류:', err);
      alert('참여 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <h1 className="logo-title">TimeUs</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-label">로그인</h2>

          <div className="input-group">
            <input
              type="text"
              className="login-input"
              placeholder="이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="password"
              maxLength={4}
              className="login-input"
              placeholder="비밀번호 숫자 4자리"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? '확인 중...' : '참여하기'}
          </button>
        </form>
      </div>
    </div>
  );
}