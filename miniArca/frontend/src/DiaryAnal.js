import React, { useState, useEffect } from 'react';
// import { Cloud, Sun, Wind, Heart, Coffee, Camera, MapPin, Sparkles, Music, Lightbulb, BookOpen } from 'lucide-react';
import './css/DiaryAnal.css';

const DiaryAnalysis = () => {
  const [weatherAnimation, setWeatherAnimation] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  // 아이콘 대체 텍스트
  const icons = {
    BookOpen: () => <span className="icon-text">📖</span>,
    Sun: () => <span className="icon-text">☀️</span>,
    Wind: () => <span className="icon-text">💨</span>,
    Cloud: () => <span className="icon-text">☁️</span>,
    Sparkles: () => <span className="icon-text">✨</span>,
    Camera: () => <span className="icon-text">📷</span>,
    Heart: () => <span className="icon-text">💖</span>,
    Music: () => <span className="icon-text">🎵</span>,
    Lightbulb: () => <span className="icon-text">💡</span>
  };

  // 분석 데이터
  const analysisData = {
    emotion_analysis: {
      주요감정: "행복",
      감정강도: 95,
      세부감정: [
        { 감정: "평온", 강도: 80 },
        { 감정: "만족", 강도: 75 },
        { 감정: "즐거움", 강도: 70 }
      ]
    },
    final_emotions: [
      ["긍정적/저활성", 0.77, "만족"],
      ["긍정적/고활성", 0.55, "기쁨"]
    ],
    object_keywords: ["강아지", "꽃", "햇빛", "햄버거", "커피"],
    place_extraction: { 장소: "공원" },
    summary: "따뜻한 봄날, 강아지와 공원 산책하며 꽃구경을 하고 맛있는 햄버거와 커피를 즐겼습니다. 행복한 하루였습니다.",
    timestamp: "2025-06-05T22:17:13.682+00:00"
  };

  const emotionColors = {
    행복: 'emotion-happy',
    평온: 'emotion-calm',
    만족: 'emotion-satisfied',
    즐거움: 'emotion-joyful'
  };

  const weatherEffects = {
    행복: { icon: icons.Sun, effect: '맑음', className: 'weather-sunny' },
    평온: { icon: icons.Wind, effect: '미풍', className: 'weather-windy' },
    만족: { icon: icons.Cloud, effect: '구름', className: 'weather-cloudy' },
    즐거움: { icon: icons.Sparkles, effect: '반짝임', className: 'weather-sparkly' }
  };

  const recommendations = {
    행복: "좋아하는 음악 듣기 추천 🎵",
    평온: "공원 산책 추천 🌳",
    만족: "독서나 차 한 잔 추천 📚",
    즐거움: "친구와 수다 떨기 추천 💬"
  };

  const quotes = {
    행복: "행복은 우리가 가진 것을 사랑할 때 시작된다.",
    평온: "평온한 마음이 가장 아름다운 보석이다.",
    만족: "만족하는 마음이 진정한 부의 시작이다.",
    즐거움: "즐거움은 나누면 배가 되고, 혼자면 반이 된다."
  };

  // 감정 MBTI 계산
  const calculateEmotionMBTI = () => {
    const mainEmotion = analysisData.emotion_analysis.주요감정;
    const intensity = analysisData.emotion_analysis.감정강도;
    const subEmotions = analysisData.emotion_analysis.세부감정;
    
    // E/I: 감정 강도가 높으면 E(외향), 낮으면 I(내향)
    const EI = intensity >= 80 ? 'E' : 'I';
    
    // S/N: 구체적 키워드가 많으면 S(감각), 추상적이면 N(직관)
    const concreteKeywords = analysisData.object_keywords.filter(k => 
      ['강아지', '꽃', '햇빛', '햄버거', '커피'].includes(k)
    ).length;
    const SN = concreteKeywords >= 3 ? 'S' : 'N';
    
    // T/F: 저활/고활 F(감정), 중성이면 T(사고)
    const positiveEmotions = ['흥분', '기쁨', '분노', '공포'];
    const hasPositive = positiveEmotions.includes(mainEmotion);
    const TF = hasPositive ? 'F' : 'T';
    
    // J/P: 만족/평온이면 J(판단), 즐거움/행복이면 P(인식)
    const structuredEmotions = ['만족', '평온'];
    const JP = structuredEmotions.some(e => subEmotions.map(se => se.감정).includes(e)) ? 'J' : 'P';
    
    return EI + SN + TF + JP;
  };

  const emotionMBTI = calculateEmotionMBTI();
  
  const mbtiDescriptions = {
    'ESFP': '자유로운 영혼의 연예인형 - 순간을 즐기며 감정에 솔직한 타입',
    'ESFJ': '따뜻한 마음의 외교관형 - 타인을 배려하며 조화를 추구하는 타입',
    'ENFP': '열정적인 활동가형 - 새로운 가능성에 흥미를 느끼는 타입',
    'ENFJ': '정의로운 사회운동가형 - 타인의 성장을 돕는 것을 좋아하는 타입',
    'ESTP': '모험을 즐기는 사업가형 - 현재에 충실하며 활동적인 타입',
    'ESTJ': '엄격한 관리자형 - 체계적이고 책임감이 강한 타입',
    'ENTP': '뜨거운 논쟁을 즐기는 변론가형 - 창의적이고 도전적인 타입',
    'ENTJ': '대담한 통솔자형 - 목표 지향적이고 리더십이 강한 타입',
    'ISFP': '호기심 많은 예술가형 - 조용하지만 감수성이 풍부한 타입',
    'ISFJ': '용감한 수호자형 - 따뜻하고 헌신적인 타입',
    'INFP': '열정적인 중재자형 - 이상을 추구하며 개성이 강한 타입',
    'INFJ': '선의의 옹호자형 - 통찰력이 있고 원칙을 중시하는 타입',
    'ISTP': '만능 재주꾼형 - 실용적이고 유연한 문제해결사 타입',
    'ISTJ': '논리주의자형 - 신중하고 책임감이 강한 타입',
    'INTP': '논리적인 사색가형 - 객관적이고 분석적인 타입',
    'INTJ': '용의주도한 전략가형 - 독립적이고 미래지향적인 타입'
  };

  // MBTI별 맞춤 조언
  const getMBTIAdvice = (mbtiType) => {
    const advice = {
      'ESFP': {
        감정관리: "감정을 솔직하게 표현하되, 잠시 멈춰서 생각해보는 시간을 가져보세요",
        스트레스해소: "친구들과 함께 신나는 활동을 하거나 새로운 경험을 시도해보세요",
        에너지충전: "사람들과의 만남이나 창의적인 활동으로 에너지를 얻으세요"
      },
      'ESFJ': {
        감정관리: "다른 사람을 돕는 것도 좋지만, 자신의 감정도 소중히 여기세요",
        스트레스해소: "사랑하는 사람들과 시간을 보내거나 봉사활동을 해보세요",
        에너지충전: "따뜻한 인간관계와 감사 표현으로 마음을 채우세요"
      },
      'ENFP': {
        감정관리: "다양한 감정을 인정하되, 한 가지에 너무 오래 머물지 마세요",
        스트레스해소: "새로운 아이디어를 탐구하거나 브레인스토밍을 해보세요",
        에너지충전: "영감을 주는 사람들과 대화하거나 새로운 프로젝트를 시작하세요"
      },
      'ENFJ': {
        감정관리: "타인의 감정을 이해하는 만큼 자신의 감정도 깊이 살펴보세요",
        스트레스해소: "멘토링이나 교육 활동으로 의미있는 시간을 보내세요",
        에너지충전: "다른 사람의 성장을 돕거나 긍정적인 변화를 만들어보세요"
      },
      'ESTP': {
        감정관리: "즉흥적인 반응보다는 잠깐 숨을 고르고 대응해보세요",
        스트레스해소: "운동이나 모험적인 활동으로 에너지를 발산하세요",
        에너지충전: "활동적인 취미나 새로운 도전으로 자극을 받으세요"
      },
      'ESTJ': {
        감정관리: "완벽을 추구하되, 때로는 유연성도 필요함을 기억하세요",
        스트레스해소: "체계적인 운동이나 목표 달성 활동을 해보세요",
        에너지충전: "성취감을 주는 일이나 리더십을 발휘할 수 있는 활동을 하세요"
      },
      'ENTP': {
        감정관리: "논리적 사고와 감정적 직감의 균형을 맞춰보세요",
        스트레스해소: "토론이나 창의적 문제해결 활동을 해보세요",
        에너지충전: "새로운 아이디어나 혁신적인 프로젝트에 참여하세요"
      },
      'ENTJ': {
        감정관리: "목표 달성만큼 감정적 웰빙도 중요함을 인식하세요",
        스트레스해소: "전략 게임이나 리더십 활동으로 성취감을 느껴보세요",
        에너지충전: "비전을 세우거나 장기 목표를 계획하는 시간을 가져보세요"
      },
      'ISFP': {
        감정관리: "내면의 가치와 일치하는 선택을 하며 자신을 믿으세요",
        스트레스해소: "예술 활동이나 자연과 함께하는 시간을 가져보세요",
        에너지충전: "혼자만의 시간이나 의미있는 창작 활동으로 마음을 달래세요"
      },
      'ISFJ': {
        감정관리: "남을 돌보는 만큼 자신도 돌보는 것이 중요해요",
        스트레스해소: "안정적인 루틴이나 사랑하는 사람과의 시간을 가져보세요",
        에너지충전: "전통적인 활동이나 봉사를 통해 만족감을 얻으세요"
      },
      'INFP': {
        감정관리: "깊은 감정을 글이나 예술로 표현해보세요",
        스트레스해소: "자연 속에서 명상하거나 창작 활동을 해보세요",
        에너지충전: "자신의 가치관과 일치하는 활동이나 의미있는 프로젝트를 해보세요"
      },
      'INFJ': {
        감정관리: "직감을 믿되, 현실적인 관점도 함께 고려해보세요",
        스트레스해소: "조용한 공간에서 독서나 명상을 해보세요",
        에너지충전: "깊이 있는 대화나 개인적 성찰 시간을 가져보세요"
      },
      'ISTP': {
        감정관리: "감정을 억누르지 말고 건설적인 방법으로 표현해보세요",
        스트레스해소: "손으로 만들거나 고치는 활동을 해보세요",
        에너지충전: "혼자만의 시간이나 실용적인 프로젝트로 집중력을 높이세요"
      },
      'ISTJ': {
        감정관리: "안정감을 추구하되, 변화에도 열린 마음을 가져보세요",
        스트레스해소: "체계적인 취미나 정리 정돈 활동을 해보세요",
        에너지충전: "익숙한 환경에서 차분한 활동이나 계획 세우기를 해보세요"
      },
      'INTP': {
        감정관리: "논리적 분석만큼 감정적 측면도 중요함을 인식하세요",
        스트레스해소: "복잡한 퍼즐이나 이론적 탐구를 해보세요",
        에너지충전: "독립적인 학습이나 깊이 있는 사고 시간을 가져보세요"
      },
      'INTJ': {
        감정관리: "장기적 관점에서 감정을 바라보며 전략적으로 접근하세요",
        스트레스해소: "체계적인 계획 수립이나 미래 비전 세우기를 해보세요",
        에너지충전: "혼자만의 시간에 깊이 있는 사고나 전문 분야 학습을 하세요"
      }
    };
    
    return advice[mbtiType] || advice['ESFP'];
  };

  const mbtiAdvice = getMBTIAdvice(emotionMBTI);

  // AI 추천 음악
  const getRecommendedMusic = () => {
    const mainEmotion = analysisData.emotion_analysis.주요감정;
    
    const musicRecommendations = {
      행복: [
        { title: "Walking on Sunshine", artist: "Katrina & The Waves", reason: "햇빛과 함께하는 행복한 순간에 어울리는 곡" },
        { title: "좋은 날", artist: "아이유", reason: "공원 산책처럼 여유로운 행복을 표현한 곡" },
        { title: "Coffee", artist: "BTS Suga", reason: "커피와 함께하는 소소한 행복 테마" }
      ],
      평온: [
        { title: "Spring Day", artist: "BTS", reason: "따뜻한 봄날의 평온함을 담은 곡" },
        { title: "꽃길", artist: "빅뱅", reason: "꽃과 함께하는 평화로운 감정에 어울리는 곡" },
        { title: "Weightless", artist: "Marconi Union", reason: "과학적으로 가장 평온한 음악으로 인정받은 곡" }
      ],
      만족: [
        { title: "Perfect Day", artist: "Lou Reed", reason: "완벽한 하루의 만족감을 표현한 곡" },
        { title: "행복", artist: "레드벨벳", reason: "일상의 작은 만족을 노래한 곡" },
        { title: "Good Day", artist: "Surfaces", reason: "햄버거 같은 일상의 즐거움을 담은 곡" }
      ],
      즐거움: [
        { title: "Dancing Queen", artist: "ABBA", reason: "즐거운 에너지가 넘치는 클래식" },
        { title: "DNA", artist: "BTS", reason: "즐거움이 폭발하는 업비트 곡" },
        { title: "Happy", artist: "Pharrell Williams", reason: "강아지와 놀듯 순수한 즐거움의 곡" }
      ]
    };
    
    return musicRecommendations[mainEmotion] || musicRecommendations['행복'];
  };

  const recommendedMusic = getRecommendedMusic();

  useEffect(() => {
    const timer = setTimeout(() => setWeatherAnimation(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const EmotionWheel = () => {
    const mainEmotion = analysisData.emotion_analysis.주요감정;
    const subEmotions = analysisData.emotion_analysis.세부감정;
    
    return (
      <div className="emotion-wheel">
        {/* 중심 감정 */}
        <div className={`emotion-center ${emotionColors[mainEmotion]}`}>
          <div className="emotion-center-content">
            <div className="emotion-center-name">{mainEmotion}</div>
            <div className="emotion-center-intensity">{analysisData.emotion_analysis.감정강도}</div>
          </div>
        </div>
        
        {/* 세부 감정들 */}
        {subEmotions.map((emotion, index) => {
          const angle = (index * 120) - 90;
          const x = Math.cos(angle * Math.PI / 180) * 60;
          const y = Math.sin(angle * Math.PI / 180) * 60;
          
          return (
            <div
              key={emotion.감정}
              className={`emotion-sub ${emotionColors[emotion.감정]}`}
              style={{
                left: `calc(50% + ${x}px - 1.5rem)`,
                top: `calc(50% + ${y}px - 1.5rem)`,
              }}
              onClick={() => setSelectedEmotion(emotion)}
            >
              <div className="emotion-sub-content">
                <div className="emotion-sub-name">{emotion.감정}</div>
                <div className="emotion-sub-intensity">{emotion.강도}</div>
              </div>
            </div>
          );
        })}
        
        {/* 연결선 */}
        {subEmotions.map((_, index) => {
          const angle = (index * 120) - 90;
          const x1 = Math.cos(angle * Math.PI / 180) * 32;
          const y1 = Math.sin(angle * Math.PI / 180) * 32;
          const x2 = Math.cos(angle * Math.PI / 180) * 54;
          const y2 = Math.sin(angle * Math.PI / 180) * 54;
          
          return (
            <svg key={index} className="emotion-connection">
              <line
                x1={`calc(50% + ${x1}px)`}
                y1={`calc(50% + ${y1}px)`}
                x2={`calc(50% + ${x2}px)`}
                y2={`calc(50% + ${y2}px)`}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="1"
              />
            </svg>
          );
        })}
      </div>
    );
  };

  const KeywordCloud = () => {
    const sizes = ['keyword-small', 'keyword-medium', 'keyword-large', 'keyword-small', 'keyword-medium'];
    const colors = ['keyword-pink', 'keyword-blue', 'keyword-green', 'keyword-purple', 'keyword-yellow'];
    
    return (
      <div className="keyword-cloud">
        {analysisData.object_keywords.map((keyword, index) => (
          <span
            key={keyword}
            className={`keyword ${sizes[index]} ${colors[index]}`}
            style={{
              transform: `rotate(${(Math.random() - 0.5) * 15}deg)`
            }}
          >
            {keyword}
          </span>
        ))}
      </div>
    );
  };

  const WeatherEffect = ({ emotion }) => {
    const weather = weatherEffects[emotion];
    const WeatherIcon = weather.icon;
    
    return (
      <div className={`weather-effect ${weather.className}`}>
        <WeatherIcon className={`weather-icon ${weatherAnimation ? 'animate' : ''}`} />
        <span className="weather-text">{weather.effect}</span>
      </div>
    );
  };

  return (
    <div className="diaryAnal-container">
      <div className="diaryAnal-wrapper">
        {/* 다이어리 제목 */}
        <div className="diaryAnal-title">
          <div className="title-header">
            <icons.BookOpen />
            <h1 className="title-text">일기 분석 결과</h1>
          </div>
          <p className="title-date">
            {new Date(analysisData.timestamp).toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>

        {/* 다이어리 북 */}
        <div className="diaryAnal-book-wrapper">
          <div className="diaryAnal-book">
            {/* 다이어리 바인딩 */}
            <div className="diaryAnal-binding">
              <div className="binding-holes">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="binding-hole"></div>
                ))}
              </div>
            </div>
            
            {/* 페이지들 */}
            <div className="diaryAnal-pages">
              {/* 왼쪽 페이지 */}
              <div className="page left-page">
                {/* 페이지 상단 */}
                <div className="page-header">
                  <div className="page-title"></div>
                  <div className="page-number"></div>
                </div>

                {/* 메인 감정 */}
                <div className="main-emotion-section">
                  <h2 className="section-title">오늘의 감정</h2>
                  <div className={`main-emotion-badge ${emotionColors[analysisData.emotion_analysis.주요감정]}`}>
                    <span className="emotion-name">{analysisData.emotion_analysis.주요감정}</span>
                    <span className="emotion-intensity">{analysisData.emotion_analysis.감정강도}%</span>
                  </div>
                  <div className="weather-section">
                    <WeatherEffect emotion={analysisData.emotion_analysis.주요감정} />
                  </div>
                </div>

                {/* 감정 휠 */}
                <div className="emotion-wheel-section">
                  <h3 className="subsection-title">감정 관계도</h3>
                  <EmotionWheel />
                </div>

                {/* 감정 MBTI */}
                <div className="mbti-section">
                  <h3 className="subsection-title">감정 MBTI</h3>
                  <div className="mbti-card">
                    <div className="mbti-content">
                      <div className="mbti-type">{emotionMBTI}</div>
                      <div className="mbti-description">
                        {mbtiDescriptions[emotionMBTI]}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MBTI별 맞춤 조언 */}
                <div className="advice-section">
                  <h3 className="subsection-title">맞춤 조언</h3>
                  <div className="advice-grid">
                    <div className="advice-card emotion-advice">
                      <div className="advice-header">
                        <span className="advice-icon">🧠</span>
                        <span className="advice-title">감정 관리</span>
                      </div>
                      <p className="advice-text">{mbtiAdvice.감정관리}</p>
                    </div>
                    <div className="advice-card stress-advice">
                      <div className="advice-header">
                        <span className="advice-icon">😌</span>
                        <span className="advice-title">스트레스 해소</span>
                      </div>
                      <p className="advice-text">{mbtiAdvice.스트레스해소}</p>
                    </div>
                    <div className="advice-card energy-advice">
                      <div className="advice-header">
                        <span className="advice-icon">⚡</span>
                        <span className="advice-title">에너지 충전</span>
                      </div>
                      <p className="advice-text">{mbtiAdvice.에너지충전}</p>
                    </div>
                  </div>
                </div>

                {/* 감정 패턴 */}
                <div className="pattern-section">
                  <h3 className="subsection-title">감정 패턴</h3>
                  {analysisData.final_emotions.map((emotion, index) => (
                    <div key={index} className="pattern-item">
                      <div className="pattern-info">
                        <span className="pattern-name">{emotion[2]}</span>
                        <span className="pattern-percentage">{Math.round(emotion[1] * 100)}%</span>
                      </div>
                      <div className="pattern-bar">
                        <div 
                          className="pattern-fill"
                          style={{ width: `${emotion[1] * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지 하단 장식 */}
                <div className="page-footer left-footer">
                  <div className="footer-text"></div>
                </div>
              </div>

              {/* 오른쪽 페이지 */}
              <div className="page right-page">
                {/* 페이지 상단 */}
                <div className="page-header">
                  <div className="page-title"></div>
                  <div className="page-number"></div>
                </div>

                {/* 키워드 클라우드 */}
                <div className="keyword-section">
                  <h3 className="subsection-title">오늘의 키워드</h3>
                  <div className="keyword-card">
                    <KeywordCloud />
                  </div>
                </div>

                {/* 감정 스토리 */}
                <div className="story-section">
                  <div className="story-header">
                    <icons.Camera />
                    <h3 className="subsection-title">오늘의 스토리</h3>
                  </div>
                  <div className="story-card">
                    <p className="story-text">따스한 햇살과 함께 {analysisData.place_extraction.장소}을 걸었다.</p>
                    <p className="story-text">강아지와 꽃 향기를 느끼며 평온함을 가득 채웠다.</p>
                    <p className="story-text">커피 한 잔과 햄버거로 하루를 만족으로 마무리했다.</p>
                  </div>
                </div>

                {/* 추천 활동 */}
                <div className="recommendation-section">
                  <h3 className="subsection-title">추천 활동</h3>
                  <div className="recommendation-list">
                    {analysisData.emotion_analysis.세부감정.slice(0, 2).map((emotion) => (
                      <div key={emotion.감정} className="recommendation-item">
                        <div className="recommendation-header">
                          <icons.Heart />
                          <span className="recommendation-emotion">{emotion.감정}</span>
                        </div>
                        <p className="recommendation-text">{recommendations[emotion.감정]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI 추천 음악 */}
                <div className="music-section">
                  <div className="music-header">
                    <icons.Music />
                    <h3 className="subsection-title">AI 추천 음악</h3>
                  </div>
                  <div className="music-list">
                    {recommendedMusic.slice(0, 2).map((music, index) => (
                      <div key={index} className="music-item">
                        <div className="music-title">{music.title}</div>
                        <div className="music-artist">by {music.artist}</div>
                        <div className="music-reason">{music.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 오늘의 명언 */}
                <div className="quote-section">
                  <div className="quote-card">
                    <div className="quote-header">
                      <icons.Lightbulb />
                      <span className="quote-title">오늘의 명언</span>
                    </div>
                    <p className="quote-text">
                      "{quotes[analysisData.emotion_analysis.주요감정]}"
                    </p>
                  </div>
                </div>

                {/* 페이지 하단 장식 */}
                <div className="page-footer right-footer">
                  <div className="footer-text"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 감정 패턴 배지 */}
        <div className="achievement-badge">
          <div className="badge-content">
            🏆 균형잡힌 행복형 패턴 달성!
          </div>
        </div>
      </div>

      {/* 모달 */}
      {selectedEmotion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4 className="modal-title">{selectedEmotion.감정} 상세</h4>
            <p className="modal-text">
              감정 강도: {selectedEmotion.강도}%
            </p>
            <p className="modal-text">
              {recommendations[selectedEmotion.감정]}
            </p>
            <button
              onClick={() => setSelectedEmotion(null)}
              className="modal-close-btn"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaryAnalysis;
/*localstorgy analysis_id 비우기 추가하기기 */