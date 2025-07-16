import json
import torch
from sentence_transformers import SentenceTransformer, util
import os
from deep_translator import GoogleTranslator  #  딥트렌스 import

# Sentence Transformer 모델 로드
model = SentenceTransformer('all-MiniLM-L6-v2')

# 파일 경로 설정
base_dir = os.path.dirname(__file__)
emoji_json_path = os.path.join(base_dir, 'emoji_list.json')
emotion_emoji_json_path = os.path.join(base_dir, 'emotion_emoji_list.json')

# JSON 파일 로드
with open(emoji_json_path, 'r', encoding='utf-8') as f:
    emoji_list = json.load(f)

with open(emotion_emoji_json_path, 'r', encoding='utf-8') as f:
    emotion_emoji_list = json.load(f)

# 완전 동기 방식
def translate_to_english(text):
    try:
        translated_text = GoogleTranslator(source='auto', target='en').translate(text)  # ✅ 딥트렌스 사용
        print(f"번역됨: '{text}' -> '{translated_text}'")
        return translated_text
    except Exception as e:
        print(f"번역 실패: '{text}', 오류: {e}")
        return text

def get_emoji(input_word, search_list):
    input_word_en = translate_to_english(input_word)
    input_embedding = model.encode(input_word_en, convert_to_tensor=True)
    emoji_embeddings = model.encode(search_list, convert_to_tensor=True)

    cosine_scores = util.pytorch_cos_sim(input_embedding, emoji_embeddings)[0]
    top_result = torch.topk(cosine_scores, k=1)
    top_index = top_result.indices.item()

    return search_list[top_index]

def get_emojis(emotion_analysis, object_keywords):
    emojis = []

    if '주요 감정' in emotion_analysis:
        emoji = get_emoji(emotion_analysis['주요 감정'], emotion_emoji_list)
        emojis.append(emoji)

    if '사물 키워드' in object_keywords and isinstance(object_keywords['사물 키워드'], list):
        for keyword in object_keywords['사물 키워드'][:5]:
            emoji = get_emoji(keyword, emoji_list)
            emojis.append(emoji)

    return emojis
