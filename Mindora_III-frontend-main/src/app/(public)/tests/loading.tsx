export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="h-10 w-40 animate-pulse rounded-lg bg-[#F9F6FF]" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-56 animate-pulse rounded-xl bg-[#F9F6FF]" />
        ))}
      </div>
    </div>
  );
}
