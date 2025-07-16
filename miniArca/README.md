# miniArca 모듈 소개

이 디렉터리는 2025 MiniArca Project의 핵심 Python/Node.js/웹 기반 서비스가 위치한 메인 폴더입니다.

## 폴더 구조

- **analysis/**: 데이터 분석, 모델 학습 및 추론, 분석 서버 코드
- **backend/**: Node.js 기반 API 서버
- **frontend/**: 웹 프론트엔드 코드
- **background/**, **unityimg/**: 서비스에서 사용하는 이미지 리소스
- **database/**: 데이터베이스 관련 파일
- **STL/**: 3D 프린팅 및 시각화용 STL 파일

## 실행 방법

1. Python 의존성 설치
   ```bash
   pip install -r requirements.txt
   ```
2. Node.js 백엔드 의존성 설치
   ```bash
   cd backend
   npm install
   ```
3. 전체 서비스 실행
   ```bash
   python start_all.py
   ```

## 참고
- Unity 3D 시각화 및 시뮬레이션은 `../unity_project/` 폴더를 참고하세요.
