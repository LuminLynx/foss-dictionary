import { notFound } from "next/navigation";
import terms from "@/data/terms.json"; // or load from YAML if needed
import ReactMarkdown from "react-markdown";

export default function TermPage({ params }: { params: { id: string } }) {
  const term = terms.find((t) => t.id === params.id);

  if (!term) return notFound();

  return (
    <main className="px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold flex items-center gap-2">
        {term.emoji && <span>{term.emoji}</span>}
        {term.term}
      </h1>

      <span className="text-sm bg-gray-200 rounded px-2 py-1 text-gray-700 mt-2 inline-block">
        {term.category}
      </span>

      <section className="mt-6 prose">
        <ReactMarkdown>{term.definition}</ReactMarkdown>
      </section>

      {term.example && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Example</h2>
          <blockquote className="italic text-gray-600">
            <ReactMarkdown>{term.example}</ReactMarkdown>
          </blockquote>
        </section>
      )}

      {term.note && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Note</h2>
          <p>{term.note}</p>
        </section>
      )}

      {term.related?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Related Terms</h2>
          <ul className="list-disc list-inside">
            {term.related.map((rid) => (
              <li key={rid}>
                <a
                  href={`/terms/${rid}`}
                  className="text-blue-600 hover:underline"
                >
                  {rid}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
