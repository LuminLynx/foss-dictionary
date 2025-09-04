interface TermPageProps {
  params: { id: string };
}

export default function TermPage({ params }: TermPageProps) {
  return (
    <>
      <h2 className="text-2xl font-bold">Term: {params.id}</h2>
      <p>Definition and details for this term will go here.</p>
    </>
  );
}
