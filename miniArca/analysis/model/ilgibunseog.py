
# -*- coding: utf-8 -*-
import os
from dotenv import load_dotenv
import json
import hashlib
import logging
import re
import time
from typing import Dict, List
import threading
from datetime import datetime, timedelta
import google.generativeai as genai



logging.basicConfig(level=logging.WARNING)


response_cache = {}

# Load environment variables from .env file
load_dotenv()

GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY is not set in the environment. Please check your .env file.")

genai.configure(api_key=GOOGLE_API_KEY)

model = genai.GenerativeModel('gemma-3-12b-it')

# 기본 재시도 설정
MAX_RETRIES = 3
RETRY_DELAY = 2  # 초 단위 지연 시간

# --- 하루 호출량 확인 코드 시작 ---
MAX_CALLS_PER_DAY = 14400  # Flash 모델의 하루 무료 호출 제한
call_count_day = 0
# 다음 날 자정으로 리셋 시간 설정
day_reset_time = (datetime.now() + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
lock = threading.Lock()

def check_and_update_daily_limit():
    """하루 API 호출 제한을 확인하고 카운트를 업데이트합니다."""
    global call_count_day, day_reset_time
    now = datetime.now()
    with lock:
        # 자정이 지나면 카운트 초기화
        if now >= day_reset_time:
            call_count_day = 0
            day_reset_time = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            print("[알림] Gemini API 일일 호출 카운트가 초기화되었습니다.")

        # 제한 확인
        if call_count_day >= MAX_CALLS_PER_DAY:
            raise RuntimeError(f"Gemini API 일일 호출 제한({MAX_CALLS_PER_DAY}회)을 초과했습니다.")
        
        # 카운트 증가 및 현황 출력
        call_count_day += 1
        #print(f"[Gemini API 사용량] 오늘 호출: {call_count_day}/{MAX_CALLS_PER_DAY}")
        
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
    # --- 호출량 확인 함수 호출 추가 ---
    check_and_update_daily_limit()

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
    주어진 한국어 텍스트에서 감정과 관련된 핵심 명사를 5개 추출해주세요.
    장소와 관련된 단어는 포함하지 마세요.
    
    **매우 중요**: 응답 JSON 객체의 키는 반드시 "사물 키워드"여야 합니다. 절대로 다른 키 이름을 사용하지 마세요.

    아래 형식을 반드시 준수하여 결과를 제공해주세요:
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
    입력된 텍스트를 띄어쓰기 포함 30자 이내로 요약
    """
    cached_response = get_cached_response(text, "_summary")
    if cached_response:
        return cached_response
    
    instructions = """
    다음 한국어 텍스트를 핵심 내용만 담아 요약해주세요.
    중요 : 요약문은 공백, 띄어쓰기, 문장부호, 숫자 등 모든 문자를 포함한 글자수가 45글자 이하여야 합니다.


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


def recommend_song_by_emotion(text):
    """
    일기 감정에 따라 노래를 추천하는 함수
    """
    cached_response = get_cached_response(text, "_song_recommend")
    if cached_response:
        return cached_response

    instructions = """
    주어진 일기(한국어 텍스트)의 감정에 가장 잘 어울리는 노래를 3곡 추천해주세요. 각 노래는 제목과 가수명을 모두 포함하고, 각각의 추천 이유도 한 문장으로 설명해주세요. 아래와 같은 JSON 형식으로 응답하세요:
    {
        "노래 추천": [
            {"노래": "노래 제목 - 가수명", "추천 이유": "한 문장 설명"},
            {"노래": "노래 제목 - 가수명", "추천 이유": "한 문장 설명"},
            {"노래": "노래 제목 - 가수명", "추천 이유": "한 문장 설명"}
        ]
    }
    """
    prompt = f"텍스트: {text}\n추천 결과:"
    full_prompt = f"{instructions}\n{prompt}"
    response = call_gemini_model(full_prompt)
    return cache_response(text, "_song_recommend", response)

def emotion_insight(text):
    """
    감정분석 인사이트 제공 함수
    """
    cached_response = get_cached_response(text, "_emotion_insight")
    if cached_response:
        return cached_response

    instructions = """
    아래는 감정 분석 인사이트 예시입니다. 예시처럼 오늘 일기의 주요 감정(이름, 강도), 감정에 대한 해석, 긍정적 단어 사용 등 구체적이고 분석적인 인사이트를 3~5문장으로 작성해주세요.  반드시 아래 JSON 형식으로만 응답하세요.

    예시:
    {
        "인사이트": "감정 분석 인사이트\n오늘 작성한 일기에서는 행복(75%)과 놀람(45%)이 주요 감정으로 나타났습니다. 이는 새로운 경험이나 예상치 못한 긍정적인 상황에 대한 반응으로 보입니다.\n\n당신의 글에서는 자연과의 교감을 통한 평온함과 만족감이 느껴집니다. 특히 \"아름다운\", \"편안한\", \"즐거운\"과 같은 단어 사용이 긍정적인 감정 상태를 반영합니다."
    }

    실제 분석 결과도 위 예시처럼 구체적이고 분석적으로 작성하되, 과거와의 비교는 하지 마세요.
    """
    prompt = f"텍스트: {text}\n인사이트:"
    full_prompt = f"{instructions}\n{prompt}"
    response = call_gemini_model(full_prompt)
    return cache_response(text, "_emotion_insight", response)

def recommend_activity_by_emotion(text):
    """
    감정에 맞는 맞춤 활동 추천 함수
    """
    cached_response = get_cached_response(text, "_activity_recommend")
    if cached_response:
        return cached_response

    instructions = """
    주어진 일기(한국어 텍스트)의 감정에 따라, 사용자의 기분을 개선하거나 감정을 잘 다룰 수 있도록 도와주는 맞춤 활동을 3가지 추천해주세요. 각 활동은 활동명과 추천 이유를 모두 포함하고, 각각의 추천 이유는 한 문장으로 설명해주세요. 아래와 같은 JSON 형식으로 응답하세요:
    {
        "활동 추천": [
            {"활동": "추천 활동1", "추천 이유": "한 문장 설명"},
            {"활동": "추천 활동2", "추천 이유": "한 문장 설명"},
            {"활동": "추천 활동3", "추천 이유": "한 문장 설명"}
        ]
    }
    """
    prompt = f"텍스트: {text}\n추천 결과:"
    full_prompt = f"{instructions}\n{prompt}"
    response = call_gemini_model(full_prompt)
    return cache_response(text, "_activity_recommend", response)


#--예시 test코드--
if __name__ == "__main__":
    example_text = "오늘은 날씨가 맑고 기분이 좋았어요. 친구와 함께 공원에서 산책을 했습니다."
    
    # 감정 분석
    emotion_result = emotion_anal(example_text)
    print("감정 분석 결과:", emotion_result)
    
    # 장소 추출
    place_result = extract_places(example_text)
    print("장소 추출 결과:", place_result)
    
    # 사물 키워드 추출
    object_keywords_result = extract_object_keywords(example_text, excluded_keywords=[place_result.get("장소")])
    print("사물 키워드 추출 결과:", object_keywords_result)
    
    # 텍스트 요약
    summary_result = summarize_text(example_text)
    print("텍스트 요약 결과:", summary_result)
    
    # 통합 분석
    analysis_result = analyze_text(example_text)
    print("통합 분석 결과:", analysis_result)
    
    # 노래 추천
    song_recommendation = recommend_song_by_emotion(example_text)
    print("노래 추천 결과:", song_recommendation)
    
    # 감정 인사이트
    emotion_insight_result = emotion_insight(example_text)
    print("감정 인사이트 결과:", emotion_insight_result)
    
    # 활동 추천
    activity_recommendation = recommend_activity_by_emotion(example_text)
    print("활동 추천 결과:", activity_recommendation)
