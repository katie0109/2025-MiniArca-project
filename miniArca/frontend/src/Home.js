import React from "react";
import { useNavigate } from "react-router-dom";
import MiniArca3 from './img/MiniArca3.png';
import "./css/Home.css";
import "./css/BackGround.css"

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="glass-orb orb-1"></div>
            <div className="glass-orb orb-2"></div>
            <div className="glass-orb orb-3"></div>
            <div className="glass-orb orb-4"></div>
            <div className="glass-orb orb-5"></div>

            <img src={MiniArca3} alt="MINIARCA" className="logo" />


            <div className="button-container">
                <button className="home-button" onClick={() => navigate("/Explain")}>Start!</button>
            </div>
        </div>
    );
}
