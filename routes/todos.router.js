/**
 * 할 일 Router 추가하기
 */

import express from 'express';
import Todo from '../schemas/todo.schema.js';
import joi from 'joi';

const router = express.Router();

const createdTodoSchema = joi.object({
  value: joi.string().min(1).max(50).required(),
});

// 할일 등록 API 구현
// DB 조회를 하기 위해서는 async를 사용한다.
// async를 사용하지 않는다면 동기적 처리로 인해 실행되는중 다른 처리가 멈출 수가 있고, 제대로 불러오지 못할 수 있다.
router.post('/todos', async (req, res, next) => {
  try {
    // 1. 클라이언트로 부터 받아온 value 데이터를 가져온다.
    const validation = await createdTodoSchema.validateAsync(req.body);

    const { value } = validation;

    /** 데이터 유효성 검사
     * 전달받은 데이터가 예상한 형식과 일치하는지 확인하기 위한 작업
     * 1-5. 만약, 클라이언트가 value 데이터를 전달하지 않았을 때, 클라이언트에 에러메시지를 전달하는 로직
     */
    if (!value) {
      return res
        .status(400)
        .json({ errorMessage: '해야할 일(value) 데이터가 존재하지 않습니다.' });
    }

    // 2. 해당하는 마지막 order 데이터를 조회한다.
    // findOne = 1개의 데이터만 조회함.
    // sort = 정렬한다 -> order 라는 컬럼을 -> 내림차순으로 하고싶다면 앞에 - 를 붙여준다!!!!!
    const todoMaxOrder = await Todo.findOne().sort('-order').exec();

    // 3. 만약 존재한다면 현재 해야 할 일을 +1 하고, order 데이터가 존재하지 않다면, 1로 할당한다.
    const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

    // 4. 해야할 일 등록한다.
    const todo = new Todo({ value, order });
    await todo.save();

    // 5. 해야할 일을 클라이언트에게 반환한다.
    res.status(201).json({ todo: todo });
  } catch (error) {
    // Router 다음에 있는 에러 처리 미들웨어를 실행한다.
    next(error);
  }
});

/** 해야할 일 목록 조회 API */
router.get('/todos', async (req, res, next) => {
  // 1. 해야할 일 목록 조회를 진행한다.
  const todos = await Todo.find().sort('-order').exec();

  // 2. 해야할 일 목록 조회 결과를 클라이언트에게 반환한다.
  return res.json({ todos: todos });
});

/** 해야할 일 순서 변경, 완료, 해제, 내용 변경 API */
router.patch('/todos/:todoId', async (req, res, next) => {
  // 1. 어떤 할일을 변경할 것인지 todoId를 통해 확인한다.
  const { todoId } = req.params;

  // 2. 어느 순서로 변경할 것인지 req.body에서 가져오도록 한다.
  // 2. 완료했는지 확인하기 위한 값 전달받는다.
  const { order, done, value } = req.body;

  // 3. todoId param을 바탕으로 현재 할 일을 Id를 통해 가져온다.
  const currentTodo = await Todo.findById(todoId).exec();

  // 3-2. 만약 요청한 할 일이 존재하지 않다면 에러메시지를 출력한다.
  if (!currentTodo) {
    // 404는 클라이언트가 요청했을때 발생하는 오류들에 대한 코드
    return res
      .status(404)
      .json({ errorMessage: '존재하지 않는 해야할 일입니다.' });
  }

  // 4. 변경하려는 값의 존재 여부에 따라 로직을 처리하도록 한다.
  if (order) {
    const targetTodo = await Todo.findOne({ order: order }).exec();
    // 4-2. 만약 targetTodo 값이 있다면 서로 order 값을 변경하도록 수행한다.
    if (targetTodo) {
      targetTodo.order = currentTodo.order;

      //4-3. targetTodo 변경된 내용을 저장해준다.
      await targetTodo.save();
    }
    // 4-4. 변경하고 싶은 할 일의 order를 변경하고자 하는 order 값으로 변경
    currentTodo.order = order;
  }

  // 해야할 일의 done이 true 일때는 가능한 조건문이지만 해제를 하는 경우에는 작동하지 않기 때문에 undefined로 설정
  if (done !== undefined) {
    // done 값이 true인 경우 현재 시간을 넣어주고 false인 경우 null을 넣어준다.
    currentTodo.doneAt = done ? new Date() : null;
  }

  if (value) {
    currentTodo.value = value;
  }

  // 5. currentTodo 변경된 내용을 저장해준다.
  await currentTodo.save();

  return res.status(200).json({});
});

/** 해야할 일 삭제 API */
router.delete('/todos/:todoId', async (req, res) => {
  // 1. 어떤 할일을 변경할 것인지 todoId를 통해 확인한다.
  const { todoId } = req.params;

  // 2. todoId param을 바탕으로 현재 할 일을 Id를 통해 가져온다.
  const todo = await Todo.findById(todoId).exec();

  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: '존재하지 않는 해야할 일입니다.' });
  }

  // 4. todo를 삭제하는 로직
  await Todo.deleteOne({ _id: todoId });

  return res.status(200).json({});
});

export default router;
