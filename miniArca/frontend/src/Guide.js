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
                <div className="glass-orb orb-1"></div>
                <div className="glass-orb orb-2"></div>
                <div className="glass-orb orb-3"></div>
                <div className="glass-orb orb-4"></div>
                <div className="glass-orb orb-5"></div>

                <p>
                    당신의 모습을 미니어쳐로 구현하기 위한 촬영을 시작합니다.<br />
                    전신이 촬영될 수 있도록 해 주시고, 정자세로 카메라를 응시해주세요.
                </p>

                <div className="page-buttons">
                    <button className="circle-button right" onClick={() => navigate("/photo")}>
                        <span className="triangle right"></span>
                    </button>
                </div>
            </div>
        </div>
    );
}
