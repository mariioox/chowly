'use client';

export default function AccountMenu({ session, onSignOut }) {
  const initial = (session?.name || '?').charAt(0).toUpperCase();
  const roleLabel = session?.role === 'waiter' ? 'Waiter' : 'Customer';

  return (
    <div className="account">
      <div className="account-pill">
        <span className="account-avatar">{initial}</span>
        <span className="account-name" title={session?.name}>
          {session?.name}
        </span>
        <span className="account-role">{roleLabel}</span>
      </div>
      <button className="account-out" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}