// === WallManager.cs ===
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using SimpleJSON;
using System.IO;

public class WallManager : MonoBehaviour
{
    public GameObject wallPrefab;
    private GameObject currentWall = null;

    public IEnumerator BuildWall(string docId)
    {
        string url = $"http://localhost:8000/background/{docId}";

        using (UnityWebRequest request = UnityWebRequest.Get(url))
        {
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                JSONNode data = JSON.Parse(request.downloadHandler.text);
                string imagePath = data["background_image_path"];

                Debug.Log("가져온 이미지 경로: " + imagePath);
                yield return StartCoroutine(CreateWallWithTexture(imagePath));
            }
            else
            {
                Debug.LogError("배경 이미지 경로 가져오기 실패: " + request.error);
            }
        }
    }

    private IEnumerator CreateWallWithTexture(string imageUrl)
    {
        if (currentWall != null)
        {
            Destroy(currentWall);
            Debug.Log("기존 벽 삭제됨.");
        }

        if (wallPrefab == null)
        {
            wallPrefab = GameObject.CreatePrimitive(PrimitiveType.Quad);
        }

        currentWall = Instantiate(wallPrefab, new Vector3(0, 0, 0), Quaternion.identity);
        currentWall.transform.localScale = new Vector3(10f, 6f, 1f);

        using (UnityWebRequest request = UnityWebRequestTexture.GetTexture(imageUrl))
        {
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                Texture2D texture = DownloadHandlerTexture.GetContent(request);
                Material mat = new Material(Shader.Find("Unlit/Texture"));
                mat.mainTexture = texture;
                currentWall.GetComponent<Renderer>().material = mat;
                Debug.Log("배경 텍스처 적용 완료!");
            }
            else
            {
                Debug.LogError("텍스처 다운로드 실패: " + request.error);
            }
        }
    }

    // 캐릭터는 벽 기준으로 z = -3에 세운다
    public Vector3 GetWallFrontPosition(float distance)
    {
        return currentWall != null ? currentWall.transform.position + new Vector3(0, 0, -distance) : Vector3.zero;
    }

    // 카메라는 좀 더 멀고 높게 배치해서 전체 벽이 잘리거나 캐릭터만 커지지 않게
    public Vector3 GetCameraPosition(float distance)
    {
        return currentWall != null ? currentWall.transform.position + new Vector3(0, 4f, -distance) : Vector3.zero;
    }

}