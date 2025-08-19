import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import DiaryAnalysisPage from './DiaryAnalysisPage';
import './css/AllResult.css';
import FloatingEmojis from './FloatingEmojis';


const AllResult = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const location = useLocation();
  const { analysisId } = location.state || {};

  const [emojis, setEmojis] = useState([]);
  const [summary, setSummary] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emojiPositions, setEmojiPositions] = useState([]);

  // EmailSend 관련 상태들
  const [emailAnalysisId, setEmailAnalysisId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const diaryRef = useRef(null);

  useEffect(() => {
    const fetchDiaryData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/getDiaryData', {
          params: { analysis_id: analysisId },
        });
        setAnalysisData(response.data);
        setEmojis(response.data.emojis);
        setSummary(response.data.summary);
        setTimestamp(response.data.timestamp);
        setShowAnalysis(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDiaryData();
  }, [analysisId]);

  // analysisId 설정 useEffect
  useEffect(() => {
    try {
      // analysisId가 props로 전달되었는지 확인
      if (analysisId) {
        setEmailAnalysisId(analysisId);
        // localStorage에도 저장
        localStorage.setItem("analysis_id", analysisId);
      } else {
        // localStorage에서 먼저 확인
        const storedAnalysisId = localStorage.getItem("analysis_id");
        
        if (storedAnalysisId) {
          setEmailAnalysisId(storedAnalysisId);
        } else {
          // localStorage에 없으면 URL 파라미터에서 확인
          const urlParams = new URLSearchParams(window.location.search);
          const urlAnalysisId = urlParams.get('analysis_id');
          
          if (urlAnalysisId) {
            setEmailAnalysisId(urlAnalysisId);
            // localStorage에도 저장
            localStorage.setItem("analysis_id", urlAnalysisId);
          } else {
            console.error('Analysis ID를 찾을 수 없습니다.');
            setErrorMessage('분석 ID를 찾을 수 없습니다. 다시 분석을 진행해주세요.');
          }
        }
      }
    } catch (error) {
      console.error('Analysis ID 가져오기 오류:', error);
      setErrorMessage('분석 ID를 가져오는 중 오류가 발생했습니다.');
    }
  }, [analysisId]);

  // 이메일 유효성 검사
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 모달 열기
  const openModal = () => {
    if (!emailAnalysisId) {
      setErrorMessage('분석 ID가 없습니다. 페이지를 새로고침하거나 다시 분석을 진행해주세요.');
      return;
    }
    setIsModalOpen(true);
    setEmail('');
    setSuccessMessage('');
    setErrorMessage('');
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setEmail('');
    setEmailLoading(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  //  이메일 전송 처리
  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('이메일 주소를 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    if (!emailAnalysisId) {
      setErrorMessage('분석 ID가 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    setEmailLoading(true);
    setErrorMessage('');

    // FormData 방식 사용
    const formData = new FormData();
    formData.append("analysis_id", emailAnalysisId);
    formData.append("email", email);

    try {
      const response = await fetch("http://localhost:8000/sendEmail", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || '이메일이 성공적으로 전송되었습니다!');
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        setErrorMessage(data.detail || '이메일 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error("이메일 전송 실패:", error);
      setErrorMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setEmailLoading(false);
    }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  function formatDateParts(timestamp) {
    const utcDate = new Date(timestamp);

    // 1. 날짜는 UTC 기준 그대로
    const year = utcDate.getUTCFullYear();
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getUTCDate()).padStart(2, '0');

    // 2. 요일은 KST 기준 (UTC + 9시간)
    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    const weekday = ['토', '일', '월', '화', '수', '목', '금'][kstDate.getDay()];

    return { year, month, day, weekday };
  }


  useEffect(() => {
    if (diaryRef.current && emojis.length > 0) {
      const container = diaryRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const emojiSize = 40;
      const margin = 10;

      const positions = emojis.map(() => {
        const left = margin + Math.random() * (width - emojiSize - margin * 2);
        const top = margin + Math.random() * (height - emojiSize - margin * 2);
        return { left, top };
      });

      setEmojiPositions(positions);
    }
  }, [emojis]);

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">에러 발생: {error}</div>;

  // ⭐️ [수정] 고정된 셀 개수 정의
  const totalCells = 60;
  // ⭐️ [수정] summary를 60자로 채웁니다. 남는 공간은 공백(' ')으로 채웁니다.
  const paddedSummary = summary.padEnd(totalCells, ' ');

  return (
    <div className="diary-container">
      {/* 전역 에러 메시지 표시 */}
      {errorMessage && !isModalOpen && (
        <div className="global-error-message">
          {errorMessage}
        </div>
      )}

      <div className="diary-book" ref={diaryRef}>
        <FloatingEmojis emojis={emojis} /> {/* 👈 이 부분 추가 */}
        <img src="/diary_background.png" alt="다이어리 배경" className="diary-background-img" />

        {/* 왼쪽 페이지 */}
        <div className="diary-left-page">
          <div className="frame-wrapper">
            <img src="/diary_frame.png" alt="다이어리 프레임" className="diary-frame" />

            <div className="diary-content">
              {timestamp && (() => {
                const { year, month, day, weekday } = formatDateParts(timestamp);
                return (
                  <div className="date-overlay">
                    <span className="date-cell">{year}</span>
                    <span className="date-cell">{month}</span>
                    <span className="date-cell">{day}</span>
                    <span className="date-cell">{weekday}</span>
                  </div>
                );
              })()}

              <video
                src={`http://localhost:8000/unityimg/Recording_${analysisId}.mp4`}
                className="unity-video"
                autoPlay
                loop
                muted
                playsInline
              />

              {/* ⭐️ [수정] 그리드 렌더링 로직 변경 */}
              <div className="grid-layer">
                {paddedSummary.split('').map((char, index) => (
                  <div key={index} className="grid-cell">
                    {char}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 페이지 */}
        {showAnalysis && analysisData ? (
          <div className="diary-right-page">
            <DiaryAnalysisPage analysisData={analysisData} />
          </div>
        ) : (
          <div className="loading-placeholder">
            로딩 중입니다...<br />
            <small>잠시만 기다려주세요</small>
          </div>
        )}
      </div>

      {/* 오른쪽 하단 이메일 전송 버튼 */}
      <button
        onClick={openModal}
        disabled={!emailAnalysisId}
        className={`email-send-button ${!emailAnalysisId ? 'disabled' : ''}`}
      >
        이메일로 전송하기
      </button>

      {/* 모달 오버레이 */}
      {isModalOpen && (
        <div 
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          {/* 모달 창 */}
          <div className="modal-content">
            <div className="modal-inner">
              <h3 className="modal-title">
                📧 분석 결과 이메일 전송 📧
              </h3>
              <p className="modal-description">
                분석 결과를 이메일로 받으시겠습니까?
              </p>

              {/* 성공 메시지 */}
              {successMessage && (
                <div className="success-message">
                  {successMessage}
                </div>
              )}

              {/* 에러 메시지 */}
              {errorMessage && (
                <div className="error-message">
                  ❌ {errorMessage}
                </div>
              )}

              {/* 로딩 중이 아니고 성공 메시지가 없을 때만 입력 폼 표시 */}
              {!emailLoading && !successMessage && (
                <div className="form-container">
                  <input
                    type="email"
                    placeholder="이메일 주소를 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendEmail(e)}
                    className="email-input"
                    required
                    autoFocus
                  />
                  
                  <div className="button-group">
                    <button
                      onClick={handleSendEmail}
                      className="send-button"
                    >
                      전송
                    </button>
                    <button
                      onClick={closeModal}
                      className="cancel-button"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {/* 로딩 스피너 */}
              {emailLoading && (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p className="loading-text">이메일을 전송 중입니다...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllResult;