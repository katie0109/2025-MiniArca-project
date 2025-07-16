import React, { useState, useEffect } from 'react';
import './css/EmailSend.css';

function EmailSend() {
  const [analysisId, setAnalysisId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // localStorage에서 analysisId 가져오기
  useEffect(() => {
    try {
      // localStorage에서 먼저 확인
      const storedAnalysisId = localStorage.getItem("analysis_id");
      
      if (storedAnalysisId) {
        setAnalysisId(storedAnalysisId);
      } else {
        // localStorage에 없으면 URL 파라미터에서 확인
        const urlParams = new URLSearchParams(window.location.search);
        const urlAnalysisId = urlParams.get('analysis_id');
        
        if (urlAnalysisId) {
          setAnalysisId(urlAnalysisId);
          // localStorage에도 저장
          localStorage.setItem("analysis_id", urlAnalysisId);
        } else {
          console.error('Analysis ID를 찾을 수 없습니다.');
          setErrorMessage('분석 ID를 찾을 수 없습니다. 다시 분석을 진행해주세요.');
        }
      }
    } catch (error) {
      console.error('Analysis ID 가져오기 오류:', error);
      setErrorMessage('분석 ID를 가져오는 중 오류가 발생했습니다.');
    }
  }, []);

  // 이메일 유효성 검사
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 모달 열기
  const openModal = () => {
    if (!analysisId) {
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
    setLoading(false);
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

    if (!analysisId) {
      setErrorMessage('분석 ID가 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    // FormData 방식 사용
    const formData = new FormData();
    formData.append("analysis_id", analysisId);
    formData.append("email", email);

    try {
      const response = await fetch("http://localhost:8000/sendEmail", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || '이메일이 성공적으로 전송되었습니다! ✅');
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
      setLoading(false);
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

  return (
    <div className="email-send-container">
      {/* 전역 에러 메시지 표시 */}
      {errorMessage && !isModalOpen && (
        <div className="global-error-message">
          ❌ {errorMessage}
        </div>
      )}

      {/* 오른쪽 하단 이메일 전송 버튼 */}
      <button
        onClick={openModal}
        disabled={!analysisId}
        className={`email-send-button ${!analysisId ? 'disabled' : ''}`}
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
              {!loading && !successMessage && (
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
              {loading && (
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
}

export default EmailSend;