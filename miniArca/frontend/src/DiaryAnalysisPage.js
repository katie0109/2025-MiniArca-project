import React, { useState, useEffect } from 'react';
import './css/DiaryAnalysisPage.css';
import './css/BackGround.css';

const DiaryAnalysisPage = ({ analysisData }) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  if (!analysisData) {
    return <div>분석 데이터가 없습니다.</div>;
  }

  const data = analysisData;

  // 감정 카테고리 및 매핑 정의
  const categories = {
    "긍정적/고활성": ["기쁨", "흥분"],
    "긍정적/저활성": ["만족", "평온"],
    "부정적/고활성": ["분노", "공포"],
    "부정적/저활성": ["슬픔", "지루함"]
  };

  const emotion_to_english = {
    "기쁨": "Joyful Jump",
    "흥분": "Cheering",
    "만족": "Clapping",
    "평온": "Warrior Idle",
    "분노": "Defeated",
    "공포": "Terrified",
    "슬픔": "Crying",
    "지루함": "Yawn"
  };

  // final_emotions에서 주요 감정 추출
  const getMainEmotionFromFinalEmotions = () => {
    if (!data.final_emotions || data.final_emotions.length === 0) {
      return ""; // 기본값
    }
    
    // 가장 높은 점수의 감정 카테고리 찾기
    const sortedEmotions = [...data.final_emotions].sort((a, b) => b[1] - a[1]);
    const englishAction = sortedEmotions[0][2];
    
    // 영어 액션에서 한국어 감정 찾기
    for (const [korEmotion, engAction] of Object.entries(emotion_to_english)) {
      if (engAction === englishAction) {
        return korEmotion;
      }
    }
    
    // fallback: 카테고리에서 첫 번째 감정 반환
    const mainCategory = sortedEmotions[0][0];
    return categories[mainCategory] ? categories[mainCategory][0] : "";
  };

  const mainEmotion = getMainEmotionFromFinalEmotions();

  // 감정 MBTI 계산 (final_emotions 기반)
  const calculateEmotionMBTI = () => {
    if (!data.final_emotions || data.final_emotions.length === 0) {
      return ''; // 기본값
    }

    //const intensity = data.emotion_analysis?.["감정 강도"] ?? 0;
    const mainCategory = data.final_emotions[0][0];
    
    const EI = (mainCategory.includes('고활성')) ? 'E' : 'I';
    
    const keywords = data.object_keywords?.["사물 키워드"] || [];
    const concreteKeywords = keywords.filter(k => 
      ['강아지', '꽃', '햇빛', '햄버거', '커피', '공원'].includes(k)
    ).length;
    const SN = concreteKeywords >= 3 ? 'S' : 'N';
    
    const TF = 'F';
    
    const JP = mainCategory.includes('저활성') ? 'J' : 'P';
    
    return EI + SN + TF + JP;
  };
  const emotionMBTI = calculateEmotionMBTI();
  
  const mbtiDescriptions = {
    'ESFP': {
      title: '자유로운 영혼의 연예인형',
      description: '지금 이 순간을 즐기며 주변 사람들에게 기쁨을 선사하는 타입입니다. 감정 표현이 솔직하고 자연스러우며, 새로운 경험을 통해 에너지를 얻습니다.'
    },
    'ESFJ': {
      title: '따뜻한 마음의 외교관형',
      description: '타인의 감정에 민감하고 배려심이 깊은 타입입니다. 조화로운 관계를 중시하며, 사랑하는 사람들의 행복을 위해 헌신합니다.'
    },
    'ENFP': {
      title: '열정적인 활동가형',
      description: '창의적이고 영감이 넘치는 타입입니다. 다양한 가능성을 탐구하며, 사람들과의 깊은 소통을 통해 동기부여를 받습니다.'
    },
    'ENFJ': {
      title: '정의로운 사회운동가형',
      description: '타인의 성장을 돕는 것을 기쁨으로 여기는 타입입니다. 강한 공감능력으로 사람들을 이끌고 긍정적인 변화를 만들어냅니다.'
    },
    'ESTP': {
      title: '모험을 즐기는 사업가형',
      description: '현실적이고 행동력이 뛰어난 타입입니다. 즉흥적인 상황에서 빛을 발하며, 새로운 도전을 통해 활력을 얻습니다.'
    },
    'ESTJ': {
      title: '엄격한 관리자형',
      description: '책임감이 강하고 체계적인 타입입니다. 목표 달성을 위해 계획을 세우고 실행하며, 안정성과 질서를 중시합니다.'
    },
    'ENTP': {
      title: '뜨거운 논쟁을 즐기는 변론가형',
      description: '창의적 사고와 논리적 분석을 즐기는 타입입니다. 새로운 아이디어를 탐구하며, 토론을 통해 지적 자극을 받습니다.'
    },
    'ENTJ': {
      title: '대담한 통솔자형',
      description: '강한 리더십과 전략적 사고를 가진 타입입니다. 비전을 세우고 이를 실현하기 위해 체계적으로 접근합니다.'
    },
    'ISFP': {
      title: '호기심 많은 예술가형',
      description: '내면의 가치를 중시하는 조용하고 온화한 타입입니다. 예술적 감성이 풍부하며, 자신만의 페이스로 삶을 살아갑니다.'
    },
    'ISFJ': {
      title: '용감한 수호자형',
      description: '신뢰할 수 있고 헌신적인 타입입니다. 타인을 돌보는 것을 자연스럽게 여기며, 안정적인 환경을 만들어갑니다.'
    },
    'INFP': {
      title: '열정적인 중재자형',
      description: '깊은 내면의 가치관을 가진 이상주의적 타입입니다. 진정성을 추구하며, 자신의 신념에 따라 행동합니다.'
    },
    'INFJ': {
      title: '선의의 옹호자형',
      description: '직관력이 뛰어나고 통찰력이 깊은 타입입니다. 의미 있는 목적을 추구하며, 타인의 성장을 도우려 합니다.'
    },
    'ISTP': {
      title: '만능 재주꾼형',
      description: '실용적이고 논리적인 사고를 가진 타입입니다. 손으로 만들고 고치는 것을 즐기며, 독립적인 성향이 강합니다.'
    },
    'ISTJ': {
      title: '논리주의자형',
      description: '성실하고 책임감이 강한 타입입니다. 전통을 존중하며, 체계적이고 신뢰할 수 있는 방식으로 일을 처리합니다.'
    },
    'INTP': {
      title: '논리적인 사색가형',
      description: '지적 호기심이 왕성하고 분석적인 타입입니다. 복잡한 이론을 탐구하며, 독립적으로 사고하는 것을 선호합니다.'
    },
    'INTJ': {
      title: '용의주도한 전략가형',
      description: '독창적이고 전략적 사고를 가진 타입입니다. 장기적 비전을 세우고, 체계적으로 목표를 달성해 나갑니다.'
    }
  };

  // 맞춤 조언 (MBTI 기반)
  const getMBTIAdvice = (mbtiType) => {
    const advice = {
      'ESFP': ["감정을 솔직하게 표현하세요", "새로운 경험을 시도해보세요", "창의적인 활동으로 에너지를 얻으세요"],
      'ESFJ': ["자신의 감정도 소중히 여기세요", "사랑하는 사람들과 시간을 보내세요", "감사 표현으로 마음을 채우세요"],
      'ENFP': ["다양한 감정을 인정하되 한 가지에 오래 머물지 마세요", "새로운 아이디어를 탐구해보세요", "영감을 주는 사람들과 대화하세요"],
      'ENFJ': ["타인의 감정을 이해하는 만큼 자신의 감정도 살펴보세요", "멘토링 활동으로 의미있는 시간을 보내세요", "긍정적인 변화를 만들어보세요"],
      'ESTP': ["즉흥적인 반응보다는 잠깐 숨을 고르고 대응하세요", "운동이나 모험적인 활동으로 에너지를 발산하세요", "새로운 도전으로 자극을 받으세요"],
      'ESTJ': ["완벽을 추구하되 때로는 유연성도 필요함을 기억하세요", "체계적인 운동이나 목표 달성 활동을 해보세요", "성취감을 주는 일로 리더십을 발휘하세요"],
      'ENTP': ["논리적 사고와 감정적 직감의 균형을 맞춰보세요", "토론이나 창의적 문제해결 활동을 해보세요", "새로운 아이디어나 혁신적인 프로젝트에 참여하세요"],
      'ENTJ': ["목표 달성만큼 감정적 웰빙도 중요함을 인식하세요", "전략 게임이나 리더십 활동으로 성취감을 느껴보세요", "비전을 세우거나 장기 목표를 계획하세요"],
      'ISFP': ["내면의 가치와 일치하는 선택을 하며 자신을 믿으세요", "예술 활동이나 자연과 함께하는 시간을 가져보세요", "혼자만의 시간이나 의미있는 창작 활동을 하세요"],
      'ISFJ': ["남을 돌보는 만큼 자신도 돌보는 것이 중요해요", "안정적인 루틴이나 사랑하는 사람과의 시간을 가져보세요", "전통적인 활동이나 봉사를 통해 만족감을 얻으세요"],
      'INFP': ["깊은 감정을 글이나 예술로 표현해보세요", "자연 속에서 명상하거나 창작 활동을 해보세요", "자신의 가치관과 일치하는 활동을 해보세요"],
      'INFJ': ["직감을 믿되 현실적인 관점도 함께 고려해보세요", "조용한 공간에서 독서나 명상을 해보세요", "깊이 있는 대화나 개인적 성찰 시간을 가져보세요"],
      'ISTP': ["감정을 억누르지 말고 건설적인 방법으로 표현해보세요", "손으로 만들거나 고치는 활동을 해보세요", "혼자만의 시간이나 실용적인 프로젝트로 집중력을 높이세요"],
      'ISTJ': ["안정감을 추구하되 변화에도 열린 마음을 가져보세요", "체계적인 취미나 정리 정돈 활동을 해보세요", "익숙한 환경에서 차분한 활동이나 계획 세우기를 해보세요"],
      'INTP': ["논리적 분석만큼 감정적 측면도 중요함을 인식하세요", "복잡한 퍼즐이나 이론적 탐구를 해보세요", "독립적인 학습이나 깊이 있는 사고 시간을 가져보세요"],
      'INTJ': ["장기적 관점에서 감정을 바라보며 전략적으로 접근하세요", "체계적인 계획 수립이나 미래 비전 세우기를 해보세요", "혼자만의 시간에 깊이 있는 사고나 전문 분야 학습을 하세요"]
    };
    return advice[mbtiType] || [];
  };

  const mbtiAdvice = getMBTIAdvice(emotionMBTI);

  // 8가지 감정별 추천 활동 정의
  const getRecommendationsByEmotion = (emotion) => {
    const recommendationsMap = {
      "기쁨": [
        { icon: "🎉", activity: "친구들과 파티" },
        { icon: "🎵", activity: "신나는 음악 듣기" }
      ],
      "흥분": [
        { icon: "🎢", activity: "놀이공원 가기" },
        { icon: "🏃", activity: "운동하기" }
      ],
      "만족": [
        { icon: "☕", activity: "여유로운 차 한 잔" },
        { icon: "📚", activity: "독서하기" }
      ],
      "평온": [
        { icon: "🌳", activity: "자연 속 산책" },
        { icon: "🛁", activity: "따뜻한 목욕" }
      ],
      "분노": [
        { icon: "🥊", activity: "복싱 또는 운동" },
        { icon: "📝", activity: "일기 쓰기" }
      ],
      "공포": [
        { icon: "🤗", activity: "가족/친구와 시간" },
        { icon: "🏠", activity: "안전한 공간에서 휴식" }
      ],
      "슬픔": [
        { icon: "💝", activity: "자기 돌봄" },
        { icon: "🎭", activity: "감정 표현하기" }
      ],
      "지루함": [
        { icon: "🎨", activity: "새로운 취미 시작" },
        { icon: "📺", activity: "흥미로운 콘텐츠 탐색" }
      ]
    };
    
    return recommendationsMap[emotion] || [];
  };

  // 8가지 감정별 명언 정의
  const getQuoteByEmotion = (emotion) => {
    const quotesMap = {
      "기쁨": "기쁨은 나누면 배가 되고, 혼자 간직하면 반이 된다.",
      "흥분": "열정은 모든 성취의 어머니이다.",
      "만족": "만족하는 마음이 진정한 부의 시작이다.",
      "평온": "평온한 마음이 가장 아름다운 보석이다.",
      "분노": "분노는 다른 사람의 실수로 자신을 벌주는 것이다.",
      "공포": "용기란 두려움이 없는 것이 아니라, 두려움을 느끼면서도 행동하는 것이다.",
      "슬픔": "슬픔의 깊이만큼 기쁨의 높이를 알 수 있다.",
      "지루함": "지루함은 새로운 모험을 시작하라는 신호이다."
    };
    
    return quotesMap[emotion] || [];
  };

  // 8가지 감정별 음악 추천 정의
  const getMusicByEmotion = (emotion) => {
    const musicMap = {
      "기쁨": [
        { title: "Happy", artist: "Pharrell Williams" },
        { title: "Good as Hell", artist: "Lizzo" },
        { title: "Dynamite", artist: "BTS" }
      ],
      "흥분": [
        { title: "Thunder", artist: "Imagine Dragons" },
        { title: "Uptown Funk", artist: "Bruno Mars" },
        { title: "Mic Drop", artist: "BTS" }
      ],
      "만족": [
        { title: "Perfect Day", artist: "Lou Reed" },
        { title: "행복", artist: "Red Velvet" },
        { title: "좋은 날", artist: "아이유" }
      ],
      "평온": [
        { title: "Spring Day", artist: "BTS" },
        { title: "Weightless", artist: "Marconi Union" },
        { title: "꽃길", artist: "BIGBANG" }
      ],
      "분노": [
        { title: "Stronger", artist: "Kelly Clarkson" },
        { title: "Fight Song", artist: "Rachel Platten" },
        { title: "Not Today", artist: "BTS" }
      ],
      "공포": [
        { title: "Brave", artist: "Sara Bareilles" },
        { title: "Stronger Than You", artist: "Kelly Clarkson" },
        { title: "You're Not Alone", artist: "Saosin" }
      ],
      "슬픔": [
        { title: "Someone Like You", artist: "Adele" },
        { title: "Spring Day", artist: "BTS" },
        { title: "사랑이 지나가면", artist: "아이유" }
      ],
      "지루함": [
        { title: "Adventure of a Lifetime", artist: "Coldplay" },
        { title: "DNA", artist: "BTS" },
        { title: "New Rules", artist: "Dua Lipa" }
      ]
    };
    
    return musicMap[emotion] || [];
  };

  const recommendations = getRecommendationsByEmotion(mainEmotion);
  const recommendedMusic = getMusicByEmotion(mainEmotion);
  const todayQuote = getQuoteByEmotion(mainEmotion);

  const EmotionAnalysis = () => {
    const intensity = data.emotion_analysis.감정강도;
    
    // 8가지 정의된 감정 기반 감정 매핑
    const emotionMapping = {
      "기쁨": { valence: 0.9, arousal: 0.8, color: '#ff6b9d' },
      "흥분": { valence: 0.8, arousal: 0.9, color: '#ff4757' },
      "만족": { valence: 0.7, arousal: 0.3, color: '#4ecdc4' },
      "평온": { valence: 0.6, arousal: 0.2, color: '#667eea' },
      "분노": { valence: 0.1, arousal: 0.9, color: '#ff4757' },
      "공포": { valence: 0.2, arousal: 0.8, color: '#8b5cf6' },
      "슬픔": { valence: 0.2, arousal: 0.3, color: '#3742fa' },
      "지루함": { valence: 0.3, arousal: 0.1, color: '#57606f' }
    };
    
    return (
      <div className="emotion-analysis">
        {/* 감정 강도 게이지 */}
        <div className="emotion-gauge">
          <div className="gauge-label">
          </div>
          <div className="gauge-bar">
            <div 
              className="gauge-fill"
              style={{ 
                width: `${intensity}%`,
                background: `linear-gradient(90deg, #667eea 0%, #ff6b9d ${intensity}%)`
              }}
            />
          </div>
        </div>
        
        {/* 감정 차원 분석 */}
        <div className="emotion-dimensions">
          <div className="dimension-chart">
            <div className="chart-axes">
              {/* Y축: Arousal */}
              <div className="y-axis">
                <span className="axis-label axis-label-top">흥분</span>
                <span className="axis-label axis-label-bottom">평온</span>
              </div>
              {/* X축: Valence */}
              <div className="x-axis">
                <span className="axis-label axis-label-left">부정</span>
                <span className="axis-label axis-label-right">긍정</span>
              </div>
            </div>
            
            {/* 감정 포인트들 - final_emotions와 주요 감정 표시 */}
            <div className="emotion-points">
              {/* 주요 감정 (final_emotions에서 가장 높은 점수) */}
              {(() => {
                const mapping = emotionMapping[mainEmotion];
                if (!mapping) return null;
                
                const x = mapping.valence * 80 + 10;
                const y = (1 - mapping.arousal) * 80 + 10;
                
                return (
                  <div
                    className="emotion-point main-emotion"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      backgroundColor: mapping.color,
                      animationDelay: '0s'
                    }}
                    title={mainEmotion}
                  >
                    <span className="emotion-label">{mainEmotion}</span>
                  </div>
                );
              })()}
              
              {/* 보조 감정들 (final_emotions의 나머지) */}
              {data.final_emotions.slice(1).map((emotionData, index) => {
                const [category, score, englishAction] = emotionData;
                
                // 영어 액션에서 한국어 감정 찾기
                let koreanEmotion = null;
                for (const [korEmotion, engAction] of Object.entries(emotion_to_english)) {
                  if (engAction === englishAction) {
                    koreanEmotion = korEmotion;
                    break;
                  }
                }
                
                if (!koreanEmotion) return null;
                
                const mapping = emotionMapping[koreanEmotion];
                if (!mapping) return null;
                
                const x = mapping.valence * 80 + 10;
                const y = (1 - mapping.arousal) * 80 + 10;
                
                return (
                  <div
                    key={`${category}-${index}`}
                    className="emotion-point sub-emotion"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      backgroundColor: mapping.color,
                      animationDelay: `${(index + 1) * 0.2}s`
                    }}
                    title={`${koreanEmotion} (${Math.round(score * 100)}%)`}
                  />
                );
              })}
            </div>
          </div>
        </div>
        
        {/* 세부 감정 분석 - final_emotions 기반 */}
        <div className="sub-emotions">
          {data.final_emotions.map((emotionData, index) => {
            const [category, score, englishAction] = emotionData;
            const percentage = Math.round(score * 100);
            
            // 영어 액션에서 한국어 감정 찾기
            let koreanEmotion = null;
            for (const [korEmotion, engAction] of Object.entries(emotion_to_english)) {
              if (engAction === englishAction) {
                koreanEmotion = korEmotion;
                break;
              }
            }
            
            if (!koreanEmotion) return null;
            
            return (
              <div key={`${category}-${index}`} className="sub-emotion-bar">
                <div className="emotion-info">
                  <span className="emotion-name">{koreanEmotion}</span>
                  <span className="emotion-percentage">{percentage}%</span>
                </div>
                <div className="emotion-progress">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: emotionMapping[koreanEmotion]?.color || '#667eea',
                      animationDelay: `${(index + 1) * 0.3}s`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const KeywordCloud = () => {
    const colors = ['keyword-pink', 'keyword-blue', 'keyword-green', 'keyword-purple', 'keyword-yellow'];
    const keywords = data.object_keywords?.["사물 키워드"] || [];

    return (
      <div className="keyword-cloud">
        {keywords.map((keyword, index) => (
          <span
            key={keyword}
            className={`keyword ${colors[index % colors.length]}`}
          >
            {keyword}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="diary-analysis-page">
      <div className="diary-analysis-container">
        {/* 메인 그리드 - 스크린샷에 맞는 2x4 레이아웃 */}
        <div className="main-grid">
          {/* 감정 분석 */}
          <div className="analysis-card emotion-analysis-card">
            <div className="card-header">
              <span className="card-icon">😊</span>
              <h1 className="card-title">감정 분석</h1>
            </div>
            <div className="emotion-analysis-content">
              <EmotionAnalysis />
            </div>
          </div>

          {/* 감정 MBTI */}
          <div className="analysis-card mbti-card">
            <div className="card-header">
              <span className="card-icon">🧠</span>
              <h2 className="card-title">감정 MBTI</h2>
            </div>
            <div className="mbti-content">
              <div className="mbti-type">{emotionMBTI}</div>
              <div className="mbti-title">{mbtiDescriptions[emotionMBTI].title}</div>
              <p className="mbti-description">{mbtiDescriptions[emotionMBTI].description}</p>
            </div>
          </div>

          {/* 오늘의 키워드 */}
          <div className="analysis-card keywords-card">
            <div className="card-header">
              <span className="card-icon">🏷️</span>
              <h2 className="card-title">오늘의 키워드</h2>
            </div>
            <KeywordCloud />
          </div>

          {/* 맞춤 조언 */}
          <div className="analysis-card advice-card">
            <div className="card-header">
              <span className="card-icon">💡</span>
              <h2 className="card-title">맞춤 조언</h2>
            </div>
            <div className="advice-list">
              {mbtiAdvice.map((advice, index) => (
                <div key={index} className="advice-item">
                  {advice}
                </div>
              ))}
            </div>
          </div>

          {/* 추천 활동 */}
          <div className="analysis-card activity-card">
            <div className="card-header">
              <span className="card-icon">🎯</span>
              <h2 className="card-title">추천 활동</h2>
            </div>
            <div className="recommendations-grid">
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <span className="recommendation-icon">{rec.icon}</span>
                  <div className="recommendation-text">{rec.activity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 음악 추천 */}
          <div className="analysis-card music-card">
            <div className="card-header">
              <span className="card-icon">🎵</span>
              <h2 className="card-title">AI 음악 추천</h2>
            </div>
            <div className="music-grid">
              {recommendedMusic.map((music, index) => (
                <div key={index} className="music-item">
                  <div className="music-title">{music.title}</div>
                  <div className="music-artist">{music.artist}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 오늘의 명언 */}
          <div className="analysis-card quote-card">
            <div className="card-header">
              <span className="card-icon">✨</span>
              <h2 className="card-title">오늘의 명언</h2>
            </div>
            <blockquote className="quote-text">
              "{todayQuote}"
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryAnalysisPage;