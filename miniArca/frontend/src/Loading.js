import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './css/Loading.css';
import logoImg from './img/MiniArca3.png';
import loadingGif from './img/run.gif'; // GIF 파일 import 추가


function DiaryResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysisData = location.state?.analysisData || {};
  const analysisId = location.state?.analysisId;

  const [isCharacterReady, setIsCharacterReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // 로딩 메시지 배열 추가
  const loadingMessages = [
    "당신의 하루를 천천히 읽고 있어요...",
    "감정을 분석하고 있어요...",
    "당신의 아바타가 생성되고 있어요...",
    "oodt가 아주 멋있어요!"
  ];

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


  // 메시지 순환 (4초마다)
  useEffect(() => {
    if (!isCharacterReady) {
      const messageInterval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 4000);

      return () => clearInterval(messageInterval);
    }
  }, [isCharacterReady, loadingMessages.length]);

  // // 진행률에 따른 메시지 변경
  // useEffect(() => {
  //   if (!isCharacterReady) {
  //     if (progress < 30) {
  //       setCurrentMessageIndex(0); 
  //     } else if (progress < 60) {
  //       setCurrentMessageIndex(1); 
  //     } else if (progress < 90) {
  //       setCurrentMessageIndex(2); 
  //     } else {
  //       setCurrentMessageIndex(3);
  //     }
  //   }
  // }, [progress, isCharacterReady]);

  // Unity 이미지 생성 polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/unityimg/Recording_${analysisId}.mp4`, { method: 'HEAD' });
        if (res.ok) {
          clearInterval(interval);
          setIsCharacterReady(true);
          setProgress(100);
        }
      } catch (err) {
        // 무시
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [analysisId]);

  // 진행률 자동 증가 (1분 동안 천천히 증가)
  useEffect(() => {
    if (!isCharacterReady && progress < 90) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const increment = 90 / (60 * 1000 / 100);
          return Math.min(prev + increment, 90);
        });
      }, 100);

      return () => clearInterval(progressInterval);
    }
  }, [progress, isCharacterReady]);

  return (
    <div className="wordcloud-wrapper">
      {/* 3D 글래스 오브들 */}
      <div className="glass-orb orb-1"></div>
      <div className="glass-orb orb-2"></div>
      <div className="glass-orb orb-3"></div>
      <div className="glass-orb orb-4"></div>

      {/* 중앙 로고 이미지 */}
      <div className="logo-container">
        <img 
          src={logoImg}
          alt="MiniArca Logo" 
          className="center-logo"
        />
        
        {/* GIF 이미지 추가 */}
        <div className="loading-gif-container">
          <img 
            src={loadingGif}
            alt="Loading Animation" 
            className="loading-gif"
          />
        </div>
        
        {/* 진행률 게이지바 */}
        <div className="progress-container">
          <div className="progress-label">{loadingMessages[currentMessageIndex]}</div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
              <div className="progress-bar-glow" />
            </div>
            <div className="progress-percentage">{Math.round(progress)}%</div>
          </div>
        </div>
      </div>

      <div className="page-buttons">
        <div style={{ width: '60px' }} />
        {isCharacterReady && (
          <button
            className="circle-button right"
            onClick={() => {
              navigate('/all-result', {
                state: {
                  analysisId,
                  analysisData,
                }
              });
            }}
          >
            <span className="triangle right"></span>
          </button>
        )}
      </div>
    </div>
  );
}

export default DiaryResult;