import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import MiniArca3 from './img/MiniArca3.png';
import Sound from './sound/sound.mp3';
import "./css/Home.css";

export default function Home() {
    const navigate = useNavigate();

    // 오디오 객체 useRef로 생성
    const clickSoundRef = useRef(new Audio(Sound));

    const handleStartClick = () => {
        // 사운드 재생
        if (clickSoundRef.current) {
        clickSoundRef.current.currentTime = 0;
        clickSoundRef.current.play();
        }

        // 약간의 딜레이 후 페이지 이동 (사운드 재생 시간 고려)
        setTimeout(() => {
        navigate("/Explain");
        }, 200); // 0.2초 뒤 이동
    };


    return (
        <div className="home-container">
            <div className="object-container">
                <img className="logo" src={MiniArca3} alt="MINIARCA" />
                <button className="start-button" onClick={handleStartClick}>START</button>
            </div>
        </div>
    );
}
