import { useEffect, useState } from "react";

function WarehouseMaster() {
  const [warehouses, setWarehouses] = useState(() => {
    const saved = localStorage.getItem("erp_warehouses");
    return saved ? JSON.parse(saved) : [];
  });

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    location: "",
    floor: "",
    rack: "",
    bin: "",
    type: "Raw Material",
    capacity: "",
    status: "Active",
  });

  // Save warehouse data
  useEffect(() => {
    localStorage.setItem(
      "erp_warehouses",
      JSON.stringify(warehouses)
    );
  }, [warehouses]);

  // Handle input changes
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Reset form
  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      location: "",
      floor: "",
      rack: "",
      bin: "",
      type: "Raw Material",
      capacity: "",
      status: "Active",
    });

    setEditingId(null);
    setShowForm(false);
  };

  // Save / Update warehouse
  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.code ||
      !form.name ||
      !form.floor ||
      !form.rack ||
      !form.bin
    ) {
      alert(
        "Please fill Warehouse Code, Name, Floor, Rack and Bin."
      );
      return;
    }

    // Warehouse prefix
    const locationPrefix =
      form.name.trim().toLowerCase() === "main warehouse"
        ? "MW"
        : form.code
            .replace(/[^A-Za-z0-9]/g, "")
            .toUpperCase();

    // Floor code
    const floorCodeMap = {
      "Ground Floor": "GF",
      "First Floor": "FF",
      "Second Floor": "SF",
    };

    const floorCode =
      floorCodeMap[form.floor] || "FL";

    // Rack number
    const rackNumber = form.rack.replace(
      "Rack ",
      ""
    );

    // Bin letter
    const binLetter =
      form.bin.charAt(0).toUpperCase();

    // Unique internal location code
    const locationCode =
      `${locationPrefix}-${floorCode}-R${rackNumber}-${binLetter}`;

    // User-friendly location
    const locationDisplay =
      `${form.floor} → ${form.rack} → ${rackNumber}-${binLetter}-Bin`;

    const warehouseData = {
      ...form,
      location: locationDisplay,
      locationCode: locationCode,
    };

    // Update existing warehouse
    if (editingId) {
      setWarehouses(
        warehouses.map((warehouse) =>
          warehouse.id === editingId
            ? {
                ...warehouse,
                ...warehouseData,
              }
            : warehouse
        )
      );
    }

    // Create new warehouse
    else {
      const newWarehouse = {
        id: Date.now(),
        ...warehouseData,
        createdAt:
          new Date().toLocaleDateString(),
      };

      setWarehouses([
        newWarehouse,
        ...warehouses,
      ]);
    }

    resetForm();
  };

  // Edit warehouse
  const handleEdit = (warehouse) => {
    setForm({
      code: warehouse.code || "",
      name: warehouse.name || "",
      location: warehouse.location || "",
      floor: warehouse.floor || "",
      rack: warehouse.rack || "",
      bin: warehouse.bin || "",
      type:
        warehouse.type || "Raw Material",
      capacity: warehouse.capacity || "",
      status:
        warehouse.status || "Active",
    });

    setEditingId(warehouse.id);
    setShowForm(true);
  };

  // Delete warehouse
  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this warehouse?"
    );

    if (confirmDelete) {
      setWarehouses(
        warehouses.filter(
          (warehouse) =>
            warehouse.id !== id
        )
      );
    }
  };

  // Search
  const filteredWarehouses =
    warehouses.filter((warehouse) => {
      const text = `
        ${warehouse.code || ""}
        ${warehouse.name || ""}
        ${warehouse.location || ""}
        ${warehouse.locationCode || ""}
        ${warehouse.type || ""}
        ${warehouse.floor || ""}
        ${warehouse.rack || ""}
        ${warehouse.bin || ""}
      `.toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            Warehouse Master
          </h2>

          <p style={styles.subtitle}>
            Manage warehouses and storage
            locations
          </p>
        </div>

        <button
          style={styles.addButton}
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          + Add New Warehouse
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>
              {editingId
                ? "Edit Warehouse"
                : "Add New Warehouse"}
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
              {/* Warehouse Code */}
              <div>
                <label style={styles.label}>
                  Warehouse Code *
                </label>

                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. WH-001"
                  style={styles.input}
                />
              </div>

              {/* Warehouse Name */}
              <div>
                <label style={styles.label}>
                  Warehouse Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Main Warehouse"
                  style={styles.input}
                />
              </div>

              {/* Floor */}
              <div>
                <label style={styles.label}>
                  Floor *
                </label>

                <select
                  name="floor"
                  value={form.floor}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">
                    Select Floor
                  </option>

                  <option value="Ground Floor">
                    Ground Floor
                  </option>

                  <option value="First Floor">
                    First Floor
                  </option>

                  <option value="Second Floor">
                    Second Floor
                  </option>
                </select>
              </div>

              {/* Rack */}
              <div>
                <label style={styles.label}>
                  Rack *
                </label>

                <select
                  name="rack"
                  value={form.rack}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">
                    Select Rack
                  </option>

                  <option value="Rack 1">
                    Rack 1
                  </option>

                  <option value="Rack 2">
                    Rack 2
                  </option>

                  <option value="Rack 3">
                    Rack 3
                  </option>

                  <option value="Rack 4">
                    Rack 4
                  </option>

                  <option value="Rack 5">
                    Rack 5
                  </option>
                </select>
              </div>

              {/* Bin */}
              <div>
                <label style={styles.label}>
                  Bin *
                </label>

                <select
                  name="bin"
                  value={form.bin}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">
                    Select Bin
                  </option>

                  <option value="A-Bin">
                    A-Bin
                  </option>

                  <option value="B-Bin">
                    B-Bin
                  </option>

                  <option value="C-Bin">
                    C-Bin
                  </option>
                </select>
              </div>

              {/* Warehouse Type */}
              <div>
                <label style={styles.label}>
                  Warehouse Type
                </label>

                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="Raw Material">
                    Raw Material
                  </option>

                  <option value="Finished Goods">
                    Finished Goods
                  </option>

                  <option value="Packing Material">
                    Packing Material
                  </option>

                  <option value="General">
                    General
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label style={styles.label}>
                  Capacity
                </label>

                <input
                  name="capacity"
                  type="number"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
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
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>

            {/* Preview */}
            {form.floor &&
              form.rack &&
              form.bin && (
                <div style={styles.locationPreview}>
                  <div>
                    <strong>
                      Location:
                    </strong>{" "}
                    {form.floor} →{" "}
                    {form.rack} →{" "}
                    {form.rack.replace(
                      "Rack ",
                      ""
                    )}
                    -
                    {form.bin.charAt(0)}
                    -Bin
                  </div>

                  <div>
                    <strong>
                      Location Code:
                    </strong>{" "}
                    {(
                      form.name
                        .trim()
                        .toLowerCase() ===
                      "main warehouse"
                        ? "MW"
                        : form.code
                            .replace(
                              /[^A-Za-z0-9]/g,
                              ""
                            )
                            .toUpperCase()
                    )}
                    -
                    {form.floor ===
                    "Ground Floor"
                      ? "GF"
                      : form.floor ===
                        "First Floor"
                      ? "FF"
                      : "SF"}
                    -R
                    {form.rack.replace(
                      "Rack ",
                      ""
                    )}
                    -
                    {form.bin.charAt(0)}
                  </div>
                </div>
              )}

            {/* Actions */}
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
                {editingId
                  ? "Update Warehouse"
                  : "Save Warehouse"}
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
            placeholder="Search warehouse, location..."
            style={styles.searchInput}
          />
        </div>

        <div style={styles.itemCount}>
          Total Warehouses:{" "}
          <strong>
            {filteredWarehouses.length}
          </strong>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {filteredWarehouses.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              🏭
            </div>

            <h3>
              No Warehouses Found
            </h3>

            <p>
              Add your first warehouse.
            </p>

            <button
              style={styles.addButton}
              onClick={() =>
                setShowForm(true)
              }
            >
              + Add First Warehouse
            </button>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    Code
                  </th>

                  <th style={styles.th}>
                    Warehouse Name
                  </th>

                  <th style={styles.th}>
                    Location
                  </th>

                  <th style={styles.th}>
                    Location Code
                  </th>

                  <th style={styles.th}>
                    Type
                  </th>

                  <th style={styles.th}>
                    Capacity
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
                {filteredWarehouses.map(
                  (warehouse) => (
                    <tr
                      key={warehouse.id}
                    >
                      <td style={styles.td}>
                        <strong>
                          {warehouse.code}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {warehouse.name}
                      </td>

                      <td style={styles.td}>
                        📍{" "}
                        {warehouse.location ||
                          "Not Assigned"}
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {warehouse.locationCode ||
                            "-"}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {warehouse.type}
                      </td>

                      <td style={styles.td}>
                        {warehouse.capacity ||
                          "0"}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.status,
                            ...(warehouse.status ===
                            "Active"
                              ? styles.active
                              : styles.inactive),
                          }}
                        >
                          {warehouse.status}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <button
                          style={
                            styles.editButton
                          }
                          onClick={() =>
                            handleEdit(
                              warehouse
                            )
                          }
                        >
                          ✏️
                        </button>

                        <button
                          style={
                            styles.deleteButton
                          }
                          onClick={() =>
                            handleDelete(
                              warehouse.id
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

  locationPreview: {
    marginTop: "18px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#1e40af",
    fontSize: "11px",
    lineHeight: "1.8",
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

export default WarehouseMaster;