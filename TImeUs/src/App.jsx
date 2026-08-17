import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/common.css'

// 레이아웃 불러오기
import MobileLayout from './layouts/MobileLayout';

// 페이지 불러오기 (파일명에 맞게 경로를 조정해주세요)
import Splash from './pages/접속화면';
import CreateRoom from './pages/방생성';
import AddSchedule from './pages/시간등록';
import AddNote from './pages/메모등록';
import Result from './pages/결과';
import Login from './pages/로그인';
import Priority from './pages/우선순위';

// API 및 유틸 (추후 Supabase 연동 시 사용)
// import { createRoom, saveSchedule, getRoomData } from './api';
// import { calculateBestTimes } from './utils/ranking'; 

export default function App() {
  return (
    <BrowserRouter>
      {/* 모든 화면이 스마트폰 비율 안에서 렌더링되도록 래퍼 적용 */}
      <MobileLayout>
       <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/room" element={<CreateRoom />} />
          
          {/* roomId를 파라미터로 받는 동적 라우팅 */}
          <Route path="/room/:roomId/login" element={<Login />} />
          <Route path="/room/:roomId/schedule" element={<AddSchedule />} />
          <Route path="/room/:roomId/note" element={<AddNote />} />
          <Route path="/room/:roomId/result" element={<Result />} />
          <Route path="/room/:roomId/priority" element={<Priority />} />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  );
}