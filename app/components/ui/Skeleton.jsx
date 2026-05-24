// app/components/ui/Skeleton.jsx
export function SkeletonCard() {
  return <div className="animate-pulse bg-gray-200 h-32 rounded-xl"></div>;
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 bg-gray-200 rounded"></div>
      <div className="h-8 bg-gray-200 rounded"></div>
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  );
}