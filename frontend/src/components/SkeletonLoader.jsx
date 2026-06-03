export default function SkeletonLoader({ rows = 4, type = "cards" }) {
  if (type === "table") {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
            {Array.from({ length: 6 }).map((__, column) => (
              <div key={column} className="skeleton h-4 rounded" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="glass-card rounded-lg p-5">
          <div className="skeleton mb-6 h-4 w-24 rounded" />
          <div className="skeleton h-8 w-32 rounded" />
        </div>
      ))}
    </div>
  );
}
