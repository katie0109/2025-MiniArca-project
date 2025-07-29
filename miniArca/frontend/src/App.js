import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// 페이지 컴포넌트들
import Home from "./Home";
import Explain from "./Explain";
import Guide from "./Guide";
import Photo from "./Photo";
import DiaryGuide from "./DiaryGuide";
import Diary from "./Diary";
import Loading from "./Loading";
import AllResult from "./AllResult";
import DiaryAnalysisPage from "./DiaryAnalysisPage";
import EmailSend from "./EmailSend";

function App() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / 2400;
      const scaleY = window.innerHeight / 1350;
      setScale(Math.min(scaleX, scaleY));
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // 초기 계산
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        position: "fixed",           
        top: "50%",                   
        left: "50%",                 
        transform: `translate(-50%, -50%) scale(${scale})`, // 정중앙 위치 + 크기 조정
        width: "2400px",
        height: "1350px",
        overflow: "hidden",
        backgoundColor: "#fff",
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explain" element={<Explain />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/photo" element={<Photo />} />
          <Route path="/diary-guide" element={<DiaryGuide />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/diary-result" element={<Loading />} />
          <Route path="/all-result" element={<AllResult />} />
          <Route path="/diary-anal" element={<DiaryAnalysisPage />} />
          <Route path="/EmailSend" element={<EmailSend />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
