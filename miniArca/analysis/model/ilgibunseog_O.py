import hashlib
import json
import re
import requests
import time

# Ollama API 설정
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3"  # 설치한 모델 이름

response_cache = {}

# Ollama 호출 함수
def call_ollama_model(full_prompt):
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": full_prompt,
            "stream": False
        }
    )
    response.raise_for_status()
    response_json = response.json()
    return response_json["response"]

# JSON 파싱
def extract_json(text):
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        return json_match.group(0)
    else:
        raise ValueError("JSON 응답을 찾을 수 없습니다.")

# 공통 캐시
def cache_response(text, key_suffix, data):
    text_hash = hashlib.md5((text + key_suffix).encode('utf-8')).hexdigest()
    response_cache[text_hash] = data
    return data

def get_cached_response(text, key_suffix):
    text_hash = hashlib.md5((text + key_suffix).encode('utf-8')).hexdigest()
    return response_cache.get(text_hash)

# 감정 분석
def emotion_anal(text):
    cached_response = get_cached_response(text, "_emotion")
    if cached_response:
        return cached_response
    
    start_time = time.time()
    instructions = """
주어진 한국어 텍스트에서 전반적인 내용을 깊이 있게 이해하여 감정을 분석하세요.
가장 높은 강도를 가지는 감정을 주요 감정으로 선택하세요.
정확히 다음 JSON 형식으로 응답하세요:
{
    "주요 감정": "감정 이름",
    "감정 강도": 숫자 (0~100),
    "세부 감정": [
        {"감정": "감정 이름", "강도": 숫자 (0~100)},
        {"감정": "감정 이름", "강도": 숫자 (0~100)},
        {"감정": "감정 이름", "강도": 숫자 (0~100)}
    ]
}
"""
    full_prompt = f"{instructions}\n텍스트: {text}\n응답:"
    response = call_ollama_model(full_prompt)
    elapsed_time = time.time() - start_time
    print(f"🕒 emotion_anal 실행 시간: {elapsed_time:.2f}초")
    return cache_response(text, "_emotion", json.loads(extract_json(response)))

# 장소 추출
def extract_places(text):
    cached_response = get_cached_response(text, "_places")
    if cached_response:
        return cached_response
    
    start_time = time.time()
    instructions = """
주어진 한국어 텍스트에서 가장 핵심적인 장소 하나를 추출하세요.
고유명사는 보통명사로 바꿔주세요. (예: '서울역' → '기차역')
정확히 다음 JSON 형식으로 응답하세요:
{
    "장소": "장소 이름"
}
중요: 응답은 반드시 한국어로 작성하고, 위에 제시된 JSON 형식을 정확히 따라주세요.
"""
    full_prompt = f"{instructions}\n텍스트: {text}\n응답:"
    response = call_ollama_model(full_prompt)
    elapsed_time = time.time() - start_time
    print(f"🕒 extract_places 실행 시간: {elapsed_time:.2f}초")
    return cache_response(text, "_places", json.loads(extract_json(response)))

# 사물 키워드 추출
def extract_object_keywords(text, excluded_keywords=None):
    cached_response = get_cached_response(text, "_object_keywords")
    if cached_response:
        return cached_response
    
    start_time = time.time()
    instructions = """
주어진 한국어 텍스트에서 장소와 관련 없는 주요 명사 5개를 추출하세요.
정확히 다음 JSON 형식으로 응답하세요:
{
    "사물 키워드": ["명사1", "명사2", "명사3", "명사4", "명사5"]
}
중요: 응답은 반드시 한국어로 작성하고, 위에 제시된 JSON 형식을 정확히 따라주세요.
단, 장소와 관련된 키워드는 제외하고, 사물 키워드만 추출하세요.
"""
    if excluded_keywords:
        instructions += f"\n단, 다음 키워드는 제외하세요: {', '.join(excluded_keywords)}."

    full_prompt = f"{instructions}\n텍스트: {text}\n응답:"
    response = call_ollama_model(full_prompt)
    elapsed_time = time.time() - start_time
    print(f"🕒 extract_places 실행 시간: {elapsed_time:.2f}초")
    return cache_response(text, "_object_keywords", json.loads(extract_json(response)))

# 60자 이내 요약
def summarize_text(text):
    cached_response = get_cached_response(text, "_summary")
    if cached_response:
        return cached_response
    
    start_time = time.time()
    instructions = """
다음 한국어 텍스트를 최대한 핵심 내용만 반영하여 요약하세요.
요약 문장은 띄어쓰기 포함 60자를 넘지 않아야 하며, 자연스러운 한국어 문장으로 만들어주세요.
정확히 다음 JSON 형식으로 응답하세요:
{
    "요약": "요약된 문장"
}
중요: 응답은 반드시 한국어로 작성하고, 위에 제시된 JSON 형식을 정확히 따라주세요.
"""
    full_prompt = f"{instructions}\n텍스트: {text}\n응답:"
    response = call_ollama_model(full_prompt)
    elapsed_time = time.time() - start_time
    print(f"🕒 extract_places 실행 시간: {elapsed_time:.2f}초")
    return cache_response(text, "_summary", json.loads(extract_json(response)))

# 테스트
if __name__ == "__main__":
    sample_text = "오늘은 한강 공원에 다녀왔다. 흐린 날씨였지만 바람이 시원해서 산책하기 좋았다. 강을 따라 걷다 보니 마음이 한결 가벼워지는 느낌이었다. 벤치에 앉아 커피를 마시며 한참을 강물 흐름만 바라봤다. 바쁜 일상 속 잠시 숨을 고를 수 있어 고마운 시간이었다."
    result = emotion_anal(sample_text)
    print(json.dumps(result, ensure_ascii=False, indent=2))






