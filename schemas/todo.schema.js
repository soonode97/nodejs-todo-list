import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  doneAt: {
    type: Date,
    requried: false,
  },
});

// 프론트엔드 서빙을 위한 코드.
TodoSchema.virtual('todoId').get(function () {
  return this._id.toHexString();
});

TodoSchema.set('toJSON', {
  virtuals: true,
});

// TodoSchema를 바탕으로 Todo 모델을 생성하여 외부로 내보내기
export default mongoose.model('Todo', TodoSchema);
