import { useMemo, useState } from "react";

function InventoryLedger() {
  // =====================================================
  // LOAD PUTAWAY DATA
  // =====================================================

  const [putaways] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_putaway");

      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Ledger Putaway Error:", error);
      return [];
    }
  });

  // =====================================================
  // LOAD MATERIAL ISSUE DATA
  // =====================================================

  const [materialIssues] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "erp_material_issue"
      );

      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error(
        "Ledger Material Issue Error:",
        error
      );

      return [];
    }
  });

  // =====================================================
  // FILTER STATES
  // =====================================================

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  // =====================================================
  // CREATE COMPLETE LEDGER
  // =====================================================

  const ledger = useMemo(() => {
    // ===================================================
    // 1. PUTAWAY = STOCK IN
    // ===================================================

    const stockIn = putaways
      .filter(
        (putaway) =>
          putaway.status === "Completed" ||
          putaway.status === "Partial"
      )
      .map((putaway) => ({
        id: Number(putaway.id),

        date:
          putaway.createdAt ||
          putaway.date ||
          "-",

        documentNo:
          putaway.documentNo ||
          "-",

        documentType:
          putaway.documentType ||
          "GRN",

        itemCode:
          putaway.itemCode ||
          "-",

        itemName:
          putaway.itemName ||
          "-",

        warehouseId:
          putaway.warehouseId ||
          "",

        warehouseName:
          putaway.warehouseName ||
          "-",

        floor:
          putaway.floor ||
          "-",

        rack:
          putaway.rack ||
          "-",

        bin:
          putaway.bin ||
          "-",

        locationCode:
          putaway.locationCode ||
          "-",

        type: "IN",

        quantity: Number(
          putaway.quantity || 0
        ),

        uom:
          putaway.uom ||
          "Mtr",

        source: "Putaway",
      }));

    // ===================================================
    // 2. MATERIAL ISSUE = STOCK OUT
    // ===================================================

    const stockOut = materialIssues
      .filter(
        (issue) =>
          issue.status === "Completed" ||
          issue.type === "OUT"
      )
      .map((issue) => ({
        id: Number(issue.id),

        date:
          issue.createdAt ||
          issue.date ||
          "-",

        documentNo:
          issue.documentNo ||
          "-",

        documentType:
          issue.documentType ||
          "Material Issue",

        itemCode:
          issue.itemCode ||
          "-",

        itemName:
          issue.itemName ||
          "-",

        warehouseId:
          issue.warehouseId ||
          "",

        warehouseName:
          issue.warehouseName ||
          "-",

        floor:
          issue.floor ||
          "-",

        rack:
          issue.rack ||
          "-",

        bin:
          issue.bin ||
          "-",

        locationCode:
          issue.locationCode ||
          "-",

        type: "OUT",

        quantity: Number(
          issue.issueQuantity || 0
        ),

        uom:
          issue.uom ||
          "Mtr",

        source: "Material Issue",
      }));

    // ===================================================
    // 3. COMBINE IN + OUT
    // ===================================================

    const movements = [
      ...stockIn,
      ...stockOut,
    ];

    // ===================================================
    // 4. SORT OLDEST → NEWEST
    // ===================================================

    movements.sort(
      (a, b) => a.id - b.id
    );

    // ===================================================
    // 5. RUNNING BALANCE
    //
    // Balance is maintained separately by:
    //
    // Item + Warehouse + Location
    // ===================================================

    const balanceMap = {};

    const result = movements.map(
      (entry) => {
        const balanceKey = [
          entry.itemCode,
          entry.warehouseId,
          entry.locationCode,
        ].join("|");

        if (
          balanceMap[balanceKey] === undefined
        ) {
          balanceMap[balanceKey] = 0;
        }

        // STOCK IN
        if (entry.type === "IN") {
          balanceMap[balanceKey] +=
            entry.quantity;
        }

        // STOCK OUT
        if (entry.type === "OUT") {
          balanceMap[balanceKey] -=
            entry.quantity;
        }

        return {
          ...entry,
          balance:
            balanceMap[balanceKey],
        };
      }
    );

    // ===================================================
    // 6. LATEST TRANSACTION FIRST
    // ===================================================

    return result.sort(
      (a, b) => b.id - a.id
    );
  }, [putaways, materialIssues]);

  // =====================================================
  // SEARCH + TYPE FILTER
  // =====================================================

  const filteredLedger = ledger.filter(
    (entry) => {
      const searchableText = `
        ${entry.documentNo}
        ${entry.documentType}
        ${entry.itemCode}
        ${entry.itemName}
        ${entry.warehouseName}
        ${entry.floor}
        ${entry.rack}
        ${entry.bin}
        ${entry.locationCode}
        ${entry.source}
      `.toLowerCase();

      const searchMatch =
        searchableText.includes(
          search.toLowerCase()
        );

      const typeMatch =
        typeFilter === "ALL" ||
        entry.type === typeFilter;

      return (
        searchMatch &&
        typeMatch
      );
    }
  );

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalIn =
    filteredLedger.reduce(
      (total, entry) => {
        if (entry.type === "IN") {
          return total + entry.quantity;
        }

        return total;
      },
      0
    );

  const totalOut =
    filteredLedger.reduce(
      (total, entry) => {
        if (entry.type === "OUT") {
          return total + entry.quantity;
        }

        return total;
      },
      0
    );

  const closingBalance =
    totalIn - totalOut;

  const totalTransactions =
    filteredLedger.length;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>
          <h2 style={styles.title}>
            Inventory Ledger
          </h2>

          <p style={styles.subtitle}>
            Complete inventory movement history
          </p>
        </div>

        <div style={styles.badge}>
          📒 Movement Ledger
        </div>

      </div>

      {/* SUMMARY */}

      <div style={styles.summaryGrid}>

        {/* TOTAL MOVEMENTS */}

        <div style={styles.summaryCard}>

          <div style={styles.icon}>
            📋
          </div>

          <div>

            <div style={styles.label}>
              Total Movements
            </div>

            <div style={styles.value}>
              {totalTransactions}
            </div>

          </div>

        </div>

        {/* TOTAL IN */}

        <div style={styles.summaryCard}>

          <div style={styles.icon}>
            📥
          </div>

          <div>

            <div style={styles.label}>
              Total Stock IN
            </div>

            <div
              style={{
                ...styles.value,
                color: "#15803d",
              }}
            >
              {totalIn.toLocaleString()}
            </div>

          </div>

        </div>

        {/* TOTAL OUT */}

        <div style={styles.summaryCard}>

          <div style={styles.icon}>
            📤
          </div>

          <div>

            <div style={styles.label}>
              Total Stock OUT
            </div>

            <div
              style={{
                ...styles.value,
                color: "#dc2626",
              }}
            >
              {totalOut.toLocaleString()}
            </div>

          </div>

        </div>

        {/* CLOSING BALANCE */}

        <div style={styles.summaryCard}>

          <div style={styles.icon}>
            📦
          </div>

          <div>

            <div style={styles.label}>
              Closing Balance
            </div>

            <div style={styles.value}>
              {closingBalance.toLocaleString()}
            </div>

          </div>

        </div>

      </div>

      {/* FILTER */}

      <div style={styles.filterCard}>

        <div style={styles.searchBox}>

          <span>
            🔍
          </span>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search document, item, location..."
            style={styles.searchInput}
          />

        </div>

        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value)
          }
          style={styles.select}
        >

          <option value="ALL">
            All Movements
          </option>

          <option value="IN">
            Stock IN
          </option>

          <option value="OUT">
            Stock OUT
          </option>

        </select>

      </div>

      {/* LEDGER TABLE */}

      <div style={styles.tableCard}>

        {filteredLedger.length === 0 ? (

          <div style={styles.empty}>

            <div style={styles.emptyIcon}>
              📒
            </div>

            <h3>
              No Inventory Movement
            </h3>

            <p>
              Complete a Putaway or Material
              Issue to create a movement.
            </p>

          </div>

        ) : (

          <div style={styles.tableWrapper}>

            <table style={styles.table}>

              <thead>

                <tr>

                  <th style={styles.th}>
                    Date
                  </th>

                  <th style={styles.th}>
                    Document
                  </th>

                  <th style={styles.th}>
                    Item Code
                  </th>

                  <th style={styles.th}>
                    Item Name
                  </th>

                  <th style={styles.th}>
                    Warehouse
                  </th>

                  <th style={styles.th}>
                    Location
                  </th>

                  <th style={styles.th}>
                    Type
                  </th>

                  <th style={styles.th}>
                    IN
                  </th>

                  <th style={styles.th}>
                    OUT
                  </th>

                  <th style={styles.th}>
                    Balance
                  </th>

                  <th style={styles.th}>
                    Source
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredLedger.map(
                  (entry) => (

                    <tr key={entry.id}>

                      {/* DATE */}

                      <td style={styles.td}>
                        {entry.date}
                      </td>

                      {/* DOCUMENT */}

                      <td style={styles.td}>

                        <strong>
                          {entry.documentNo}
                        </strong>

                        <div
                          style={
                            styles.secondary
                          }
                        >
                          {entry.documentType}
                        </div>

                      </td>

                      {/* ITEM CODE */}

                      <td style={styles.td}>

                        <strong>
                          {entry.itemCode}
                        </strong>

                      </td>

                      {/* ITEM NAME */}

                      <td style={styles.td}>
                        {entry.itemName}
                      </td>

                      {/* WAREHOUSE */}

                      <td style={styles.td}>
                        {entry.warehouseName}
                      </td>

                      {/* LOCATION */}

                      <td style={styles.td}>

                        <strong>
                          {entry.locationCode}
                        </strong>

                        <div
                          style={
                            styles.secondary
                          }
                        >
                          {entry.floor}
                          {" → "}
                          {entry.rack}
                          {" → "}
                          {entry.bin}
                        </div>

                      </td>

                      {/* TYPE */}

                      <td style={styles.td}>

                        {entry.type === "IN" ? (

                          <span
                            style={
                              styles.inBadge
                            }
                          >
                            IN
                          </span>

                        ) : (

                          <span
                            style={
                              styles.outBadge
                            }
                          >
                            OUT
                          </span>

                        )}

                      </td>

                      {/* IN */}

                      <td style={styles.td}>

                        {entry.type === "IN" ? (

                          <strong
                            style={
                              styles.inQuantity
                            }
                          >
                            +
                            {entry.quantity.toLocaleString()}
                          </strong>

                        ) : (
                          "-"
                        )}

                      </td>

                      {/* OUT */}

                      <td style={styles.td}>

                        {entry.type === "OUT" ? (

                          <strong
                            style={
                              styles.outQuantity
                            }
                          >
                            -
                            {entry.quantity.toLocaleString()}
                          </strong>

                        ) : (
                          "-"
                        )}

                      </td>

                      {/* BALANCE */}

                      <td style={styles.td}>

                        <strong
                          style={
                            styles.balance
                          }
                        >
                          {entry.balance.toLocaleString()}
                        </strong>

                        {" "}
                        {entry.uom}

                      </td>

                      {/* SOURCE */}

                      <td style={styles.td}>

                        <span
                          style={
                            styles.sourceBadge
                          }
                        >
                          {entry.source ===
                          "Material Issue"
                            ? "📤 Material Issue"
                            : "📦 Putaway"}
                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* INFO */}

      <div style={styles.infoBox}>

        <strong>
          Ledger Logic:
        </strong>

        <span>
          Putaway creates Stock IN.
          Material Issue creates Stock OUT.
          Running Balance is maintained
          separately for each Item,
          Warehouse and Location.
        </span>

      </div>

    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  container: {
    padding: "28px 32px",
    color: "#111827",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },

  title: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  badge: {
    background: "#eff6ff",
    color: "#2563eb",
    padding: "9px 13px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "600",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },

  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "17px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  icon: {
    width: "40px",
    height: "40px",
    borderRadius: "9px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  label: {
    color: "#64748b",
    fontSize: "10px",
    marginBottom: "4px",
  },

  value: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },

  filterCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "13px 17px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "16px",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#94a3b8",
    flex: 1,
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "12px",
    color: "#111827",
    background: "#ffffff",
  },

  select: {
    border: "1px solid #dbe2ea",
    borderRadius: "7px",
    padding: "9px 12px",
    fontSize: "11px",
    outline: "none",
    minWidth: "170px",
    color: "#111827",
    background: "#ffffff",
  },

  tableCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    color: "#111827",
  },

  th: {
    textAlign: "left",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "11px",
    padding: "13px",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "14px 13px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "12px",
    whiteSpace: "nowrap",
    color: "#111827",
  },

  secondary: {
    color: "#64748b",
    fontSize: "10px",
    marginTop: "4px",
  },

  inBadge: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
  },

  outBadge: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
  },

  inQuantity: {
    color: "#15803d",
    fontSize: "13px",
  },

  outQuantity: {
    color: "#dc2626",
    fontSize: "13px",
  },

  balance: {
    color: "#111827",
    fontSize: "13px",
  },

  sourceBadge: {
    background: "#f1f5f9",
    color: "#475569",
    padding: "5px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    padding: "70px 20px",
    color: "#64748b",
  },

  emptyIcon: {
    fontSize: "48px",
  },

  infoBox: {
    marginTop: "16px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: "10px",
    padding: "12px 15px",
    color: "#1e40af",
    fontSize: "11px",
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
};

export default InventoryLedger;