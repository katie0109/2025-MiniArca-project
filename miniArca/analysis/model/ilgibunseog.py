# -*- coding: utf-8 -*-

import os
from dotenv import load_dotenv
import json
import hashlib
import logging
import re
import time
from typing import Dict, List
import google.generativeai as genai



logging.basicConfig(level=logging.WARNING)


response_cache = {}

# Load environment variables from .env file
load_dotenv()

GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY is not set in the environment. Please check your .env file.")

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

# ---------------------
# 3. 감정 분석 함수
# ---------------------
def emotion_anal(text):
    """
    감정 분석 함수
    """
    cached_response = get_cached_response(text, "_emotion")
    if cached_response:
        return cached_response
    
    instructions = """
    주어진 한국어 텍스트에서 전반적인 내용을 깊이 있게 이해하여 감정을 분석해주세요.
    가장 높은 강도를 가지는 감정을 주요 감정으로 선택해주세요.
    세부 감정은 높은 강도순대로 나열해주세요.
    다음 형식으로 정확하게 결과를 제공해주세요:
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
    
    prompt = f"텍스트: {text}\n분석 결과:"
    full_prompt = f"{instructions}\n{prompt}"
    
    response = call_gemini_model(full_prompt)
    return cache_response(text, "_emotion", response)



# ---------------------
# 4. 장소 추출 함수
# ---------------------

def extract_places(text):
    """
    장소 추출 함수
    """
    cached_response = get_cached_response(text, "_places")
    if cached_response:
        return cached_response
    
    instructions = """
    텍스트에서 핵심적인 장소를 하나만 선택해주세요.
    장소가 만약 고유명사이면 대명사로 바꾸어주세요.예를 들어 '서울역'일 경우 '기차역' 으로 바꾸는 것처럼 대명사로 바꾸어주세요.
    만약 장소가 없다면 텍스트에서 장소를 분석해서 장소를 추출해주세요.
    다음 형식으로 정확하게 결과를 제공해주세요:
    {
        "장소": "장소 이름"
    }
    """
    
    prompt = f"텍스트: {text}\n장소 추출:"
    full_prompt = f"{instructions}\n{prompt}"
    
    response = call_gemini_model(full_prompt)
    return cache_response(text, "_places", response)

# ---------------------
# 5. 사물 키워드 추출 함수
# ---------------------
def extract_object_keywords(text, excluded_keywords=None):
    """
    사물 키워드 추출 함수
    """
    cached_response = get_cached_response(text, "_object_keywords")
    if cached_response:
        return cached_response
    
    instructions = """
    중요: 장소와 관련된 단어들은 포함하지 마세요.
    주어진 한국어 텍스트에서 주요 감정 또는 세부 감정과 관련된 사물, 상황 또는 개념을 중심으로 명사를 5개 추출해주세요.
    다음 형식으로 정확하게 결과를 제공해주세요:
    {
        "사물 키워드": ["명사1", "명사2", "명사3", "명사4", "명사5"]
    }
    """
    
    if excluded_keywords:
        excluded_string = ", ".join(excluded_keywords)
        instructions += f"\n단, 다음 키워드는 결과에서 제외해주세요: {excluded_string}."
    
    prompt = f"텍스트: {text}\n사물 키워드 추출 결과:"
    full_prompt = f"{instructions}\n{prompt}"
    
    response = call_gemini_model(full_prompt)
    return cache_response(text, "_object_keywords", response)

# ---------------------
# 7. 텍스트 요약 함수 (60자 이내)
# ---------------------
def summarize_text(text):
    """
    입력된 텍스트를 띄어쓰기 포함 60자 이내로 요약
    """
    cached_response = get_cached_response(text, "_summary")
    if cached_response:
        return cached_response
    
    instructions = """
    다음 한국어 텍스트를 핵심 내용만 담아 요약해주세요.
    중요 : 요약문은 공백, 띄어쓰기, 문장부호, 숫자 등 모든 문자를 포함한 글자수가 45글자 이상 55글자 이하여야 합니다.


    **응답 형식:**
    {
        "요약": "요약문"
    }
    """

    # instructions = """
    # 다음 한국어 텍스트를 최대한 핵심 내용만 반영하여 요약해주세요.
    # 요약 문장은 공백, 문장부호, 숫자 등 모든 문자의 개수를 포함해서 최소 50자에서 최대 60자로 요약해야 하며, 자연스러운 한국어 문장으로 만들어주세요.
    # 아래 형식처럼 정확히 JSON으로 응답해주세요:
    # {
    #     "요약": "요약된 문장"
    # }
    # """
    
    prompt = f"텍스트: {text}\n요약 결과:"
    full_prompt = f"{instructions}\n{prompt}"

    response = call_gemini_model(full_prompt)
    return cache_response(text, "_summary", response)


# ---------------------
# 6. 통합 사용 예시
# ---------------------
def analyze_text(text):
    place_result = extract_places(text)
    excluded_keywords = [place_result.get("장소")] if place_result.get("장소") else []
    object_keywords_result = extract_object_keywords(text, excluded_keywords=excluded_keywords)
    emotion_result = emotion_anal(text)
    summary_result = summarize_text(text)

    
    return {
        "emotion": emotion_result,
        "place": place_result,
        "object_keywords": object_keywords_result,
        "summary": summary_result
    }

    print(json.dumps(result, ensure_ascii=False, indent=4))



