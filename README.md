# **2025 MiniArca Project**

[![Unity](https://img.shields.io/badge/Unity-2022.3-black.svg?style=for-the-badge&logo=unity)](https://unity.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.95-teal.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

> 사용자의 하루를 AI로 분석하고, 3D 아바타와 교감하며 마음을 치유하는 새로운 형태의 디지털 멘탈 케어 서비스

---

## **✨ 프로젝트 개요 (Overview)**

**MiniArca**는 바쁜 일상 속 자신의 감정을 돌아볼 시간이 부족한 현대인들을 위한 AI 기반 멘탈 케어 솔루션입니다. 사용자가 텍스트와 이미지로 하루를 기록하면, AI가 그 안에 담긴 복합적인 감정을 분석합니다. 분석된 결과는 Unity 3D 환경의 아바타를 통해 시각적으로 표현되며, 사용자는 아바타와의 상호작용을 통해 자신의 감정 상태를 직관적으로 이해하고 위로받는 경험을 할 수 있습니다.

본 프로젝트는 단순한 일기 기록을 넘어, AI 기술과 3D 인터랙션을 결합하여 사용자의 자기 성찰을 돕고 긍정적인 정서 변화를 유도하는 것을 목표로 합니다.

## **🚀 주요 기능 (Features)**

*   **📝 AI 기반 다중 감정 분석:** 사용자가 작성한 텍스트와 업로드한 이미지를 다각도로 분석하여 기쁨, 슬픔, 분노 등 핵심 감정과 관련 키워드를 추출합니다.
*   **🤖 인터랙티브 3D 아바타:** 분석된 감정 상태가 3D 아바타의 표정, 행동, 주변 환경에 실시간으로 반영되어 사용자와 교감합니다.
*   **🎨 감정 맞춤형 이모지 및 배경 생성:** AI 분석 결과를 바탕으로 일기 내용에 가장 어울리는 이모지를 추천하고, 일기장의 배경 이미지를 동적으로 생성합니다.
*   **🔒 안전한 데이터 관리:** 모든 일기 데이터는 MongoDB에 안전하게 저장되며, Node.js 기반의 백엔드 서버를 통해 체계적으로 관리됩니다.
*   **💻 크로스플랫폼 지원:** 핵심 기능은 Unity 3D 클라이언트에서, 데이터 조회 및 관리는 React 기반의 웹 애플리케이션에서 접근할 수 있습니다.

## **🏛️ 시스템 아키텍처 (System Architecture)**

본 프로젝트는 각 기능의 독립성과 확장성을 보장하기 위해 **마이크로서비스 아키텍처(MSA)**를 채택했습니다. 각 컴포넌트는 독립적으로 개발 및 배포가 가능하며, 표준 REST API를 통해 유기적으로 통신합니다.

```
+------------------+      +------------------+
|   Unity Client   |      |  React Web App   |
+------------------+      +------------------+
         |                        |
         +----------+-------------+
                    | (HTTPS/REST API)
+-------------------------------------------------+
|                   Backend Server                |
|                  (Node.js, Express)             |
|  (API Gateway, Business Logic, User Auth)       |
+-------------------------------------------------+
         |                         |
(HTTP/REST API)           (MongoDB Driver)
         |                         |
+------------------+      +------------------+
|   AI Server      |      |    Database      |
| (Python, FastAPI)|      |    (MongoDB)     |
+------------------+      +------------------+
```

*   **Client (Unity / React):** 사용자 인터페이스 및 경험을 담당합니다.
*   **Backend (Node.js):** 클라이언트 요청을 처리하는 API 게이트웨이이자, 핵심 비즈니스 로직을 수행합니다.
*   **AI Server (Python/FastAPI):** 텍스트 및 이미지 분석 요청을 받아 AI 모델을 통해 감정을 추론하고 결과를 반환합니다.
*   **Database (MongoDB):** 사용자 정보, 일기, 분석 결과 등 모든 데이터를 영속적으로 저장합니다.

## **🛠️ 기술 스택 (Tech Stack)**

| 분야 | 기술 |
| :--- | :--- |
| **Client (3D)** | `Unity Engine`, `C#` |
| **Client (Web)** | `React.js`, `JavaScript` |
| **Backend** | `Node.js`, `Express.js` |
| **AI Server** | `Python`, `FastAPI`, `PyTorch`, `YOLOv5` |
| **Database** | `MongoDB` |
| **CI/CD & Etc.** | `Git`, `GitHub` |

## **⚙️ 시작하기 (Getting Started)**

### **1. 사전 요구사항 (Prerequisites)**

*   [Node.js](https://nodejs.org/en/) (v16 이상)
*   [Python](https://www.python.org/downloads/) (v3.9 이상)
*   [Unity Hub](https://unity.com/download) 및 Unity Editor (2022.3.x 권장)
*   [MongoDB](https://www.mongodb.com/try/download/community) 또는 Docker

### **2. 설치 및 설정 (Installation)**

1.  **프로젝트 클론**
    ```bash
    git clone https://github.com/katie0109/2025-MiniArca-project.git
    cd 2025-MiniArca-project
    ```

2.  **백엔드 서버 설정**
    ```bash
    cd miniArca/backend
    npm install
    # .env 파일 생성 및 환경변수 설정 (DB 연결 정보 등)
    ```

3.  **프론트엔드 웹 설정**
    ```bash
    cd miniArca/frontend
    npm install
    ```

4.  **AI 서버 설정**
    ```bash
    cd miniArca
    pip install -r requirements.txt
    # analysis/server/.env, analysis/model/.env 파일 생성 및 환경변수 설정
    ```

5.  **Unity 프로젝트 설정**
    *   Unity Hub를 열고 `unity_project` 폴더를 프로젝트로 추가합니다.
    *   프로젝트를 열면 Unity가 필요한 패키지를 자동으로 설치합니다.

## **▶️ 실행 방법 (How to Run)**

1.  **데이터베이스 실행**
    *   로컬에 설치된 MongoDB 서버를 실행하거나, Docker를 통해 실행합니다.

2.  **전체 서버 실행**
    *   프로젝트의 핵심 서버(백엔드, AI)를 동시에 실행합니다.
    ```bash
    cd miniArca
    python start_all.py
    ```

3.  **프론트엔드 웹 실행 (필요 시)**
    ```bash
    cd miniArca/frontend
    npm start
    ```

4.  **Unity 클라이언트 실행**
    *   Unity Editor에서 `unity_project`를 열고, `Play` 버튼을 눌러 실행합니다.

## **📂 프로젝트 구조 (Project Structure)**

```
.
├── miniArca/              # 웹, 서버, AI 관련 소스코드
│   ├── analysis/          # AI 분석 모델 및 서버
│   ├── backend/           # Node.js 백엔드 서버
│   ├── database/          # DB 설정 및 리소스
│   ├── frontend/          # React 프론트엔드 웹
│   └── start_all.py       # 전체 서버 실행 스크립트
│
├── unity_project/         # Unity 3D 클라이언트 프로젝트
│   ├── Assets/            # Unity 에셋 (스크립트, 모델, 씬 등)
│   └── ProjectSettings/   # Unity 프로젝트 설정
│
└── README.md              # 프로젝트 소개 문서
```

