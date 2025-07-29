using System;
using System.IO;
using System.Collections;
using UnityEditor;
using UnityEditor.Recorder;
using UnityEditor.Recorder.Input;
using UnityEngine;
using UnityEngine.Networking;

public class AutoRun : MonoBehaviour
{
    private string nodeUrl = "http://localhost:5000/get-analysis-id";

    public WallManager wallManager;
    public ClothingActivator clothingActivator;
    public Camera captureCamera;

    private RecorderController recorderController;

    private bool isProcessing = false;
    private bool clothingReady = false;
    private string lastProcessedId = "";

    private string folderPath;
    private string fileName;
    private string analysisId;

    void Awake()
    {
        Application.runInBackground = true;
    }

    void Start()
    {
        clothingActivator.OnStartRecording += StartRecording;
        clothingActivator.OnStopRecording += StopRecording;

       // StartCoroutine(PollForAnalysisId());  풀링 방식
    }

    //IEnumerator PollForAnalysisId()
    //{
    //    while (true)
    //    {
    //        if (!isProcessing)
    //        {
    //            UnityWebRequest request = UnityWebRequest.Get(nodeUrl);
    //            yield return request.SendWebRequest();

    //            if (request.result == UnityWebRequest.Result.Success)
    //            {
    //                string json = request.downloadHandler.text;
    //                AnalysisIdWrapper result = JsonUtility.FromJson<AnalysisIdWrapper>(json);

    //                if (!string.IsNullOrEmpty(result.analysis_id) && result.analysis_id != lastProcessedId)
    //                {
    //                    if (result.analysis_id == lastProcessedId)
    //                    {
    //                        Debug.Log("이미 처리한 분석 ID → 무시하고 30초 후 재시도");
    //                    }
    //                    else
    //                    {
    //                        Debug.Log("새로운 분석 ID 감지됨: " + result.analysis_id);
    //                        isProcessing = true;
    //                        lastProcessedId = result.analysis_id;

    //                        yield return StartCoroutine(HandleAnalysisId(result.analysis_id));

    //                        isProcessing = false;
    //                    }
    //                }
    //                else
    //                {
    //                    Debug.Log("분석 ID 없음");
    //                }
    //            }
    //            else
    //            {
    //                Debug.LogWarning("분석 ID 요청 실패: " + request.error);
    //            }
    //        }
    //        else
    //        {
    //            Debug.Log("이전 ID 처리 중, 대기 중...");
    //        }

    //        yield return new WaitForSeconds(30f);
    //    }
    //}

    IEnumerator GenerateStlFile(string analysisId)
    {
        // 애니메이터 일시 정지 (T-포즈를 위해)
        Animator animator = clothingActivator.rootObject.GetComponentInChildren<Animator>();
        bool wasEnabled = false;

        if (animator != null)
        {
            wasEnabled = animator.enabled;
            animator.enabled = false;
            Debug.Log("[STL] 애니메이터 일시 정지");

            // 한 프레임 대기 (포즈 적용을 위해)
            yield return null;
        }

        string stlPath = StlExporter.ExportMeshToStl(clothingActivator.rootObject, analysisId);

        // 애니메이터 복구
        if (animator != null)
        {
            animator.enabled = wasEnabled;
            Debug.Log("[STL] 애니메이터 복구");
        }

        if (string.IsNullOrEmpty(stlPath))
        {
            Debug.LogError("[AutoRun]  STL 파일 생성 실패!");
        }
        else
        {
            Debug.Log($"[AutoRun]  STL 파일 생성 성공: {stlPath}");

            // 서버로 STL 경로 전송
            Debug.Log("[AutoRun]  서버로 STL 경로 전송 시작...");
            yield return StartCoroutine(SendStlPathToServer(analysisId, stlPath));
        }
    }

    public IEnumerator HandleAnalysisId(string id)
    {
        analysisId = id;

        yield return StartCoroutine(wallManager.BuildWall(analysisId));
        yield return new WaitForSeconds(1f);

        Vector3 characterPos = wallManager.GetWallFrontPosition(3f);
        characterPos.y -= 2.0f; // Y축 살짝 내림

        if (clothingActivator.rootObject != null)
        {
            clothingActivator.rootObject.transform.position = characterPos;
            clothingActivator.rootObject.transform.rotation = Quaternion.Euler(0f, 180f, 0f);
        }

        clothingActivator.InitializeWithId(analysisId);

        captureCamera.orthographic = true;
        captureCamera.orthographicSize = 3f;
        captureCamera.transform.position = new Vector3(0f, 0f, -10f);
        captureCamera.transform.rotation = Quaternion.Euler(0f, 0f, 0f);
    }

    void StartRecording()
    {
        folderPath = Path.Combine(Directory.GetParent(Directory.GetParent(Application.dataPath).FullName).FullName, "miniArca", "unityimg");

        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
            Debug.Log($"폴더 생성: {folderPath}");
        }

        fileName = $"Recording_{analysisId}";

        var recorderControllerSettings = ScriptableObject.CreateInstance<RecorderControllerSettings>();
        recorderController = new RecorderController(recorderControllerSettings);

        var movieRecorderSettings = ScriptableObject.CreateInstance<MovieRecorderSettings>();
        movieRecorderSettings.name = "AutoRecording";
        movieRecorderSettings.Enabled = true;

        movieRecorderSettings.OutputFormat = MovieRecorderSettings.VideoRecorderOutputFormat.MP4;
        movieRecorderSettings.VideoBitRateMode = VideoBitrateMode.High;
        movieRecorderSettings.ImageInputSettings = new GameViewInputSettings
        {
            OutputWidth = 1600,  // 변경된 해상도
            OutputHeight = 1184
        };

        movieRecorderSettings.OutputFile = Path.Combine(folderPath, fileName);

        recorderControllerSettings.SetRecordModeToManual();
        recorderControllerSettings.AddRecorderSettings(movieRecorderSettings);
        recorderControllerSettings.FrameRate = 30.0f;

        recorderController.PrepareRecording();
        recorderController.StartRecording();

        Debug.Log($"녹화 시작: {movieRecorderSettings.OutputFile}");
    }

    void StopRecording()
    {
        if (recorderController != null && recorderController.IsRecording())
        {
            recorderController.StopRecording();
            Debug.Log("녹화 완료!");

            string recPath = Path.Combine(folderPath, fileName + ".mp4");
            string stlPath = StlExporter.ExportMeshToStl(clothingActivator.rootObject, analysisId);

            StartCoroutine(SendPathsToServer(analysisId, stlPath, recPath));
        }
        else
        {
            Debug.LogWarning("녹화 중이 아닙니다.");
        }
    }

    IEnumerator SendPathsToServer(string analysisId, string stlPath, string recPath)
    {
        // STL 업데이트는 8000번 포트 (FastAPI), analysis-id 요청은 5000번 포트 (Node.js)
        string url = "http://localhost:8000/update-stl-path";

        string json = JsonUtility.ToJson(new PathUpdate
        {
            analysis_id = analysisId,
            stl_path = stlPath.Replace("\\", "/"),
            rec_path = recPath.Replace("\\", "/")
        });

        UnityWebRequest request = new UnityWebRequest(url, "POST");
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");

        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            Debug.Log(" STL 경로 서버로 전송 성공!");
            Debug.Log($"서버 응답: {request.downloadHandler.text}");
        }
        else
        {
            Debug.LogError($" STL 경로 서버로 전송 실패: {request.error}");
            Debug.LogError($"응답 코드: {request.responseCode}");
            Debug.LogError($"요청 URL: {url}");
            Debug.LogError($"요청 데이터: {json}");
        }
        // string url = "http://localhost:5000/update-paths";

        // string json = JsonUtility.ToJson(new PathUpdate
        // {
        //     analysis_id = analysisId,
        //     stl_path = stlPath.Replace("\\", "/"),
        //     rec_path = recPath.Replace("\\", "/")
        // });

        // UnityWebRequest request = new UnityWebRequest(url, "POST");
        // byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        // request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        // request.downloadHandler = new DownloadHandlerBuffer();
        // request.SetRequestHeader("Content-Type", "application/json");

        // yield return request.SendWebRequest();

        // if (request.result == UnityWebRequest.Result.Success)
        // {
        //     Debug.Log("STL + 녹화 경로 서버로 전송 성공!");
        // }
        // else
        // {
        //     Debug.LogError("STL + 녹화 경로 서버로 전송 실패: " + request.error);
        // }
    }
IEnumerator SendStlPathToServer(string analysisId, string stlPath)
{
    string url = "http://localhost:8000/update-stl-path";  // 서버 주소 확인 필요

    string json = JsonUtility.ToJson(new
    {
        analysis_id = analysisId,
        stl_path = stlPath.Replace("\\", "/")
    });

    UnityWebRequest request = new UnityWebRequest(url, "POST");
    byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
    request.uploadHandler = new UploadHandlerRaw(bodyRaw);
    request.downloadHandler = new DownloadHandlerBuffer();
    request.SetRequestHeader("Content-Type", "application/json");

    yield return request.SendWebRequest();

    if (request.result == UnityWebRequest.Result.Success)
    {
        Debug.Log("[AutoRun] STL 경로 전송 성공");
        Debug.Log($"[서버 응답] {request.downloadHandler.text}");
    }
    else
    {
        Debug.LogError("[AutoRun] STL 경로 전송 실패: " + request.error);
        Debug.LogError($"응답 코드: {request.responseCode}");
        Debug.LogError($"요청 본문: {json}");
    }
}

    [System.Serializable]
    public class PathUpdate
    {
        public string analysis_id;
        public string stl_path;
        public string rec_path;
    }

    [System.Serializable]
    public class AnalysisIdWrapper
    {
        public string analysis_id;
    }
}