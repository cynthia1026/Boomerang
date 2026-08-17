import React from 'react';
import './MobileLayout.css';

export default function MobileLayout({ children }) {
  return (
    <div className="mobile-wrapper">
      <div className="mobile-content">
        {children}
      </div>
    </div>
  );
}