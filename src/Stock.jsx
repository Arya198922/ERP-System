import { useMemo, useState } from "react";

function Stock() {
  // =========================================
  // LOAD DATA
  // =========================================

  const [items] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_items");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Item data error:", error);
      return [];
    }
  });

  const [warehouses] = useState(() => {
    try {
      const saved =
        localStorage.getItem("erp_warehouses");

      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error(
        "Warehouse data error:",
        error
      );
      return [];
    }
  });

  const [grns] = useState(() => {
    try {
      const saved =
        localStorage.getItem("erp_grn_mrn");

      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("GRN data error:", error);
      return [];
    }
  });

  const [putaways] = useState(() => {
    try {
      const saved =
        localStorage.getItem("erp_putaway");

      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error(
        "Putaway data error:",
        error
      );
      return [];
    }
  });

  const [issues] = useState(() => {
    try {
      const saved =
        localStorage.getItem("erp_material_issue");

      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error(
        "Material Issue data error:",
        error
      );
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] =
    useState("ALL");

  // =========================================
  // ITEM HELPERS
  // =========================================

  const getItem = (itemId) => {
    return items.find(
      (item) =>
        String(item.id) ===
        String(itemId)
    );
  };

  const getItemCode = (putaway) => {
    const item = getItem(
      putaway.itemId
    );

    return (
      putaway.itemCode ||
      item?.code ||
      "-"
    );
  };

  const getItemName = (putaway) => {
    const item = getItem(
      putaway.itemId
    );

    return (
      putaway.itemName ||
      item?.name ||
      "Unknown Item"
    );
  };

  // =========================================
  // STOCK CALCULATION
  // =========================================
  //
  // PUTAWAY        = STOCK IN
  // MATERIAL ISSUE = STOCK OUT
  //
  // PICKING does NOT reduce Stock.
  // =========================================

  const stockData = useMemo(() => {
    const stockMap = {};

    // -----------------------------------------
    // 1. PUTAWAY = STOCK IN
    // -----------------------------------------
    putaways.forEach((putaway) => {
      if (
        putaway.status !== "Completed" &&
        putaway.status !== "Partial"
      ) {
        return;
      }

      const quantity = Number(
        putaway.quantity || 0
      );

      if (quantity <= 0) return;

      const itemCode = getItemCode(putaway);
      const itemName = getItemName(putaway);

      const warehouseCode =
        putaway.warehouseCode || "";

      const warehouseName =
        putaway.warehouseName || "";

      const floor = putaway.floor || "";
      const rack = putaway.rack || "";
      const bin = putaway.bin || "";
      const locationCode =
        putaway.locationCode || "";

      const key = [
        itemCode,
        warehouseCode,
        floor,
        rack,
        bin,
        locationCode,
      ].join("_");

      if (!stockMap[key]) {
        stockMap[key] = {
          itemCode,
          itemName,
          warehouseCode,
          warehouseName,
          floor,
          rack,
          bin,
          location:
            putaway.location ||
            `${floor} → ${rack} → ${bin}`,
          locationCode,
          uom: putaway.uom || "Mtr",
          stock: 0,
        };
      }

      stockMap[key].stock += quantity;
    });

    // -----------------------------------------
    // 2. MATERIAL ISSUE = STOCK OUT
    // -----------------------------------------
    issues.forEach((issue) => {
      if (
        issue.status &&
        issue.status !== "Completed"
      ) {
        return;
      }

      const quantity = Number(
        issue.issueQuantity ||
        issue.quantity ||
        0
      );

      if (quantity <= 0) return;

      const itemCode = issue.itemCode || "";
      const locationCode =
        issue.locationCode || "";

      // Match by Item + Location.
      // Material Issue originates from Picking,
      // so its location is the stock source.
      const stockKey = Object.keys(stockMap).find(
        (key) => {
          const stock = stockMap[key];

          return (
            String(stock.itemCode).toLowerCase() ===
              String(itemCode).toLowerCase() &&
            String(stock.locationCode).toLowerCase() ===
              String(locationCode).toLowerCase()
          );
        }
      );

      if (stockKey) {
        stockMap[stockKey].stock -= quantity;
      }
    });

    // -----------------------------------------
    // 3. FINAL CLOSING STOCK
    // -----------------------------------------
    return Object.values(stockMap)
      .map((stock) => ({
        ...stock,
        stock: Number(
          Math.max(
            Number(stock.stock || 0),
            0
          ).toFixed(3)
        ),
      }))
      .filter(
        (stock) => stock.stock > 0
      );

  }, [putaways, issues, items]);

  // =========================================
  // FILTER
  // =========================================

  const filteredStock =
    stockData.filter((stock) => {
      const searchText = `
        ${stock.itemCode}
        ${stock.itemName}
        ${stock.warehouseCode}
        ${stock.warehouseName}
        ${stock.floor}
        ${stock.rack}
        ${stock.bin}
        ${stock.locationCode}
      `.toLowerCase();

      const matchesSearch =
        searchText.includes(
          search.toLowerCase()
        );

      const matchesWarehouse =
        warehouseFilter === "ALL" ||
        stock.warehouseCode ===
          warehouseFilter;

      return (
        matchesSearch &&
        matchesWarehouse
      );
    });

  // =========================================
  // SUMMARY
  // =========================================

  const totalStockQty =
    filteredStock.reduce(
      (total, stock) =>
        total +
        Number(stock.stock || 0),
      0
    );

  const totalPendingPutaway =
    grns
      .filter(
        (grn) =>
          grn.documentType ===
            "GRN" &&
          grn.status ===
            "Completed"
      )
      .reduce(
        (total, grn) => {
          const accepted =
            Number(
              grn.acceptedQty || 0
            );

          const putawayQty =
            putaways
              .filter(
                (p) =>
                  String(
                    p.transactionId
                  ) ===
                  String(grn.id)
              )
              .reduce(
                (sum, p) =>
                  sum +
                  Number(
                    p.quantity || 0
                  ),
                0
              );

          return (
            total +
            Math.max(
              accepted -
                putawayQty,
              0
            )
          );
        },
        0
      );

  const completedPutaways =
    putaways.filter(
      (p) =>
        p.status ===
        "Completed"
    ).length;

  // =========================================
  // RENDER
  // =========================================

  return (
    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            Stock
          </h2>

          <p style={styles.subtitle}>
            Live inventory after Putaway and Material Issue
          </p>
        </div>

        <div style={styles.headerBadge}>
          📦 Live Stock
        </div>
      </div>

      {/* SUMMARY */}

      <div style={styles.summaryGrid}>

        {/* Stock Items */}

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            📦
          </div>

          <div>
            <div style={styles.summaryLabel}>
              Stock Locations
            </div>

            <div style={styles.summaryValue}>
              {filteredStock.length}
            </div>
          </div>
        </div>

        {/* Total Stock */}

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            📊
          </div>

          <div>
            <div style={styles.summaryLabel}>
              Available Quantity
            </div>

            <div style={styles.summaryValue}>
              {totalStockQty.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Pending */}

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            ⏳
          </div>

          <div>
            <div style={styles.summaryLabel}>
              Pending Putaway
            </div>

            <div
              style={{
                ...styles.summaryValue,
                color: "#d97706",
              }}
            >
              {totalPendingPutaway.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Putaways */}

        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>
            📥
          </div>

          <div>
            <div style={styles.summaryLabel}>
              Putaway Transactions
            </div>

            <div style={styles.summaryValue}>
              {completedPutaways}
            </div>
          </div>
        </div>

      </div>

      {/* FILTERS */}

      <div style={styles.filterCard}>

        <div style={styles.searchBox}>
          🔍

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search item, warehouse, rack, bin..."
            style={styles.searchInput}
          />
        </div>

        <select
          value={
            warehouseFilter
          }
          onChange={(e) =>
            setWarehouseFilter(
              e.target.value
            )
          }
          style={styles.filterSelect}
        >
          <option value="ALL">
            All Warehouses
          </option>

          {warehouses.map(
            (warehouse) => (
              <option
                key={warehouse.id}
                value={
                  warehouse.code
                }
              >
                {warehouse.code} -{" "}
                {warehouse.name}
              </option>
            )
          )}
        </select>

      </div>

      {/* TABLE */}

      <div style={styles.tableCard}>

        {filteredStock.length ===
        0 ? (

          <div style={styles.empty}>

            <div
              style={
                styles.emptyIcon
              }
            >
              📦
            </div>

            <h3>
              No Stock Available
            </h3>

            <p>
              Complete Putaway to add stock.
              Material Issue automatically reduces stock.
            </p>

          </div>

        ) : (

          <div
            style={
              styles.tableWrapper
            }
          >

            <table
              style={
                styles.table
              }
            >

              <thead>
                <tr>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Item Code
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Item Name
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Warehouse
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Floor
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Rack
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Bin
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Location Code
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Available Stock
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    UOM
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Status
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredStock.map(
                  (stock) => (

                    <tr
                      key={[
                        stock.itemCode,
                        stock.warehouseCode,
                        stock.floor,
                        stock.rack,
                        stock.bin,
                      ].join("_")}
                    >

                      {/* ITEM CODE */}

                      <td
                        style={
                          styles.td
                        }
                      >
                        <strong>
                          {
                            stock.itemCode
                          }
                        </strong>
                      </td>

                      {/* ITEM NAME */}

                      <td
                        style={
                          styles.td
                        }
                      >
                        {
                          stock.itemName
                        }
                      </td>

                      {/* WAREHOUSE */}

                      <td
                        style={
                          styles.td
                        }
                      >
                        <strong>
                          {
                            stock.warehouseCode
                          }
                        </strong>

                        <div
                          style={
                            styles.secondaryText
                          }
                        >
                          {
                            stock.warehouseName
                          }
                        </div>
                      </td>

                      {/* FLOOR */}

                      <td
                        style={
                          styles.td
                        }
                      >
                        {
                          stock.floor ||
                          "-"
                        }
                      </td>

                      {/* RACK */}

                      <td
                        style={
                          styles.td
                        }
                      >
                        {
                          stock.rack ||
                          "-"
                        }
                      </td>

                      {/* BIN */}

                      <td
                        style={
                          styles.td
                        }
                      >
                        {
                          stock.bin ||
                          "-"
                        }
                      </td>

                      {/* LOCATION CODE */}

                      <td
                        style={
                          styles.td
                        }
                      >
                        <span
                          style={
                            styles.locationCode
                          }
                        >
                          {
                            stock.locationCode ||
                            "-"
                          }
                        </span>
                      </td>

                      {/* STOCK */}

                      <td
                        style={
                          styles.td
                        }
                      >
                        <span
                          style={
                            styles.stockQty
                          }
                        >
                          {Number(
                            stock.stock
                          ).toLocaleString()}
                        </span>
                      </td>

                      {/* UOM */}

                      <td
                        style={
                          styles.td
                        }
                      >
                        {
                          stock.uom
                        }
                      </td>

                      {/* STATUS */}

                      <td
                        style={
                          styles.td
                        }
                      >
                        <span
                          style={
                            styles.status
                          }
                        >
                          In Stock
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

      {/* LOGIC NOTE */}

      <div
        style={
          styles.infoBox
        }
      >

        <strong>
          Stock Calculation:
        </strong>

        <span>
          Putaway quantity is Stock IN.
          Completed Material Issue is
          Stock OUT. Picking does not
          reduce stock.
        </span>

      </div>

    </div>
  );
}

// =========================================
// STYLES
// =========================================

const styles = {
  container: {
    padding: "28px 32px",
    color: "#111827",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
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

  headerBadge: {
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
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "17px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  summaryIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "9px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontSize: "20px",
  },

  summaryLabel: {
    color: "#64748b",
    fontSize: "10px",
    marginBottom: "4px",
  },

  summaryValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },

  filterCard: {
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "13px 17px",
    display: "flex",
    justifyContent:
      "space-between",
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

  filterSelect: {
    border:
      "1px solid #dbe2ea",
    borderRadius: "7px",
    padding: "9px 12px",
    fontSize: "11px",
    outline: "none",
    minWidth: "200px",
    color: "#111827",
    background: "#ffffff",
  },

  tableCard: {
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse",
    color: "#111827",
  },

  th: {
    textAlign: "left",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "11px",
    padding: "13px",
    borderBottom:
      "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "15px 13px",
    borderBottom:
      "1px solid #f1f5f9",
    fontSize: "12px",
    whiteSpace: "nowrap",
    color: "#111827",
  },

  secondaryText: {
    color: "#64748b",
    fontSize: "10px",
    marginTop: "3px",
  },

  locationCode: {
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "5px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "600",
  },

  stockQty: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#15803d",
  },

  status: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
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
    border:
      "1px solid #dbeafe",
    borderRadius: "10px",
    padding: "12px 15px",
    color: "#1e40af",
    fontSize: "11px",
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
};

export default Stock;