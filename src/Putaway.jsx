import { useEffect, useState } from "react";

function Putaway() {
  // ==============================
  // LOAD DATA FROM LOCAL STORAGE
  // ==============================

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_grn_mrn");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("GRN data error:", error);
      return [];
    }
  });

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_items");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Item data error:", error);
      return [];
    }
  });

  const [warehouses, setWarehouses] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_warehouses");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Warehouse data error:", error);
      return [];
    }
  });

  const [putaways, setPutaways] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_putaway");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Putaway data error:", error);
      return [];
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    transactionId: "",
    warehouseId: "",
    floor: "",
    rack: "",
    bin: "",
    quantity: "",
  });

  // ==============================
  // SAVE PUTAWAY DATA
  // ==============================

  useEffect(() => {
    localStorage.setItem(
      "erp_putaway",
      JSON.stringify(putaways)
    );
  }, [putaways]);

  // ==============================
  // ITEM
  // ==============================

  const getItem = (transaction) => {
    return items.find(
      (item) =>
        String(item.id) ===
        String(transaction.itemId)
    );
  };

  const getItemName = (transaction) => {
    const item = getItem(transaction);

    return (
      item?.name ||
      transaction.itemName ||
      transaction.item ||
      "Unknown Item"
    );
  };

  const getItemCode = (transaction) => {
    const item = getItem(transaction);

    return (
      item?.code ||
      transaction.itemCode ||
      "-"
    );
  };

  // ==============================
  // WAREHOUSE
  // ==============================

  const getWarehouse = (transaction) => {
    return warehouses.find(
      (warehouse) =>
        String(warehouse.id) ===
        String(transaction.warehouseId)
    );
  };

  // ==============================
  // PUTAWAY QUANTITY
  // ==============================

  const getPutawayQty = (transactionId) => {
    return putaways
      .filter(
        (row) =>
          String(row.transactionId) ===
          String(transactionId)
      )
      .reduce(
        (total, row) =>
          total + Number(row.quantity || 0),
        0
      );
  };

  // ==============================
  // PENDING QUANTITY
  // ==============================

  const getPendingQty = (transaction) => {
    const acceptedQty = Number(
      transaction.acceptedQty || 0
    );

    const alreadyPutaway =
      getPutawayQty(transaction.id);

    return Math.max(
      acceptedQty - alreadyPutaway,
      0
    );
  };

  // ==============================
  // OPEN PUTAWAY
  // ==============================

  const handleOpen = (transaction) => {
    const warehouse =
      getWarehouse(transaction);

    setForm({
      transactionId: transaction.id,
      warehouseId:
        warehouse?.id || "",
      floor:
        warehouse?.floor || "",
      rack:
        warehouse?.rack || "",
      bin:
        warehouse?.bin || "",
      quantity: "",
    });

    setShowForm(true);
  };

  // ==============================
  // WAREHOUSE CHANGE
  // ==============================

  const handleWarehouseChange = (e) => {
    const warehouseId =
      e.target.value;

    const warehouse =
      warehouses.find(
        (w) =>
          String(w.id) ===
          String(warehouseId)
      );

    setForm((prev) => ({
      ...prev,
      warehouseId,
      floor:
        warehouse?.floor || "",
      rack:
        warehouse?.rack || "",
      bin:
        warehouse?.bin || "",
    }));
  };

  // ==============================
  // RESET
  // ==============================

  const resetForm = () => {
    setForm({
      transactionId: "",
      warehouseId: "",
      floor: "",
      rack: "",
      bin: "",
      quantity: "",
    });

    setShowForm(false);
  };

  // ==============================
  // SUBMIT PUTAWAY
  // ==============================

  const handleSubmit = (e) => {
    e.preventDefault();

    const transaction =
      transactions.find(
        (t) =>
          String(t.id) ===
          String(form.transactionId)
      );

    if (!transaction) {
      alert(
        "GRN/MRN transaction not found."
      );
      return;
    }

    const quantity =
      Number(form.quantity);

    const pendingQty =
      getPendingQty(transaction);

    // Warehouse validation
    if (!form.warehouseId) {
      alert(
        "Please select warehouse."
      );
      return;
    }

    // Quantity validation
    if (
      !form.quantity ||
      quantity <= 0
    ) {
      alert(
        "Please enter valid Putaway Quantity."
      );
      return;
    }

    // Pending quantity validation
    if (quantity > pendingQty) {
      alert(
        `Putaway quantity cannot exceed pending quantity (${pendingQty}).`
      );
      return;
    }

    const warehouse =
      warehouses.find(
        (w) =>
          String(w.id) ===
          String(form.warehouseId)
      );

    if (!warehouse) {
      alert(
        "Warehouse location not found."
      );
      return;
    }

    // ==============================
    // CREATE PUTAWAY RECORD
    // ==============================

    const newPutaway = {
      id: Date.now(),

      transactionId:
        transaction.id,

      documentNo:
        transaction.documentNo ||
        "-",

      documentType:
        transaction.documentType ||
        "GRN",

      date:
        transaction.date ||
        new Date()
          .toISOString()
          .split("T")[0],

      itemId:
        transaction.itemId ||
        "",

      itemCode:
        getItemCode(transaction),

      itemName:
        getItemName(transaction),

      warehouseId:
        warehouse.id,

      warehouseCode:
        warehouse.code ||
        "",

      warehouseName:
        warehouse.name ||
        "",

      floor:
        warehouse.floor ||
        "",

      rack:
        warehouse.rack ||
        "",

      bin:
        warehouse.bin ||
        "",

      location:
        warehouse.location ||
        "",

      locationCode:
        warehouse.locationCode ||
        "",

      quantity,

      uom:
        getItem(transaction)?.uom ||
        transaction.uom ||
        "Mtr",

      status:
        quantity === pendingQty
          ? "Completed"
          : "Partial",

      createdAt:
        new Date().toLocaleString(),
    };

    // ==============================
    // SAVE DIRECTLY TO LOCAL STORAGE
    // ==============================

    const updatedPutaways = [
      newPutaway,
      ...putaways,
    ];

    localStorage.setItem(
      "erp_putaway",
      JSON.stringify(
        updatedPutaways
      )
    );

    // Update React state
    setPutaways(
      updatedPutaways
    );

    // Success
    alert(
      "Putaway completed successfully."
    );

    resetForm();
  };

  // ==============================
  // PENDING GRN
  // ==============================

  const pendingTransactions =
    transactions.filter(
      (transaction) =>
        transaction.status ===
          "Completed" &&
        Number(
          transaction.acceptedQty || 0
        ) >
          getPutawayQty(
            transaction.id
          )
    );

  // ==============================
  // SEARCH
  // ==============================

  const filteredTransactions =
    pendingTransactions.filter(
      (transaction) => {
        const warehouse =
          getWarehouse(
            transaction
          );

        const text = `
          ${transaction.documentNo || ""}
          ${getItemCode(transaction)}
          ${getItemName(transaction)}
          ${warehouse?.name || ""}
          ${warehouse?.location || ""}
          ${warehouse?.locationCode || ""}
        `.toLowerCase();

        return text.includes(
          search.toLowerCase()
        );
      }
    );

  // ==============================
  // RENDER
  // ==============================

  return (
    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            Putaway
          </h2>

          <p style={styles.subtitle}>
            Move received material to
            warehouse storage locations
          </p>
        </div>
      </div>

      {/* PUTAWAY FORM */}

      {showForm && (
        <div style={styles.formCard}>

          <div style={styles.formHeader}>
            <div>
              <h3 style={styles.formTitle}>
                Complete Putaway
              </h3>

              <p style={styles.formSubtitle}>
                Assign received material
                to a storage location
              </p>
            </div>

            <button
              type="button"
              style={styles.closeButton}
              onClick={resetForm}
            >
              ✕
            </button>
          </div>

          {(() => {
            const transaction =
              transactions.find(
                (t) =>
                  String(t.id) ===
                  String(
                    form.transactionId
                  )
              );

            if (!transaction) {
              return null;
            }

            const pendingQty =
              getPendingQty(
                transaction
              );

            return (
              <form
                onSubmit={
                  handleSubmit
                }
              >

                {/* INFO */}

                <div
                  style={
                    styles.infoBox
                  }
                >

                  <div>
                    <strong>
                      Document
                    </strong>

                    <span>
                      {transaction.documentNo ||
                        "-"}
                    </span>
                  </div>

                  <div>
                    <strong>
                      Item
                    </strong>

                    <span>
                      {getItemCode(
                        transaction
                      )}{" "}
                      -{" "}
                      {getItemName(
                        transaction
                      )}
                    </span>
                  </div>

                  <div>
                    <strong>
                      Accepted Qty
                    </strong>

                    <span>
                      {transaction.acceptedQty ||
                        0}{" "}
                      Mtr
                    </span>
                  </div>

                  <div>
                    <strong>
                      Pending Qty
                    </strong>

                    <span
                      style={
                        styles.pending
                      }
                    >
                      {pendingQty} Mtr
                    </span>
                  </div>

                </div>

                {/* FORM GRID */}

                <div
                  style={
                    styles.formGrid
                  }
                >

                  {/* WAREHOUSE */}

                  <div>
                    <label
                      style={
                        styles.label
                      }
                    >
                      Warehouse *
                    </label>

                    <select
                      value={
                        form.warehouseId
                      }
                      onChange={
                        handleWarehouseChange
                      }
                      style={
                        styles.input
                      }
                    >
                      <option value="">
                        Select Warehouse
                      </option>

                      {warehouses
                        .filter(
                          (w) =>
                            w.status ===
                            "Active"
                        )
                        .map(
                          (
                            warehouse
                          ) => (
                            <option
                              key={
                                warehouse.id
                              }
                              value={
                                warehouse.id
                              }
                            >
                              {
                                warehouse.code
                              }{" "}
                              -{" "}
                              {
                                warehouse.name
                              }{" "}
                              →{" "}
                              {
                                warehouse.location
                              }
                            </option>
                          )
                        )}
                    </select>
                  </div>

                  {/* FLOOR */}

                  <div>
                    <label
                      style={
                        styles.label
                      }
                    >
                      Floor
                    </label>

                    <input
                      value={
                        form.floor
                      }
                      readOnly
                      style={
                        styles.input
                      }
                    />
                  </div>

                  {/* RACK */}

                  <div>
                    <label
                      style={
                        styles.label
                      }
                    >
                      Rack
                    </label>

                    <input
                      value={
                        form.rack
                      }
                      readOnly
                      style={
                        styles.input
                      }
                    />
                  </div>

                  {/* BIN */}

                  <div>
                    <label
                      style={
                        styles.label
                      }
                    >
                      Bin
                    </label>

                    <input
                      value={
                        form.bin
                      }
                      readOnly
                      style={
                        styles.input
                      }
                    />
                  </div>

                  {/* LOCATION CODE */}

                  <div>
                    <label
                      style={
                        styles.label
                      }
                    >
                      Location Code
                    </label>

                    <input
                      value={
                        warehouses.find(
                          (w) =>
                            String(
                              w.id
                            ) ===
                            String(
                              form.warehouseId
                            )
                        )
                          ?.locationCode ||
                        ""
                      }
                      readOnly
                      style={
                        styles.input
                      }
                    />
                  </div>

                  {/* QUANTITY */}

                  <div>
                    <label
                      style={
                        styles.label
                      }
                    >
                      Putaway Quantity *
                    </label>

                    <input
                      type="number"
                      min="1"
                      max={
                        pendingQty
                      }
                      value={
                        form.quantity
                      }
                      onChange={(e) =>
                        setForm(
                          (prev) => ({
                            ...prev,
                            quantity:
                              e.target
                                .value,
                          })
                        )
                      }
                      placeholder={`Max ${pendingQty}`}
                      style={
                        styles.input
                      }
                    />
                  </div>

                </div>

                {/* LOCATION PREVIEW */}

                <div
                  style={
                    styles.locationPreview
                  }
                >
                  📍{" "}
                  {form.floor ||
                    "Floor"}{" "}
                  →{" "}
                  {form.rack ||
                    "Rack"}{" "}
                  →{" "}
                  {form.bin ||
                    "Bin"}

                  {form.warehouseId && (
                    <span>
                      {" "}
                      |{" "}
                      {
                        warehouses.find(
                          (w) =>
                            String(
                              w.id
                            ) ===
                            String(
                              form.warehouseId
                            )
                        )
                          ?.locationCode
                      }
                    </span>
                  )}
                </div>

                {/* ACTIONS */}

                <div
                  style={
                    styles.formActions
                  }
                >

                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                    style={
                      styles.cancelButton
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={
                      styles.saveButton
                    }
                  >
                    Complete Putaway
                  </button>

                </div>

              </form>
            );
          })()}

        </div>
      )}

      {/* SEARCH */}

      <div
        style={
          styles.searchCard
        }
      >

        <div
          style={
            styles.searchBox
          }
        >
          🔍

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search GRN, item, warehouse..."
            style={
              styles.searchInput
            }
          />
        </div>

        <div
          style={
            styles.itemCount
          }
        >
          Pending Putaway:{" "}
          <strong>
            {
              filteredTransactions.length
            }
          </strong>
        </div>

      </div>

      {/* TABLE */}

      <div
        style={
          styles.tableCard
        }
      >

        {filteredTransactions.length ===
        0 ? (

          <div
            style={
              styles.empty
            }
          >
            <div
              style={
                styles.emptyIcon
              }
            >
              📦
            </div>

            <h3>
              No Pending Putaway
            </h3>

            <p>
              All completed GRNs are
              already put away.
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
                    Document
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Item
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
                    Accepted
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Putaway
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Pending
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Status
                  </th>

                  <th
                    style={
                      styles.th
                    }
                  >
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredTransactions.map(
                  (
                    transaction
                  ) => {

                    const warehouse =
                      getWarehouse(
                        transaction
                      );

                    const accepted =
                      Number(
                        transaction.acceptedQty ||
                          0
                      );

                    const completed =
                      getPutawayQty(
                        transaction.id
                      );

                    const pending =
                      accepted -
                      completed;

                    return (
                      <tr
                        key={
                          transaction.id
                        }
                      >

                        <td
                          style={
                            styles.td
                          }
                        >
                          <strong>
                            {
                              transaction.documentNo ||
                              "-"
                            }
                          </strong>

                          <div
                            style={
                              styles.small
                            }
                          >
                            {
                              transaction.date ||
                              "-"
                            }
                          </div>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <strong>
                            {
                              getItemCode(
                                transaction
                              )
                            }
                          </strong>

                          <div
                            style={
                              styles.small
                            }
                          >
                            {
                              getItemName(
                                transaction
                              )
                            }
                          </div>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <strong>
                            {
                              warehouse?.name ||
                              "Not Assigned"
                            }
                          </strong>

                          <div
                            style={
                              styles.small
                            }
                          >
                            📍{" "}
                            {
                              warehouse?.location ||
                              "-"
                            }
                          </div>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {accepted} Mtr
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {completed} Mtr
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            fontWeight:
                              "700",
                          }}
                        >
                          {pending} Mtr
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <span
                            style={
                              styles.pendingBadge
                            }
                          >
                            Pending
                          </span>
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          <button
                            type="button"
                            style={
                              styles.putawayButton
                            }
                            onClick={() =>
                              handleOpen(
                                transaction
                              )
                            }
                          >
                            📦 Putaway
                          </button>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

// =====================================
// STYLES
// =====================================

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

  searchCard: {
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "14px 18px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "55%",
    color: "#64748b",
  },

  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "12px",
    color: "#111827",
    background: "#ffffff",
  },

  itemCount: {
    color: "#64748b",
    fontSize: "12px",
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
    color: "#475569",
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
    whiteSpace: "nowrap",
    color: "#111827",
  },

  small: {
    color: "#64748b",
    fontSize: "10px",
    marginTop: "4px",
  },

  pendingBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
  },

  putawayButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "8px 12px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "600",
  },

  formCard: {
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "20px",
    color: "#111827",
  },

  formHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  formTitle: {
    margin: 0,
    fontSize: "16px",
    color: "#111827",
  },

  formSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "11px",
  },

  closeButton: {
    border: "none",
    background: "#f1f5f9",
    color: "#111827",
    borderRadius: "7px",
    padding: "7px 10px",
    cursor: "pointer",
  },

  infoBox: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: "12px",
    background: "#f8fafc",
    borderRadius: "8px",
    padding: "14px",
    marginBottom: "18px",
    color: "#111827",
  },

  pending: {
    color: "#dc2626",
    fontWeight: "700",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "16px",
  },

  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#475569",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #d1d5db",
    borderRadius: "7px",
    padding: "10px",
    fontSize: "12px",
    outline: "none",
    background: "#ffffff",
    color: "#111827",
  },

  locationPreview: {
    marginTop: "18px",
    background: "#eff6ff",
    border:
      "1px solid #dbeafe",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#1e40af",
    fontSize: "11px",
    fontWeight: "600",
  },

  formActions: {
    display: "flex",
    justifyContent:
      "flex-end",
    gap: "10px",
    marginTop: "20px",
  },

  cancelButton: {
    border:
      "1px solid #dbe2ea",
    background: "#ffffff",
    color: "#111827",
    padding: "10px 16px",
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
};

export default Putaway;