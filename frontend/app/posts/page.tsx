
'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

type Post = {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
};

type Comment = {
  id: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
};

export default function PostsPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [commentAuthors, setCommentAuthors] = useState<Record<number, string>>({});
  const [commentContents, setCommentContents] = useState<Record<number, string>>({});

  const queryClient = useQueryClient();

  // Lấy danh sách bài viết
  const {
    data: posts = [],
    isLoading,
    isError,
  } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await api.get('/api/posts');
      return res.data;
    },
  });

  // Lấy bình luận của tất cả bài viết
  const {
    data: comments = [],
    isLoading: commentsLoading,
  } = useQuery<Comment[]>({
    queryKey: ['comments', posts.map((post) => post.id)],
    queryFn: async () => {
      const responses = await Promise.all(
        posts.map((post) =>
          api.get(`/api/posts/${post.id}/comments`)
        )
      );

      return responses.flatMap((response) => response.data);
    },
    enabled: posts.length > 0,
  });

  // Thêm bài viết
  const addPostMutation = useMutation({
    mutationFn: async (newPost: {
      title: string;
      content: string;
      author: string;
    }) => {
      const res = await api.post('/api/posts', newPost);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setTitle('');
      setContent('');
      setAuthor('');
      toast.success('Đăng bài viết thành công!');
    },
    onError: (error) => {
      console.error('Lỗi đăng bài:', error);
      toast.error('Không thể đăng bài viết!');
    },
  });

  // Sửa bài viết
  const updatePostMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      author,
    }: {
      id: number;
      title: string;
      content: string;
      author: string;
    }) => {
      const res = await api.put(`/api/posts/${id}`, {
        title,
        content,
        author,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Cập nhật bài viết thành công!');
    },
    onError: (error) => {
      console.error('Lỗi cập nhật bài viết:', error);
      toast.error('Không thể cập nhật bài viết!');
    },
    onSettled: () => setEditingId(null),
  });

  // Xóa bài viết
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Xóa bài viết thành công!');
    },
    onError: (error) => {
      console.error('Lỗi xóa bài viết:', error);
      toast.error('Không thể xóa bài viết!');
    },
  });

  // Thêm bình luận
  const addCommentMutation = useMutation({
    mutationFn: async ({
      postId,
      author,
      content,
    }: {
      postId: number;
      author: string;
      content: string;
    }) => {
      const res = await api.post(`/api/posts/${postId}/comments`, {
        author,
        content,
      });
      return res.data as Comment;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setCommentContents((previous) => ({
        ...previous,
        [variables.postId]: '',
      }));
      toast.success('Đăng bình luận thành công!');
    },
    onError: (error) => {
      console.error('Lỗi đăng bình luận:', error);
      toast.error('Không thể đăng bình luận!');
    },
  });

  // Xóa bình luận
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await api.delete(`/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Đã xóa bình luận!');
    },
    onError: (error) => {
      console.error('Lỗi xóa bình luận:', error);
      toast.error('Không thể xóa bình luận!');
    },
  });

  // Gửi bài viết
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !author.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    addPostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
    });
  };

  // Gửi bình luận
  const handleCommentSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    postId: number
  ) => {
    e.preventDefault();

    const commentAuthor = commentAuthors[postId]?.trim();
    const commentContent = commentContents[postId]?.trim();

    if (!commentAuthor || !commentContent) {
      toast.error('Vui lòng nhập tên và nội dung bình luận!');
      return;
    }

    addCommentMutation.mutate({
      postId,
      author: commentAuthor,
      content: commentContent,
    });
  };

  // Sửa bài viết
  const handleEdit = (post: Post) => {
    const newTitle = window.prompt('Nhập tiêu đề mới:', post.title);
    if (newTitle === null) return;

    const newContent = window.prompt('Nhập nội dung mới:', post.content);
    if (newContent === null) return;

    const newAuthor = window.prompt('Nhập tên tác giả:', post.author);
    if (newAuthor === null) return;

    if (!newTitle.trim() || !newContent.trim() || !newAuthor.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    setEditingId(post.id);
    updatePostMutation.mutate({
      id: post.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      author: newAuthor.trim(),
    });
  };

  // Xóa bài viết
  const handleDelete = (post: Post) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa bài viết "${post.title}" không?`
    );

    if (confirmed) {
      deletePostMutation.mutate(post.id);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Đang tải bài viết...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h2 className="text-lg font-bold text-red-600">
            Không thể tải bài viết
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Hãy kiểm tra backend tại http://localhost:5000.
          </p>
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-white"
          >
            Thử lại
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">BLOGSPACE</h1>
            <p className="text-sm text-slate-500">Post Management</p>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
            {posts.length} bài viết
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-10 rounded-3xl bg-slate-900 px-8 py-10 text-white">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            SHARE YOUR THOUGHTS
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ý tưởng của bạn, câu chuyện của bạn.
          </h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Tạo, quản lý và chia sẻ những bài viết của bạn trong một không gian đơn giản.
          </p>
        </section>

        <section className="mb-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Viết bài mới</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            Điền đầy đủ thông tin để chia sẻ bài viết của bạn.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="post-title" className="mb-2 block text-sm font-semibold">
                Tiêu đề
              </label>
              <input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài viết"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label htmlFor="post-content" className="mb-2 block text-sm font-semibold">
                Nội dung
              </label>
              <textarea
                id="post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bạn muốn chia sẻ điều gì?"
                rows={5}
                required
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label htmlFor="post-author" className="mb-2 block text-sm font-semibold">
                Tác giả
              </label>
              <input
                id="post-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nhập tên tác giả"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={addPostMutation.isPending}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {addPostMutation.isPending ? 'Đang đăng...' : '+ Đăng bài viết'}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500">LATEST STORIES</p>
            <h2 className="mt-1 text-2xl font-bold">Danh sách bài viết</h2>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <div className="text-4xl">📝</div>
              <h3 className="mt-4 font-semibold">Chưa có bài viết</h3>
              <p className="mt-1 text-sm text-slate-500">
                Hãy viết bài đầu tiên của bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => {
                const postComments = comments.filter(
                  (comment) => comment.postId === post.id
                );

                return (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-xl font-bold">{post.title}</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                        #{post.id}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap leading-7 text-slate-600">
                      {post.content}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {post.author}
                        </span>
                        <span className="mx-2">·</span>
                        {new Date(post.createdAt).toLocaleString('vi-VN')}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(post)}
                          disabled={editingId === post.id}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                        >
                          {editingId === post.id ? 'Đang sửa...' : 'Sửa'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          disabled={deletePostMutation.isPending}
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    {/* Khu vực bình luận */}
                    <section className="mt-6 border-t border-slate-100 pt-5">
                      <h4 className="mb-4 font-bold">
                        Bình luận ({postComments.length})
                      </h4>

                      {commentsLoading ? (
                        <p className="mb-4 text-sm text-slate-500">
                          Đang tải bình luận...
                        </p>
                      ) : postComments.length === 0 ? (
                        <p className="mb-4 text-sm text-slate-500">
                          Chưa có bình luận. Hãy là người đầu tiên chia sẻ!
                        </p>
                      ) : (
                        <div className="mb-5 space-y-3">
                          {postComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="rounded-xl bg-slate-50 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold">{comment.author}</p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                    {comment.content}
                                  </p>
                                  <p className="mt-2 text-xs text-slate-400">
                                    {new Date(comment.createdAt).toLocaleString('vi-VN')}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('Bạn có chắc muốn xóa bình luận này không?')) {
                                      deleteCommentMutation.mutate(comment.id);
                                    }
                                  }}
                                  disabled={deleteCommentMutation.isPending}
                                  className="shrink-0 rounded-lg px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <form
                        onSubmit={(e) => handleCommentSubmit(e, post.id)}
                        className="space-y-3"
                      >
                        <input
                          value={commentAuthors[post.id] ?? ''}
                          onChange={(e) =>
                            setCommentAuthors((previous) => ({
                              ...previous,
                              [post.id]: e.target.value,
                            }))
                          }
                          placeholder="Tên của bạn"
                          aria-label={`Tên người bình luận cho bài viết ${post.title}`}
                          required
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                        />

                        <textarea
                          value={commentContents[post.id] ?? ''}
                          onChange={(e) =>
                            setCommentContents((previous) => ({
                              ...previous,
                              [post.id]: e.target.value,
                            }))
                          }
                          placeholder="Viết bình luận..."
                          aria-label={`Nội dung bình luận cho bài viết ${post.title}`}
                          rows={3}
                          required
                          className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                        />

                        <button
                          type="submit"
                          disabled={addCommentMutation.isPending}
                          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                          {addCommentMutation.isPending
                            ? 'Đang gửi...'
                            : 'Gửi bình luận'}
                        </button>
                      </form>
                    </section>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-sm text-slate-400">
          BLOGSPACE — Post Management System
        </div>
      </footer>
    </main>
  );
}