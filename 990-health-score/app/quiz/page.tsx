import QuizForm from "@/components/QuizForm";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[680px] px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-3xl text-[#1A2E44] tracking-tight">
          Enter your Form 990 numbers
        </h1>
        <p className="mt-2 text-gray-600">
          You&apos;ll find these on your most recently filed Form 990.
        </p>
      </div>
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-10">
        <QuizForm />
      </div>
    </main>
  );
}
