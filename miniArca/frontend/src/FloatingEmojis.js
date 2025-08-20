import React from 'react';
import './css/FloatingEmojis.css';

const positionPresets = [
  { top: '20%', left: '3%' }, { top: '87%', left: '95%' },
  { top: '18%', left: '48%' }, { top: '40%', left: '49%' },
  { top: '78%', left: '49%' }, { top: '50%', left: '2%' },

  { top: '20%', left: '92%' }, { top: '60%', left: '48%' },
  { top: '75%', left: '2%' }, { top: '2%', left: '70%' },
  { top: '43%', left: '90%' }, { top: '65%', left: '95%' },
];

function FloatingEmojis({ emojis }) {
  const repeatedEmojis = Array(2).fill(null).flatMap(() => emojis);

  return repeatedEmojis.map((emoji, index) => {
    const pos = positionPresets[index % positionPresets.length];
    const size = Math.floor(Math.random() * 20) + 50;
    const delay = Math.random() * 3;

    return (
      <img
        key={`${emoji}-${index}`}
        src={`http://localhost:8000/emojis/${emoji}.png`}
        alt={emoji}
        className="floating-emoji"
        style={{
          ...pos,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });
}

export default FloatingEmojis;