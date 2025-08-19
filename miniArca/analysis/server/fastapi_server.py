import sys
import os

# analysis 폴더를 sys.path에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from model import ilgibunseog
from model.emotion_compute import calculate_final_emotion
from model.generate_background import generate_anime_background
import json
from dotenv import load_dotenv
from model import emoji_select
import traceback
from model.analyze import analyze_combined_images
from model.ilgibunseog import get_song_recommendations, emotion_insight, recommend_activity_by_emotion
import httpx
import smtplib
from email.message import EmailMessage
import mimetypes                                       

load_dotenv()

app = FastAPI()

emoji_folder_path = os.path.join(os.getcwd(), "static", "emojis")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
app.mount("/emojis", StaticFiles(directory=os.path.join(BASE_DIR, "database", "emojis")), name="emojis")
app.mount("/unityimg", StaticFiles(directory=os.path.join(BASE_DIR, "unityimg")), name="unityimg")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    app.database = app.mongodb_client[os.getenv("DB_NAME")]
    print("MongoDB에 연결되었습니다!")

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()
    print("MongoDB 연결이 종료되었습니다.")

class DiaryEntry(BaseModel):
    content: str
    analysis_id: str

cached_analysis_results = {}

from fastapi import UploadFile, File, Form

@app.post("/uploadPhotoPart")
async def upload_photo_part(
    file: UploadFile = File(...),
    analysis_id: str = Form(...),
    part: str = Form(...),  # 'f' 또는 'b'
):
    try:
        if part not in ('f', 'b'):
            raise HTTPException(status_code=400, detail="part는 'f' 또는 'b' 여야 합니다.")

        user_directory = os.path.join(BASE_DIR,"analysis", "model", "Pictures", analysis_id)
        os.makedirs(user_directory, exist_ok=True)

        filename = f"{analysis_id}_{part}.jpg"
        filepath = os.path.join(user_directory, filename)


        with open(filepath, "wb") as buffer:
            buffer.write(await file.read())

        return {"message": f"{part}면 사진 업로드 성공", "file_path": filepath}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"사진 업로드 실패: {str(e)}")

@app.post("/analyzePhoto")
async def analyze_photo(analysis_id: str = Form(...)):
    try:
        user_directory = os.path.join(BASE_DIR,"analysis", "model", "Pictures", analysis_id)
        front_path = os.path.join(user_directory, f"{analysis_id}_f.jpg")
        back_path = os.path.join(user_directory, f"{analysis_id}_b.jpg")

        if not os.path.exists(front_path) or not os.path.exists(back_path):
            raise HTTPException(status_code=400, detail="앞면 또는 뒷면 사진이 없습니다.")

        # 분석 수행
        analysis_result = analyze_combined_images(analysis_id)

        new_diary_entry = {
            "_id": analysis_id,
            "photo_analysis_result": analysis_result,
            "front_path": front_path,
            "back_path": back_path
        }
        await app.database.diary_entries.insert_one(new_diary_entry)

        return {
            "message": "사진 분석 완료 및 결과 저장됨",
            "analysis_id": analysis_id,
            "analysis_result": analysis_result
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"사진 분석 중 오류 발생: {str(e)}")


# ...existing code...
@app.post("/analyzeDiary")
async def analyze_diary(entry: DiaryEntry):
    try:
        content = entry.content
        analysis_id = entry.analysis_id
        print(f"Received content: {content}")
        print(f"Received analysis_id: {analysis_id}")

        print("Trying to find document in database...")
        document = await app.database.diary_entries.find_one({"_id": analysis_id})
        if not document:
            print("No document found for given analysis_id.")
            raise HTTPException(status_code=400, detail="사진 분석을 먼저 수행해야 합니다.")
        print("Document found.")

        print("Performing emotion analysis...")
        emotion_analysis = ilgibunseog.emotion_anal(content)
        print(f"Emotion analysis result: {emotion_analysis}")

        print("Extracting places...")
        place_extraction = ilgibunseog.extract_places(content)
        print(f"Place extraction result: {place_extraction}")

        print("Extracting object keywords...")
        object_keywords = ilgibunseog.extract_object_keywords(content)
        print(f"Object keywords result: {object_keywords}")

        print("Calculating final emotions...")
        final_emotions = calculate_final_emotion(emotion_analysis)
        print(f"Final emotions result: {final_emotions}")

        print("Summarizing text...")
        summary_result = ilgibunseog.summarize_text(content)
        summary_text = summary_result.get("요약", "")
        print(f"Summary result: {summary_text}")

        # --- 추가 분석: 노래 추천, 감정 인사이트, 활동 추천 ---
        print("Running recommend_song_by_emotion...")
        song_recommend = get_song_recommendations(content)
        print(f"Song recommend result: {song_recommend}")

        print("Running emotion_insight...")
        emotion_insight_result = emotion_insight(content)
        print(f"Emotion insight result: {emotion_insight_result}")

        print("Running recommend_activity_by_emotion...")
        activity_recommend = recommend_activity_by_emotion(content)
        print(f"Activity recommend result: {activity_recommend}")
        # ---

        cached_analysis_results["content"] = content
        cached_analysis_results["emotion_analysis"] = emotion_analysis

        update_data = {
            "$set": {
                "content": content,
                "summary": summary_text,
                "emotion_analysis": emotion_analysis,
                "final_emotions": final_emotions,
                "place_extraction": place_extraction,
                "object_keywords": object_keywords,
                "song_recommend": song_recommend,
                "emotion_insight": emotion_insight_result,
                "activity_recommend": activity_recommend,
                "timestamp": datetime.now()
            }
        }

        print("Updating database with analysis results...")
        await app.database.diary_entries.update_one({"_id": analysis_id}, update_data)
        print("Database update completed.")

        location = place_extraction.get("장소")
        image_path = None
        if location:
            print(f"Generating anime background for location: {location}")
            image_path = generate_anime_background(analysis_id, location)
            print(f"Generated image path: {image_path}")

            print("Updating database with background image path...")
            await app.database.diary_entries.update_one(
                {"_id": analysis_id},
                {"$set": {"background_image_path": image_path}}
            )
            print("Background image path updated in database.")

        print("Selecting and saving emojis...")
        emojis = await select_and_save_emoji(analysis_id)
        print(f"Emojis selected: {emojis}")

        print("Returning final response...")

        # Unity 알림 전송 위치를 이쪽으로 이동
        UNITY_SERVER_URL = "http://localhost:8081/notify/"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(UNITY_SERVER_URL, json={"analysis_id": analysis_id})
                response.raise_for_status()
                print("Unity 알림 전송 성공")
            except Exception as e:
                print(f"[WARN] Unity 알림 실패: {e}")

        return {
            "id": analysis_id,
            "summary": summary_text,
            "emotion_analysis": emotion_analysis,
            "final_emotions": final_emotions,
            "place_extraction": place_extraction,
            "object_keywords": object_keywords,
            "background_image_path": image_path,
            "emojis": emojis,
            "song_recommend": song_recommend,
            "emotion_insight": emotion_insight_result,
            "activity_recommend": activity_recommend
        }

    except ValueError as ve:
        print(f"[ERROR] Value error occurred: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON decoding error: {e}")
        raise HTTPException(status_code=500, detail="Invalid JSON format")
    except Exception as e:
        print(f"[ERROR] Unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))

#MongoDB에 저장된 최대 100개의 일기 분석 데이터 호출
@app.get("/entries")
async def get_entries():
    try:
        entries = await app.database.diary_entries.find().to_list(length=100)
        for entry in entries:
            entry["_id"] = str(entry["_id"])
        return entries
    except Exception as e:
        print(f"Error fetching entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

#모션을 위한 감정 호출
@app.get("/final-emotions")
async def get_final_emotions():
    try:
        if "emotion_analysis" not in cached_analysis_results:
            raise HTTPException(status_code=400, detail="No analysis data found. Please analyze the diary first.")

        emotion_analysis = cached_analysis_results["emotion_analysis"]
        final_emotions = calculate_final_emotion(emotion_analysis)

        return final_emotions

    except Exception as e:
        print(f"Unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 특정 일기(doc_id)의 배경 이미지 경로를 반환하는 api
@app.get("/background/{doc_id}")
async def get_background(doc_id: str):
    try:
        print(f"[Background 요청] doc_id: {doc_id}")

        doc = await app.database.diary_entries.find_one({"_id": doc_id})
        if not doc or "background_image_path" not in doc:
            print("배경 이미지가 없는 문서이거나 해당 ID 없음.")
            #raise HTTPException(status_code=404, detail="Background image not found.")

        return {
            "background_image_path": doc["background_image_path"]
        }

    except Exception as e:
        print(f"[오류] background 요청 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="서버 내부 오류 발생.")


# # notify_unity.py 유니티에 요청 보내기 
# from fastapi import FastAPI
# import motor.motor_asyncio
# import httpx

# app = FastAPI()
# mongo = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
# db = mongo["your_db"]
# collection = db["your_collection"]

# UNITY_SERVER_URL = "http://localhost:8081/notify"  # 유니티 HTTP 서버 주소

# @app.on_event("startup")
# async def watch_mongodb():
#     print("🚀 MongoDB 감시 시작!")
#     async with collection.watch() as stream:
#         async for change in stream:
#             if change["operationType"] == "insert":
#                 analysis_id = change["fullDocument"].get("analysis_id")
#                 print(f"✅ 새 데이터: {analysis_id}")

#                 # 유니티로 POST 요청 보내기
#                 async with httpx.AsyncClient() as client:
#                     await client.post(UNITY_SERVER_URL, json={"analysis_id": analysis_id})


#유니티가 해당 id의 데이터를 조회하는 api  
@app.get("/entry/{analysis_id}")
async def get_entry(analysis_id: str):
    try:
        print(f" [Unity 요청] analysis_id: {analysis_id}")  # Unity에서 호출했음을 로그로 출력

        doc = await app.database.diary_entries.find_one({
            "_id": analysis_id,
            "이모지": {"$exists": True}
        })
        if not doc:
            print(" 요청된 ID에 해당하는 데이터가 없거나 분석이 아직 완료되지 않았음.")
            raise HTTPException(status_code=404, detail="해당 분석 ID를 찾을 수 없습니다.")

        doc["_id"] = str(doc["_id"])
        print(f" 분석 데이터 반환 완료 (ID: {analysis_id})")
        return doc

    except Exception as e:
        print(f" 오류 발생 (ID: {analysis_id}) → {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

#일기분석결과(감정분포바)
@app.get("/emotion-distribution/{analysis_id}")
async def get_emotion_distribution(analysis_id: str):
    try:
        document = await app.database.diary_entries.find_one({"_id": analysis_id})
        if not document or "emotion_analysis" not in document:
            raise HTTPException(status_code=404, detail="해당 분석 ID의 감정 분석 결과가 없습니다.")
        
        detail_emotions = document["emotion_analysis"].get("세부 감정", [])
        distribution = []

        for emotion_entry in detail_emotions:
            emotion = emotion_entry.get("감정")
            intensity = emotion_entry.get("강도", 0)
            if emotion and isinstance(intensity, (int, float)):
                distribution.append({
                    "emotion": emotion,
                    "percentage": round(intensity * 100, 2)  # 0.75 → 75%
                })

        return {"emotion_distribution": distribution}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#이모지 고르고 저장
async def select_and_save_emoji(id: str):
    try:
        document = await app.database.diary_entries.find_one({"_id": id})
        
        if not document:
            print(f"Document not found for id: {id}")
            return
        
        emotion_analysis = document.get("emotion_analysis", {})
        object_keywords = document.get("object_keywords", {})
        
        print(f"Emotion analysis: {emotion_analysis}")
        print(f"Object keywords: {object_keywords}")
        
        try:
            emojis = emoji_select.get_emojis(emotion_analysis, object_keywords)
            print(f"Selected emojis: {emojis}")
        except Exception as emoji_error:
            print(f"Error in emoji selection: {emoji_error}")
            print(f"Traceback: {traceback.format_exc()}")
            return None
        
        try:
            update_result = await app.database.diary_entries.update_one(
                {"_id": id},
                {"$set": {"이모지": emojis}}
            )
            
            if update_result.modified_count == 0:
                print(f"Failed to update document {id}")
            else:
                print(f"Successfully updated document {id} with emojis: {emojis}")
        except Exception as db_error:
            print(f"Error updating database: {db_error}")
            print(f"Traceback: {traceback.format_exc()}")
            return None
        
        return emojis
    except Exception as e:
        print(f"Error selecting and saving emoji: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return None

# STL 파일 경로 db에 저장
class STLPathUpdate(BaseModel):
    analysis_id: str
    stl_path: str

@app.post("/update-stl-path")
async def update_stl_path(update: STLPathUpdate):
    try:
        print(f"STL 경로 업데이트 요청 - ID: {update.analysis_id}, Path: {update.stl_path}")
        
        # 먼저 해당 문서가 존재하는지 확인
        existing_doc = await app.database.diary_entries.find_one({"_id": update.analysis_id})
        if not existing_doc:
            print(f"[ERROR] 해당 analysis_id를 찾을 수 없음: {update.analysis_id}")
            raise HTTPException(status_code=404, detail="해당 분석 ID를 찾을 수 없습니다.")
        
        # 파일 존재 여부 확인 (추가)
        if not os.path.exists(update.stl_path):
            print(f"[WARNING] STL 파일이 실제로 존재하지 않음: {update.stl_path}")
            # 경고만 출력하고 계속 진행 (파일이 나중에 생성될 수 있음)
        
        # final_result 구조로 저장 (기존 코드와 일치)
        result = await app.database.diary_entries.update_one(
            {"_id": update.analysis_id},
            {
                "$set": {
                    "final_result.STL_path": update.stl_path,
                    "stl_path": update.stl_path,  # 추가: 직접 접근을 위한 필드
                    "stl_updated_at": datetime.now()
                }
            }
        )

        if result.modified_count == 0:
            print(f"[WARNING] 문서는 존재하지만 업데이트되지 않음: {update.analysis_id}")
            raise HTTPException(status_code=400, detail="STL 경로 업데이트에 실패했습니다.")

        print(f"[SUCCESS] STL 경로 저장 완료 - ID: {update.analysis_id}")
        return {
            "message": "STL 경로 저장 완료", 
            "analysis_id": update.analysis_id,
            "stl_path": update.stl_path,
            "file_exists": os.path.exists(update.stl_path)  # 파일 존재 여부 추가
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] STL 경로 업데이트 중 예외 발생: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")

# STL 경로 조회를 위한 추가 엔드포인트
@app.get("/stl-path/{analysis_id}")
async def get_stl_path(analysis_id: str):
    try:
        doc = await app.database.diary_entries.find_one({"_id": analysis_id})
        if not doc:
            raise HTTPException(status_code=404, detail="해당 분석 ID를 찾을 수 없습니다.")
        
        stl_path = doc.get("stl_path") or doc.get("final_result", {}).get("STL_path")
        
        if not stl_path:
            raise HTTPException(status_code=404, detail="STL 파일 경로가 없습니다.")
            
        return {
            "analysis_id": analysis_id,
            "stl_path": stl_path,
            "file_exists": os.path.exists(stl_path) if stl_path else False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] STL 경로 조회 중 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 이메일 자동 전송
@app.post("/sendEmail")
async def send_email(
    analysis_id: str = Form(...),
    email: str = Form(...)
):
    try:
        print(f"[이메일] 전송 요청 - analysis_id: {analysis_id}, email: {email}")
        
        # 이메일 형식 검증 (추가)
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise HTTPException(status_code=400, detail="올바르지 않은 이메일 형식입니다.")
        
        doc = await app.database.diary_entries.find_one({"_id": analysis_id})
        if not doc:
            raise HTTPException(status_code=404, detail="해당 분석 결과를 찾을 수 없습니다.")
        
        subject = "[MINIARCA]당신의 캐릭터 3D 모델링 파일이 도착했습니다!"
        
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = "path22ForSend@gmail.com"
        msg["To"] = email
        
        # 감정 분석 결과를 포함한 더 상세한 이메일 본문 (개선)
        emotion_analysis = doc.get("emotion_analysis", {})
        summary = doc.get("summary", "요약 정보 없음")
        
        body = f'''
        안녕하세요!  
        PATH 팀입니다.

        캐릭터 3D 모델링 파일을 보내드립니다.

        💡 안내드립니다!  
        해당 STL 파일은 다음 장소에서 직접 출력하실 수 있습니다:

        **덕성여대 도서관 오스카라운지**  
        - 위치: 도봉구 삼양로 144길 33 (도서관 1층)
        - 3D 프린터 이용 가능 (무료)
        - 문의: 02-901-8000

        감사합니다.  
        PATH 팀
        '''
        msg.set_content(body)
        
        print("[이메일] 첨부 파일 검색 시작...")
        
        # ✅ STL 파일 첨부 (여러 경로에서 찾기)
        stl_attached = False
        
        # 1. final_result.STL_path에서 찾기
        final_result = doc.get("final_result", {})
        stl_path = final_result.get("STL_path")
        
        # 2. 직접 stl_path 필드에서 찾기
        if not stl_path:
            stl_path = doc.get("stl_path")
        
        print(f"[이메일] STL 경로 확인: {stl_path}")
        
        if stl_path and os.path.exists(stl_path):
            try:
                with open(stl_path, "rb") as f:
                    file_data = f.read()
                    filename = os.path.basename(stl_path)
                    
                    # STL 파일은 application/octet-stream으로 첨부
                    msg.add_attachment(
                        file_data, 
                        maintype='application', 
                        subtype='octet-stream', 
                        filename=filename
                    )
                    print(f"[이메일] STL 파일 첨부 성공: {filename} ({len(file_data)} bytes)")
                    stl_attached = True
            except Exception as e:
                print(f"[이메일] STL 파일 첨부 실패: {e}")
        else:
            print(f"[이메일] STL 파일 없음 또는 경로 오류: {stl_path}")
        
        # ✅ PNG 파일 첨부 (있는 경우)
        png_attached = False
        png_path = final_result.get("png_path")
        
        if png_path and os.path.exists(png_path):
            try:
                with open(png_path, "rb") as f:
                    file_data = f.read()
                    filename = os.path.basename(png_path)
                    
                    msg.add_attachment(
                        file_data, 
                        maintype='image', 
                        subtype='png', 
                        filename=filename
                    )
                    print(f"[이메일] PNG 파일 첨부 성공: {filename}")
                    png_attached = True
            except Exception as e:
                print(f"[이메일] PNG 파일 첨부 실패: {e}")
        
        # ✅ 배경 이미지 첨부 (있는 경우) - 추가
        bg_attached = False
        bg_path = doc.get("background_image_path")
        
        if bg_path and os.path.exists(bg_path):
            try:
                with open(bg_path, "rb") as f:
                    file_data = f.read()
                    filename = os.path.basename(bg_path)
                    
                    # 파일 확장자에 따라 MIME 타입 결정
                    if bg_path.lower().endswith('.png'):
                        subtype = 'png'
                    elif bg_path.lower().endswith(('.jpg', '.jpeg')):
                        subtype = 'jpeg'
                    else:
                        subtype = 'octet-stream'
                    
                    msg.add_attachment(
                        file_data, 
                        maintype='image', 
                        subtype=subtype, 
                        filename=filename
                    )
                    print(f"[이메일] 배경 이미지 첨부 성공: {filename}")
                    bg_attached = True
            except Exception as e:
                print(f"[이메일] 배경 이미지 첨부 실패: {e}")
        
        print(f"[이메일] 첨부 파일 요약 - STL: {stl_attached}, PNG: {png_attached}, 배경: {bg_attached}")
        
        # 첨부 파일이 없으면 경고 (개선)
        if not (stl_attached or png_attached or bg_attached):
            print("[이메일] 첨부할 파일이 없습니다. 텍스트만 전송됩니다.")
        
        # 이메일 전송
        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
                smtp.login("path22ForSend@gmail.com", "nsbv zvph vrwu lqca")
                smtp.send_message(msg)
            print("[이메일] SMTP 전송 성공")
        except Exception as smtp_error:
            print(f"[이메일] SMTP 전송 실패: {smtp_error}")
            raise HTTPException(status_code=500, detail=f"이메일 전송 실패: {str(smtp_error)}")
        
        # 결과 메시지
        attached_files = []
        if stl_attached:
            attached_files.append("STL 파일")
        if png_attached:
            attached_files.append("PNG 파일")
        if bg_attached:
            attached_files.append("배경 이미지")
        
        if attached_files:
            message = f"이메일 전송 완료 (첨부: {', '.join(attached_files)})"
        else:
            message = "이메일 전송 완료 (첨부 파일 없음)"
        
        print(f"[이메일] {message}")
        
        # 전송 기록 DB에 저장 (추가)
        await app.database.diary_entries.update_one(
            {"_id": analysis_id},
            {
                "$set": {
                    "email_sent": True,
                    "email_sent_to": email,
                    "email_sent_at": datetime.now(),
                    "email_attachments": attached_files
                }
            }
        )
        
        return {"message": message, "attachments": attached_files}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[이메일 전송 오류] {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"이메일 전송 실패: {str(e)}")

# STL 파일 경로 확인을 위한 디버깅 엔드포인트 (개발용)
@app.get("/debug-stl/{analysis_id}")
async def debug_stl_info(analysis_id: str):
    try:
        doc = await app.database.diary_entries.find_one({"_id": analysis_id})
        if not doc:
            return {"error": "문서 없음"}
        
        final_result = doc.get("final_result", {})
        stl_path_1 = final_result.get("STL_path")
        stl_path_2 = doc.get("stl_path")
        
        return {
            "analysis_id": analysis_id,
            "final_result.STL_path": stl_path_1,
            "stl_path": stl_path_2,
            "stl_path_1_exists": os.path.exists(stl_path_1) if stl_path_1 else False,
            "stl_path_2_exists": os.path.exists(stl_path_2) if stl_path_2 else False,
            "background_image_path": doc.get("background_image_path"),
            "email_sent": doc.get("email_sent", False),
            "all_keys": list(doc.keys())
        }
    except Exception as e:
        return {"error": str(e)}
    
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000,timeout_keep_alive=1000,access_log=False)