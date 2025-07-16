import os
import cv2
import numpy as np
import torch
from collections import Counter
from segment_anything import sam_model_registry, SamPredictor

def tensor_to_python(val):
    if isinstance(val, torch.Tensor):
        return val.item() if val.numel() == 1 else [v.item() for v in val]
    if isinstance(val, list):
        return [tensor_to_python(v) for v in val]
    if isinstance(val, dict):
        return {k: tensor_to_python(v) for k, v in val.items()}
    return val


# BASE_DIR: .../2025-MiniArca-project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) )
MODEL_DIR = os.path.join(BASE_DIR, "miniArca", "analysis", "model")
PT_DIR = os.path.join(MODEL_DIR, "pt")
GSA_DIR = os.path.join(MODEL_DIR, "GSA")

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

HAIR_MODEL_PATH = os.path.join(PT_DIR, "best(hair).pt")
FASHION_MODEL_PATH = os.path.join(PT_DIR, "best_fixed.pt")
SAM_CHECKPOINT = os.path.join(GSA_DIR, "sam_vit_h.pth")

hair_model = torch.hub.load('ultralytics/yolov5', 'custom', path=HAIR_MODEL_PATH)
hair_model.conf = 0.1
fashion_model = torch.hub.load('ultralytics/yolov5', 'custom', path=FASHION_MODEL_PATH)
fashion_model.conf = 0.1

sam_model = sam_model_registry["vit_h"](checkpoint=SAM_CHECKPOINT)
sam_model.to(device)
sam_predictor = SamPredictor(sam_model)

TOP_CLASSES = list(range(0, 13))
OUTER_CLASSES = list(range(13, 17))
BOTTOM_CLASSES = list(range(17, 23))

def extract_dominant_color(image_rgb, mask):
    masked_image = cv2.bitwise_and(image_rgb, image_rgb, mask=mask.astype(np.uint8))
    hsv = cv2.cvtColor(masked_image, cv2.COLOR_RGB2HSV)
    v_channel = hsv[:, :, 2]
    valid_pixels = (mask.astype(bool)) & (v_channel < 200)
    pixels = masked_image[valid_pixels]
    if len(pixels) == 0:
        return "#000000"
    mean_color = np.mean(pixels, axis=0).astype(int)
    return '#{:02x}{:02x}{:02x}'.format(*mean_color)

def analyze_combined_images(inserted_id):
    try:
        user_dir = os.path.join(MODEL_DIR, "Pictures", inserted_id)
        front_path = os.path.join(user_dir, f"{inserted_id}_f.jpg")
        back_path = os.path.join(user_dir, f"{inserted_id}_b.jpg")
        save_dir = os.path.join(user_dir, "results")
        os.makedirs(save_dir, exist_ok=True)

        # 앞/뒤 이미지 경로 읽기
        front_image = cv2.imread(front_path)
        if front_image is None:
            raise FileNotFoundError(f"앞면 이미지 로드 실패: {front_path}")
        front_rgb = cv2.cvtColor(front_image, cv2.COLOR_BGR2RGB)

        def analyze_image(path, use_front_rgb_for_color=False):
            img = cv2.imread(path)
            if img is None:
                raise FileNotFoundError(f"이미지 로드 실패: {path}")
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            sam_predictor.set_image(img_rgb)

            hair_result = []
            fashion_result = []

            # 1) Hair detection: 가장 높은 confidence 한 개
            det = hair_model(img_rgb)
            best = None
            best_conf = 0.0
            for *box, conf, cls in det.xyxy[0]:
                box = list(map(int, box))
                # SAM 예측
                masks, _, _ = sam_predictor.predict(
                    box=np.array([box]),
                    point_coords=None,
                    point_labels=None,
                    multimask_output=False
                )
                # masks 배열 유효성 검사
                if masks is None or masks.shape[0] == 0:
                    continue
                mask = masks[0].astype(bool)
                # 마스크에 True(픽셀)가 하나라도 있는지 확인
                if not mask.any():
                    continue

                # 유효한 마스크만 색 추출
                color = extract_dominant_color(
                    front_rgb if use_front_rgb_for_color else img_rgb,
                    mask
                )
                if float(conf) > best_conf:
                    best_conf = float(conf)
                    best = (hair_model.names[int(cls)], color, best_conf)

            if best:
                hair_result.append(best)

            # 2) Fashion detection: 모든 박스 처리
            det = fashion_model(img_rgb)
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

                color = extract_dominant_color(
                    front_rgb if use_front_rgb_for_color else img_rgb,
                    mask
                )
                fashion_result.append((fashion_model.names[int(cls)], color))

            return hair_result, fashion_result

        # 앞/뒤 이미지 분석
        front_hair, front_fashion = analyze_image(front_path, use_front_rgb_for_color=False)
        back_hair,  back_fashion  = analyze_image(back_path,  use_front_rgb_for_color=True)

        def get_bang_info(hair_list):
            for label, color, conf in hair_list:
                if 'bang' in label:
                    return label, color, conf
            return None, "#000000", 0.0

        front_bang, front_color, front_conf = get_bang_info(front_hair)
        back_bang, back_color, back_conf = get_bang_info(back_hair)

        final_hair_label = front_bang if front_bang and back_bang and 'bang' in front_bang and 'no_bang' in back_bang else (front_bang or back_bang)
        final_hair_color = back_color if final_hair_label and back_bang and final_hair_label.split('_')[1] != back_bang.split('_')[1] else front_color

        fashion_counter = Counter([label for label, _ in front_fashion])
        fashion_colors = {label: color for label, color in front_fashion}

        name_to_idx = {v: k for k, v in fashion_model.names.items()}

        for label, color in back_fashion:
            if label == "hoodie":
                fashion_counter["hoodie"] += 1
                fashion_colors["hoodie"] = color
                for key in list(fashion_counter):
                    cls_idx = name_to_idx.get(key, -1)
                    if cls_idx in TOP_CLASSES and key != "hoodie":
                        if key in fashion_counter:
                            del fashion_counter[key]
                        if key in fashion_colors:
                            del fashion_colors[key]
                break

        # name_to_idx = {v: k for k, v in fashion_model.names.items()}

        result = []
        if final_hair_label:
            result.append({"label": final_hair_label, "color": final_hair_color})

        for label in fashion_counter:
            if label in name_to_idx:
                idx = name_to_idx[label]
                if idx in TOP_CLASSES or idx in OUTER_CLASSES or idx in BOTTOM_CLASSES:
                    result.append({"label": label, "color": fashion_colors[label]})

        # 저장
        txt_path = os.path.join(save_dir, "result.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            for item in result:
                f.write(f"Label: {item['label']}, Color: {item['color']}\n")

        return {"results": tensor_to_python(result)}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"분석 중 오류 발생: {str(e)}"}
