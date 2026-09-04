export function TableSkeletonRows({
  rowCount,
  columnCount,
}: {
  rowCount: number;
  columnCount: number;
}) {
  const safeCols = Math.max(1, columnCount);
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <tr key={`sk-${rowIdx}`} className="animate-pulse">
          {Array.from({ length: safeCols }).map((__, colIdx) => (
            <td key={`sk-${rowIdx}-c-${colIdx}`} className="px-6 py-4 whitespace-nowrap">
              <div
                className="h-4 rounded bg-gray-200"
                style={{ width: `${55 + ((rowIdx + colIdx * 3) % 5) * 8}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
