# MiniArca Unity Project

## 프로젝트 소개 (Description)

MiniArca Unity Project는 2025 MiniArca 프로젝트의 Unity 기반 3D 시각화 및 시뮬레이션 컴포넌트입니다. 이 프로젝트는 실시간 데이터 시각화, 3D 환경 시뮬레이션, 사용자 인터랙션 등을 제공하며, 백엔드 서버와 연동하여 동적인 3D 콘텐츠를 생성합니다.

## 주요 기능 (Features)

- **3D 환경 시뮬레이션**: 실시간 3D 환경 렌더링 및 시뮬레이션
- **데이터 시각화**: 백엔드 서버로부터 받은 데이터를 3D 환경에서 시각화
- **사용자 인터랙션**: 직관적인 사용자 인터페이스 및 상호작용 기능
- **멀티미디어 지원**: 다양한 미디어 리소스 통합 및 재생
- **실시간 통신**: 백엔드 서버와의 실시간 데이터 교환
- **녹화 기능**: 시뮬레이션 과정의 녹화 및 재생

## 설치 방법 (Installation)

### 필수 요구사항 (Requirements/Prerequisites)

- **Unity Editor**: 2022.3 LTS 이상
- **Unity Hub**: 최신 버전
- **운영체제**: Windows 10/11, macOS, Linux
- **하드웨어**: 
  - GPU: DirectX 11 지원 그래픽 카드
  - RAM: 8GB 이상 권장
  - 저장공간: 5GB 이상 사용 가능한 공간

### 설치 단계

1. **Unity Hub 설치**
   - [Unity Hub](https://unity.com/download)에서 최신 버전 다운로드 및 설치

2. **Unity Editor 설치**
   - Unity Hub에서 Unity 2022.3 LTS 버전 설치

3. **프로젝트 클론**
   ```bash
   git clone https://github.com/katie0109/2025-MiniArca-project.git
   cd 2025-MiniArca-project/unity_project
   ```

4. **Unity 프로젝트 열기**
   - Unity Hub에서 "Add project from disk" 선택
   - `unity_project/` 폴더 선택하여 프로젝트 추가

## 사용법 (Usage)

### 기본 실행

1. **Unity Editor에서 프로젝트 열기**
   - Unity Hub에서 MiniArca Unity Project 선택

2. **패키지 복원**
   - Unity Editor가 자동으로 필요한 패키지들을 복원합니다
   - Package Manager에서 누락된 패키지가 있는지 확인

3. **시뮬레이션 실행**
   - Unity Editor에서 Play 버튼 클릭하여 시뮬레이션 시작

### 백엔드 서버와 연동

1. **백엔드 서버 실행 (선택사항)**
   ```bash
   # 루트 디렉터리에서
   python miniArca/start_all.py
   ```

2. **Unity에서 서버 연결 확인**
   - Unity Console에서 서버 연결 상태 확인
   - 필요시 서버 URL 설정 조정

## 폴더 구조 (Project Structure)

```
unity_project/
├── Assembly-CSharp-Editor.csproj    # 에디터 스크립트 프로젝트
├── Assembly-CSharp.csproj           # 런타임 스크립트 프로젝트
├── My project.sln                   # Visual Studio 솔루션 파일
├── unity_project.sln                # Unity 솔루션 파일
├── README.md                        # 프로젝트 문서
├── Assets/                          # Unity 에셋 폴더
│   ├── Scripts/                     # C# 스크립트
│   ├── Scenes/                      # Unity 씬 파일
│   ├── Prefabs/                     # 프리팹 에셋
│   ├── Materials/                   # 머티리얼 에셋
│   ├── Textures/                    # 텍스처 이미지
│   └── Models/                      # 3D 모델 에셋
├── ProjectSettings/                 # Unity 프로젝트 설정
├── Packages/                        # 패키지 매니저 관련 파일
├── Library/                         # Unity 컴파일된 라이브러리 (자동 생성)
├── Logs/                           # Unity 로그 파일
├── Recordings/                      # 녹화 데이터 파일
├── UserSettings/                    # 사용자별 설정 파일
└── obj/                            # 빌드 오브젝트 파일 (자동 생성)
```

## 기여 방법 (Contributing)

1. **Fork** 이 저장소를 fork합니다
2. **Branch** 새로운 기능을 위한 브랜치를 생성합니다
   ```bash
   git checkout -b feature/새로운기능
   ```
3. **Commit** 변경사항을 커밋합니다
   ```bash
   git commit -m 'feat: 새로운 기능 추가'
   ```
4. **Push** 브랜치에 푸시합니다
   ```bash
   git push origin feature/새로운기능
   ```
5. **Pull Request** 를 생성합니다

### 개발 가이드라인

- Unity 코딩 스타일 가이드를 따라주세요
- 새로운 기능은 테스트와 함께 제출해주세요
- 문서 업데이트를 포함해주세요
- 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 형식을 사용해주세요

## 라이선스 (License)

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](../LICENSE) 파일을 참고하세요.

## 연락처 (Contact)

- **프로젝트 관리자**: katie0109
- **GitHub**: [https://github.com/katie0109/2025-MiniArca-project](https://github.com/katie0109/2025-MiniArca-project)
- **이슈 보고**: [GitHub Issues](https://github.com/katie0109/2025-MiniArca-project/issues)

## 관련 문서

- **전체 프로젝트 문서**: [../README.md](../README.md)
- **백엔드 서버**: [../miniArca/backend/](../miniArca/backend/)
- **데이터 분석**: [../miniArca/analysis/](../miniArca/analysis/)
- **프론트엔드**: [../miniArca/frontend/](../miniArca/frontend/)
