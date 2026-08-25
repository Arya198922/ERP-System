import { useEffect, useState } from "react";

function GrnMrn() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("erp_grn_mrn");
    return saved ? JSON.parse(saved) : [];
  });

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    documentType: "GRN",
    documentNo: "",
    date: new Date().toISOString().split("T")[0],
    itemId: "",
    warehouseId: "",
    receivedQty: "",
    acceptedQty: "",
    rejectedQty: "",
    remarks: "",
    status: "Completed",
  });

  // Load Item Master data
  useEffect(() => {
    const savedItems = localStorage.getItem("erp_items");

    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  // Load Warehouse Master data
  useEffect(() => {
    const savedWarehouses = localStorage.getItem("erp_warehouses");

    if (savedWarehouses) {
      setWarehouses(JSON.parse(savedWarehouses));
    }
  }, []);

  // Save GRN/MRN transactions
  useEffect(() => {
    localStorage.setItem(
      "erp_grn_mrn",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleReceivedQtyChange = (e) => {
    const received = Number(e.target.value);

    setForm({
      ...form,
      receivedQty: e.target.value,
      acceptedQty: received > 0 ? received : "",
      rejectedQty: "",
    });
  };

  const resetForm = () => {
    setForm({
      documentType: "GRN",
      documentNo: "",
      date: new Date().toISOString().split("T")[0],
      itemId: "",
      warehouseId: "",
      receivedQty: "",
      acceptedQty: "",
      rejectedQty: "",
      remarks: "",
      status: "Completed",
    });

    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.documentNo ||
      !form.itemId ||
      !form.warehouseId ||
      !form.receivedQty
    ) {
      alert(
        "Please fill Document No, Item, Warehouse and Received Qty."
      );
      return;
    }

    const received = Number(form.receivedQty);
    const accepted = Number(form.acceptedQty || 0);
    const rejected = Number(form.rejectedQty || 0);

    if (accepted + rejected !== received) {
      alert(
        "Accepted Qty + Rejected Qty must equal Received Qty."
      );
      return;
    }

    const selectedItem = items.find(
      (item) => String(item.id) === String(form.itemId)
    );

    const selectedWarehouse = warehouses.find(
      (warehouse) =>
        String(warehouse.id) === String(form.warehouseId)
    );

    const newTransaction = {
      id: Date.now(),
      ...form,
      receivedQty: received,
      acceptedQty: accepted,
      rejectedQty: rejected,
      itemName: selectedItem?.name || "",
      itemCode: selectedItem?.code || "",
      uom: selectedItem?.uom || "",
      warehouseName: selectedWarehouse?.name || "",
      warehouseCode: selectedWarehouse?.code || "",
      createdAt: new Date().toLocaleDateString(),
    };

    setTransactions([newTransaction, ...transactions]);

    resetForm();
  };

  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (confirmDelete) {
      setTransactions(
        transactions.filter(
          (transaction) => transaction.id !== id
        )
      );
    }
  };

  const filteredTransactions = transactions.filter(
    (transaction) => {
      const text = `
        ${transaction.documentNo}
        ${transaction.documentType}
        ${transaction.itemCode}
        ${transaction.itemName}
        ${transaction.warehouseCode}
        ${transaction.warehouseName}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    }
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>GRN / MRN</h2>

          <p style={styles.subtitle}>
            Goods Receipt Note & Material Receipt Note
          </p>
        </div>

        <button
          style={styles.addButton}
          onClick={() => setShowForm(true)}
        >
          + New Receipt
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>
              New GRN / MRN
            </h3>

            <button
              style={styles.closeButton}
              onClick={resetForm}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              {/* Document Type */}
              <div>
                <label style={styles.label}>
                  Document Type
                </label>

                <select
                  name="documentType"
                  value={form.documentType}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="GRN">GRN</option>
                  <option value="MRN">MRN</option>
                </select>
              </div>

              {/* Document No */}
              <div>
                <label style={styles.label}>
                  Document No *
                </label>

                <input
                  name="documentNo"
                  value={form.documentNo}
                  onChange={handleChange}
                  placeholder="e.g. GRN-0001"
                  style={styles.input}
                />
              </div>

              {/* Date */}
              <div>
                <label style={styles.label}>
                  Receipt Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              {/* Item */}
              <div>
                <label style={styles.label}>
                  Item *
                </label>

                <select
                  name="itemId"
                  value={form.itemId}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">
                    Select Item
                  </option>

                  {items.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse */}
              <div>
                <label style={styles.label}>
                  Warehouse *
                </label>

                <select
                  name="warehouseId"
                  value={form.warehouseId}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">
                    Select Warehouse
                  </option>

                  {warehouses.map((warehouse) => (
                    <option
                      key={warehouse.id}
                      value={warehouse.id}
                    >
                      {warehouse.code} - {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Received */}
              <div>
                <label style={styles.label}>
                  Received Qty *
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="receivedQty"
                  value={form.receivedQty}
                  onChange={handleReceivedQtyChange}
                  placeholder="e.g. 5000"
                  style={styles.input}
                />
              </div>

              {/* Accepted */}
              <div>
                <label style={styles.label}>
                  Accepted Qty
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="acceptedQty"
                  value={form.acceptedQty}
                  onChange={handleChange}
                  placeholder="e.g. 4900"
                  style={styles.input}
                />
              </div>

              {/* Rejected */}
              <div>
                <label style={styles.label}>
                  Rejected Qty
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="rejectedQty"
                  value={form.rejectedQty}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  style={styles.input}
                />
              </div>

              {/* Status */}
              <div>
                <label style={styles.label}>
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>
              </div>

              {/* Remarks */}
              <div style={styles.fullWidth}>
                <label style={styles.label}>
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Enter remarks..."
                  rows="3"
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={resetForm}
                style={styles.cancelButton}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={styles.saveButton}
              >
                Save Receipt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={styles.searchCard}>
        <div style={styles.searchBox}>
          🔍

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search document, item, warehouse..."
            style={styles.searchInput}
          />
        </div>

        <div style={styles.count}>
          Total Receipts:{" "}
          <strong>{filteredTransactions.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {filteredTransactions.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              📥
            </div>

            <h3>No Receipts Found</h3>

            <p>
              Create your first GRN or MRN transaction.
            </p>

            <button
              style={styles.addButton}
              onClick={() => setShowForm(true)}
            >
              + Create Receipt
            </button>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    Document
                  </th>

                  <th style={styles.th}>
                    Date
                  </th>

                  <th style={styles.th}>
                    Item
                  </th>

                  <th style={styles.th}>
                    Warehouse
                  </th>

                  <th style={styles.th}>
                    Received
                  </th>

                  <th style={styles.th}>
                    Accepted
                  </th>

                  <th style={styles.th}>
                    Rejected
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>

                  <th style={styles.th}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map(
                  (transaction) => (
                    <tr key={transaction.id}>
                      <td style={styles.td}>
                        <strong>
                          {transaction.documentNo}
                        </strong>

                        <div
                          style={
                            styles.documentType
                          }
                        >
                          {transaction.documentType}
                        </div>
                      </td>

                      <td style={styles.td}>
                        {transaction.date}
                      </td>

                      <td style={styles.td}>
                        {transaction.itemCode}
                        <div
                          style={
                            styles.secondaryText
                          }
                        >
                          {transaction.itemName}
                        </div>
                      </td>

                      <td style={styles.td}>
                        {transaction.warehouseCode}
                        <div
                          style={
                            styles.secondaryText
                          }
                        >
                          {transaction.warehouseName}
                        </div>
                      </td>

                      <td style={styles.td}>
                        {transaction.receivedQty}{" "}
                        {transaction.uom}
                      </td>

                      <td style={styles.td}>
                        {transaction.acceptedQty}{" "}
                        {transaction.uom}
                      </td>

                      <td style={styles.td}>
                        {transaction.rejectedQty}{" "}
                        {transaction.uom}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.status,
                            ...(transaction.status ===
                            "Completed"
                              ? styles.completed
                              : transaction.status ===
                                "Pending"
                              ? styles.pending
                              : styles.cancelled),
                          }}
                        >
                          {transaction.status}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <button
                          style={
                            styles.deleteButton
                          }
                          onClick={() =>
                            handleDelete(
                              transaction.id
                            )
                          }
                        >
                          🗑️
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
    </div>
  );
}

const styles = {
  container: {
    padding: "28px 32px",
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
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  addButton: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  formCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "20px",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  formTitle: {
    margin: 0,
    fontSize: "16px",
  },

  closeButton: {
    border: "none",
    background: "#f1f5f9",
    borderRadius: "7px",
    padding: "7px 10px",
    cursor: "pointer",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },

  fullWidth: {
    gridColumn: "1 / -1",
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
    border: "1px solid #dbe2ea",
    borderRadius: "7px",
    padding: "10px",
    fontSize: "12px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dbe2ea",
    borderRadius: "7px",
    padding: "10px",
    fontSize: "12px",
    outline: "none",
    resize: "vertical",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },

  cancelButton: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    padding: "10px 16px",
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
    fontWeight: "600",
  },

  searchCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#94a3b8",
    width: "55%",
  },

  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "12px",
  },

  count: {
    color: "#64748b",
    fontSize: "12px",
  },

  tableCard: {
    background: "#fff",
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
  },

  secondaryText: {
    fontSize: "10px",
    color: "#64748b",
    marginTop: "3px",
  },

  documentType: {
    fontSize: "9px",
    color: "#2563eb",
    marginTop: "3px",
    fontWeight: "700",
  },

  status: {
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
    color: "#a16207",
  },

  cancelled: {
    background: "#fee2e2",
    color: "#b91c1c",
  },

  deleteButton: {
    border: "none",
    background: "#fef2f2",
    padding: "7px",
    borderRadius: "6px",
    cursor: "pointer",
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

export default GrnMrn;