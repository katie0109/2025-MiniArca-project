
# 2025 MiniArca Project

## 프로젝트 소개

2025 MiniArca Project는 다양한 기술 스택을 활용하여 개발된 통합 시스템입니다. 본 프로젝트는 데이터 분석, 백엔드, 프론트엔드, Unity 기반 3D 시각화 등 여러 모듈로 구성되어 있으며, 각 모듈은 독립적으로 개발 및 운영될 수 있도록 설계되었습니다. 이 프로젝트는 실시간 데이터 처리, 시각화, 사용자 인터페이스, 3D 환경 제공 등 다양한 기능을 제공합니다.

## 전체 구조

```
miniArca/
├── requirements.txt         # Python 의존성 목록
├── start_all.py             # 전체 서비스 일괄 실행 스크립트
├── analysis/                # 데이터 분석 및 모델 관련 코드
│   ├── model/               # 머신러닝/딥러닝 모델 코드
│   └── server/              # 분석 서버 코드
├── backend/                 # Node.js 기반 백엔드 서버
│   ├── package.json         # Node.js 의존성 목록
│   └── server.js            # 백엔드 서버 진입점
├── background/              # 배경 이미지 등 리소스 파일
├── database/                # 데이터베이스 관련 파일 및 스크립트
├── frontend/                # 프론트엔드(웹) 코드
├── STL/                     # 3D 모델 STL 파일
├── unityimg/                # Unity 관련 이미지 리소스
unity_project/
├── Assets/                  # Unity 프로젝트 에셋
├── ProjectSettings/         # Unity 프로젝트 설정
├── ...                      # 기타 Unity 프로젝트 파일
```

## 주요 폴더 설명

- **miniArca/**: Python 기반 데이터 분석, 서버, 백엔드, 프론트엔드 등 핵심 서비스가 위치한 메인 디렉터리입니다.
  - **analysis/**: 데이터 분석, 모델 학습 및 추론, 분석 서버 코드 포함
  - **backend/**: Node.js 기반 API 서버 및 관련 코드
  - **frontend/**: 사용자 인터페이스(웹 프론트엔드) 코드
  - **background/**, **unityimg/**: 서비스에서 사용하는 이미지 리소스
  - **database/**: 데이터베이스 스키마, 초기화 스크립트 등
  - **STL/**: 3D 프린팅 및 시각화용 STL 파일
- **unity_project/**: Unity 엔진 기반 3D 시각화 및 시뮬레이션 프로젝트

## 실행 방법

1. Python 환경 설정 및 의존성 설치
   ```bash
   pip install -r miniArca/requirements.txt
   ```
2. Node.js 백엔드 의존성 설치
   ```bash
   cd miniArca/backend
   npm install
   ```
3. 전체 서비스 실행
   ```bash
   python miniArca/start_all.py
   ```
4. Unity 프로젝트는 `unity_project/` 폴더에서 Unity Editor로 열어 실행

## 문의

- 담당자: [이름/이메일 기입]
- 이 저장소는 2025년 MiniArca 프로젝트의 공식 저장소입니다.
