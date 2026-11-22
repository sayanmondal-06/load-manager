
import { useEffect, useState } from "react";
import "./App.css";

//const API_URL = "http://localhost:5000/api/leads";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/leads";
const allowedSources = [
    "Website",
    "LinkedIn",
    "Referral",
    "Advertisement",
    "Other"
];

const allowedStatuses = [
    "New",
    "Contacted",
    "Qualified",
    "Lost"
];

function App() {
    const [leads, setLeads] = useState([]);

    const [stats, setStats] = useState({
        total: 0,
        new_leads: 0,
        contacted: 0,
        qualified: 0,
        lost: 0
    });

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formErrors, setFormErrors] = useState({});

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        source: "",
        status: ""
    });

    const [editingId, setEditingId] = useState(null);

    // Validate all form fields
    const validateForm = () => {
        const errors = {};

        // Name validation
        if (!formData.name.trim()) {
            errors.name = "Name is required";
        } else if (formData.name.trim().length > 100) {
            errors.name = "Name cannot exceed 100 characters";
        }

        // Email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else if (!emailPattern.test(formData.email.trim())) {
            errors.email = "Enter a valid email address";
        } else if (formData.email.trim().length > 150) {
            errors.email = "Email cannot exceed 150 characters";
        }

        // International phone validation
        const normalizedPhone = formData.phone.replace(/[\s().-]/g, "");
        const phonePattern = /^\+?[1-9]\d{6,14}$/;

        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required";
        } else if (!phonePattern.test(normalizedPhone)) {
            errors.phone =
                "Enter a valid international number with 7 to 15 digits, including country code";
        }

        // Company validation (optional)
        if (formData.company.trim().length > 100) {
            errors.company = "Company cannot exceed 100 characters";
        }

        // Source validation
        if (!allowedSources.includes(formData.source)) {
            errors.source = "Please select a source";
        }

        // Status validation
        if (!allowedStatuses.includes(formData.status)) {
            errors.status = "Please select a status";
        }

        setFormErrors(errors);

        return Object.keys(errors).length === 0;
    };

    // Fetch leads with search and status filter
    const fetchLeads = async () => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            if (search.trim()) {
                params.append("search", search.trim());
            }

            if (statusFilter !== "All") {
                params.append("status", statusFilter);
            }

            const response = await fetch(
                `${API_URL}?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch leads");
            }

            const data = await response.json();
            setLeads(data);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch overall dashboard statistics
    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/stats`);

            if (!response.ok) {
                throw new Error("Failed to fetch statistics");
            }

            const data = await response.json();

            setStats({
                total: Number(data.total),
                new_leads: Number(data.new_leads),
                contacted: Number(data.contacted),
                qualified: Number(data.qualified),
                lost: Number(data.lost)
            });

        } catch (error) {
            setError(error.message);
        }
    };

    // Fetch leads whenever search or filter changes
    useEffect(() => {
        fetchLeads();
    }, [search, statusFilter]);

    // Fetch dashboard statistics when page loads
    useEffect(() => {
        fetchStats();
    }, []);

    // Handle form input changes
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));

        // Clear the error for the field being corrected
        setFormErrors((previousErrors) => ({
            ...previousErrors,
            [name]: ""
        }));
    };

    // Add or update lead
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Stop submission if validation fails
        if (!validateForm()) {
            return;
        }

        try {
            const url = editingId
                ? `${API_URL}/${editingId}`
                : API_URL;

            const method = editingId ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...formData,
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    company: formData.company.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            alert(data.message);

            resetForm();

            // Refresh both table and dashboard
            await Promise.all([
                fetchLeads(),
                fetchStats()
            ]);

        } catch (error) {
            alert(error.message);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            company: "",
            source: "",
            status: ""
        });

        setFormErrors({});
        setEditingId(null);
    };

    // Load lead details into form for editing
    const handleEdit = (lead) => {
        setFormData({
            name: lead.name || "",
            email: lead.email || "",
            phone: lead.phone || "",
            company: lead.company || "",
            source: lead.source || "",
            status: lead.status || ""
        });

        setFormErrors({});
        setEditingId(lead.id);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // Delete lead
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this lead?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to delete lead");
            }

            alert(data.message);

            // Refresh both table and dashboard
            await Promise.all([
                fetchLeads(),
                fetchStats()
            ]);

        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="app-container">

            <header className="header">
                <div>
                    <h1>Lead Manager</h1>
                    <p>Manage your business leads in one place</p>
                </div>
            </header>

            <main className="main-content">

                {/* Dashboard statistics */}
                <section className="dashboard">

                    <div className="stat-card">
                        <h3>Total Leads</h3>
                        <p>{stats.total}</p>
                    </div>

                    <div className="stat-card">
                        <h3>New</h3>
                        <p>{stats.new_leads}</p>
                    </div>

                    <div className="stat-card">
                        <h3>Contacted</h3>
                        <p>{stats.contacted}</p>
                    </div>

                    <div className="stat-card">
                        <h3>Qualified</h3>
                        <p>{stats.qualified}</p>
                    </div>

                    <div className="stat-card">
                        <h3>Lost</h3>
                        <p>{stats.lost}</p>
                    </div>

                </section>

                {/* Add or edit lead form */}
                <section className="form-section">
                    <h2>{editingId ? "Edit Lead" : "Add New Lead"}</h2>

                    <form
                        onSubmit={handleSubmit}
                        className="lead-form"
                        noValidate
                    >

                        <div>
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name *"
                                value={formData.name}
                                onChange={handleChange}
                                maxLength="100"
                                required
                                aria-invalid={Boolean(formErrors.name)}
                            />
                            {formErrors.name && (
                                <p className="error-message">
                                    {formErrors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address *"
                                value={formData.email}
                                onChange={handleChange}
                                maxLength="150"
                                required
                                aria-invalid={Boolean(formErrors.email)}
                            />
                            {formErrors.email && (
                                <p className="error-message">
                                    {formErrors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone Number (with country code) *"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                aria-invalid={Boolean(formErrors.phone)}
                            />
                            {formErrors.phone && (
                                <p className="error-message">
                                    {formErrors.phone}
                                </p>
                            )}
                        </div>

                        <div>
                            <input
                                type="text"
                                name="company"
                                placeholder="Company (Optional)"
                                value={formData.company}
                                onChange={handleChange}
                                maxLength="100"
                                aria-invalid={Boolean(formErrors.company)}
                            />
                            {formErrors.company && (
                                <p className="error-message">
                                    {formErrors.company}
                                </p>
                            )}
                        </div>

                        <div>
                            <select
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                required
                                aria-invalid={Boolean(formErrors.source)}
                            >
                                <option value="">Select Source *</option>
                                <option value="Website">Website</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Referral">Referral</option>
                                <option value="Advertisement">Advertisement</option>
                                <option value="Other">Other</option>
                            </select>
                            {formErrors.source && (
                                <p className="error-message">
                                    {formErrors.source}
                                </p>
                            )}
                        </div>

                        <div>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                                aria-invalid={Boolean(formErrors.status)}
                            >
                                <option value="">Select Status *</option>
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Lost">Lost</option>
                            </select>
                            {formErrors.status && (
                                <p className="error-message">
                                    {formErrors.status}
                                </p>
                            )}
                        </div>

                        <button type="submit" className="primary-btn">
                            {editingId ? "Update Lead" : "Add Lead"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}

                    </form>
                </section>

                {/* Leads table */}
                <section className="leads-section">

                    <div className="section-heading">
                        <h2>All Leads</h2>
                        <span>{leads.length} records shown</span>
                    </div>

                    <div className="filters">

                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Lost">Lost</option>
                        </select>

                    </div>

                    {error && (
                        <p className="error-message">{error}</p>
                    )}

                    {loading ? (
                        <p className="empty-message">Loading leads...</p>
                    ) : (
                        <div className="table-container">

                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Company</th>
                                        <th>Source</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {leads.length > 0 ? (
                                        leads.map((lead) => (
                                            <tr key={lead.id}>
                                                <td>{lead.id}</td>
                                                <td>{lead.name}</td>
                                                <td>{lead.email}</td>
                                                <td>{lead.phone || "-"}</td>
                                                <td>{lead.company || "-"}</td>
                                                <td>{lead.source || "-"}</td>

                                                <td>
                                                    <span className={`status ${(lead.status || "new").toLowerCase()}`}>
                                                        {lead.status || "New"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="action-buttons">

                                                        <button
                                                            className="edit-btn"
                                                            onClick={() => handleEdit(lead)}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => handleDelete(lead.id)}
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="empty-message">
                                                No leads found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                        </div>
                    )}

                </section>

            </main>
        </div>
    );
}

export default App;
