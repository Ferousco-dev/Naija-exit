export default function Topbar({ user, onLogout }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        background: "var(--color-background-primary)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#3B6D11",
          }}
        />
        <span
          style={{
            fontSize: "16px",
            fontWeight: "500",
            color: "var(--color-text-primary)",
          }}
        >
          Naija Exit
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-md)",
            padding: "4px 10px",
            background: "var(--color-background-secondary)",
          }}
        >
          🇳🇬 {user?.country}
        </div>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#C0DD97",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "500",
            color: "#27500A",
            cursor: "pointer",
          }}
          onClick={onLogout}
          title="Logout"
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
