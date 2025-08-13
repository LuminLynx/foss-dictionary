export default function TermLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <header className="py-4 px-6 border-b flex justify-between items-center">
        <a href="/" className="text-xl font-bold hover:text-blue-600">
          🧠 Dev Glossary
        </a>
        <nav className="space-x-4">
          <a href="/terms" className="text-sm text-gray-600 hover:underline">
            All Terms
          </a>
          <a
            href="/contribute"
            className="text-sm text-gray-600 hover:underline"
          >
            Contribute
          </a>
        </nav>
      </header>

      <main className="px-6 py-10">{children}</main>

      <footer className="px-6 py-8 text-sm text-gray-500 text-center border-t">
        Made with ☕ by the FOSS community. Want to add a term? Open a PR.
      </footer>
    </div>
  );
}
