using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;

public class STLExporter : MonoBehaviour
{
    [ContextMenu("Export Unified STL from 'just'")]
    public void ExportUnifiedSTL()
    {
        GameObject parent = GameObject.Find("just");
        if (parent == null)
        {
            Debug.LogError("GameObject named 'just' not found.");
            return;
        }

        // 1. 임시 복제 오브젝트 생성
        GameObject tempRoot = new GameObject("Temp_ExportRoot");

        var meshFilters = parent.GetComponentsInChildren<MeshFilter>(true);
        var skinnedMeshes = parent.GetComponentsInChildren<SkinnedMeshRenderer>(true);

        foreach (var mf in meshFilters)
        {
            if (mf.sharedMesh == null) continue;

            GameObject copy = new GameObject(mf.name + "_copy");
            copy.transform.SetParent(tempRoot.transform);
            copy.transform.position = mf.transform.position;
            copy.transform.rotation = mf.transform.rotation;
            copy.transform.localScale = mf.transform.lossyScale;

            var meshFilter = copy.AddComponent<MeshFilter>();
            var meshRenderer = copy.AddComponent<MeshRenderer>();

            meshFilter.sharedMesh = mf.sharedMesh;
        }

        foreach (var smr in skinnedMeshes)
        {
            if (smr.sharedMesh == null) continue;

            Mesh baked = new Mesh();
            smr.BakeMesh(baked);

            GameObject copy = new GameObject(smr.name + "_copy");
            copy.transform.SetParent(tempRoot.transform);
            copy.transform.position = smr.transform.position;
            copy.transform.rotation = smr.transform.rotation;
            copy.transform.localScale = smr.transform.lossyScale;

            var meshFilter = copy.AddComponent<MeshFilter>();
            var meshRenderer = copy.AddComponent<MeshRenderer>();

            meshFilter.sharedMesh = baked;
        }

        // 2. 모든 메시 STL로 저장
        ExportSTLFromObject(tempRoot);

        // 3. 끝나고 임시 오브젝트 제거
        DestroyImmediate(tempRoot);
    }

    void ExportSTLFromObject(GameObject root)
    {
        var meshFilters = root.GetComponentsInChildren<MeshFilter>();

        string path = Application.dataPath + "/just_combined.stl";
        using (BinaryWriter writer = new BinaryWriter(File.Open(path, FileMode.Create)))
        {
            writer.Write(new byte[80]); // STL header
            uint triangleCount = 0;
            List<byte[]> triangleData = new List<byte[]>();

            // 중심 계산
            List<Vector3> allPoints = new List<Vector3>();
            foreach (var mf in meshFilters)
            {
                Mesh mesh = mf.sharedMesh;
                if (mesh == null) continue;

                Vector3[] vertices = mesh.vertices;
                foreach (var v in vertices)
                    allPoints.Add(mf.transform.TransformPoint(v));
            }

            Vector3 center = Vector3.zero;
            foreach (var p in allPoints) center += p;
            center /= allPoints.Count;

            Quaternion rotate = Quaternion.Euler(-180f, -90f, 90f);

            foreach (var mf in meshFilters)
            {
                Mesh mesh = mf.sharedMesh;
                if (mesh == null) continue;

                Vector3[] vertices = mesh.vertices;
                int[] triangles = mesh.triangles;

                for (int i = 0; i < triangles.Length; i += 3)
                {
                    Vector3 v0 = rotate * ((mf.transform.TransformPoint(vertices[triangles[i]]) - center) * 1000f);
                    Vector3 v1 = rotate * ((mf.transform.TransformPoint(vertices[triangles[i + 1]]) - center) * 1000f);
                    Vector3 v2 = rotate * ((mf.transform.TransformPoint(vertices[triangles[i + 2]]) - center) * 1000f);

                    Vector3 normal = Vector3.Cross(v1 - v0, v2 - v0).normalized;

                    using (MemoryStream ms = new MemoryStream(50))
                    using (BinaryWriter bw = new BinaryWriter(ms))
                    {
                        bw.Write(normal.x); bw.Write(normal.y); bw.Write(normal.z);
                        bw.Write(v0.x); bw.Write(v0.y); bw.Write(v0.z);
                        bw.Write(v1.x); bw.Write(v1.y); bw.Write(v1.z);
                        bw.Write(v2.x); bw.Write(v2.y); bw.Write(v2.z);
                        bw.Write((ushort)0);
                        triangleData.Add(ms.ToArray());
                        triangleCount++;
                    }
                }
            }

            writer.Seek(80, SeekOrigin.Begin);
            writer.Write(triangleCount);
            foreach (var t in triangleData) writer.Write(t.ToArray());

            Debug.Log($"✅ Unified STL export complete: {path} ({triangleCount} triangles)");
        }
    }
}
