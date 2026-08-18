import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Table from '../layouts/Table';
import { getRoomDetails } from '../api/roomApi';
import { generateDates, generateTimes } from '../utils/schedule';
import '../styles/결과.css';

// 30분 단위 문자열("HH:mm")을 30분 뒤 시간으로 변환
const add30Minutes = (timeStr) => {
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
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// 날짜별/구간별 텍스트 병합 유틸
const formatGroupedTimeRanges = (timeLabels) => {
  if (!timeLabels || timeLabels.length === 0) return [];

  const dateMap = {};
  timeLabels.forEach((label) => {
    const parts = label.trim().split(' ');
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
