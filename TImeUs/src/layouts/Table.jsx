// src/layouts/Table.jsx
import React from 'react';
import './Table.css'; // css는 기존 제공해드린 스크롤 테이블 CSS를 그대로 사용하세요!

export default function Table({ dates, times, renderSlot }) {
  return (
    <div className="table-scroll-container">
      <table className="schedule-table">
        <thead>
          <tr>
            <th className="time-header-cell sticky-col"></th>
            {dates.map((date, idx) => (
              <th key={idx} className="date-header-cell">{date}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time, timeIdx) => (
            <tr key={timeIdx}>
              <td className="time-label-cell sticky-col">{time}</td>
              {dates.map((_, dateIdx) => {
                const key = `${dateIdx}-${timeIdx}`;
                return renderSlot(dateIdx, timeIdx, key);
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}