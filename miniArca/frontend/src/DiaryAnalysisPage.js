import React, { useState, useEffect } from 'react';
import './css/DiaryAnalysisPage.css';

const DiaryAnalysisPage = ({ analysisData }) => {
  const [animationStarted, setAnimationStarted] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setAnimationStarted(true), 500);
      return () => clearTimeout(timer);
    }, []);

  if (!analysisData) {
    return <div>분석 데이터를 불러오는 중입니다...</div>;
  }


  // 감정 매핑
  const emotionMapping = {
    "기쁨": { color: '#FFD700', emoji: '😊' },
    "흥분": { color: '#FF7F50', emoji: '🤩' },
    "만족": { color: '#FF69B4', emoji: '😍' },
    "평온": { color: '#7ED7C1', emoji: '😌' },
    "분노": { color: '#FF6B6B', emoji: '😠' },
    "공포": { color: '#F0E68C', emoji: '🤢' },
    "슬픔": { color: '#87CEEB', emoji: '😢' },
    "지루함": { color: '#B19CD9', emoji: '😟' }
  };

  // 애니메이션 이름 → 한글 감정명 매핑
  const animationToKorean = {
    "Joyful Jump": "기쁨",
    "Cheering": "흥분",
    "Clapping": "만족",
    "Warrior Idle": "평온",
    "Defeated": "분노",
    "Terrified": "공포",
    "Crying": "슬픔",
    "Yawn": "지루함"
  };
  const defaultEmotion = { name: '평온', percentage: 0, color: '#7ED7C1', emoji: '😌', category: '' };

  // 대표 감정(최종) 결과
  const parseFinalEmotions = () => {
    if (!analysisData?.final_emotions || analysisData.final_emotions.length === 0) {
      return [];
    }
    return analysisData.final_emotions.map(finalEmotion => {
      const [category, score, animationName] = finalEmotion;
      const koreanName = animationToKorean[animationName] || '알 수 없음';
      const emotionInfo = emotionMapping[koreanName] || defaultEmotion;
      const percentage = Math.round(score * 100);
      return { ...emotionInfo, name: koreanName, percentage, category };
    });
  };

  // 세부 감정(분석 감정)
  const parseDetailEmotions = () => {
    if (!analysisData?.emotion_analysis?.['세부 감정']) return [];
    return analysisData.emotion_analysis['세부 감정'].map(emotion => ({
      name: emotion['감정'],
      percentage: emotion['강도']
    }));
  };

  const finalEmotions = parseFinalEmotions();
  const detailEmotions = parseDetailEmotions();

  // 키워드 추출
  const extractKeywords = () => {
    if (!analysisData?.object_keywords?.['사물 키워드']) return ['#일기', '#감정', '#하루'];
    return analysisData.object_keywords['사물 키워드'].map(kw => `#${kw}`);
  };

  // 추천 활동 생성
  const getRecommendations = () => {
    if (!analysisData?.activity_recommend?.['활동 추천']) return [];
    const icons = ['🌿', '🎵', '🎨', '🎉', '📸', '🫖', '🧘‍♀️', '🏃‍♀️', '✍️', '📚'];
    return analysisData.activity_recommend['활동 추천'].map((rec, index) => ({
      icon: icons[index % icons.length],
      title: rec['활동'],
      desc: rec['추천 이유']
    }));
  };

  // 추천 음악 생성
  const getRecommendedMusic = () => {
    if (!analysisData?.song_recommend?.['노래 추천'] || analysisData.song_recommend['노래 추천'].length === 0) {
      return [];
    }
    return analysisData.song_recommend['노래 추천'];
  };

  const keywords = extractKeywords();
  const recommendations = getRecommendations();
  const recommendedMusic = getRecommendedMusic();

  return (
    <div className="analysis-page">
      {/* <div className="notebook-lines"></div> */}

      {/* 헤더 */}
      <div className="page-header">
        <span className="weather-icon">🌤️</span>
        <span className="page-title">감정 분석 리포트</span>
      </div>

      {/* 일기 요약 */}
      <div className="summary-section sticky-note" style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: '20px', background: '#FFF8E9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <span style={{ fontWeight: 'bold', color: '#FF69B4', marginRight: '8px' }}>오늘의 한 줄 요약</span>
        {analysisData.summary}
      </div>

      {/* 대표 감정 결과 */}
      <div className="main-emotion-section" style={{ flexDirection: 'column', gap: '6px' }}>
        <div className="section-title"><span className="section-emoji">😃</span>대표 감정 결과</div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {finalEmotions.map((emotion, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              padding: '10px 18px',
              minWidth: '120px',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '28px', marginRight: '10px' }}>{emotion.emoji}</span>
              <div>
                <div style={{ fontWeight: 'bold', color: emotion.color }}>{emotion.name}</div>
                <div style={{ fontSize: '18px', color: '#888' }}>{emotion.category}</div>
                <div style={{ fontSize: '18px', color: '#333' }}>{emotion.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 세부 감정 리스트 */}
      <div className="sub-emotions" style={{ margin: '18px 0' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {detailEmotions.map((emotion, idx) => (
            <div key={idx} style={{
              background: '#F7F7FA',
              borderRadius: '8px',
              padding: '8px 14px',
              minWidth: '90px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontWeight: 'bold', color: '#555' }}>{emotion.name}</div>
              <div style={{ fontSize: '13px', color: '#888' }}>{emotion.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 키워드 */}
      <div className="keywords-section">
        <div className="section-title"><span className="section-emoji">🏷️</span>오늘의 키워드</div>
        <div className="keywords-container">
          {keywords.map((keyword, index) => (
            <span key={index} className={`keyword-tag ${animationStarted ? 'animate' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>{keyword}</span>
          ))}
        </div>
      </div>

      {/* 추천 음악 */}
      <div className="music-section">
        <div className="section-title"><span className="section-emoji">🎶</span>오늘의 추천 플레이리스트</div>
        <div className="music-notes-container" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginTop: '10px'
        }}>
          {recommendedMusic.length > 0 ? (
            recommendedMusic.map((song, index) => (
              <div
                key={index}
                className="music-card"
                style={{
                  background: '#E6F3FF',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  padding: '7px 9px',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '56px',
                  margin: 0
                }}
              >
                <span className="music-emoji" style={{ fontSize: '22px', marginRight: '12px' }}>🎵</span>
                <div className="music-details" style={{ flex: 1 }}>
                  <div className="music-title">{song['노래']}</div>
                 {/* <div className="music-reason">{song['추천 이유']}</div> */}
                </div>
              </div>
            ))
          ) : (
            <div className="music-card" style={{
              background: '#E6F3FF',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              padding: '7px 9px',
              display: 'flex',
              alignItems: 'center',
              minHeight: '56px',
              margin: 0
            }}>
              <span className="music-emoji" style={{ fontSize: '22px', marginRight: '12px' }}>🎵</span>
              <span className="music-text">추천 음악이 없습니다.</span>
            </div>
          )}
        </div>
      </div>

      {/* 추천 활동 */}
      <div className="recommendations-section">
        <div className="section-title"><span className="section-emoji">💝</span>마음을 위한 추천</div>
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`recommendation-card ${animationStarted ? 'animate' : ''}`}
            style={{ animationDelay: `${0.5 + index * 0.2}s` }}
          >
            <span className="rec-icon">{rec.icon}</span>
            <div className="rec-content">
              <div className="rec-title">{rec.title}</div>
              <div className="rec-desc">{rec.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiaryAnalysisPage;