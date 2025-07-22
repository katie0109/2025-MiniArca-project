import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./css/DiaryGuide.css";
import "./css/BackGround.css";
import "./css/CircleButton.css";

const DiaryGuide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const analysisId = location.state?.analysisId || localStorage.getItem("analysis_id");

  const goToDiary = () => {
    if (analysisId) {
      navigate("/diary", { state: { analysisId } });
    } else {
      alert("분석 ID를 찾을 수 없습니다.");
    }
  };

  return (
    <div className="fixed-canvas">
      <div className="guide-message">
        <p>
          당신의 하루를 재구성하기 위한 일기 작성을 시작합니다.<br />
          오늘 하루를 요약해 일기를 작성해주세요.<br />
          장소, 사물, 감정의 키워드를 넣어 작성하면 더욱 좋습니다.
        </p>
      </div>
      <div className="page-buttons">
        <div style={{ width: "75px" }}></div>
        <button className="circle-button right" onClick={() => navigate("/diary")}>
            <span className="triangle right"></span>
        </button>
      </div>
    </div>
  );
};

export default DiaryGuide;
