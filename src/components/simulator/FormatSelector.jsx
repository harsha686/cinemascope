import React from 'react';
import { ASPECT_RATIOS } from '../../data/formats';

export default function FormatSelector({ selectedRatio, onSelect, availableRatios }) {
  const ratios = availableRatios
    ? ASPECT_RATIOS.filter(r => availableRatios.includes(r.ratio))
    : ASPECT_RATIOS;

  return (
    <div className="format-selector">
      {ratios.map(r => (
        <button
          key={r.ratio}
          className={`format-btn ${selectedRatio === r.ratio ? 'active' : ''}`}
          onClick={() => onSelect(r)}
          title={r.fullName}
        >
          {r.ratio} · {r.name}
        </button>
      ))}
    </div>
  );
}
