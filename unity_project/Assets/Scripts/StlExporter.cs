using System.Collections.Generic;
using System.Globalization;
using System.IO;
using UnityEngine;

public static class StlExporter
{
    public static string ExportMeshToStl(GameObject obj, string filename, bool useTPose = true, bool centerAtOrigin = true)
    {
        Debug.Log($"[STL] ===== Export 시작 =====");
        Debug.Log($"[STL] RootObject: {obj.name}, 활성 상태: {obj.activeInHierarchy}, T-포즈: {useTPose}, 원점중심: {centerAtOrigin}");

        if (obj == null)
        {
            Debug.LogError("[STL] GameObject가 null입니다!");
            return "";
        }

        // T-포즈 설정 (3D 프린팅용)
        Animator animator = obj.GetComponentInChildren<Animator>();
        bool wasAnimatorEnabled = false;
        RuntimeAnimatorController originalController = null;

        if (useTPose && animator != null)
        {
            wasAnimatorEnabled = animator.enabled;
            originalController = animator.runtimeAnimatorController;
            animator.enabled = false; // T-포즈로 만들기
            Debug.Log("[STL] T-포즈로 설정됨 (3D 프린팅 최적화)");
        }

        List<Mesh> meshes = new List<Mesh>();
        List<Transform> transforms = new List<Transform>();

        // 1. MeshFilter 찾기
        MeshFilter[] meshFilters = obj.GetComponentsInChildren<MeshFilter>(true);
        Debug.Log($"[STL] 발견된 MeshFilter 수: {meshFilters.Length}");

        foreach (var mf in meshFilters)
        {
            if (mf.sharedMesh != null && mf.gameObject.activeInHierarchy)
            {
                Debug.Log($"[STL]  MeshFilter 메쉬 포함: {mf.name}");
                meshes.Add(mf.sharedMesh);
                transforms.Add(mf.transform);
            }
        }

        // 2. SkinnedMeshRenderer 찾기 (주요 추가 부분!)
        SkinnedMeshRenderer[] skinnedRenderers = obj.GetComponentsInChildren<SkinnedMeshRenderer>(true);
        Debug.Log($"[STL] 발견된 SkinnedMeshRenderer 수: {skinnedRenderers.Length}");

        foreach (var smr in skinnedRenderers)
        {
            if (smr.sharedMesh != null && smr.gameObject.activeInHierarchy)
            {
                Debug.Log($"[STL]  SkinnedMeshRenderer 메쉬 포함: {smr.name}");

                Mesh bakedMesh = new Mesh();
                smr.BakeMesh(bakedMesh);

                // 디버깅용: 베이크된 메시 버텍스 범위 출력
                Vector3 bakedMin = Vector3.positiveInfinity;
                Vector3 bakedMax = Vector3.negativeInfinity;
                foreach (var v in bakedMesh.vertices)
                {
                    bakedMin = Vector3.Min(bakedMin, v);
                    bakedMax = Vector3.Max(bakedMax, v);
                }
                Debug.Log($"[STL] {smr.name} bakedMesh 로컬 버텍스 범위: Min{bakedMin}, Max{bakedMax}");

                meshes.Add(bakedMesh);
                transforms.Add(smr.transform);
            }
        }


        if (meshes.Count == 0)
        {
            Debug.LogError("[STL]  저장할 메쉬가 없습니다. STL 저장 중단.");

            // 애니메이터 복구
            if (useTPose && animator != null)
            {
                animator.enabled = wasAnimatorEnabled;
                animator.runtimeAnimatorController = originalController;
            }

            // 추가 디버깅: 모든 자식 오브젝트 확인
            Debug.Log("[STL] === 자식 오브젝트 디버깅 ===");
            Transform[] allChildren = obj.GetComponentsInChildren<Transform>(true);
            foreach (var child in allChildren)
            {
                MeshFilter mf = child.GetComponent<MeshFilter>();
                MeshRenderer mr = child.GetComponent<MeshRenderer>();
                SkinnedMeshRenderer smr = child.GetComponent<SkinnedMeshRenderer>();
                Debug.Log($"[STL] 자식: {child.name}, MeshFilter: {mf != null}, MeshRenderer: {mr != null}, SkinnedMeshRenderer: {smr != null}, 활성: {child.gameObject.activeInHierarchy}");
            }

            return "";
        }

        // 중심점 계산 (3D 프린팅용 원점 배치)
        Vector3 centerOffset = Vector3.zero;
        if (centerAtOrigin)
        {
            centerOffset = CalculateCenter(meshes, transforms);
            Debug.Log($"[STL] 원점 중심 배치 - 오프셋: {centerOffset}");
        }

        // 저장 경로 생성
        string path = @"C:\Users\DS\miniArca\STL";
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
            Debug.Log($"[STL]  폴더 생성: {path}");
        }

        string filePath = Path.Combine(path, filename + ".stl");
        Debug.Log($"[STL]  저장 경로: {filePath}");

        try
        {
            using (StreamWriter sw = new StreamWriter(filePath))
            {
                sw.WriteLine("solid exported");

                int totalTriangles = 0;
                for (int i = 0; i < meshes.Count; i++)
                {
                    Mesh mesh = meshes[i];
                    Transform t = transforms[i];
                    Vector3[] vertices = mesh.vertices;
                    int[] triangles = mesh.triangles;

                    Debug.Log($"[STL] 메쉬 {i}: {vertices.Length} 버텍스, {triangles.Length / 3} 삼각형");
                    totalTriangles += triangles.Length / 3;

                    for (int j = 0; j < triangles.Length; j += 3)
                    {
                        // 월드 좌표로 변환 후 중심점 보정 (3D 프린팅용)
                        Vector3 v0 = t.TransformPoint(vertices[triangles[j]]) - centerOffset;
                        Vector3 v1 = t.TransformPoint(vertices[triangles[j + 1]]) - centerOffset;
                        Vector3 v2 = t.TransformPoint(vertices[triangles[j + 2]]) - centerOffset;
                        Vector3 normal = Vector3.Cross(v1 - v0, v2 - v0).normalized;

                        sw.WriteLine($"facet normal {FormatVec(normal)}");
                        sw.WriteLine("  outer loop");
                        sw.WriteLine($"    vertex {FormatVec(v0)}");
                        sw.WriteLine($"    vertex {FormatVec(v1)}");
                        sw.WriteLine($"    vertex {FormatVec(v2)}");
                        sw.WriteLine("  endloop");
                        sw.WriteLine("endfacet");
                    }
                }

                sw.WriteLine("endsolid exported");
                Debug.Log($"[STL]  총 {totalTriangles}개 삼각형 저장 완료");
            }

            // 파일 생성 확인
            if (File.Exists(filePath))
            {
                FileInfo fileInfo = new FileInfo(filePath);
                Debug.Log($"[STL]  3D 프린팅용 STL 파일 저장 성공!");
                Debug.Log($"[STL]  파일 크기: {fileInfo.Length} bytes");
                Debug.Log($"[STL]  전체 경로: {filePath}");

                // 애니메이터 복구
                if (useTPose && animator != null)
                {
                    animator.enabled = wasAnimatorEnabled;
                    animator.runtimeAnimatorController = originalController;
                    Debug.Log("[STL] 애니메이터 복구 완료");
                }

                return filePath;
            }
            else
            {
                Debug.LogError("[STL]  파일이 생성되지 않았습니다!");

                // 애니메이터 복구
                if (useTPose && animator != null)
                {
                    animator.enabled = wasAnimatorEnabled;
                    animator.runtimeAnimatorController = originalController;
                }

                return "";
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[STL]  STL 파일 저장 중 오류: {e.Message}");
            Debug.LogError($"[STL] 스택 트레이스: {e.StackTrace}");

            // 애니메이터 복구
            if (useTPose && animator != null)
            {
                animator.enabled = wasAnimatorEnabled;
                animator.runtimeAnimatorController = originalController;
            }

            return "";
        }
    }

    private static Vector3 CalculateCenter(List<Mesh> meshes, List<Transform> transforms)
    {
        Vector3 min = Vector3.positiveInfinity;
        Vector3 max = Vector3.negativeInfinity;

        for (int i = 0; i < meshes.Count; i++)
        {
            Mesh mesh = meshes[i];
            Transform t = transforms[i];

            foreach (Vector3 vertex in mesh.vertices)
            {
                Vector3 worldVertex = t.TransformPoint(vertex);
                min = Vector3.Min(min, worldVertex);
                max = Vector3.Max(max, worldVertex);
            }
        }

        return (min + max) * 0.5f; // 중심점 계산
    }

    private static string FormatVec(Vector3 v)
    {
        return v.x.ToString("F6", CultureInfo.InvariantCulture) + " " +
               v.y.ToString("F6", CultureInfo.InvariantCulture) + " " +
               v.z.ToString("F6", CultureInfo.InvariantCulture);
    }
}