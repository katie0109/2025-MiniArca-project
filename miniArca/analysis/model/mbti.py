# -*- coding: utf-8 -*-
import json
import hashlib
import logging
import re
import time
import google.generativeai as genai


logging.basicConfig(level=logging.WARNING)

response_cache = {}

GOOGLE_API_KEY = 'AIzaSyD5HJpCTFOEtkw3gJJadeTC6t65WAzE6kI'

genai.configure(api_key=GOOGLE_API_KEY)

model = genai.GenerativeModel('gemini-1.5-flash')

# 기본 재시도 설정
MAX_RETRIES = 10
RETRY_DELAY = 1  # 초 단위 지연 시간

# ---------------------
# 2. 공통 함수
# ---------------------
def cache_response(text, key_suffix, data):
    """
    응답 결과를 해시 기반 캐시에 저장
    """
    text_hash = hashlib.md5((text + key_suffix).encode('utf-8')).hexdigest()
    response_cache[text_hash] = data
    return data

def get_cached_response(text, key_suffix):
    """
    캐시 확인 및 가져오기
    """
    text_hash = hashlib.md5((text + key_suffix).encode('utf-8')).hexdigest()
    return response_cache.get(text_hash)

def call_gemini_model(full_prompt):
    """
    공통 모델 호출 함수 (generate_content)
    """
    for attempt in range(MAX_RETRIES):
        try:
            # 모델 호출
            response = model.generate_content(full_prompt)
            response_text = response.text.strip()
            
            # JSON 부분만 추출 (정규 표현식 사용)
            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
                return json.loads(json_text)
            else:
                logging.error(f"Attempt {attempt + 1}: No JSON found in response.")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
        
        except json.JSONDecodeError as e:
            logging.error(f"Attempt {attempt + 1}: Invalid JSON format: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
    
    # 최대 시도 횟수 초과 시 기본값 반환
    logging.error("Maximum retries reached. Returning default response.")
    return {}

def get_emotion_mbti(emotion_analysis, final_emotions, object_keywords):
    full_prompt = f"""
다음은 한 사람의 감정 분석 결과이다. 이 데이터를 바탕으로 감정 기반 MBTI를 추정해줘.
EI는 감정의 활력(고활성/저활성)과 강도에 따라 결정하고,
SN은 키워드의 구체성 여부를 고려해 판단하고,
TF는 감정 기반으로 판단하되 감성적인 경향이면 F로,
JP는 감정 흐름이 질서 정연한가 즉흥적인가를 기준으로 판단해.
판단 기준은 설명하지 말고, **MBTI 4글자만 출력**해.

[감정 분석 결과]
emotion_analysis: {json.dumps(emotion_analysis, ensure_ascii=False)}
final_emotions: {json.dumps(final_emotions, ensure_ascii=False)}
object_keywords: {json.dumps(object_keywords, ensure_ascii=False)}

MBTI:
"""

    cached = get_cached_response(full_prompt, "emotion_mbti")
    if cached:
        return cached

    result = call_gemini_model(full_prompt)

    if isinstance(result, dict) and 'mbti' in result:
        return cache_response(full_prompt, "emotion_mbti", result['mbti'])
    elif isinstance(result, str):
        return cache_response(full_prompt, "emotion_mbti", result.strip())
    else:
        return cache_response(full_prompt, "emotion_mbti", "ISFP")