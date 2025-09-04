export default function TermLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <article className="prose">{children}</article>;
}
