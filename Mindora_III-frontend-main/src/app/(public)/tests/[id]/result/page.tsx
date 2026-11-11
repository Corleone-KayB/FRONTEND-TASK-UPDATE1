import { TestResultView } from "@/components/tests/TestResult";
import { TESTS } from "@/lib/mock-data/tests";

export function generateStaticParams() {
  return TESTS.map((test) => ({ id: test.id }));
}

export default async function TestResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestResultView id={id} />;
}
