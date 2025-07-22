import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/Diary.css';
import './css/BackGround.css';

function Diary() {
  const [diaryText, setDiaryText] = useState('');
  const [analysisId, setAnalysisId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const id = location.state?.analysisId || localStorage.getItem("analysis_id");
    if (id) {
      setAnalysisId(id);
    } else {
      alert("분석 ID를 찾을 수 없습니다.");
    }
  }, []);

  const analyzeDiary = async () => {
    if (diaryText.trim() === '') {
      alert('일기 내용을 입력해주세요.');
      return;
    }

    navigate('/diary-result', {
      state: {
        analysisId: analysisId,
        loading: true,
      },
    });

    try {

      await axios.post('http://localhost:8000/analyzeDiary', {
        content: diaryText,
        analysis_id: analysisId,
      });

      await axios.post('http://localhost:5000/store-analysis-id', {
        analysis_id: analysisId,
      });

      console.log('📝 일기 분석 완료');
    } catch (error) {
      console.error('❌ 일기 분석 오류:', error.response?.data || error.message);
    }
  };

  return (
    <div className="diary-container">
      <textarea
        className="diary-textarea"
        placeholder="장소, 사물, 감정의 키워드를 넣어 3~5줄의 일기를 작성해주세요."
        value={diaryText}
        onChange={(e) => setDiaryText(e.target.value)}
      />
      <button className="diary-button" onClick={analyzeDiary}>
        작성 완료
      </button>
      <div className="page-buttons">
          <button className="circle-button left" onClick={() => navigate("/diary-guide")}>
              <span className="triangle left"></span>
          </button>
      </div>
    </div>
  );
}

export default Diary;
