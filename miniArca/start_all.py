import subprocess
import time

# 2. FastAPI 서버 실행 (아나콘다 가상환경 활성화 후 실행)
subprocess.Popen(["cmd.exe", "/k", "cd /d C:\\Users\\DS\\miniArca\\analysis\\server && conda activate path22 && python fastapi_server.py"])
time.sleep(3)

# 3. Node.js 백엔드 서버 실행
subprocess.Popen(["cmd.exe", "/k", "cd /d C:\\Users\\DS\\miniArca\\backend && node server.js"])
time.sleep(3)

# 4. React 프론트엔드 실행
subprocess.Popen(["cmd.exe", "/k", "cd /d C:\\Users\\DS\\miniArca\\frontend && npm start"])


