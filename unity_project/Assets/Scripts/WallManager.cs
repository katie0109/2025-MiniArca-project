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

                Debug.Log("������ �̹��� ���: " + imagePath);
                yield return StartCoroutine(CreateWallWithTexture(imagePath));
            }
            else
            {
                Debug.LogError("��� �̹��� ��� �������� ����: " + request.error);
            }
        }
    }

    private IEnumerator CreateWallWithTexture(string imageUrl)
    {
        if (currentWall != null)
        {
            Destroy(currentWall);
            Debug.Log("���� �� ������.");
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
                Debug.Log("��� �ؽ�ó ���� �Ϸ�!");
            }
            else
            {
                Debug.LogError("�ؽ�ó �ٿ�ε� ����: " + request.error);
            }
        }
    }

    // ĳ���ʹ� �� �������� z = -3�� �����
    public Vector3 GetWallFrontPosition(float distance)
    {
        return currentWall != null ? currentWall.transform.position + new Vector3(0, 0, -distance) : Vector3.zero;
    }

    // ī�޶�� �� �� �ְ� ���� ��ġ�ؼ� ��ü ���� �߸��ų� ĳ���͸� Ŀ���� �ʰ�
    public Vector3 GetCameraPosition(float distance)
    {
        return currentWall != null ? currentWall.transform.position + new Vector3(0, 4f, -distance) : Vector3.zero;
    }

}

