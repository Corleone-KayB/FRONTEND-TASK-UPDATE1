import { TestQuizGate } from "@/components/tests/TestQuiz";
import { TESTS } from "@/lib/mock-data/tests";

export function generateStaticParams() {
  return TESTS.map((test) => ({ id: test.id }));
}

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestQuizGate id={id} />;
}
