
import os
from dotenv import load_dotenv
import requests
from PIL import Image
from io import BytesIO
import base64
from deep_translator import GoogleTranslator  #  딥 트렌스스


# Stability API 키를 .env에서 불러오기
load_dotenv()
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
if not STABILITY_API_KEY:
    raise ValueError("STABILITY_API_KEY is not set in the environment. Please check your .env file.")

STABILITY_API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"



response = requests.get(
    "https://api.stability.ai/v1/models",
    headers={"Authorization": f"Bearer {STABILITY_API_KEY}"}
)

headers = {
    "Authorization": f"Bearer {STABILITY_API_KEY}",
    "Content-Type": "application/json"
}

def translate_to_english(text):
    try:
        return GoogleTranslator(source='auto', target='en').translate(text)  #  이 부분 deep-translator로
    except Exception as e:
        print(f"Translation error: {e}")
        return text

def generate_anime_background(entry_id, location):
    location_en = translate_to_english(location)

    prompt = (
        f"2D digital animation illustration of a {location_en}, "
        "anime-style background, consistent color palette, "
        "highly detailed yet simple shapes, "
        "soft shading with cel shading effect, "
        "hand-painted look, studio Ghibli-inspired, "
        "clear and distinct features, balanced composition, "
        "focus on depth and atmospheric perspective, "
        "cohesive lighting and shadow effects"
    )

    negative_prompt = (
        "realistic, photorealistic, people, characters, faces, "
        "surrealism, low-quality, blurry, noisy, over-saturated colors, "
        "complex patterns, inconsistent lighting, unrelated objects, "
        "text, letters, language, alphabets, writing"
    )

    body = {
        "text_prompts": [
            {"text": prompt},
            {"text": negative_prompt, "weight": -1.0}
        ],
        "cfg_scale": 7,
        "clip_guidance_preset": "FAST_BLUE",
        "height": 832,
        "width": 1216,
        "samples": 1,
        "steps": 30
    }

    response = requests.post(STABILITY_API_URL, headers=headers, json=body)
    
    if response.status_code != 200:
        raise Exception(f"API 요청 실패: {response.status_code} - {response.text}")

    image_data = response.json()["artifacts"][0]["base64"]
    image = Image.open(BytesIO(base64.b64decode(image_data)))

    save_path = os.path.join("C:\\Users\\DS\\Desktop\\2025-MiniArca-project\\miniArca\\background", f"{entry_id}.png")
    image.save(save_path)

    print(f"✅ Stability API 이미지 저장 완료: {save_path}")
    return save_path
