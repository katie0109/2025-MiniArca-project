import React from "react";
import { useNavigate } from "react-router-dom";
import "./css/Explain.css";
import logoImage from "./img/MiniArca3.png";

export default function Explain() {
    const navigate = useNavigate();

    const features = [
        {
            id: 1,
            title: "오늘의 OOTD",
            description: "오늘의 스타일을 기록해보세요",
            icon: "📸",
            details: "오늘의 옷차림을 사진으로 남기면면, AI가 분석하여 당신의 아바타를 생성할 수 있어요요"
        },
        {
            id: 2,
            title: "감정 분석 일기",
            description: "오늘의 마음을 이해해보세요",
            icon: "💭",
            details: "하루의 감정을 AI가 분석하여 당신의 마음 상태와 패턴을 알려드려요"
        },
        {
            id: 3,
            title: "3D 아바타 생성",
            description: "나만의 디지털 자아를 만나보세요",
            icon: "🪞",
            details: "당신의 사진으로 개성 넘치는 3D 아바타를 만들어 일기 속 주인공이 되어보세요"
        },
        {
            id: 4,
            title: "영상 일기",
            description: "추억이 움직이는 이야기가 됩니다",
            icon: "📖",
            details: "텍스트, 이미지, 아바타가 하나로 어우러진 나만의 영상 일기를 만들어보세요"
        }
    ];

    const steps = [
        {
            step: 1,
            title: "마음속 이야기 꺼내기",
            description: "오늘 하루를 돌아보며 솔직한 마음을 자유롭게 적어보세요",
            icon: "🌱"
        },
        {
            step: 2,
            title: "나의 모습 담기",
            description: "사진을 통해 일기 속 주인공인 나만의 아바타를 만들어보세요",
            icon: "🌸"
        },
        {
            step: 3,
            title: "추억으로 완성하기",
            description: "AI가 당신의 하루를 아름다운 멀티미디어 일기로 변신시켜드려요",
            icon: "🌟"
        }
    ];

    return (
        <div className="explain-container">
            {/* 배경 글래스 오브들 */}
            <div className="glass-orb orb-1"></div>
            <div className="glass-orb orb-2"></div>
            <div className="glass-orb orb-3"></div>
            <div className="glass-orb orb-4"></div>
            <div className="glass-orb orb-5"></div>

            {/* 헤더 */}
            <header className="explain-header">
                <button className="back-button" onClick={() => navigate("/")}>
                    ← 홈으로
                </button>
                <img src={logoImage} alt="MINIARCA 로고" className="logo-image" />
                <p>매일매일 소중한 순간들을 기록하고 간직해보세요 ✨</p>
            </header>

            {/* 서비스 핵심 기능 소개 */}
            <section className="features-section">
                <h2>🌈 일상을 특별하게 만드는 기능들</h2>
                <div className="features-grid">{features.map((feature) => (
                        <div key={feature.id} className="feature-card">
                            <div className="feature-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                            <p className="feature-details">{feature.details}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 서비스 사용 방법 안내 */}
            <section className="steps-section">
                <h2>📝 나만의 일기 만들기</h2>
                <div className="steps-container">{steps.map((step, index) => (
                        <div key={step.step} className="step-card">
                            <div className="step-number">
                                <span>{step.step}</span>
                            </div>
                            <div className="step-content">
                                <div className="step-icon">{step.icon}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 시작하기 버튼 */}
            <section className="start-section">
                <button className="start-button" onClick={() => navigate("/Guide")}>
                    MINIARCA 시작하기🪄
                </button>
            </section>
        </div>
    );
}