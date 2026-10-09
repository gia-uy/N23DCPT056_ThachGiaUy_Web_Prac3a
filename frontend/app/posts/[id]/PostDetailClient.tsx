
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = String(params.id);

  // Lấy thông tin bài viết
  const {
    data: post,
    isLoading: postLoading,
    isError: postError,
  } = useQuery<Post>({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await api.get(`/api/posts/${id}`);
      return response.data;
    },
  });

  // Lấy danh sách bình luận
  const {
    data: comments = [],
    isLoading: commentsLoading,
  } = useQuery<Comment[]>({
    queryKey: ['comments', id],
    queryFn: async () => {
      const response = await api.get(`/api/posts/${id}/comments`);
      return response.data;
    },
  });

  // Xóa bình luận
  const deleteComment = useMutation({
    mutationFn: async (commentId: number) => {
      await api.delete(`/api/comments/${commentId}`);
    },
    onSuccess: () => {
      toast.success('Đã xóa bình luận!');
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: () => {
      toast.error('Không thể xóa bình luận!');
    },
  });

  if (postLoading) {
    return <main className="p-8">Đang tải bài viết...</main>;
  }

  if (postError || !post) {
    return (
      <main className="p-8">
        <p>Không tìm thấy bài viết.</p>
        <button
          onClick={() => router.push('/posts')}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
        >
          Quay lại danh sách
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <button
        onClick={() => router.push('/posts')}
        className="mb-6 rounded border px-4 py-2 hover:bg-gray-100"
      >
        ← Quay lại danh sách
      </button>

      <article className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="mb-3 text-3xl font-bold">{post.title}</h1>

        <p className="mb-4 text-sm text-gray-500">
          Tác giả: {post.author} ·{' '}
          {new Date(post.createdAt).toLocaleString('vi-VN')}
        </p>

        <div className="whitespace-pre-wrap leading-7 text-gray-800">
          {post.content}
        </div>
      </article>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">
          Bình luận ({comments.length})
        </h2>

        {commentsLoading ? (
          <p>Đang tải bình luận...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500">Chưa có bình luận nào.</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{comment.author}</p>
                    <p className="mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
                        deleteComment.mutate(comment.id);
                      }
                    }}
                    disabled={deleteComment.isPending}
                    className="shrink-0 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}