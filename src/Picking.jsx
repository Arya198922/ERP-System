import { useMemo, useState } from "react";

function Picking() {
  // =====================================================
  // LOAD PUTAWAY
  // =====================================================

  const [putaways] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_putaway");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Putaway error:", error);
      return [];
    }
  });

  // =====================================================
  // LOAD EXISTING PICKING
  // =====================================================

  const [pickings, setPickings] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_picking");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Picking error:", error);
      return [];
    }
  });

  // =====================================================
  // LOAD MATERIAL ISSUE
  // =====================================================

  const [issues] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "erp_material_issue"
      );

      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Material Issue error:", error);
      return [];
    }
  });

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedStock, setSelectedStock] =
    useState(null);

  const [form, setForm] = useState({
    pickQuantity: "",
    pickedBy: "",
    remarks: "",
  });

  // =====================================================
  // AUTO PICKING NUMBER
  // =====================================================

  const nextPickingNo = useMemo(() => {
    let maxNumber = 0;

    pickings.forEach((pick) => {
      const match = String(
        pick.documentNo || ""
      ).match(/^PK-(\d+)$/);

      if (match) {
        maxNumber = Math.max(
          maxNumber,
          Number(match[1])
        );
      }
    });

    return `PK-${String(
      maxNumber + 1
    ).padStart(4, "0")}`;
  }, [pickings]);

  // =====================================================
  // AVAILABLE STOCK
  //
  // PUTAWAY
  // MINUS
  // PICKED
  // MINUS
  // MATERIAL ISSUE
  //
  // =====================================================

  const availableStock = useMemo(() => {
    const stockMap = {};

    // ===================================================
    // STOCK IN FROM PUTAWAY
    // ===================================================

    putaways.forEach((putaway) => {
      if (
        putaway.status !== "Completed" &&
        putaway.status !== "Partial"
      ) {
        return;
      }

      const key = [
        putaway.itemCode || "",
        putaway.warehouseId || "",
        putaway.locationCode || "",
      ].join("|");

      if (!stockMap[key]) {
        stockMap[key] = {
          itemCode:
            putaway.itemCode || "-",

          itemName:
            putaway.itemName || "-",

          warehouseId:
            putaway.warehouseId || "",

          warehouseName:
            putaway.warehouseName || "-",

          floor:
            putaway.floor || "-",

          rack:
            putaway.rack || "-",

          bin:
            putaway.bin || "-",

          locationCode:
            putaway.locationCode || "-",

          uom:
            putaway.uom || "Mtr",

          quantity: 0,
        };
      }

      stockMap[key].quantity += Number(
        putaway.quantity || 0
      );
    });

    // ===================================================
    // PICKED STOCK
    //
    // Once picked, it is no longer available
    // for another picking transaction.
    // ===================================================

    pickings.forEach((pick) => {
      const key = [
        pick.itemCode || "",
        pick.warehouseId || "",
        pick.locationCode || "",
      ].join("|");

      if (stockMap[key]) {
        stockMap[key].quantity -= Number(
          pick.pickQuantity || 0
        );
      }
    });

    // ===================================================
    // MATERIAL ISSUE
    //
    // Existing old direct issues are also deducted.
    // ===================================================

    issues.forEach((issue) => {
      const key = [
        issue.itemCode || "",
        issue.warehouseId || "",
        issue.locationCode || "",
      ].join("|");

      if (stockMap[key]) {
        stockMap[key].quantity -= Number(
          issue.issueQuantity || 0
        );
      }
    });

    return Object.values(stockMap).filter(
      (stock) => stock.quantity > 0
    );
  }, [
    putaways,
    pickings,
    issues,
  ]);

  // =====================================================
  // SAVE PICKING
  // =====================================================

  const savePickings = (data) => {
    setPickings(data);

    localStorage.setItem(
      "erp_picking",
      JSON.stringify(data)
    );
  };

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // OPEN NEW PICKING
  // =====================================================

  const openNewPicking = () => {
    setSelectedStock(null);

    setSearch("");

    setForm({
      pickQuantity: "",
      pickedBy: "",
      remarks: "",
    });

    setShowForm(true);
  };

  // =====================================================
  // SELECT STOCK
  // =====================================================

  const selectStock = (stock) => {
    setSelectedStock(stock);

    setForm((prev) => ({
      ...prev,
      pickQuantity: "",
    }));
  };

  // =====================================================
  // COMPLETE PICKING
  // =====================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedStock) {
      alert(
        "Please select fabric and location."
      );

      return;
    }

    const quantity = Number(
      form.pickQuantity
    );

    if (!form.pickQuantity || quantity <= 0) {
      alert(
        "Please enter valid Pick Quantity."
      );

      return;
    }

    if (!form.pickedBy.trim()) {
      alert(
        "Please enter Picked By."
      );

      return;
    }

    // =================================================
    // GET LATEST STOCK
    // =================================================

    const latestStock =
      availableStock.find(
        (stock) =>
          stock.itemCode ===
            selectedStock.itemCode &&
          String(stock.warehouseId) ===
            String(
              selectedStock.warehouseId
            ) &&
          stock.locationCode ===
            selectedStock.locationCode
      );

    if (!latestStock) {
      alert(
        "Selected stock is no longer available."
      );

      return;
    }

    // =================================================
    // PREVENT OVER PICKING
    // =================================================

    if (
      quantity >
      latestStock.quantity
    ) {
      alert(
        `Insufficient Available Stock.\n\nAvailable: ${latestStock.quantity} ${latestStock.uom}\nRequested: ${quantity} ${latestStock.uom}`
      );

      return;
    }

    // =================================================
    // CREATE PICKING TRANSACTION
    // =================================================

    const newPicking = {
      id: Date.now(),

      documentNo:
        nextPickingNo,

      documentType:
        "Picking",

      date: new Date()
        .toISOString()
        .split("T")[0],

      itemCode:
        selectedStock.itemCode,

      itemName:
        selectedStock.itemName,

      warehouseId:
        selectedStock.warehouseId,

      warehouseName:
        selectedStock.warehouseName,

      floor:
        selectedStock.floor,

      rack:
        selectedStock.rack,

      bin:
        selectedStock.bin,

      locationCode:
        selectedStock.locationCode,

      pickQuantity:
        quantity,

      uom:
        selectedStock.uom,

      pickedBy:
        form.pickedBy.trim(),

      remarks:
        form.remarks.trim(),

      status:
        "Completed",

      type:
        "PICK",

      source:
        "Picking",

      createdAt:
        new Date().toLocaleString(),
    };

    // =================================================
    // SAVE
    // =================================================

    const updatedPickings = [
      newPicking,
      ...pickings,
    ];

    savePickings(
      updatedPickings
    );

    alert(
      `${nextPickingNo} completed successfully.\n\nPicked: ${quantity} ${selectedStock.uom}`
    );

    // =================================================
    // RESET
    // =================================================

    setSelectedStock(null);

    setSearch("");

    setForm({
      pickQuantity: "",
      pickedBy: "",
      remarks: "",
    });

    setShowForm(false);
  };

  // =====================================================
  // SEARCH STOCK
  // =====================================================

  const filteredStock =
    availableStock.filter(
      (stock) => {
        const text = `
          ${stock.itemCode}
          ${stock.itemName}
          ${stock.warehouseName}
          ${stock.floor}
          ${stock.rack}
          ${stock.bin}
          ${stock.locationCode}
        `.toLowerCase();

        return text.includes(
          search.toLowerCase()
        );
      }
    );

  // =====================================================
  // TOTAL PICKED
  // =====================================================

  const totalPicked =
    pickings.reduce(
      (total, pick) =>
        total +
        Number(
          pick.pickQuantity || 0
        ),
      0
    );

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h2 style={styles.title}>
            Picking
          </h2>

          <p style={styles.subtitle}>
            Pick material from warehouse locations
          </p>

        </div>

        <button
          style={styles.newButton}
          onClick={openNewPicking}
        >
          + New Picking
        </button>

      </div>

      {/* SUMMARY */}

      <div style={styles.summaryGrid}>

        <div style={styles.summaryCard}>

          <div style={styles.icon}>
            📦
          </div>

          <div>

            <div style={styles.label}>
              Available Locations
            </div>

            <div style={styles.value}>
              {availableStock.length}
            </div>

          </div>

        </div>

        <div style={styles.summaryCard}>

          <div style={styles.icon}>
            📋
          </div>

          <div>

            <div style={styles.label}>
              Total Pickings
            </div>

            <div style={styles.value}>
              {pickings.length}
            </div>

          </div>

        </div>

        <div style={styles.summaryCard}>

          <div style={styles.icon}>
            📤
          </div>

          <div>

            <div style={styles.label}>
              Total Picked
            </div>

            <div
              style={{
                ...styles.value,
                color: "#2563eb",
              }}
            >
              {totalPicked.toLocaleString()}
            </div>

          </div>

        </div>

      </div>

      {/* FORM */}

      {showForm && (

        <div style={styles.formCard}>

          <div style={styles.formHeader}>

            <div>

              <h3 style={styles.formTitle}>
                New Picking
              </h3>

              <div
                style={
                  styles.documentNo
                }
              >
                Picking No:
                {" "}
                <strong>
                  {nextPickingNo}
                </strong>
              </div>

            </div>

            <button
              style={styles.closeButton}
              onClick={() =>
                setShowForm(false)
              }
            >
              ×
            </button>

          </div>

          {/* SEARCH */}

          <div style={styles.searchBox}>

            <span>
              🔍
            </span>

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Enter Fabric Code or Fabric Name..."
              style={styles.searchInput}
              autoFocus
            />

          </div>

          {/* STOCK RESULTS */}

          {search.trim() && (

            <div
              style={
                styles.matchBox
              }
            >

              {filteredStock.length ===
              0 ? (

                <div
                  style={
                    styles.noMatch
                  }
                >
                  No available stock found.
                </div>

              ) : (

                filteredStock.map(
                  (stock, index) => {

                    const selected =
                      selectedStock &&
                      selectedStock.itemCode ===
                        stock.itemCode &&
                      String(
                        selectedStock.warehouseId
                      ) ===
                        String(
                          stock.warehouseId
                        ) &&
                      selectedStock.locationCode ===
                        stock.locationCode;

                    return (
                      <div
                        key={`${stock.itemCode}-${stock.locationCode}-${index}`}
                        onClick={() =>
                          selectStock(
                            stock
                          )
                        }
                        style={{
                          ...styles.stockOption,

                          ...(selected
                            ? styles.selectedStock
                            : {}),
                        }}
                      >

                        <div>

                          <strong
                            style={
                              styles.itemCode
                            }
                          >
                            {
                              stock.itemCode
                            }
                          </strong>

                          <div
                            style={
                              styles.itemName
                            }
                          >
                            {
                              stock.itemName
                            }
                          </div>

                        </div>

                        <div
                          style={
                            styles.locationInfo
                          }
                        >

                          <strong>
                            {
                              stock.locationCode
                            }
                          </strong>

                          <div
                            style={
                              styles.locationText
                            }
                          >
                            {
                              stock.warehouseName
                            }

                            {" • "}

                            {
                              stock.floor
                            }

                            {" → "}

                            {
                              stock.rack
                            }

                            {" → "}

                            {
                              stock.bin
                            }
                          </div>

                        </div>

                        <div
                          style={
                            styles.availableQty
                          }
                        >
                          {
                            stock.quantity.toLocaleString()
                          }

                          {" "}

                          {
                            stock.uom
                          }
                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

          )}

          {/* SELECTED STOCK */}

          {selectedStock && (

            <div
              style={
                styles.selectedPanel
              }
            >

              <div
                style={
                  styles.selectedHeader
                }
              >

                <strong>
                  Selected Stock
                </strong>

                <button
                  type="button"
                  style={
                    styles.changeButton
                  }
                  onClick={() =>
                    setSelectedStock(
                      null
                    )
                  }
                >
                  Change
                </button>

              </div>

              <div
                style={
                  styles.selectedGrid
                }
              >

                {/* FABRIC CODE */}

                <div>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Fabric Code
                  </label>

                  <div
                    style={
                      styles.valueBox
                    }
                  >
                    {
                      selectedStock.itemCode
                    }
                  </div>

                </div>

                {/* FABRIC NAME */}

                <div>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Fabric Name
                  </label>

                  <div
                    style={
                      styles.valueBox
                    }
                  >
                    {
                      selectedStock.itemName
                    }
                  </div>

                </div>

                {/* WAREHOUSE */}

                <div>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Warehouse
                  </label>

                  <div
                    style={
                      styles.valueBox
                    }
                  >
                    {
                      selectedStock.warehouseName
                    }
                  </div>

                </div>

                {/* LOCATION */}

                <div>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Location
                  </label>

                  <div
                    style={
                      styles.valueBox
                    }
                  >
                    {
                      selectedStock.locationCode
                    }
                  </div>

                </div>

                {/* AVAILABLE */}

                <div>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Available Stock
                  </label>

                  <div
                    style={{
                      ...styles.valueBox,
                      color: "#15803d",
                      fontWeight: "700",
                    }}
                  >
                    {
                      selectedStock.quantity.toLocaleString()
                    }

                    {" "}

                    {
                      selectedStock.uom
                    }
                  </div>

                </div>

                {/* PICK QUANTITY */}

                <div>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Pick Quantity *
                  </label>

                  <input
                    type="number"
                    name="pickQuantity"
                    min="0"
                    max={
                      selectedStock.quantity
                    }
                    value={
                      form.pickQuantity
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={`Max ${selectedStock.quantity}`}
                    style={
                      styles.input
                    }
                  />

                </div>

                {/* PICKED BY */}

                <div>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Picked By *
                  </label>

                  <input
                    type="text"
                    name="pickedBy"
                    value={
                      form.pickedBy
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Picker name"
                    style={
                      styles.input
                    }
                  />

                </div>

                {/* REMARKS */}

                <div>

                  <label
                    style={
                      styles.label
                    }
                  >
                    Remarks
                  </label>

                  <input
                    type="text"
                    name="remarks"
                    value={
                      form.remarks
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Optional"
                    style={
                      styles.input
                    }
                  />

                </div>

              </div>

              {/* FOOTER */}

              <div
                style={
                  styles.formFooter
                }
              >

                <button
                  type="button"
                  style={
                    styles.cancelButton
                  }
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  style={
                    styles.saveButton
                  }
                  onClick={
                    handleSubmit
                  }
                >
                  Complete Picking
                </button>

              </div>

            </div>

          )}

        </div>
      )}

      {/* MAIN SEARCH */}

      <div
        style={
          styles.mainSearch
        }
      >

        <span>
          🔍
        </span>

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search Fabric Code or Fabric Name..."
          style={
            styles.mainSearchInput
          }
        />

        <strong>
          Available Locations:
          {" "}
          {
            filteredStock.length
          }
        </strong>

      </div>

      {/* AVAILABLE STOCK */}

      <div
        style={
          styles.tableCard
        }
      >

        <div
          style={
            styles.tableHeader
          }
        >
          Available Stock for Picking
        </div>

        {filteredStock.length ===
        0 ? (

          <div style={styles.empty}>
            📦

            <h3>
              No Available Stock
            </h3>

            <p>
              Complete Putaway first.
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

                  <th style={styles.th}>
                    Fabric Code
                  </th>

                  <th style={styles.th}>
                    Fabric Name
                  </th>

                  <th style={styles.th}>
                    Warehouse
                  </th>

                  <th style={styles.th}>
                    Location
                  </th>

                  <th style={styles.th}>
                    Available Qty
                  </th>

                  <th style={styles.th}>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredStock.map(
                  (stock, index) => (

                    <tr
                      key={`${stock.itemCode}-${stock.locationCode}-${index}`}
                    >

                      <td style={styles.td}>
                        <strong>
                          {
                            stock.itemCode
                          }
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {
                          stock.itemName
                        }
                      </td>

                      <td style={styles.td}>
                        {
                          stock.warehouseName
                        }
                      </td>

                      <td style={styles.td}>

                        <strong>
                          {
                            stock.locationCode
                          }
                        </strong>

                        <div
                          style={
                            styles.secondary
                          }
                        >
                          {
                            stock.floor
                          }

                          {" → "}

                          {
                            stock.rack
                          }

                          {" → "}

                          {
                            stock.bin
                          }
                        </div>

                      </td>

                      <td style={styles.td}>

                        <strong
                          style={
                            styles.stockQty
                          }
                        >
                          {
                            stock.quantity.toLocaleString()
                          }
                        </strong>

                        {" "}

                        {
                          stock.uom
                        }

                      </td>

                      <td style={styles.td}>

                        <button
                          style={
                            styles.actionButton
                          }
                          onClick={() => {

                            setSearch(
                              stock.itemCode
                            );

                            setShowForm(
                              true
                            );

                            selectStock(
                              stock
                            );

                          }}
                        >
                          Pick Stock
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* RECENT PICKINGS */}

      <div
        style={{
          ...styles.tableCard,
          marginTop: "18px",
        }}
      >

        <div
          style={
            styles.tableHeader
          }
        >
          Recent Pickings
        </div>

        {pickings.length ===
        0 ? (

          <div
            style={
              styles.emptySmall
            }
          >
            No picking transactions yet.
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

                  <th style={styles.th}>
                    Picking No.
                  </th>

                  <th style={styles.th}>
                    Fabric
                  </th>

                  <th style={styles.th}>
                    Location
                  </th>

                  <th style={styles.th}>
                    Picked By
                  </th>

                  <th style={styles.th}>
                    Quantity
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {pickings
                  .slice(0, 10)
                  .map((pick) => (

                    <tr key={pick.id}>

                      <td style={styles.td}>

                        <strong>
                          {
                            pick.documentNo
                          }
                        </strong>

                        <div
                          style={
                            styles.secondary
                          }
                        >
                          {
                            pick.date
                          }
                        </div>

                      </td>

                      <td style={styles.td}>

                        <strong>
                          {
                            pick.itemCode
                          }
                        </strong>

                        <div
                          style={
                            styles.secondary
                          }
                        >
                          {
                            pick.itemName
                          }
                        </div>

                      </td>

                      <td style={styles.td}>
                        {
                          pick.locationCode
                        }
                      </td>

                      <td style={styles.td}>
                        {
                          pick.pickedBy
                        }
                      </td>

                      <td style={styles.td}>

                        <strong
                          style={
                            styles.pickQty
                          }
                        >
                          +
                          {
                            Number(
                              pick.pickQuantity
                            ).toLocaleString()
                          }
                        </strong>

                        {" "}

                        {
                          pick.uom
                        }

                      </td>

                      <td style={styles.td}>

                        <span
                          style={
                            styles.completedBadge
                          }
                        >
                          Completed
                        </span>

                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>

        )}

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
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    color: "#111827",
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  newButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "12px 17px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "15px",
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
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  label: {
    color: "#64748b",
    fontSize: "11px",
    marginBottom: "4px",
  },

  value: {
    fontSize: "21px",
    fontWeight: "700",
    color: "#111827",
  },

  formCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "13px",
    padding: "22px",
    marginBottom: "18px",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  formTitle: {
    margin: 0,
    fontSize: "19px",
  },

  documentNo: {
    marginTop: "5px",
    fontSize: "12px",
    color: "#64748b",
  },

  closeButton: {
    border: "none",
    background: "#f1f5f9",
    color: "#64748b",
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    fontSize: "20px",
    cursor: "pointer",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #dbe2ea",
    borderRadius: "8px",
    padding: "0 12px",
    height: "44px",
    marginBottom: "10px",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "13px",
    color: "#111827",
    background: "#ffffff",
    marginLeft: "8px",
  },

  matchBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    overflow: "hidden",
    marginBottom: "16px",
  },

  stockOption: {
    display: "grid",
    gridTemplateColumns:
      "1.1fr 1.5fr 0.6fr",
    alignItems: "center",
    gap: "15px",
    padding: "13px 15px",
    borderBottom:
      "1px solid #f1f5f9",
    cursor: "pointer",
    background: "#ffffff",
  },

  selectedStock: {
    background: "#eff6ff",
  },

  itemCode: {
    color: "#111827",
    fontSize: "13px",
  },

  itemName: {
    color: "#64748b",
    fontSize: "11px",
    marginTop: "4px",
  },

  locationInfo: {
    color: "#111827",
    fontSize: "12px",
  },

  locationText: {
    color: "#64748b",
    fontSize: "10px",
    marginTop: "4px",
  },

  availableQty: {
    color: "#15803d",
    fontWeight: "700",
    textAlign: "right",
    fontSize: "13px",
  },

  noMatch: {
    padding: "18px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "12px",
  },

  selectedPanel: {
    background: "#f8fafc",
    border: "1px solid #dbeafe",
    borderRadius: "10px",
    padding: "17px",
  },

  selectedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    fontSize: "13px",
  },

  changeButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
  },

  selectedGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "14px",
  },

  valueBox: {
    background: "#ffffff",
    border: "1px solid #dbe2ea",
    borderRadius: "7px",
    padding: "10px",
    minHeight: "17px",
    fontSize: "12px",
    color: "#111827",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dbe2ea",
    borderRadius: "7px",
    padding: "10px",
    fontSize: "12px",
    color: "#111827",
    background: "#ffffff",
    outline: "none",
  },

  formFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
  },

  cancelButton: {
    border: "1px solid #dbe2ea",
    background: "#ffffff",
    color: "#475569",
    padding: "10px 17px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  saveButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "10px 18px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "700",
  },

  mainSearch: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "11px",
    padding: "13px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  },

  mainSearchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "12px",
    color: "#111827",
    background: "#ffffff",
  },

  tableCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
  },

  tableHeader: {
    padding: "16px 18px",
    borderBottom:
      "1px solid #e5e7eb",
    fontSize: "14px",
    fontWeight: "700",
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
    borderBottom:
      "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "14px 13px",
    borderBottom:
      "1px solid #f1f5f9",
    fontSize: "12px",
    color: "#111827",
    whiteSpace: "nowrap",
  },

  secondary: {
    color: "#64748b",
    fontSize: "10px",
    marginTop: "4px",
  },

  stockQty: {
    color: "#15803d",
    fontSize: "13px",
  },

  pickQty: {
    color: "#2563eb",
    fontSize: "13px",
  },

  actionButton: {
    border: "none",
    background: "#dbeafe",
    color: "#2563eb",
    padding: "7px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "10px",
  },

  completedBadge: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
  },

  empty: {
    textAlign: "center",
    padding: "55px 20px",
    color: "#64748b",
  },

  emptySmall: {
    textAlign: "center",
    padding: "35px",
    color: "#64748b",
    fontSize: "12px",
  },
};

export default Picking;