import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/접속화면.css';

export default function Splash() {
  const navigate = useNavigate(); // 1. useNavigate 훅을 변수에 할당

  return (
    <div className="div">
      <div className="frame-2">
        <div className="frame-1">
          <div className="time-us">TimeUs</div>
          <div className="div2">우리 모두가 가능한 시간을 찾아보세요.</div>
        </div>
        <div className="rectangle-1"></div>
        {/* 2. 'on' 오타 제거 및 navigate('/room') 소문자로 호출 */}
        <button className="div3" onClick={() => navigate('/room')}>
          방 생성하기
        </button>
      </div>
    </div>
  );
}