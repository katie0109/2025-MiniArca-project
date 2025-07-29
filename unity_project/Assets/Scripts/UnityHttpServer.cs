using UnityEngine;
using System.Net;
using System.Text;
using System.Threading;
using System;

public class UnityHttpServer : MonoBehaviour
{
    private HttpListener listener;
    private Thread listenerThread;
    private string url = "http://localhost:8081/notify/";

    void Start()
    {
        listener = new HttpListener();
        listener.Prefixes.Add(url);
        listener.Start();

        listenerThread = new Thread(HandleIncomingConnections);
        listenerThread.Start();

        Debug.Log("Unity HTTP Server started at " + url);
    }

    private void HandleIncomingConnections()
    {
        while (true)
        {
            try
            {
                Debug.Log("��� ��...");
                var context = listener.GetContext();
                var request = context.Request;

                Debug.Log("��û ����: " + request.HttpMethod + " " + request.Url.AbsolutePath);

                if (request.HttpMethod == "POST" && request.Url.AbsolutePath.StartsWith("/notify"))
                {
                    using (var reader = new System.IO.StreamReader(request.InputStream, request.ContentEncoding))
                    {
                        string requestBody = reader.ReadToEnd();
                        Debug.Log(" Body: " + requestBody);

                        string analysisId = ExtractAnalysisId(requestBody);
                        Debug.Log(" �м� ID: " + analysisId);

                        UnityMainThreadDispatcher.Instance().Enqueue(() =>
                        {
                            var autoRun = FindObjectOfType<AutoRun>();
                            if (autoRun != null)
                            {
                                Debug.Log(" AutoRun ��ü ã��. �ڷ�ƾ ����");
                                autoRun.StartCoroutine(autoRun.HandleAnalysisId(analysisId));
                            }
                            else
                            {
                                Debug.LogError(" AutoRun ��ü �� ã��!");
                            }
                        });
                    }
                }

                // ���� ������
                var response = context.Response;
                string responseString = "{\"status\":\"ok\"}";
                byte[] buffer = Encoding.UTF8.GetBytes(responseString);
                response.ContentLength64 = buffer.Length;
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.OutputStream.Close();
            }
            catch (Exception ex)
            {
                Debug.LogError(" HTTP Server Error: " + ex);
            }
        }
    }

    private string ExtractAnalysisId(string json)
    {
        try
        {
            int start = json.IndexOf(":\"") + 2;
            int end = json.IndexOf("\"", start);
            if (start >= 2 && end > start)
            {
                return json.Substring(start, end - start);
            }
        }
        catch
        {
            Debug.LogWarning(" analysis_id �Ľ� ����, ����: " + json);
        }
        return "";
    }

    void OnApplicationQuit()
    {
        if (listener != null && listener.IsListening)
        {
            listener.Stop();
            Debug.Log("HTTP ���� ����");
        }
        if (listenerThread != null && listenerThread.IsAlive)
        {
            listenerThread.Abort();
        }
    }
}
