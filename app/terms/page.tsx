import Link from "next/link";
import { getAllTerms } from "@/lib/terms";

export default function TermsIndexPage() {
  const terms = getAllTerms();

  return (
    <main>
      <h1>Glossary Terms</h1>
      <ul>
        {terms.map((term) => (
          <li key={term.id}>
            <Link href={`/terms/${term.id}`}>{term.term}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

