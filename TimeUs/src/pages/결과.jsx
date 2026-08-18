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

  const getCellBgColor
