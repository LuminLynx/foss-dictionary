import { notFound } from "next/navigation";
import { getTermById } from "@/lib/terms";

interface TermPageProps {
  params: { id: string };
}

export default function TermDetailPage({ params }: TermPageProps) {
  const term = getTermById(params.id);

  if (!term) {
    notFound();
  }

  return (
    <main>
      <h1>{term.term}</h1>
      <p>{term.definition}</p>

      {term.related && term.related.length > 0 && (
        <>
          <h2>Related Terms</h2>
          <ul>
            {term.related.map((relId) => (
              <li key={relId}>{relId}</li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
