export default function TermCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border p-4 rounded shadow-sm hover:shadow-md transition">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
