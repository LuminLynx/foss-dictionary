export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-bold">Terms</h1>
      </header>
      {children}
    </section>
  );
}
