// app/layout.tsx
import Link from "next/link";
import routes from "../routes.json" assert { type: "json" }; // ✅ JSON import attribute for NodeNext
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
          {routes
            // Option 1: filter out dynamic routes
            .filter((r) => !r.includes("["))
            // Option 2: OR replace placeholder with a sample value
            // .map((r) => r.includes("[id]") ? r.replace("[id]", "123") : r)
            .map((href) => (
              <Link key={href} href={href} style={{ marginRight: "1rem" }}>
                {href === "/" ? "Home" : href.replace("/", "").toUpperCase()}
              </Link>
            ))}
        </nav>
        {children}
      </body>
    </html>
  );
}
