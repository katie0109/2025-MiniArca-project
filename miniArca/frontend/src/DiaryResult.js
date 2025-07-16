import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './css/DiaryResult.css';

function DiaryResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysisData = location.state?.analysisData || {};
  const analysisId = location.state?.analysisId;

  const [isCharacterReady, setIsCharacterReady] = useState(false);

  const wordsSet = new Set();
  const words = [];

  // 주요 감정
  const mainEmotion = analysisData?.emotion_analysis?.주요_감정 || analysisData?.emotion_analysis?.["주요 감정"];
  const mainEmotionStrength = analysisData?.emotion_analysis?.["감정 강도"];
  if (mainEmotion && !wordsSet.has(mainEmotion)) {
    words.push({ text: mainEmotion, value: mainEmotionStrength || 80 });
    wordsSet.add(mainEmotion);
  }

  // 세부 감정
  const detailEmotions = analysisData?.emotion_analysis?.세부_감정 || analysisData?.emotion_analysis?.["세부 감정"];
  if (Array.isArray(detailEmotions)) {
    const sortedDetail = [...detailEmotions].sort((a, b) => b.강도 - a.강도);
    sortedDetail.slice(0, 3).forEach(item => {
      if (!wordsSet.has(item.감정)) {
        words.push({ text: item.감정, value: item.강도 });
        wordsSet.add(item.감정);
      }
    });
  }

  // 장소
  const place = analysisData?.place_extraction?.장소;
  if (place && !wordsSet.has(place)) {
    words.push({ text: place, value: 50 });
    wordsSet.add(place);
  }

  // 사물 키워드
  const objectKeywords = analysisData?.object_keywords?.["사물 키워드"];
  if (Array.isArray(objectKeywords)) {
    for (const keyword of objectKeywords) {
      if (!wordsSet.has(keyword)) {
        words.push({ text: keyword, value: 40 });
        wordsSet.add(keyword);
      }
      if (words.length >= 10) break;
    }
  } 

  const positionPresets = [
    { top: '8%', left: '15%' },
    { top: '20%', left: '70%' },
    { top: '65%', left: '30%' },
    { top: '75%', left: '75%' },
    { top: '15%', left: '45%' },
    { top: '40%', left: '80%' },
    { top: '58%', left: '10%' },
    { top: '10%', left: '55%' },
    { top: '70%', left: '60%' },
    { top: '25%', left: '30%' },
  ];

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const shuffledWords = shuffle(words).slice(0, positionPresets.length);
  const colorPalette = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#A0CED9', '#FFD3B6'];

  // Unity 이미지 생성 polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/unityimg/Recording_${analysisId}.mp4`, { method: 'HEAD' });
        if (res.ok) {
          clearInterval(interval);
          setIsCharacterReady(true);
        }
      } catch (err) {
        // 무시
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [analysisId]);

  return (
    <div className="wordcloud-wrapper">
      {/* 3D 글래스 오브들 */}
      <div className="glass-orb orb-1"></div>
      <div className="glass-orb orb-2"></div>
      <div className="glass-orb orb-3"></div>
      <div className="glass-orb orb-4"></div>

      {shuffledWords.map((word, index) => {
        const pos = positionPresets[index];
        const fontSize = `${Math.floor(Math.random() * 20) + 30}px`;
        const delay = Math.random() * 3;
        const color = colorPalette[index % colorPalette.length];

        return (
          <div
            key={index}
            className="floating-word"
            style={{
              ...pos,
              fontSize,
              animationDelay: `${delay}s`,
              color,
              textShadow: `0 0 8px ${color}, 0 0 20px white`
            }}
          >
            {word.text}
          </div>
        );
      })}

      {/* 캐릭터 생성 메시지 */}
      <div className="svg-spinner-wrapper">
        <svg className="svg-loader" viewBox="0 0 50 50">
          <circle className={`path ${isCharacterReady ? 'complete' : ''}`} cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="svg-spinner-text">
            {isCharacterReady ? '캐릭터 생성 완료' : '캐릭터 생성 중'}
          </text>
        </svg>
      </div>

      <div className="page-buttons">
        <button className="circle-button left" onClick={() => navigate(-1)}>
          <span className="triangle left"></span>
        </button>

        <button
          className="circle-button right"
          onClick={() => {
            if (isCharacterReady) {
              navigate('/all-result', {
                state: {
                  analysisId,
                  analysisData,
                }
              });
            }
          }}
        >
          <span className="triangle right"></span>
        </button>
      </div>
    </div>
  );
}

export default DiaryResult;
