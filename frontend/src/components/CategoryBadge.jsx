import { getCategoryIcon } from "../utils/icons.js";

export default function CategoryBadge({ category }) {
  if (!category) {
    return <span className="badge text-muted">Uncategorized</span>;
  }
  return (
    <span className="badge" style={{ background: `${category.color}22`, color: category.color }}>
      <span aria-hidden="true">{getCategoryIcon(category.icon)}</span>
      {category.name}
    </span>
  );
}
