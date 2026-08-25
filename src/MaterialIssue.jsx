import { useMemo, useState } from "react";

function MaterialIssue() {
  const [pickings] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_picking");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [issues, setIssues] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_material_issue");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [form, setForm] = useState({
    issueQuantity: "",
    issueTo: "",
    remarks: "",
  });

  const nextDocumentNo = useMemo(() => {
    let max = 0;
    issues.forEach((issue) => {
      const m = String(issue.documentNo || "").match(/^MI-(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return `MI-${String(max + 1).padStart(4, "0")}`;
  }, [issues]);

  // ONLY PICKED STOCK CAN BE ISSUED.
  // Picked Qty - already issued Qty = available to issue.
  const availableStock = useMemo(() => {
    const issuedByPicking = {};

    issues.forEach((issue) => {
      if (issue.status !== "Completed") return;
      const id = String(issue.pickingId || "");
      if (!id) return;
      issuedByPicking[id] =
        (issuedByPicking[id] || 0) +
        Number(issue.issueQuantity || 0);
    });

    return pickings
      .filter(
        (pick) =>
          String(pick.status || "").toLowerCase() === "completed"
      )
      .map((pick) => {
        const pickedQty = Number(
          pick.pickQuantity || pick.quantity || 0
        );
        const issuedQty =
          issuedByPicking[String(pick.id)] || 0;

        return {
          ...pick,
          pickingNo: pick.documentNo || "-",
          itemCode: pick.itemCode || pick.itemId || "-",
          itemName: pick.itemName || "-",
          warehouseId: pick.warehouseId || "",
          warehouseName: pick.warehouseName || "-",
          floor: pick.floor || "-",
          rack: pick.rack || "-",
          bin: pick.bin || "-",
          locationCode: pick.locationCode || "-",
          uom: pick.uom || "Mtr",
          pickedQuantity: pickedQty,
          issuedQuantity: issuedQty,
          remainingQuantity: Number(
            (pickedQty - issuedQty).toFixed(3)
          ),
        };
      })
      .filter((stock) => stock.remainingQuantity > 0);
  }, [pickings, issues]);

  const filteredStock = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableStock;

    return availableStock.filter((s) =>
      [
        s.pickingNo,
        s.itemCode,
        s.itemName,
        s.warehouseName,
        s.locationCode,
        s.floor,
        s.rack,
        s.bin,
        s.pickedBy,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, availableStock]);

  const totalIssued = issues.reduce(
    (sum, issue) => sum + Number(issue.issueQuantity || 0),
    0
  );

  const totalPickedAvailable = availableStock.reduce(
    (sum, stock) => sum + Number(stock.remainingQuantity || 0),
    0
  );

  const openNewIssue = () => {
    setSelectedStock(null);
    setSearch("");
    setForm({
      issueQuantity: "",
      issueTo: "",
      remarks: "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setSelectedStock(null);
    setSearch("");
    setForm({
      issueQuantity: "",
      issueTo: "",
      remarks: "",
    });
    setShowForm(false);
  };

  const selectStock = (stock) => {
    setSelectedStock(stock);
    setSearch(stock.itemCode);
    setForm((prev) => ({
      ...prev,
      issueQuantity: "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedStock) {
      alert("Please select picked stock.");
      return;
    }

    const quantity = Number(form.issueQuantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Please enter a valid Issue Quantity.");
      return;
    }

    if (!form.issueTo.trim()) {
      alert("Please enter Issue To.");
      return;
    }

    // Re-check latest picked balance.
    const issuedAgainstPicking = issues
      .filter(
        (issue) =>
          String(issue.pickingId || "") ===
          String(selectedStock.id)
      )
      .reduce(
        (sum, issue) =>
          sum + Number(issue.issueQuantity || 0),
        0
      );

    const pickedQty = Number(
      selectedStock.pickQuantity ||
        selectedStock.quantity ||
        0
    );

    const latestAvailable = Number(
      (pickedQty - issuedAgainstPicking).toFixed(3)
    );

    if (latestAvailable <= 0) {
      alert("This picking has already been fully issued.");
      return;
    }

    if (quantity > latestAvailable) {
      alert(
        `Issue quantity cannot exceed picked balance.\n\n` +
        `Picked: ${pickedQty} ${selectedStock.uom}\n` +
        `Already Issued: ${issuedAgainstPicking} ${selectedStock.uom}\n` +
        `Available to Issue: ${latestAvailable} ${selectedStock.uom}`
      );
      return;
    }

    const newIssue = {
      id: Date.now(),
      documentNo: nextDocumentNo,
      documentType: "Material Issue",
      type: "OUT",
      source: "Material Issue",
      status: "Completed",
      date: new Date().toISOString().split("T")[0],

      // Picking reference
      pickingId: selectedStock.id,
      pickingNo: selectedStock.pickingNo,

      // Item
      itemCode: selectedStock.itemCode,
      itemName: selectedStock.itemName,

      // Location
      warehouseId: selectedStock.warehouseId,
      warehouseName: selectedStock.warehouseName,
      floor: selectedStock.floor,
      rack: selectedStock.rack,
      bin: selectedStock.bin,
      locationCode: selectedStock.locationCode,

      // Quantity
      issueQuantity: quantity,
      quantity,
      uom: selectedStock.uom,

      // Issue details
      issueTo: form.issueTo.trim(),
      remarks: form.remarks.trim(),
      pickedBy: selectedStock.pickedBy || "",

      createdAt: new Date().toLocaleString(),
    };

    const updated = [newIssue, ...issues];
    setIssues(updated);
    localStorage.setItem(
      "erp_material_issue",
      JSON.stringify(updated)
    );

    alert(
      `${nextDocumentNo} completed successfully.\n\n` +
      `Picking: ${selectedStock.pickingNo}\n` +
      `${selectedStock.itemCode} - ${selectedStock.itemName}\n` +
      `Issued: ${quantity} ${selectedStock.uom}`
    );

    closeForm();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Material Issue</h2>
          <p style={styles.subtitle}>
            Issue picked material from warehouse to department / person
          </p>
        </div>

        <button style={styles.newButton} onClick={openNewIssue}>
          + New Material Issue
        </button>
      </div>

      <div style={styles.summaryGrid}>
        <Summary
          icon="📦"
          label="Picked Stock Available"
          value={`${totalPickedAvailable.toLocaleString()} Mtr`}
          green
        />
        <Summary
          icon="📤"
          label="Total Issues"
          value={issues.length}
        />
        <Summary
          icon="📊"
          label="Issued Quantity"
          value={`${totalIssued.toLocaleString()} Mtr`}
          red
        />
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <div>
              <h3 style={styles.formTitle}>New Material Issue</h3>
              <div style={styles.documentNo}>
                Issue Document No.: <strong>{nextDocumentNo}</strong>
              </div>
            </div>

            <button style={styles.closeButton} onClick={closeForm}>
              ×
            </button>
          </div>

          <label style={styles.label}>
            Fabric Code / Fabric Name *
          </label>

          <div style={styles.searchBox}>
            <span>🔍</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedStock(null);
              }}
              placeholder="Enter Fabric Code or Fabric Name..."
              style={styles.searchInput}
              autoFocus
            />
          </div>

          <div style={styles.matchBox}>
            {filteredStock.length === 0 ? (
              <div style={styles.noMatch}>
                No picked stock available.
                <br />
                <small>Complete Picking first.</small>
              </div>
            ) : (
              filteredStock.map((stock) => (
                <button
                  key={stock.id}
                  type="button"
                  onClick={() => selectStock(stock)}
                  style={{
                    ...styles.stockOption,
                    ...(selectedStock?.id === stock.id
                      ? styles.selectedStock
                      : {}),
                  }}
                >
                  <div>
                    <strong style={styles.itemCode}>
                      {stock.itemCode}
                    </strong>
                    <div style={styles.itemName}>
                      {stock.itemName}
                    </div>
                    <div style={styles.pickingRef}>
                      {stock.pickingNo}
                    </div>
                  </div>

                  <div style={styles.locationInfo}>
                    <strong>{stock.locationCode}</strong>
                    <div style={styles.locationText}>
                      {stock.warehouseName} • {stock.floor} →{" "}
                      {stock.rack} → {stock.bin}
                    </div>
                  </div>

                  <div style={styles.availableQty}>
                    {stock.remainingQuantity.toLocaleString()}{" "}
                    {stock.uom}
                  </div>
                </button>
              ))
            )}
          </div>

          {selectedStock && (
            <div style={styles.selectedPanel}>
              <div style={styles.selectedHeader}>
                <span>Selected Picked Stock</span>
                <button
                  type="button"
                  style={styles.clearButton}
                  onClick={() => setSelectedStock(null)}
                >
                  Change
                </button>
              </div>

              <div style={styles.selectedGrid}>
                <Field label="Picking No." value={selectedStock.pickingNo} />
                <Field label="Fabric Code" value={selectedStock.itemCode} />
                <Field label="Fabric Name" value={selectedStock.itemName} />
                <Field
                  label="Warehouse"
                  value={selectedStock.warehouseName}
                />
                <Field
                  label="Location Code"
                  value={selectedStock.locationCode}
                />
                <Field
                  label="Picked Quantity"
                  value={`${selectedStock.pickedQuantity.toLocaleString()} ${selectedStock.uom}`}
                />
                <Field
                  label="Available to Issue"
                  value={`${selectedStock.remainingQuantity.toLocaleString()} ${selectedStock.uom}`}
                  green
                />

                <div>
                  <label style={styles.label}>Issue Quantity *</label>
                  <input
                    name="issueQuantity"
                    type="number"
                    min="0"
                    max={selectedStock.remainingQuantity}
                    step="0.01"
                    value={form.issueQuantity}
                    onChange={handleChange}
                    placeholder={`Max ${selectedStock.remainingQuantity}`}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Issue To *</label>
                  <input
                    name="issueTo"
                    value={form.issueTo}
                    onChange={handleChange}
                    placeholder="Department / Person"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Remarks</label>
                  <input
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    placeholder="Optional"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formFooter}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  style={styles.saveButton}
                  onClick={handleSubmit}
                >
                  Complete Material Issue
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={styles.mainSearch}>
        <span>🔍</span>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedStock(null);
          }}
          placeholder="Search Picking No., Fabric Code or Fabric Name..."
          style={styles.mainSearchInput}
        />
        <strong>
          Available Pickings: {filteredStock.length}
        </strong>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          Picked Stock Available for Material Issue
        </div>

        {filteredStock.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: "32px" }}>📦</div>
            <h3>No Picked Stock Available</h3>
            <p>Complete Picking first, then issue the picked material.</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Picking No.</th>
                  <th style={styles.th}>Fabric Code</th>
                  <th style={styles.th}>Fabric Name</th>
                  <th style={styles.th}>Warehouse</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Available Qty</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredStock.map((stock) => (
                  <tr key={stock.id}>
                    <td style={styles.td}>
                      <strong>{stock.pickingNo}</strong>
                      <div style={styles.secondary}>
                        {stock.date || "-"}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <strong>{stock.itemCode}</strong>
                    </td>

                    <td style={styles.td}>{stock.itemName}</td>

                    <td style={styles.td}>{stock.warehouseName}</td>

                    <td style={styles.td}>
                      <strong>{stock.locationCode}</strong>
                      <div style={styles.secondary}>
                        {stock.floor} → {stock.rack} → {stock.bin}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <strong style={styles.stockQty}>
                        {stock.remainingQuantity.toLocaleString()}
                      </strong>{" "}
                      {stock.uom}
                    </td>

                    <td style={styles.td}>
                      <button
                        style={styles.actionButton}
                        onClick={() => {
                          setShowForm(true);
                          selectStock(stock);
                        }}
                      >
                        Issue Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          Recent Material Issues
        </div>

        {issues.length === 0 ? (
          <div style={styles.empty}>No material issues yet.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Issue No.</th>
                  <th style={styles.th}>Picking No.</th>
                  <th style={styles.th}>Fabric</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Issue To</th>
                  <th style={styles.th}>Quantity</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {issues.slice(0, 10).map((issue) => (
                  <tr key={issue.id}>
                    <td style={styles.td}>
                      <strong>{issue.documentNo}</strong>
                      <div style={styles.secondary}>{issue.date}</div>
                    </td>

                    <td style={styles.td}>
                      {issue.pickingNo || "-"}
                    </td>

                    <td style={styles.td}>
                      <strong>{issue.itemCode}</strong>
                      <div style={styles.secondary}>
                        {issue.itemName}
                      </div>
                    </td>

                    <td style={styles.td}>
                      {issue.locationCode}
                    </td>

                    <td style={styles.td}>{issue.issueTo}</td>

                    <td style={styles.td}>
                      <strong style={styles.outQty}>
                        -{Number(
                          issue.issueQuantity || 0
                        ).toLocaleString()}
                      </strong>{" "}
                      {issue.uom || "Mtr"}
                    </td>

                    <td style={styles.td}>
                      <span style={styles.badge}>Completed</span>
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

function Summary({ icon, label, value, green, red }) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryIcon}>{icon}</div>
      <div>
        <div style={styles.summaryLabel}>{label}</div>
        <div
          style={{
            ...styles.summaryValue,
            ...(green ? { color: "#15803d" } : {}),
            ...(red ? { color: "#dc2626" } : {}),
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, green = false }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <div
        style={{
          ...styles.valueBox,
          ...(green
            ? { color: "#15803d", fontWeight: "700" }
            : {}),
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

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
    color: "#fff",
    padding: "12px 17px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
    marginBottom: "18px",
  },
  summaryCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "17px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  summaryIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },
  summaryLabel: {
    color: "#64748b",
    fontSize: "11px",
    marginBottom: "4px",
  },
  summaryValue: {
    fontSize: "21px",
    fontWeight: "700",
    color: "#111827",
  },
  formCard: {
    background: "#fff",
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
  label: {
    display: "block",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "600",
    marginBottom: "6px",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #dbe2ea",
    borderRadius: "8px",
    padding: "0 12px",
    height: "44px",
    marginBottom: "10px",
    background: "#fff",
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "13px",
    color: "#111827",
    background: "#fff",
    marginLeft: "8px",
  },
  matchBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    overflow: "hidden",
    marginBottom: "16px",
    background: "#fff",
    maxHeight: "280px",
    overflowY: "auto",
  },
  stockOption: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1.1fr 1.5fr 0.6fr",
    alignItems: "center",
    gap: "15px",
    padding: "13px 15px",
    border: "none",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    background: "#fff",
    textAlign: "left",
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
  pickingRef: {
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: "700",
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
    fontWeight: "700",
    fontSize: "13px",
  },
  clearButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
  },
  selectedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
  },
  valueBox: {
    background: "#fff",
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
    background: "#fff",
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
    background: "#fff",
    color: "#475569",
    padding: "10px 17px",
    borderRadius: "7px",
    cursor: "pointer",
  },
  saveButton: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "700",
  },
  mainSearch: {
    background: "#fff",
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
    background: "#fff",
  },
  tableCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "18px",
  },
  tableHeader: {
    padding: "16px 18px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
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
  outQty: {
    color: "#dc2626",
  },
  actionButton: {
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    padding: "7px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "10px",
  },
  badge: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    padding: "45px 20px",
    color: "#64748b",
    fontSize: "12px",
  },
};

export default MaterialIssue;