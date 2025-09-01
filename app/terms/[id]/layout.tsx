export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section style={{ padding: '1.5rem', backgroundColor: '#f9f9f9' }}>
      {/* Shared UI for all /terms/[id] pages */}
      {children}
    </section>
  );
}

