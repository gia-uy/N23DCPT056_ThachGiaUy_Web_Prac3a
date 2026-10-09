
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-10 text-center shadow">
        <p className="mb-4 font-semibold tracking-widest text-blue-600">
          BLOGSPACE
        </p>

        <h1 className="mb-6 text-4xl font-bold text-gray-900">
          Chào mừng đến với Blog
        </h1>

        <p className="mb-8 text-gray-600">
          Tạo, quản lý và chia sẻ những câu chuyện của bạn.
        </p>

        <Link
          href="/posts"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Khám phá bài viết →
        </Link>
      </div>
    </main>
  );
}