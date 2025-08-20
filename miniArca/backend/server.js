const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();
const port = 5000;

// Load environment variables from .env file
dotenv.config();

// Swagger 설정
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'MiniArca Node.js API',
      version: '1.0.0',
      description: 'API documentation for MiniArca Node.js server',
    },
    servers: [
      { url: 'http://localhost:5000' }
    ],
  },
  apis: ['./server.js'], // 또는 API가 정의된 파일 경로
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// MongoDB 연결
const mongoUrl = process.env.MONGODB_URL;
if (!mongoUrl) {
  throw new Error('MONGODB_URL is not set in the environment. Please check your .env file.');
}
mongoose.connect(mongoUrl)
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => console.error('MongoDB 연결 실패:', err));

// 스키마 정의
const AnalysisSchema = new mongoose.Schema({
  _id: String,
  emojis: [String],
  summary: String,
  timestamp: Date,
  emotion_analysis: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  final_emotions: [[mongoose.Schema.Types.Mixed]],
  object_keywords: {
    type: Map,
    of: [String]
  },
  song_recommend: mongoose.Schema.Types.Mixed,
  emotion_insight: mongoose.Schema.Types.Mixed,
  activity_recommend: mongoose.Schema.Types.Mixed
}, { collection: 'diary_entries' });

const AnalysisModel = mongoose.model('Analysis', AnalysisSchema);

// 미들웨어
app.use(cors());
app.use(express.json());

// Multer 설정
const upload = multer({ storage: multer.memoryStorage() });

// FastAPI로 일기 분석 전달 (기존 로직 유지)
/**
 * @swagger
 * /analyzeDiary:
 *   post:
 *     summary: Analyze diary content via FastAPI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               analysis_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Analysis result
 */
app.post('/analyzeDiary', async (req, res) => {
  try {
    const { content, analysis_id } = req.body;
    const response = await axios.post('http://localhost:8000/analyzeDiary', { 
      content, 
      analysis_id 
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FastAPI로 사진 분석 전달 (기존 로직 유지)
/**
 * @swagger
 * /analyzePhoto:
 *   post:
 *     summary: Analyze photo via FastAPI
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo analysis result
 */
app.post('/analyzePhoto', upload.single('file'), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await axios.post('http://localhost:8000/analyzePhoto', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MongoDB에서 이모지, 요약, 타임스탬프, 감정 분석 등 가져오기
/**
 * @swagger
 * /getDiaryData:
 *   get:
 *     summary: Get diary data by analysis_id
 *     parameters:
 *       - in: query
 *         name: analysis_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The analysis ID
 *     responses:
 *       200:
 *         description: Diary data
 */
app.get('/getDiaryData', async (req, res) => {
  try {
    const { analysis_id } = req.query;

    const document = await AnalysisModel.findById(analysis_id).exec();

    if (!document) {
      return res.status(404).json({ error: '분석 결과를 찾을 수 없습니다' });
    }

    // 디버깅: DB에서 불러온 document와 emojis 필드 출력
    // console.log('[getDiaryData] document:', document);
    // console.log('[getDiaryData] document.emojis:', document.emojis, 'typeof:', typeof document.emojis, 'isArray:', Array.isArray(document.emojis));

    // emojis 배열의 각 요소에서 불필요한 공백/쉼표 제거
    const cleanEmojis = Array.isArray(document.emojis)
      ? document.emojis.map(e => typeof e === 'string' ? e.replace(/,?$/,'').trim() : e)
      : [];

    res.json({
      emojis: cleanEmojis,
      summary: document.summary,
      timestamp: document.timestamp ? document.timestamp.toISOString() : null,
      emotion_analysis: document.emotion_analysis,
      final_emotions: document.final_emotions,
      object_keywords: document.object_keywords,
      song_recommend: document.song_recommend,
      emotion_insight: document.emotion_insight,
      activity_recommend: document.activity_recommend
    });
    
  } catch (error) {
    console.error('에러 발생:', error);
    res.status(500).json({ error: error.message });
  }
});

//사용자 id를 주고 받는 엔드포인트
/**
 * @swagger
 * /store-analysis-id:
 *   post:
 *     summary: Store the latest analysis ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               analysis_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: ID 저장 완료
 */
let latestAnalysisId = null;

app.post('/store-analysis-id', (req, res) => {
  latestAnalysisId = req.body.analysis_id;
  console.log(" 저장된 analysis_id:", latestAnalysisId);
  res.json({ message: "ID 저장 완료" });
});

app.get('/get-analysis-id', (req, res) => {
/**
 * @swagger
 * /get-analysis-id:
 *   get:
 *     summary: Get the latest analysis ID
 *     responses:
 *       200:
 *         description: Latest analysis ID
 */
  if (!latestAnalysisId) {
    return res.status(404).json({ error: "아직 분석된 ID 없음" });
  }
  res.json({ analysis_id: latestAnalysisId });
});


// 기존 엔트리 조회 (기존 로직 유지)
/**
 * @swagger
 * /entries:
 *   get:
 *     summary: Get all diary entries
 *     responses:
 *       200:
 *         description: List of diary entries
 */
app.get('/entries', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:8000/entries');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});