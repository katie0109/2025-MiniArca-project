import React from "react";
import { useNavigate } from "react-router-dom";
import "./css/Explain.css";

import MiniArca3 from './img/MiniArca3.png';
import step1Img from "./img/step1.png";
import step2Img from "./img/step2.png";
import step3Img from "./img/step3.png";
import step4Img from "./img/step4.png";

export default function Explain() {
    const navigate = useNavigate();

    const steps = [
        {
            step: 1,
            title: "사진 촬영하기",
            image: step1Img,
            description: "오늘의 모습을 3D 캐릭터로 구현합니다.",
        },
        {
            step: 2,
            title: "일기 작성하기",
            image: step2Img,
            description: "오늘의 하루를 담은 일기를 작성합니다.",
        },
        {
            step: 3,
            title: "AI 분석하기",
            image: step3Img,
            description: "AI가 당신의 하루를 분석합니다.",
        },
        {
            step: 4,
            title: "추억으로 간직하기",
            image: step4Img,
            description: "캐릭터를 3D 프린터로 출력합니다.",
        }
    ];

    return (
        <div className="explain-container">
            <div className="object-container">
                {/* 서비스 사용 방법 안내 */}
                <section className="steps-section">
                    <div className="title-container">
                        <img src={MiniArca3}
                             alt="MINIARCA"
                             style={{ width: "500px", height: "auto" }} />
                    <h2>사용 방법</h2>
                    </div>
                    <div className="steps-container">{steps.map((step, index) => (
                            <div key={step.step} className="step-card">
                                <div className="step-number">
                                    <span>{step.step}</span>
                                </div>
                                <div className="step-content">
                                    <h3>{step.title}</h3>
                                    <img src={step.image} alt={`Step ${step.step}`} className="step-image" />
                                    <p>{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="page-buttons">
                <button className="circle-button left" onClick={() => navigate("/")}>
                    <span className="triangle left"></span>
                </button>
                <button className="circle-button right" onClick={() => navigate("/guide")}>
                    <span className="triangle right"></span>
                </button>
            </div>
        </div>
    );
}