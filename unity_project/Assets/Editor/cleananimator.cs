//#if UNITY_EDITOR
//using UnityEngine;
//using UnityEditor;
//using System.IO;

//public class CleanPrefabGenerator : MonoBehaviour
//{
//    [MenuItem("Tools/Generate Clean Prefabs from FBX")]
//    static void GenerateCleanPrefabs()
//    {
//        string fbxFolder = "Assets/new"; // 너가 지정한 폴더
//        string prefabFolder = "Assets/new/cleanPrefabs"; // 결과 저장 폴더

//        // 저장할 폴더 없으면 만든다
//        if (!AssetDatabase.IsValidFolder(prefabFolder))
//        {
//            AssetDatabase.CreateFolder("Assets/new", "cleanPrefabs");
//        }

//        // fbx 모델 전부 검색
//        string[] guids = AssetDatabase.FindAssets("t:Model", new[] { fbxFolder });

//        int count = 0;
//        foreach (string guid in guids)
//        {
//            string fbxPath = AssetDatabase.GUIDToAssetPath(guid);
//            GameObject fbxAsset = AssetDatabase.LoadAssetAtPath<GameObject>(fbxPath);

//            if (fbxAsset == null)
//            {
//                Debug.LogWarning($"불러오기 실패: {fbxPath}");
//                continue;
//            }

//            // fbx 인스턴스 생성
//            GameObject instance = (GameObject)PrefabUtility.InstantiatePrefab(fbxAsset);

//            if (instance == null)
//            {
//                Debug.LogWarning($"인스턴스 생성 실패: {fbxPath}");
//                continue;
//            }

//            // Animator 삭제
//            Animator animator = instance.GetComponent<Animator>();
//            if (animator != null)
//            {
//                DestroyImmediate(animator);
//            }

//            // Prefab 저장
//            string fileName = Path.GetFileNameWithoutExtension(fbxPath);
//            string savePath = Path.Combine(prefabFolder, fileName + ".prefab").Replace("\\", "/");

//            PrefabUtility.SaveAsPrefabAsset(instance, savePath);
//            DestroyImmediate(instance); // 인스턴스 삭제
//            count++;
//        }

//        AssetDatabase.Refresh();
//        Debug.Log($"완료: {count}개 Prefab 생성 (Animator 제거 완료)");
//    }
//}
//#endif
