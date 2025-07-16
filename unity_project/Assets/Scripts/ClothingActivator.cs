using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;
using SimpleJSON;
using System;

public class ClothingActivator : MonoBehaviour
{
    public GameObject rootObject;
    public Animator characterAnimator;

    private List<string> activeClothNames = new List<string>();
    private List<Color> activeColors = new List<Color>();

    private List<string> motionNames = new List<string>();
    private List<string> currentFaceNames = new List<string>();

    private string serverUrl = "http://localhost:8000/entry/";

    private readonly HashSet<string> alwaysActiveNames = new HashSet<string>
    {
        "custombody_UP",
        "Armature",
        "ear1_x",
        "nose_f",
        "shoes"
    };

    private readonly Dictionary<string, List<string>> motionToFaceMap = new Dictionary<string, List<string>>()
    {
        { "Joyful Jump", new List<string> { "eye4_x" } },
        { "Cheering", new List<string> { "eye4_x" } },
        { "Clapping", new List<string> { "eye2_x" } },
        { "Warrior Idle", new List<string> { "eye2_x" } },
        { "Defeated", new List<string> { "eyebrow2_x", "eye3_x" } },
        { "Terrified", new List<string> { "eyebrow4_x", "eye5_x" } },
        { "Crying", new List<string> { "eyebrow4_x", "eye5_x" } },
        { "Yawn", new List<string> { "eye3_x" } },
    };

    // 📝 디비 저장명 ➔ 유니티 child 이름 매핑
    private readonly Dictionary<string, string> clothingLabelMap = new Dictionary<string, string>()
    {
        // 옷 24개
        { "sleeveless", "sleeveless" },
        { "strapless", "short_sleeve_round" },
        { "crop_sleeve", "short_sleeve_crop" },
        { "short_sleeve", "short_sleeve_round" },
        { "long_collar", "short_sleeve_collar" },
        { "long_sleeve_collar", "long_sleeve_collar" },
        { "crop_vneck", "long_sleeve_v_neck" },
        { "hoodie", "hoodie" },
        { "shirt_short", "short_sleeve_shirt" },
        { "blouse_short", "short_sleeve_blouse" },
        { "shirt_long", "long_sleeve_shirt" },
        { "round_long", "long_sleeve_round" },
        { "vneck", "short_sleeve_v_neck" },
        { "cardigan", "cardigan" },
        { "coat", "coat" },
        { "jumper", "jumper" },
        { "jacket", "jacket" },
        { "pants_mini", "mini_pants" },
        { "pants_midi", "midi_pants" },
        { "pants_long", "long_pants" },
        { "skirt_mini", "mini_skirt" },
        { "skirt_midi", "midi_skirt" },
        { "skirt_long", "long_skirt" },
        { "mini_dress", "mini_dress" },

        // 헤어 + 신발 7개
        { "no_bang_long", "long_hair" },
        { "bang_long", "long_hair_front" },
        { "no_bang_medium", "short_hair" },
        { "bang_medium", "short_hair_front" },
        { "no_bang_short", "man_hair" },
        { "bang_short", "man_hair_front" },
        { "shoes", "shoes" }
    };

    public Coroutine motionCoroutine { get; private set; }
    public float totalMotionDuration { get; private set; } = 0f;

    public event Action OnStartRecording;
    public event Action OnStopRecording;

    void Start()
    {
        if (rootObject == null)
        {
            Debug.LogError("Root Object가 설정되지 않았습니다.");
            return;
        }

        if (characterAnimator == null)
        {
            characterAnimator = rootObject.GetComponentInChildren<Animator>();
        }

        if (characterAnimator == null)
        {
            Debug.LogWarning("Animator가 설정되지 않았습니다.");
            return;
        }
    }

    public void InitializeWithId(string docId)
    {
        StartCoroutine(LoadClothingAndMotion(docId));
    }

    private IEnumerator LoadClothingAndMotion(string docId)
    {
        string url = serverUrl + docId;

        using (UnityWebRequest request = UnityWebRequest.Get(url))
        {
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                string rawJson = request.downloadHandler.text;
                Debug.Log("[DEBUG] 서버 응답: " + rawJson);

                JSONNode data = JSON.Parse(rawJson);

                // 옷 정보 파싱
                JSONNode clothes = data["photo_analysis_result"]["results"];
                activeClothNames.Clear();
                activeColors.Clear();
                foreach (JSONNode item in clothes.AsArray)
                {
                    string rawLabel = item["label"].Value.Trim();
                    string mappedLabel = clothingLabelMap.ContainsKey(rawLabel) ? clothingLabelMap[rawLabel] : rawLabel;

                    string colorHex = item["color"].Value.Trim();

                    activeClothNames.Add(mappedLabel);

                    if (!colorHex.StartsWith("#"))
                        colorHex = "#" + colorHex;

                    if (ColorUtility.TryParseHtmlString(colorHex, out Color parsedColor))
                        activeColors.Add(parsedColor);
                    else
                    {
                        Debug.LogWarning($"색상 파싱 실패: {colorHex}");
                        activeColors.Add(Color.white);
                    }
                }

                // 모션 정보 파싱
                JSONNode finalEmotions = data["final_emotions"];
                motionNames.Clear();
                if (finalEmotions != null && finalEmotions.IsArray)
                {
                    foreach (JSONNode emotionData in finalEmotions.AsArray)
                    {
                        if (emotionData.IsArray && emotionData.Count >= 3)
                        {
                            string motion = emotionData[2].Value;
                            motionNames.Add(motion);
                        }
                    }
                }

                if (motionNames.Count > 0)
                {
                    if (motionCoroutine != null)
                        StopCoroutine(motionCoroutine);

                    totalMotionDuration = CalculateTotalMotionDuration();
                    motionCoroutine = StartCoroutine(PlayMotionWithRecording());

                    Debug.Log($"모션들 설정 완료: {string.Join(", ", motionNames)}");
                }
                else
                {
                    Debug.LogWarning("모션 데이터가 없습니다.");
                }

                ApplyClothing();
            }
            else
            {
                Debug.LogError("서버 요청 실패: " + request.error);
            }
        }
    }

    private void ApplyClothing()
    {
        for (int i = 0; i < rootObject.transform.childCount; i++)
        {
            Transform child = rootObject.transform.GetChild(i);

            if (alwaysActiveNames.Contains(child.name))
            {
                child.gameObject.SetActive(true);
                continue;
            }

            int index = activeClothNames.IndexOf(child.name);
            if (index != -1)
            {
                child.gameObject.SetActive(true);
                ApplyColor(child, activeColors[index]);
                Debug.Log($"{child.name} 활성화 및 색상 적용: {activeColors[index]}");
            }
            else
            {
                child.gameObject.SetActive(false);
            }
        }
    }

    private void ApplyColor(Transform target, Color color)
    {
        Renderer renderer = target.GetComponent<Renderer>() ?? target.GetComponentInChildren<Renderer>();
        if (renderer != null)
        {
            foreach (var mat in renderer.materials)
            {
                mat.color = color;
            }
        }
    }

    private IEnumerator PlayMotionWithRecording()
    {
        List<Transform> lastFaceObjects = new List<Transform>();
        bool firstLoopDone = false;

        while (true)
        {
            if (firstLoopDone)
                OnStartRecording?.Invoke();

            foreach (var motionName in motionNames)
            {
                // 1. 표정 끄기
                foreach (var faceObj in lastFaceObjects)
                {
                    if (faceObj != null)
                        faceObj.gameObject.SetActive(false);
                }
                lastFaceObjects.Clear();

                // 2. 현재 모션 표정 가져오기
                if (motionToFaceMap.TryGetValue(motionName, out List<string> faceNames))
                {
                    currentFaceNames = faceNames;
                }
                else
                {
                    currentFaceNames = new List<string>();
                }

                // 3. 표정 켜기
                foreach (string faceName in currentFaceNames)
                {
                    Transform faceObj = rootObject.transform.Find(faceName);
                    if (faceObj != null)
                    {
                        faceObj.gameObject.SetActive(true);
                        lastFaceObjects.Add(faceObj);
                        Debug.Log($"표정 오브젝트 활성화: {faceName}");
                    }
                }

                // 4. 모션 재생
                characterAnimator.Play(motionName);
                Debug.Log($"모션 재생: {motionName}");

                AnimationClip clip = GetAnimationClip(motionName);

                if (clip != null)
                {
                    Debug.Log($"[DEBUG] {motionName} clip length: {clip.length}초");
                    yield return new WaitForSeconds(clip.length);
                }
                else
                {
                    Debug.LogWarning($"모션 클립을 찾을 수 없음: {motionName}");
                    yield return new WaitForSeconds(1f);
                }
            }

            if (firstLoopDone)
            {
                OnStopRecording?.Invoke();
                break; // 2번째 루프 끝나면 종료
            }

            firstLoopDone = true;
        }
    }

    private float CalculateTotalMotionDuration()
    {
        float totalDuration = 0f;

        foreach (var motionName in motionNames)
        {
            AnimationClip clip = GetAnimationClip(motionName);
            if (clip != null)
            {
                totalDuration += clip.length;
            }
            else
            {
                totalDuration += 1f; // fallback
            }
        }

        Debug.Log($"[DEBUG] 총 모션 재생 시간: {totalDuration}초");
        return totalDuration;
    }

    private AnimationClip GetAnimationClip(string clipName)
    {
        if (characterAnimator == null) return null;

        foreach (var clip in characterAnimator.runtimeAnimatorController.animationClips)
        {
            if (clip.name == clipName)
                return clip;
        }
        return null;
    }
}
