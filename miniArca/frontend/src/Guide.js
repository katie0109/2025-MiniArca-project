import React from "react";
import { useNavigate } from "react-router-dom";
import "./css/Guide.css";
import "./css/BackGround.css";
import "./css/CircleButton.css";

export default function Guide() {
    const navigate = useNavigate();

    return (
        <div className="fixed-canvas">
            <div className="guide-message">
                <p>
                    당신의 모습을 3D 캐릭터로 구현하기 위한 촬영을 시작합니다.<br />
                    전신이 촬영될 수 있도록 해 주시고, 정자세로 카메라를 응시해주세요.
                </p>
            </div>
            <div className="page-buttons">
                <button className="circle-button left" onClick={() => navigate("/explain")}>
                    <span className="triangle left"></span>
                </button>
                <button className="circle-button right" onClick={() => navigate("/photo")}>
                    <span className="triangle right"></span>
                </button>
            </div>
        </div>
    );
}
