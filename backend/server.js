
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'posts.json');

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Đảm bảo thư mục và file dữ liệu tồn tại
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([
    {
      id: 1,
      title: 'Bài viết đầu tiên',
      content: 'Chào mừng đến với Blog của chúng tôi!',
      author: 'Admin',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Hướng dẫn NextJS',
      content: 'NextJS giúp xây dựng ứng dụng web bằng React.',
      author: 'Admin',
      createdAt: new Date().toISOString()
    }
  ], null, 2), 'utf-8');
}

let posts = JSON.parse(
  fs.readFileSync(dataFile, 'utf-8')
);

const savePosts = () => {
  fs.writeFileSync(
    dataFile,
    JSON.stringify(posts, null, 2),
    'utf-8'
  );
};


const commentsFile = path.join(dataDir, 'comments.json');

if (!fs.existsSync(commentsFile)) {
  fs.writeFileSync(commentsFile, '[]', 'utf-8');
}

let comments = JSON.parse(fs.readFileSync(commentsFile, 'utf-8'));

const saveComments = () => {
  fs.writeFileSync(
    commentsFile,
    JSON.stringify(comments, null, 2),
    'utf-8'
  );
};

// GET: lấy danh sách bài viết
app.get('/api/posts', (req, res) => {
  res.json(posts);
});


 // GET: lấy chi tiết một bài viết
app.get('/api/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((item) => item.id === id);

  if (!post) {
    return res.status(404).json({
      error: 'Không tìm thấy bài viết'
    });
  }

  res.json(post);
});

// POST: tạo bài viết mới
app.post('/api/posts', (req, res) => {
  const { title, content, author } = req.body;

  if (
    typeof title !== 'string' || !title.trim() ||
    typeof content !== 'string' || !content.trim() ||
    typeof author !== 'string' || !author.trim()
  ) {
    return res.status(400).json({
      error: 'Vui lòng nhập đầy đủ tiêu đề, nội dung và tác giả'
    });
  }

  const newPost = {
    id: Date.now(),
    title: title.trim(),
    content: content.trim(),
    author: author.trim(),
    createdAt: new Date().toISOString()
  };

  posts.push(newPost);
  savePosts();

  res.status(201).json(newPost);
});

// PUT: cập nhật bài viết
app.put('/api/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, content, author } = req.body;

  const post = posts.find(post => post.id === id);

  if (!post) {
    return res.status(404).json({
      error: 'Không tìm thấy bài viết'
    });
  }

  if (
    typeof title !== 'string' || !title.trim() ||
    typeof content !== 'string' || !content.trim() ||
    typeof author !== 'string' || !author.trim()
  ) {
    return res.status(400).json({
      error: 'Vui lòng nhập đầy đủ tiêu đề, nội dung và tác giả'
    });
  }

  post.title = title.trim();
  post.content = content.trim();
  post.author = author.trim();

  savePosts();

  res.json(post);
});

// DELETE: xóa bài viết
app.delete('/api/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = posts.findIndex(post => post.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Không tìm thấy bài viết'
    });
  }

  const deletedPost = posts.splice(index, 1)[0];
  savePosts();

  res.json({
    message: 'Đã xóa bài viết thành công',
    post: deletedPost
  });
});


app.get('/api/posts/:id/comments', (req, res) => {
  const postId = Number(req.params.id);
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }

  const postComments = comments.filter(
    (comment) => comment.postId === postId
  );

  res.json(postComments);
});

app.post('/api/posts/:id/comments', (req, res) => {
  const postId = Number(req.params.id);
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }

  const { author, content } = req.body;

  if (
    typeof author !== 'string' ||
    !author.trim() ||
    typeof content !== 'string' ||
    !content.trim()
  ) {
    return res.status(400).json({
      error: 'Vui lòng nhập đầy đủ tên tác giả và nội dung bình luận'
    });
  }

  const newComment = {
    id: Date.now(),
    postId,
    author: author.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  saveComments();

  res.status(201).json(newComment);
});

app.delete('/api/comments/:commentId', (req, res) => {
  const commentId = Number(req.params.commentId);

  const index = comments.findIndex(
    (comment) => comment.id === commentId
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy bình luận' });
  }

  const deletedComment = comments.splice(index, 1)[0];
  saveComments();

  res.json({
    message: 'Đã xóa bình luận thành công',
    comment: deletedComment
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Backend chạy tại http://localhost:${PORT}`);
});