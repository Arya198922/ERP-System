import "./responsive.css";
import { useState } from "react";
import ItemMaster from "./ItemMaster";
import WarehouseMaster from "./WarehouseMaster";
import GrnMrn from "./GrnMrn";
import Stock from "./Stock";
import InventoryLedger from "./InventoryLedger";
import MaterialIssue from "./MaterialIssue";
import Putaway from "./Putaway";
import Picking from "./Picking";
function App() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    "Dashboard",
    "Item Master",
    "Warehouse",
    "Vendor",
    "Purchase Order",
    "GRN / MRN",
    "Stock",
    "Putaway",
    "Picking",
    "Material Issue",
    "Stock Ledger",
    "Reports",
  ];

  const stats = [
    { title: "Total Items", value: "1,248", icon: "📦" },
    { title: "Total Stock", value: "10,520", icon: "🏷️" },
    { title: "Pending GRN", value: "18", icon: "📥" },
    { title: "Pending Picking", value: "27", icon: "🛒" },
  ];

  const transactions = [
    {
      id: "GRN-10025",
      type: "GRN",
      item: "Cotton Fabric",
      qty: "2,500 Mtr",
      status: "Completed",
    },
    {
      id: "PIK-00891",
      type: "Picking",
      item: "Polyester Fabric",
      qty: "850 Mtr",
      status: "Pending",
    },
    {
      id: "ISS-00452",
      type: "Issue",
      item: "Packing Material",
      qty: "320 Nos",
      status: "Completed",
    },
    {
      id: "GRN-10026",
      type: "GRN",
      item: "Viscose Fabric",
      qty: "1,200 Mtr",
      status: "Pending",
    },
  ];

  return (
    <div style={styles.app}>
      {/* Mobile Menu Button */}
      <button
        className="wms-mobile-menu"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="wms-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`wms-sidebar ${
          mobileMenuOpen ? "wms-sidebar-open" : ""
        }`}
        style={styles.sidebar}
      >
        <button
          className="wms-mobile-close"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          ×
        </button>

        <div style={styles.logo}>
          <div style={styles.logoBox}>ERP</div>
          <div>
            <div style={styles.logoTitle}>ERP SYSTEM</div>
            <div style={styles.logoSub}>WMS Management</div>
          </div>
        </div>

        <div style={styles.menuTitle}>MAIN MENU</div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => {
                setActiveMenu(item);
                setMobileMenuOpen(false);
              }}
              style={{
                ...styles.menuItem,
                ...(activeMenu === item ? styles.activeMenu : {}),
              }}
            >
              <span style={styles.menuIcon}>
                {item === "Dashboard"
                  ? "▦"
                  : item === "Item Master"
                  ? "📦"
                  : item === "Warehouse"
                  ? "🏭"
                  : item === "Vendor"
                  ? "👥"
                  : item === "Purchase Order"
                  ? "📋"
                  : item === "GRN / MRN"
                  ? "📥"
                  : item === "Stock"
                  ? "📊"
                  : item === "Putaway"
                  ? "📍"
                  : item === "Picking"
                  ? "🛒"
                  : item === "Material Issue"
                  ? "📤"
                  : item === "Stock Ledger"
                  ? "📒"
                  : "📈"}
              </span>

              {item}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.userCircle}>V</div>
          <div>
            <div style={styles.userName}>Admin User</div>
            <div style={styles.userRole}>Administrator</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <div style={styles.breadcrumb}>ERP / {activeMenu}</div>
            <h1 style={styles.pageTitle}>{activeMenu}</h1>
          </div>

          <div style={styles.headerRight}>
            <button style={styles.notification}>🔔</button>

            <div style={styles.profile}>
              <div style={styles.profileCircle}>V</div>
              <div>
                <div style={styles.profileName}>Vishal</div>
                <div style={styles.profileRole}>WMS Executive</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
    
{activeMenu === "GRN / MRN" ? (
  <GrnMrn />

) : activeMenu === "Stock" ? (
  <Stock />

) : activeMenu === "Stock Ledger" ? (
  <InventoryLedger />

) : activeMenu === "Putaway" ? (
  <Putaway />

) : activeMenu === "Warehouse" ? (
  <WarehouseMaster />

) : activeMenu === "Item Master" ? (
  <ItemMaster />

  ) : activeMenu === "Material Issue" ? (
  <MaterialIssue />

  ) : activeMenu === "Picking" ? (
  <Picking />

) : activeMenu === "Dashboard" ? (

          <div style={styles.content}>
            <div style={styles.welcomeBox}>
              <div>
                <h2 style={styles.welcomeTitle}>Good Evening, Vishal 👋</h2>
                <p style={styles.welcomeText}>
                  Welcome back to your ERP & WMS management system.
                </p>
              </div>

              <div style={styles.dateBox}>
                📅 23 August 2026
              </div>
            </div>

            {/* Stats */}
            <div style={styles.statsGrid}>
              {stats.map((stat) => (
                <div style={styles.statCard} key={stat.title}>
                  <div style={styles.statTop}>
                    <div style={styles.statIcon}>{stat.icon}</div>
                    <span style={styles.statArrow}>↗</span>
                  </div>

                  <div style={styles.statValue}>{stat.value}</div>
                  <div style={styles.statTitle}>{stat.title}</div>
                </div>
              ))}
            </div>

            {/* Middle Section */}
            <div style={styles.twoColumn}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.cardTitle}>Stock Overview</h3>
                    <p style={styles.cardSub}>Current warehouse inventory</p>
                  </div>

                  <button style={styles.viewButton}>View Stock</button>
                </div>

                <div style={styles.stockRows}>
                  <div style={styles.stockRow}>
                    <span>Raw Material</span>
                    <strong>18,450</strong>
                    <span style={styles.stockUnit}>Mtr</span>
                  </div>

                  <div style={styles.stockRow}>
                    <span>Finished Goods</span>
                    <strong>12,820</strong>
                    <span style={styles.stockUnit}>Nos</span>
                  </div>

                  <div style={styles.stockRow}>
                    <span>Packing Material</span>
                    <strong>8,650</strong>
                    <span style={styles.stockUnit}>Nos</span>
                  </div>

                  <div style={styles.stockRow}>
                    <span>Other Materials</span>
                    <strong>5,900</strong>
                    <span style={styles.stockUnit}>Nos</span>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.cardTitle}>Warehouse Status</h3>
                    <p style={styles.cardSub}>Current warehouse utilization</p>
                  </div>
                </div>

                <div style={styles.warehouse}>
                  <div style={styles.warehouseTop}>
                    <span>Main Warehouse</span>
                    <strong>78%</strong>
                  </div>

                  <div style={styles.progressBackground}>
                    <div
                      style={{
                        ...styles.progress,
                        width: "78%",
                      }}
                    />
                  </div>
                </div>

                <div style={styles.warehouse}>
                  <div style={styles.warehouseTop}>
                    <span>Finished Goods</span>
                    <strong>62%</strong>
                  </div>

                  <div style={styles.progressBackground}>
                    <div
                      style={{
                        ...styles.progress,
                        width: "62%",
                      }}
                    />
                  </div>
                </div>

                <div style={styles.warehouse}>
                  <div style={styles.warehouseTop}>
                    <span>Packing Store</span>
                    <strong>41%</strong>
                  </div>

                  <div style={styles.progressBackground}>
                    <div
                      style={{
                        ...styles.progress,
                        width: "41%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>Recent Transactions</h3>
                  <p style={styles.cardSub}>
                    Latest ERP & WMS activities
                  </p>
                </div>

                <button style={styles.viewButton}>View All</button>
              </div>

              <div style={styles.table}>
                <div style={styles.tableHeader}>
                  <span>Document</span>
                  <span>Type</span>
                  <span>Item</span>
                  <span>Quantity</span>
                  <span>Status</span>
                </div>

                {transactions.map((transaction) => (
                  <div style={styles.tableRow} key={transaction.id}>
                    <strong>{transaction.id}</strong>
                    <span>{transaction.type}</span>
                    <span>{transaction.item}</span>
                    <span>{transaction.qty}</span>

                    <span
                      style={{
                        ...styles.status,
                        ...(transaction.status === "Completed"
                          ? styles.completed
                          : styles.pending),
                      }}
                    >
                      {transaction.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.modulePage}>
            <div style={styles.moduleIcon}>🚧</div>

            <h2>{activeMenu}</h2>

            <p>
              This module will be developed next.
            </p>

            <button
              style={styles.primaryButton}
              onClick={() => setActiveMenu("Dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  sidebar: {
    width: "250px",
    background: "#111827",
    color: "#fff",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 8px 28px",
  },

  logoBox: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },

  logoTitle: {
    fontWeight: "800",
    fontSize: "15px",
  },

  logoSub: {
    color: "#9ca3af",
    fontSize: "11px",
    marginTop: "3px",
  },

  menuTitle: {
    color: "#6b7280",
    fontSize: "10px",
    fontWeight: "700",
    padding: "0 12px 10px",
    letterSpacing: "1px",
  },

  menuItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    padding: "11px 12px",
    marginBottom: "3px",
    borderRadius: "8px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  activeMenu: {
    background: "#2563eb",
    color: "#fff",
  },

  menuIcon: {
    width: "20px",
    textAlign: "center",
  },

  sidebarBottom: {
    marginTop: "auto",
    borderTop: "1px solid #273244",
    padding: "18px 8px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  userCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  userName: {
    fontSize: "13px",
    fontWeight: "600",
  },

  userRole: {
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "2px",
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  header: {
    height: "76px",
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    boxSizing: "border-box",
  },

  breadcrumb: {
    color: "#94a3b8",
    fontSize: "11px",
    marginBottom: "4px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "22px",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },

  notification: {
    border: "none",
    background: "#f1f5f9",
    borderRadius: "8px",
    padding: "9px 11px",
    cursor: "pointer",
  },

  profile: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  profileCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },

  profileName: {
    fontSize: "13px",
    fontWeight: "700",
  },

  profileRole: {
    fontSize: "11px",
    color: "#94a3b8",
  },

  content: {
    padding: "28px 32px",
  },

  welcomeBox: {
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    borderRadius: "14px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "21px",
  },

  welcomeText: {
    margin: "7px 0 0",
    opacity: 0.85,
    fontSize: "13px",
  },

  dateBox: {
    background: "rgba(255,255,255,0.15)",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "12px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "20px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statIcon: {
    fontSize: "21px",
  },

  statArrow: {
    color: "#22c55e",
  },

  statValue: {
    fontSize: "25px",
    fontWeight: "800",
    marginTop: "12px",
  },

  statTitle: {
    color: "#64748b",
    fontSize: "12px",
    marginTop: "3px",
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "20px",
    marginBottom: "20px",
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "16px",
  },

  cardSub: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: "11px",
  },

  viewButton: {
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#2563eb",
    padding: "8px 11px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "11px",
  },

  stockRows: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  stockRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 50px",
    alignItems: "center",
    paddingBottom: "12px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "13px",
  },

  stockUnit: {
    color: "#94a3b8",
    fontSize: "11px",
    textAlign: "right",
  },

  warehouse: {
    marginBottom: "18px",
  },

  warehouseTop: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    marginBottom: "7px",
  },

  progressBackground: {
    height: "8px",
    background: "#e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "10px",
  },

  table: {
    width: "100%",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 0.7fr 1.4fr 1fr 1fr",
    padding: "11px 12px",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns: "1fr 0.7fr 1.4fr 1fr 1fr",
    padding: "14px 12px",
    borderBottom: "1px solid #f1f5f9",
    alignItems: "center",
    fontSize: "12px",
  },

  status: {
    width: "fit-content",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
  },

  completed: {
    background: "#dcfce7",
    color: "#15803d",
  },

  pending: {
    background: "#fef3c7",
    color: "#b45309",
  },

  modulePage: {
    margin: "80px auto",
    maxWidth: "500px",
    textAlign: "center",
    background: "#fff",
    padding: "50px",
    borderRadius: "15px",
    border: "1px solid #e5e7eb",
  },

  moduleIcon: {
    fontSize: "50px",
  },

  primaryButton: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "11px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "15px",
  },
};

export default App;