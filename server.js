const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB 연결
const uri = "mongodb+srv://j07087815:9vveztlZpqTiKNIV@cluster0.xkizt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB에 성공적으로 연결되었습니다."))
  .catch(err => console.error("MongoDB 연결 오류:", err));

// 스키마 정의 및 모델 생성
const rentalSchema = new mongoose.Schema({
  studentId: String,
  name: String,
  email: String,
  rentedAt: String,
  returnBy: String,
  isReturned: Boolean
});

const Rental = mongoose.model('Rental', rentalSchema);

// HTML 파일 경로 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 대여 가능한 우산 개수 가져오기
app.get('/umbrellas', async (req, res) => {
  try {
    const availableUmbrellas = 20 - await Rental.countDocuments({ isReturned: false });
    res.json({ availableUmbrellas });
  } catch (error) {
    res.status(500).json({ message: '우산 개수를 가져오는 데 실패했습니다.' });
  }
});

// 대여 신청 API
app.post('/rent', async (req, res) => {
  const { studentId, name, email } = req.body;
  const rentedAt = new Date().toLocaleString();
  const returnBy = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString(); // 7일 후

  try {
    const rental = new Rental({ studentId, name, email, rentedAt, returnBy, isReturned: false });
    await rental.save();
    res.status(201).json({ message: '대여 신청 완료!', returnBy });
  } catch (error) {
    res.status(500).json({ message: '대여 신청에 실패했습니다.' });
  }
});

// 대여 기록 조회 API (특정 학번)
app.get('/rental/:studentId', async (req, res) => {
  try {
    const rental = await Rental.findOne({ studentId: req.params.studentId });
    if (rental) {
      res.json(rental);
    } else {
      res.status(404).json({ message: '대여 기록을 찾을 수 없습니다.' });
    }
  } catch (error) {
    res.status(500).json({ message: '대여 기록을 가져오는 데 실패했습니다.' });
  }
});

// 모든 대여 기록 조회 API
app.get('/rental', async (req, res) => {
  try {
    const rentals = await Rental.find();
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ message: '대여 기록을 가져오는 데 실패했습니다.' });
  }
});

// 반납 API
app.post('/return', async (req, res) => {
  try {
    const rental = await Rental.findOne({ studentId: req.body.studentId });
    if (rental && !rental.isReturned) {
      rental.isReturned = true;
      await rental.save();
      res.json({ message: '반납 완료!' });
    } else {
      res.status(404).json({ message: '반납할 기록이 없습니다.' });
    }
  } catch (error) {
    res.status(500).json({ message: '반납 처리에 실패했습니다.' });
  }
});

// 모든 대여 기록 삭제 API
app.delete('/rental', async (req, res) => {
  try {
    await Rental.deleteMany({});
    res.json({ message: '모든 대여 기록이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '대여 기록 삭제에 실패했습니다.' });
  }
});

// 서버 실행
const port = 3000;
app.listen(port, () => console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`));
