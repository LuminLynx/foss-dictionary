export const terms = [
  {
    id: "props",
    title: "Props",
    description:
      "Short for properties; used to pass data into React components.",
    category: "React",
    emoji: "📦",
  },
  {
    id: "middleware",
    title: "Middleware",
    description:
      "Software layer between systems to enable communication or data processing.",
    category: "Architecture",
    emoji: "🔌",
  },
];

export function getTermById(id: string) {
  return terms.find((term) => term.id === id);
}
