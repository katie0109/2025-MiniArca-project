# MiniArca Core Services

이 디렉터리는 **2025 MiniArca Project**의 핵심 서비스를 담당하는 모듈입니다. AI 분석, 백엔드 API, 웹 프론트엔드 등 주요 서버 측 및 웹 기반 구성 요소가 포함되어 있습니다.

## 🏛️ 아키텍처

본 모듈은 각 기능의 독립성과 확장성을 고려하여 마이크로서비스 아키텍처(MSA)를 기반으로 설계되었습니다.

-   **Frontend (React)**: 사용자가 일기를 작성하고 분석 결과를 확인할 수 있는 웹 애플리케이션입니다.
-   **Backend (Node.js/Express)**: API 게이트웨이 역할을 하며, 클라이언트 요청 처리 및 데이터베이스 연동 등 핵심 비즈니스 로직을 수행합니다.
-   **AI Server (Python/FastAPI)**: 텍스트와 이미지에 대한 감정 분석, 키워드 추출, 추천 생성 등 AI 모델 기반의 추론을 담당합니다.
-   **Database (MongoDB)**: 모든 사용자 데이터, 일기 내용, 분석 결과 등을 영속적으로 저장합니다.

## 🛠️ 기술 스택

| 분야         | 기술                                           |
| :----------- | :--------------------------------------------- |
| **Frontend** | `React.js`, `JavaScript`                       |
| **Backend**  | `Node.js`, `Express.js`                        |
| **AI Server**| `Python`, `FastAPI`, `PyTorch`, `YOLOv5`       |
| **Database** | `MongoDB`                                      |

## 📂 폴더 구조

```
miniArca/
├── analysis/          # AI 분석 모델 및 FastAPI 서버
├── backend/           # Node.js 백엔드 서버
├── frontend/          # React 프론트엔드 웹
├── database/          # DB 설정 및 리소스
├── background/        # 동적 생성 배경 이미지 저장소
├── unityimg/          # Unity 연동용 이미지 리소스
├── STL/               # 3D 프린팅 및 시각화용 STL 파일
├── requirements.txt   # Python 패키지 의존성 파일
└── start_all.py       # 전체 서버 실행 스크립트
```

## ⚙️ 시작하기

### 사전 요구사항

-   [Node.js](https://nodejs.org/en/) (v16 이상)
-   [Python](https://www.python.org/downloads/) (v3.9 이상)
-   [MongoDB](https://www.mongodb.com/try/download/community)

### 설치 및 설정

1.  **Python 의존성 설치**
    ```bash
    # miniArca/ 디렉터리에서 실행
    pip install -r requirements.txt
    ```

2.  **백엔드 서버 설정**
    ```bash
    cd backend
    npm install
    # .env 파일을 생성하고 MongoDB 연결 정보 등 환경변수를 설정합니다.
    ```

3.  **프론트엔드 웹 설정**
    ```bash
    cd frontend
    npm install
    ```

4.  **환경변수 설정**
    -   `analysis/model/.env` 및 `analysis/server/.env` 파일에 필요한 환경변수를 설정합니다.

## ▶️ 실행 방법

1.  **전체 서버 실행**
    -   백엔드 API 서버와 AI 분석 서버를 동시에 실행합니다.
    ```bash
    # miniArca/ 디렉터리에서 실행
    python start_all.py
    ```

2.  **프론트엔드 웹 실행**
    -   React 개발 서버를 실행합니다.
    ```bash
    cd frontend
    npm start
    ```
    -   웹 브라우저에서 `http://localhost:3000`으로 접속하여 확인할 수 있습니다.

## 🔗 관련 문서

-   **Unity 3D 클라이언트**: Unity 시각화 및 시뮬레이션 프로젝트는 [`../unity_project/`](../unity_project/) 폴더를 참고하세요.
-   **전체 프로젝트 개요**: 프로젝트의 전체적인 내용은 루트 [`README.md`](../README.md) 파일을 참고하세요.