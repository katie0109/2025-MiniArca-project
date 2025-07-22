import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./css/Photo.css";
import "./css/BackGround.css";
import { v4 as uuidv4 } from "uuid";

const playShutterSound = () => {
  const audio = new Audio('/sounds/shutter.mp3');
  audio.volume = 0.7; // 볼륨 조절 (0.0 ~ 1.0)
  audio.play().catch(console.error);
};

const Photo = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [countdown, setCountdown] = useState(5);
  const [analysisId] = useState(uuidv4());
  const [step, setStep] = useState("front");
  const [message, setMessage] = useState("앞면 촬영까지 5초...");
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState(null);
  const navigate = useNavigate();

  const photoInfo = {
    front: {
      type: "앞면 촬영",
      message: "앞면 전신사진을 준비하세요",
      instruction: "정면을 보고 자연스럽게 서주세요"
    },
    back: {
      type: "뒷면 촬영",
      message: "뒷면 전신사진을 준비하세요",
      instruction: "뒤돌아서서 자연스럽게 서주세요"
    }
  };

  const stopTracks = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null; // ✅ 수정됨: stop 후 srcObject 초기화
    }
  };

  const startCamera = async () => {
    stopTracks();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", aspectRatio: 9 / 16 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // ✅ 캠 준비 완료 후에 카운트다운 시작
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startCountdown(); // ✅ 여기로 이동
        };
      }
    } catch (err) {
      console.error("카메라 시작 오류:", err);
    }
  };

  useEffect(() => {
    console.log("📸 MINIARCA 전신사진 촬영 시작!");
    startCamera();
    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
      stopTracks();
    };
  }, []);

  useEffect(() => {
    if (!isCaptured) {
      startCamera();
    }
  }, [step, isCaptured]); // ✅ 수정됨: step뿐 아니라 isCaptured도 의존성에 추가

  const startCountdown = () => {
    setCountdown(5);
    let time = 5;
    const interval = setInterval(() => {
      time -= 1;
      setCountdown(time);
      if (time <= 0) {
        playShutterSound();
        clearInterval(interval);
        capturePhoto();
      }
    }, 1000);
    setCountdownInterval(interval);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas || !videoRef.current) return;

    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
    setIsCaptured(true);
  };

  const uploadPhotoPart = async () => {
    if (!capturedImage) return;
    try {
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const formData = new FormData();
      formData.append("file", blob, "photo.png");
      formData.append("analysis_id", analysisId);
      formData.append("part", step === "front" ? "f" : "b");

      await axios.post("http://localhost:8000/uploadPhotoPart", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (step === "front") {
        setStep("back");
        setCapturedImage(null);
        setIsCaptured(false);
        setMessage("뒷면 촬영까지 5초...");
        startCountdown();
      } else {

        // 뒷면 업로드 후 분석 시작 API 호출
        await axios.post('http://localhost:8000/analyzePhoto',
          new URLSearchParams({ analysis_id: analysisId })
        );
        
        localStorage.setItem("analysis_id", analysisId);
        navigate("/diary-guide", { state: { analysisId } });
      }
    } catch (error) {
      console.error("사진 분석 요청 오류:", error);
    }
  };

  const retry = () => {
    stopTracks(); // ✅ 수정됨: 재촬영 전 기존 트랙 정지
    setCapturedImage(null);
    setIsCaptured(false);
    setCountdown(5);
    setMessage(step === "front" ? "앞면 촬영까지 5초..." : "뒷면 촬영까지 5초...");
    startCamera(); // ✅ 수정됨: 재촬영 시 카메라 재시작
    startCountdown();
  };

  const currentInfo = photoInfo[step];
  const currentPhotoNumber = step === "front" ? 1 : 2;

  return (
    <div className="photo-container">
      {!isCaptured && (
        <div className="left-info">
          <div className="countdown-info-card">
            <div className="countdown-text">{currentInfo.message}</div>
            <div className="pose-text">{currentInfo.instruction}</div>
          </div>
        </div>
      )}

      {!isCaptured && (
        <div className="right-actions">
          <div className="shot-info-card">
            <div className="shot-counter">
              <span>{currentPhotoNumber}</span> / 2
            </div>
            <div className="shot-type">{currentInfo.type}</div>
          </div>

          <div className="progress-card">
            <div className="progress-steps">
              <div className="progress-step">
                <div className={`step-circle ${step === "front" ? "current" : "completed"}`}>
                  앞
                </div>
                <div className="step-label">앞면</div>
              </div>
              <div className="progress-step">
                <div className={`step-circle ${step === "back" ? "current" : ""}`}>
                  뒤
                </div>
                <div className="step-label">뒷면</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="photo-booth-ui">
        <div className="main-camera-container">
          {!isCaptured && (
            <div className="countdown-area">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div className="countdown-overlay">
                <div className="countdown-display-center">
                  {String(countdown).padStart(2, "0")}
                </div>
              </div>
            </div>
          )}

          {isCaptured && capturedImage && (
            <div className="captured-screen">
              <img
                src={capturedImage}
                alt="Captured"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "36px"
                }}
              />
              <div
                className="action-buttons"
                style={{
                  position: "absolute",
                  bottom: "30px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: "20px",
                  zIndex: 10
                }}
              >
                <button className="btn" onClick={retry}>재촬영</button>
                <button className="btn primary" onClick={uploadPhotoPart}>
                  {step === "front" ? "다음 (뒷면)" : "분석 시작!"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={720}
        height={1280}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default Photo;
