//#if UNITY_EDITOR
//using UnityEngine;
//using UnityEditor;
//using System.IO;

//public class CleanPrefabGenerator : MonoBehaviour
//{
//    [MenuItem("Tools/Generate Clean Prefabs from FBX")]
//    static void GenerateCleanPrefabs()
//    {
//        string fbxFolder = "Assets/new"; // �ʰ� ������ ����
//        string prefabFolder = "Assets/new/cleanPrefabs"; // ��� ���� ����

//        // ������ ���� ������ �����
//        if (!AssetDatabase.IsValidFolder(prefabFolder))
//        {
//            AssetDatabase.CreateFolder("Assets/new", "cleanPrefabs");
//        }

//        // fbx �� ���� �˻�
//        string[] guids = AssetDatabase.FindAssets("t:Model", new[] { fbxFolder });

//        int count = 0;
//        foreach (string guid in guids)
//        {
//            string fbxPath = AssetDatabase.GUIDToAssetPath(guid);
//            GameObject fbxAsset = AssetDatabase.LoadAssetAtPath<GameObject>(fbxPath);

//            if (fbxAsset == null)
//            {
//                Debug.LogWarning($"�ҷ����� ����: {fbxPath}");
//                continue;
//            }

//            // fbx �ν��Ͻ� ����
//            GameObject instance = (GameObject)PrefabUtility.InstantiatePrefab(fbxAsset);

//            if (instance == null)
//            {
//                Debug.LogWarning($"�ν��Ͻ� ���� ����: {fbxPath}");
//                continue;
//            }

//            // Animator ����
//            Animator animator = instance.GetComponent<Animator>();
//            if (animator != null)
//            {
//                DestroyImmediate(animator);
//            }

//            // Prefab ����
//            string fileName = Path.GetFileNameWithoutExtension(fbxPath);
//            string savePath = Path.Combine(prefabFolder, fileName + ".prefab").Replace("\\", "/");

//            PrefabUtility.SaveAsPrefabAsset(instance, savePath);
//            DestroyImmediate(instance); // �ν��Ͻ� ����
//            count++;
//        }

//        AssetDatabase.Refresh();
//        Debug.Log($"�Ϸ�: {count}�� Prefab ���� (Animator ���� �Ϸ�)");
//    }
//}
//#endif
