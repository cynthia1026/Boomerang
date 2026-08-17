import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/접속화면.css';

export default function Splash() {
  const navigate = useNavigate();
  
  // 모달(팝업) 열림/닫힘 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 입력한 초대 링크(URL 또는 룸 ID) 상태
  const [inviteUrl, setInviteUrl] = useState('');

  // 팝업 안에서 [확인] 버튼을 눌렀을 때 처리
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!inviteUrl.trim()) {
      alert('초대 링크나 방 주소를 입력해주세요.');
      return;
    }

    try {
      let roomId = inviteUrl.trim();

      // 전체 URL 형식으로 입력한 경우 (예: https://.../room/uuid/result 또는 /room/uuid/login 등)
      if (roomId.includes('/room/')) {
        const parts = roomId.split('/room/');
        if (parts[1]) {
          // 뒤에 붙은 경로(/result, /login 등)를 잘라내고 순수 roomId만 추출
          roomId = parts[1].split('/')[0];
        }
      }

      // 모달 닫기 및 해당 방의 로그인 페이지로 이동
      setIsModalOpen(false);
      setInviteUrl('');
      navigate(`/room/${roomId}/result`);
    } catch (err) {
      console.error(err);
      alert('올바른 링크 형식이 아닙니다.');
    }
  };

  return (
    <div className="div">
      <div className="frame-2">
        <div className="frame-1">
          <div className="time-us">TimeUs</div>
          <div className="div2">우리 모두가 가능한 시간을 찾아보세요.</div>
        </div>
        <div className="rectangle-1"></div>

        {/* 버튼 영역 (방 생성하기 + 약속 참여하기) */}
        <div className="splash-btn-group">
          <button className="div3" onClick={() => navigate('/room')}>
            방 생성하기
          </button>
          
          {/* 약속 참여하기 버튼 */}
          <button className="div3 sub-btn" onClick={() => setIsModalOpen(true)}>
            약속 참여하기
          </button>
        </div>
      </div>

      {/* 링크 입력 팝업(모달) */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">약속 참여하기</h3>
            <p className="modal-desc">공유받은 초대 링크나 방 주소를 입력해 주세요.</p>
            
            <form onSubmit={handleJoinSubmit}>
              <div className="url-copy-box">
                <input
                  type="text"
                  className="url-input"
                  placeholder="https://... 또는 방 주소"
                  value={inviteUrl}
                  onChange={(e) => setInviteUrl(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="modal-btn-row">
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="copy-btn"
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
