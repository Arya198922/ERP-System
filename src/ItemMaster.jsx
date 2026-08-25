import { useEffect, useState } from "react";

function ItemMaster() {
 const [items, setItems] = useState(() => {
  const savedItems = localStorage.getItem("erp_items");
  return savedItems ? JSON.parse(savedItems) : [];
});

const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    category: "",
    uom: "Mtr",
    hsn: "",
    minStock: "",
    status: "Active",
  });

  // Save items
  useEffect(() => {
    localStorage.setItem("erp_items", JSON.stringify(items));
  }, [items]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      category: "",
      uom: "Mtr",
      hsn: "",
      minStock: "",
      status: "Active",
    });

    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.code || !form.name || !form.category) {
      alert("Please fill Item Code, Item Name and Category.");
      return;
    }

    if (editingId) {
      setItems(
        items.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...form,
              }
            : item
        )
      );
    } else {
      const newItem = {
        id: Date.now(),
        ...form,
        createdAt: new Date().toLocaleDateString(),
      };

      setItems([newItem, ...items]);
    }

    resetForm();
  };

  const handleEdit = (item) => {
    setForm({
      code: item.code,
      name: item.name,
      category: item.category,
      uom: item.uom,
      hsn: item.hsn,
      minStock: item.minStock,
      status: item.status,
    });

    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (confirmDelete) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const filteredItems = items.filter((item) => {
    const text =
      `${item.code} ${item.name} ${item.category} ${item.hsn}`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Item Master</h2>
          <p style={styles.subtitle}>
            Manage products and inventory items
          </p>
        </div>

        <button
          style={styles.addButton}
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          + Add New Item
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>
              {editingId ? "Edit Item" : "Add New Item"}
            </h3>

            <button style={styles.closeButton} onClick={resetForm}>
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Item Code *</label>
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. FAB-001"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Item Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Cotton Fabric"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Category *</label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Raw Material"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>UOM</label>
                <select
                  name="uom"
                  value={form.uom}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="Mtr">Mtr</option>
                  <option value="Kg">Kg</option>
                  <option value="Nos">Nos</option>
                  <option value="Box">Box</option>
                  <option value="Set">Set</option>
                </select>
              </div>

              <div>
                <label style={styles.label}>HSN Code</label>
                <input
                  name="hsn"
                  value={form.hsn}
                  onChange={handleChange}
                  placeholder="HSN Code"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Minimum Stock</label>
                <input
                  name="minStock"
                  type="number"
                  value={form.minStock}
                  onChange={handleChange}
                  placeholder="0"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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

              <button type="submit" style={styles.saveButton}>
                {editingId ? "Update Item" : "Save Item"}
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item code, name, category..."
            style={styles.searchInput}
          />
        </div>

        <div style={styles.itemCount}>
          Total Items: <strong>{filteredItems.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {filteredItems.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📦</div>
            <h3>No Items Found</h3>
            <p>Add your first item to the Item Master.</p>

            <button
              style={styles.addButton}
              onClick={() => setShowForm(true)}
            >
              + Add First Item
            </button>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Item Code</th>
                  <th style={styles.th}>Item Name</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>UOM</th>
                  <th style={styles.th}>HSN</th>
                  <th style={styles.th}>Min Stock</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <strong>{item.code}</strong>
                    </td>

                    <td style={styles.td}>{item.name}</td>

                    <td style={styles.td}>{item.category}</td>

                    <td style={styles.td}>{item.uom}</td>

                    <td style={styles.td}>{item.hsn || "-"}</td>

                    <td style={styles.td}>{item.minStock || "0"}</td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.status,
                          ...(item.status === "Active"
                            ? styles.active
                            : styles.inactive),
                        }}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <button
                        style={styles.editButton}
                        onClick={() => handleEdit(item)}
                      >
                        ✏️
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDelete(item.id)}
                      >
                        🗑️
                      </button>
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

  itemCount: {
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

  status: {
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
  },

  active: {
    background: "#dcfce7",
    color: "#15803d",
  },

  inactive: {
    background: "#fee2e2",
    color: "#b91c1c",
  },

  editButton: {
    border: "none",
    background: "#eff6ff",
    padding: "7px",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "6px",
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

export default ItemMaster;