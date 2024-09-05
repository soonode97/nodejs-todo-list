import express from 'express';
import connect from './schemas/index.js';
import todosRouter from './routes/todos.router.js';
import errorHandlerMiddleware from './middlewares/error-handler.middleware.js';

const app = express();
const port = 3000;

connect();

app.use(express.json()); // 미들웨어 1
app.use(express.urlencoded({ extended: true })); // 미들웨어 2
// 정적인 파일을 assets 폴더를 바탕으로 서빙을 한다는 구문

app.use(express.static('./assets')); // 미들웨어 3

const router = express.Router();

router.get('/', (req, res) => {
  return res.json('Hello World!');
});

app.use('/api', [router, todosRouter]); // 미들웨어 4

app.use(errorHandlerMiddleware); // 에러 처리 미들웨어 등록 5

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
