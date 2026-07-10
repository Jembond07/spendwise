export default function AccountBadge({ account }) {
  if (!account) {
    return <span className="badge text-muted">No account</span>;
  }
  return (
    <span className="badge" style={{ background: `${account.color}22`, color: account.color }}>
      <span className="badge-dot" style={{ background: account.color }} />
      {account.name}
    </span>
  );
}
