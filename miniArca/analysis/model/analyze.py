import os
import cv2
import numpy as np
import torch
from collections import Counter
from segment_anything import sam_model_registry, SamPredictor

# ───────────────────────── 공통 유틸 ─────────────────────────
def tensor_to_python(val):
    if isinstance(val, torch.Tensor):
        return val.item() if val.numel() == 1 else [v.item() for v in val]
    if isinstance(val, list):
        return [tensor_to_python(v) for v in val]
    if isinstance(val, dict):
        return {k: tensor_to_python(v) for k, v in val.items()}
    return val

def extract_dominant_color(image_rgb, mask):
    """V 채널 과다 밝은 픽셀 제외하고(강한 하이라이트 배제) 대표색 추출"""
    mask_u8 = mask.astype(np.uint8)
    if mask_u8.max() == 0:
        return "#000000"
    masked = cv2.bitwise_and(image_rgb, image_rgb, mask=mask_u8)
    hsv = cv2.cvtColor(masked, cv2.COLOR_RGB2HSV)
    v = hsv[:, :, 2]
    valid = (mask.astype(bool)) & (v < 200)
    pixels = image_rgb[valid]
    if pixels.size == 0:
        return "#000000"
    mean_color = np.mean(pixels, axis=0).astype(int)  # RGB
    return "#{:02x}{:02x}{:02x}".format(*mean_color)

# ───────────────────────── 경로/모델 로딩 ─────────────────────────
# BASE_DIR: .../2025-MiniArca-project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MODEL_DIR = os.path.join(BASE_DIR, "miniArca", "analysis", "model")

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 필요 시 네가 쓰는 고정 경로로 교체해도 됨
FASHION_MODEL_PATH     = os.path.join(MODEL_DIR, "pt", "best_fixed(0612).pt")
SAM_CHECKPOINT         = os.path.join(MODEL_DIR, "GSA", "sam_vit_h.pth")
HAIR_FRONT_MODEL_PATH  = os.path.join(MODEL_DIR, "pt", "front_bang.pt")
HAIR_BACK_MODEL_PATH   = os.path.join(MODEL_DIR, "pt", "back_length.pt")

# YOLOv5 로드
hair_front_model = torch.hub.load('ultralytics/yolov5', 'custom', path=HAIR_FRONT_MODEL_PATH)
hair_front_model.conf = 0.2
hair_back_model  = torch.hub.load('ultralytics/yolov5', 'custom', path=HAIR_BACK_MODEL_PATH)
hair_back_model.conf  = 0.2
fashion_model    = torch.hub.load('ultralytics/yolov5', 'custom', path=FASHION_MODEL_PATH)
fashion_model.conf    = 0.3

# SAM 로드
sam_model = sam_model_registry["vit_h"](checkpoint=SAM_CHECKPOINT)
sam_model.to(device)
sam_predictor = SamPredictor(sam_model)

# 클래스 인덱스 범위 (fashion_model.names의 인덱스 기준)
TOP_CLASSES    = list(range(0, 13))
OUTER_CLASSES  = list(range(13, 17))
BOTTOM_CLASSES = list(range(17, 23))

# label ↔ index 매핑
name_to_idx = {v: k for k, v in fashion_model.names.items()}

# ───────────────────────── 헬퍼: 감지 ─────────────────────────
@torch.no_grad()
def detect_best_hair(image_rgb, model, color_from_rgb=None):
    """
    가장 conf 높은 박스 1개만 채택. SAM 박스 마스크가 비면 skip.
    color_from_rgb가 주어지면 그 이미지에서 색 추출(예: back은 front 기준 색 추출)
    """
    det = model(image_rgb)
    best = None
    best_conf = -1.0
    img_for_color = color_from_rgb if color_from_rgb is not None else image_rgb

    sam_predictor.set_image(image_rgb)
    if len(det.xyxy) == 0 or det.xyxy[0].shape[0] == 0:
        return None

    for *box, conf, cls in det.xyxy[0]:
        box = list(map(int, box))
        masks, _, _ = sam_predictor.predict(
            box=np.array([box]),
            point_coords=None,
            point_labels=None,
            multimask_output=False
        )
        if masks is None or masks.shape[0] == 0:
            continue
        mask = masks[0].astype(bool)
        if not mask.any():
            continue

        color = extract_dominant_color(img_for_color, mask)
        c = float(conf)
        if c > best_conf:
            best_conf = c
            best = (model.names[int(cls)], color, c)
    return best

@torch.no_grad()
def detect_fashion_all(image_rgb, color_from_rgb=None):
    """
    패션 박스 전부 처리해서 [(label, color, conf, idx), ...] 반환.
    color_from_rgb 있으면 그 RGB에서 색 추출.
    """
    det = fashion_model(image_rgb)
    results = []
    img_for_color = color_from_rgb if color_from_rgb is not None else image_rgb

    sam_predictor.set_image(image_rgb)
    if len(det.xyxy) == 0 or det.xyxy[0].shape[0] == 0:
        return results

    for *box, conf, cls in det.xyxy[0]:
        idx = int(cls)
        label = fashion_model.names[idx]
        box = list(map(int, box))
        masks, _, _ = sam_predictor.predict(
            box=np.array([box]),
            point_coords=None,
            point_labels=None,
            multimask_output=False
        )
        if masks is None or masks.shape[0] == 0:
            continue
        mask = masks[0].astype(bool)
        if not mask.any():
            continue
        color = extract_dominant_color(img_for_color, mask)
        results.append((label, color, float(conf), idx))
    return results

# ───────────────────────── 메인 함수 ─────────────────────────
def analyze_combined_images(inserted_id: str):
    try:
        user_dir = os.path.join(MODEL_DIR, "Pictures", inserted_id)
        front_path = os.path.join(user_dir, f"{inserted_id}_f.jpg")
        back_path  = os.path.join(user_dir, f"{inserted_id}_b.jpg")
        save_dir   = os.path.join(user_dir, "results")
        os.makedirs(save_dir, exist_ok=True)

        # 이미지 로드
        front_bgr = cv2.imread(front_path)
        if front_bgr is None:
            raise FileNotFoundError(f"앞면 이미지 로드 실패: {front_path}")
        back_bgr  = cv2.imread(back_path)
        if back_bgr is None:
            raise FileNotFoundError(f"뒷면 이미지 로드 실패: {back_path}")

        front_rgb = cv2.cvtColor(front_bgr, cv2.COLOR_BGR2RGB)
        back_rgb  = cv2.cvtColor(back_bgr,  cv2.COLOR_BGR2RGB)

        # ─ Hair ─
        # 앞: 앞머리(bang/no_bang), 뒤: 길이(short/bob/long/tied)
        front_hair_best = detect_best_hair(front_rgb, hair_front_model, color_from_rgb=None)
        back_hair_best  = detect_best_hair(back_rgb,  hair_back_model,  color_from_rgb=front_rgb)  # 색상은 front 기준

        final_hair_label = None
        final_hair_color = "#000000"
        if front_hair_best and back_hair_best:
            front_label, front_color, _ = front_hair_best   # e.g., 'bang' or 'no_bang'
            back_label,  back_color,  _ = back_hair_best    # e.g., 'short'/'bob'/'long'/'tied'
            final_hair_label = f"{front_label}_{back_label}"  # e.g., 'no_bang_long'
            # 색상은 front 기준(요구사항 반영)
            final_hair_color = front_color
        elif front_hair_best:  # 백업
            final_hair_label, final_hair_color, _ = front_hair_best
        elif back_hair_best:   # 백업
            final_hair_label, final_hair_color, _ = back_hair_best

        # ─ Fashion (앞/뒤) ─
        # 앞: 전부 수집 / 뒤: hoodie 있으면 TOP 제거 후 hoodie로 대체
        front_fashion = detect_fashion_all(front_rgb, color_from_rgb=None)
        back_fashion  = detect_fashion_all(back_rgb,  color_from_rgb=front_rgb)

        # 앞 결과 집계
        fashion_counter = Counter()
        fashion_colors  = {}
        for label, color, conf, idx in front_fashion:
            fashion_counter[label] += 1
            # 가장 최근 색으로 덮어써도 무방; 필요시 conf 비교 로직 추가 가능
            fashion_colors[label] = color

        # 뒤에서 hoodie 있으면 TOP 제거 규칙 적용
        hoodie_seen = False
        for label, color, conf, idx in back_fashion:
            if label == "hoodie":
                hoodie_seen = True
                fashion_counter["hoodie"] = 1
                fashion_colors["hoodie"] = color
                # TOP 클래스들 제거(hoodie만 남기기 위해)
                for key in list(fashion_counter.keys()):
                    cls_idx = name_to_idx.get(key, -1)
                    if cls_idx in TOP_CLASSES and key != "hoodie":
                        fashion_counter.pop(key, None)
                        fashion_colors.pop(key, None)
                break

        # 최종 결과 구성
        results = []
        if final_hair_label:
            results.append({"label": final_hair_label, "color": final_hair_color})

        for label in fashion_counter:
            idx = name_to_idx.get(label, -1)
            if idx in TOP_CLASSES or idx in OUTER_CLASSES or idx in BOTTOM_CLASSES:
                results.append({"label": label, "color": fashion_colors[label]})

        # 저장
        txt_path = os.path.join(save_dir, "result.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            for item in results:
                f.write(f"Label: {item['label']}, Color: {item['color']}\n")

        return {"results": tensor_to_python(results)}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"분석 중 오류 발생: {str(e)}"}
