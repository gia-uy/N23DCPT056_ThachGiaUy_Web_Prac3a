
import { Suspense } from 'react';
import PostDetailClient from './PostDetailClient';

export default function PostDetailPage() {
  return (
    <Suspense fallback={<main className="p-8">Đang tải trang...</main>}>
      <PostDetailClient />
    </Suspense>
  );
}