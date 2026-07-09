export default function CategoryBadge({ category }) {
  if (!category) {
    return <span className="badge text-muted">Uncategorized</span>;
  }
  return (
    <span className="badge" style={{ background: `${category.color}22`, color: category.color }}>
      <span className="badge-dot" style={{ background: category.color }} />
      {category.name}
    </span>
  );
}
