import { useEffect, useState, useRef } from "react"
import { jwtDecode } from "jwt-decode"
import Cookies from "js-cookie"
import axios from "axios"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
    const fileInputRef = useRef(null)

    const handleImportClick = () => {
        fileInputRef.current.click() 
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append("file", file)

        try {
            const token = Cookies.get("token")
            const res = await fetch("http://localhost:4000/api/excel/import", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            const data = await res.json()
            if (res.ok) {
                alert(`${data.count} leads imported successfully.`)
                await fetchLeads(token)
            } else {
                alert(data.message || "Import failed.")
            }
        } catch (err) {
            console.error("Import failed:", err)
            alert("Something went wrong while importing.")
        }
    }

    const [logs, setLogs] = useState([])
    const [role, setRole] = useState("")
    const [user, setUser] = useState(null)
    const [leads, setLeads] = useState([])
    const [users, setUsers] = useState([])
    const [assignableUsers, setAssignableUsers] = useState([]) 
    const [tags, setTags] = useState([])
    const [showUserModal, setShowUserModal] = useState(false)
    const [showLeadModal, setShowLeadModal] = useState(false)
    const [showEditUserModal, setShowEditUserModal] = useState(false)
    const [showEditLeadModal, setShowEditLeadModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [editingLead, setEditingLead] = useState(null) 
    const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "support-agent" })
    const [leadForm, setLeadForm] = useState({
        name: "",
        email: "",
        phone: "",
        source: "",
        status: "New",
        tags: [],
        notes: "",
        assignedTo: "",
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const [showTagModal, setShowTagModal] = useState(false) 
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [editingTag, setEditingTag] = useState(null)
    const [tagForm, setTagForm] = useState({ name: "", color: "red" })
    const [filters, setFilters] = useState({
        status: "",
        assignedTo: "",
        tags: [],
        source: "",
        dateFrom: "",
        dateTo: "",
        searchTerm: "",
    }) 
    const [filteredLeads, setFilteredLeads] = useState([])

    const handleExportLeads = async () => {
        try {
            const token = Cookies.get("token")
            const res = await fetch("http://localhost:4000/api/excel/export", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!res.ok) throw new Error("Failed to export leads")

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)

            const a = document.createElement("a")
            a.href = url
            a.download = "leads_export.xlsx"
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error("Export failed:", err)
            alert("Failed to export leads.")
        }
    }

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = Cookies.get("token")
                const res = await axios.get("http://localhost:4000/api/activity", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                setLogs(res.data)
                console.log("logs", res)
            } catch (err) {
                console.error("Failed to fetch logs:", err)
            }
        }

        fetchLogs()
    }, [])

    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                const token = Cookies.get("token")

                if (!token) {
                    setError("No authentication token found")
                    setLoading(false)
                    setTimeout(() => {
                        window.location.href = "/"
                    }, 2000)
                    return
                }

                try {
                    const decoded = jwtDecode(token)
                    console.log("Decoded token:", decoded)

                    if (decoded.exp && decoded.exp < Date.now() / 1000) {
                        setError("Token has expired")
                        Cookies.remove("token")
                        setLoading(false)
                        setTimeout(() => {
                            window.location.href = "/"
                        }, 2000)
                        return
                    }

                    setRole(decoded.role || "")
                    setUser(decoded)
                    console.log("dec", decoded)

                    await Promise.all([fetchLeads(token), fetchTags(token), fetchUsers(token)])
                } catch (tokenError) {
                    console.error("Invalid token:", tokenError)
                    setError("Invalid authentication token")
                    Cookies.remove("token")
                    setLoading(false)
                    setTimeout(() => {
                        window.location.href = "/"
                    }, 2000)
                    return
                }
            } catch (err) {
                console.error("Dashboard initialization error:", err)
                setError("Failed to initialize dashboard")
            } finally {
                setLoading(false)
            }
        }

        initializeDashboard()
    }, [])

    const fetchLeads = async (token) => {
        try {
            const token = Cookies.get('token')
            const res = await axios.get("http://localhost:4000/api/leads", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            setLeads(res.data || [])
            console.log("Fetched leads:", res.data)
        } catch (error) {
            console.error("Failed to fetch leads:", error)
            setError("Failed to fetch leads data")
        }
    }
    useEffect(() => {
        fetchLeads()
    }, [])

    const fetchTags = async (token) => {
        try {
            const endpoint = "http://localhost:4000/api/tags"
            console.log("Fetching tags...")

            const res = await axios.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            setTags(res.data || [])
            console.log("Fetched tags:", res.data)
        } catch (error) {
            console.error("Failed to fetch tags:", error)
        }
    }

    const fetchUsers = async (token) => {
        try {
            const endpoint = "http://localhost:4000/api/users"
            console.log("Fetching users...")

            const res = await axios.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            setUsers(res.data || [])
            const assignable = (res.data || []).filter((user) => user.role === "sub-admin" || user.role === "support-agent")
            setAssignableUsers(assignable)
            console.log("Fetched users:", res.data)
            console.log("Assignable users:", assignable)
        } catch (error) {
            console.error("Failed to fetch users:", error)
        }
    }

    const handleLogout = () => {
        Cookies.remove("token")
        window.location.href = "/"
    }

    const handleUserFormSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = Cookies.get("token")
            await axios.post("http://localhost:4000/api/users", userForm, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setShowUserModal(false)
            setUserForm({ name: "", email: "", password: "", role: "support-agent" })
            fetchUsers(token)
            alert("User created successfully!")
        } catch (error) {
            console.error("Failed to create user:", error)
            alert("Failed to create user: " + (error.response?.data?.message || error.message))
        }
    }

    const handleEditUser = (user) => {
        setEditingUser(user)
        setUserForm({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
        })
        setShowEditUserModal(true)
    }

    const handleUserUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = Cookies.get("token")
            const updateData = {
                name: userForm.name,
                email: userForm.email,
                role: userForm.role,
            }

            if (userForm.password.trim()) {
                updateData.password = userForm.password
            }

            await axios.put(`http://localhost:4000/api/users/${editingUser._id}`, updateData, {
                headers: { Authorization: `Bearer ${token}` },
            })

            setShowEditUserModal(false)
            setEditingUser(null)
            setUserForm({ name: "", email: "", password: "", role: "support-agent" })
            fetchUsers(token)
            alert("User updated successfully!")
        } catch (error) {
            console.error("Failed to update user:", error)
            alert("Failed to update user: " + (error.response?.data?.message || error.message))
        }
    }

    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            try {
                const token = Cookies.get("token")
                await axios.delete(`http://localhost:4000/api/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })

                fetchUsers(token)
                alert("User deleted successfully!")
            } catch (error) {
                console.error("Failed to delete user:", error)
                alert("Failed to delete user: " + (error.response?.data?.message || error.message))
            }
        }
    }

    const handleLeadFormSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = Cookies.get("token")

            const leadData = {
                ...leadForm,
                notes: leadForm.notes.trim()
                    ? [
                        {
                            text: leadForm.notes,
                            createdAt: new Date().toISOString(),
                        },
                    ]
                    : [],
                assignedTo: leadForm.assignedTo || null,
            }

            await axios.post("http://localhost:4000/api/leads", leadData, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setShowLeadModal(false)
            setLeadForm({ name: "", email: "", phone: "", source: "", status: "New", tags: [], notes: "", assignedTo: "" })
            fetchLeads(token)
            alert("Lead created successfully!")
        } catch (error) {
            console.error("Failed to create lead:", error)
            alert("Failed to create lead: " + (error.response?.data?.message || error.message))
        }
    }

    const handleEditLead = (lead) => {
        setEditingLead(lead)
        setLeadForm({
            name: lead.name,
            email: lead.email,
            phone: lead.phone || "",
            source: lead.source || "",
            status: lead.status,
            tags: lead.tags ? lead.tags.map((tag) => tag._id || tag) : [],
            notes: lead.notes && lead.notes.length > 0 ? lead.notes[0].text : "",
            assignedTo: lead.assignedTo?._id || "",
        })
        setShowEditLeadModal(true)
    }

    const handleLeadUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = Cookies.get("token")

            const updateData = {
                ...leadForm,
                notes: leadForm.notes.trim()
                    ? [
                        {
                            text: leadForm.notes,
                            createdAt: new Date().toISOString(),
                        },
                    ]
                    : [],
                assignedTo: leadForm.assignedTo || null,
            }

            await axios.put(`http://localhost:4000/api/leads/${editingLead._id}`, updateData, {
                headers: { Authorization: `Bearer ${token}` },
            })

            setShowEditLeadModal(false)
            setEditingLead(null)
            setLeadForm({ name: "", email: "", phone: "", source: "", status: "New", tags: [], notes: "", assignedTo: "" })
            fetchLeads(token)
            alert("Lead updated successfully!")
        } catch (error) {
            console.error("Failed to update lead:", error)
            alert("Failed to update lead: " + (error.response?.data?.message || error.message))
        }
    }

    const handleDeleteLead = async (leadId, leadName) => {
        if (window.confirm(`Are you sure you want to delete lead "${leadName}"? This action cannot be undone.`)) {
            try {
                const token = Cookies.get("token")
                await axios.delete(`http://localhost:4000/api/leads/${leadId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })

                fetchLeads(token)
                alert("Lead deleted successfully!")
            } catch (error) {
                console.error("Failed to delete lead:", error)
                alert("Failed to delete lead: " + (error.response?.data?.message || error.message))
            }
        }
    }

    const handleTagToggle = (tagId) => {
        setLeadForm((prev) => ({
            ...prev,
            tags: prev.tags.includes(tagId) ? prev.tags.filter((id) => id !== tagId) : [...prev.tags, tagId],
        }))
    }

    const handleTagFormSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = Cookies.get("token")
            await axios.post("http://localhost:4000/api/tags", tagForm, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setShowTagModal(false)
            setTagForm({ name: "", color: "red" })
            fetchTags(token)
            alert("Tag created successfully!")
        } catch (error) {
            console.error("Failed to create tag:", error)
            alert("Failed to create tag: " + (error.response?.data?.message || error.message))
        }
    }

    const handleEditTag = (tag) => {
        setEditingTag(tag)
        setTagForm({
            name: tag.name,
            color: tag.color,
        })
        setShowTagModal(true)
    }

    const handleTagUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = Cookies.get("token")
            await axios.put(`http://localhost:4000/api/tags/${editingTag._id}`, tagForm, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setShowTagModal(false)
            setEditingTag(null)
            setTagForm({ name: "", color: "red" })
            fetchTags(token)
            alert("Tag updated successfully!")
        } catch (error) {
            console.error("Failed to update tag:", error)
            alert("Failed to update tag: " + (error.response?.data?.message || error.message))
        }
    }

    const handleDeleteTag = async (tagId, tagName) => {
        if (window.confirm(`Are you sure you want to delete tag "${tagName}"? This action cannot be undone.`)) {
            try {
                const token = Cookies.get("token")
                await axios.delete(`http://localhost:4000/api/tags/${tagId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                fetchTags(token)
                alert("Tag deleted successfully!")
            } catch (error) {
                console.error("Failed to delete tag:", error)
                alert("Failed to delete tag: " + (error.response?.data?.message || error.message))
            }
        }
    }

    const applyFilters = () => {
        let filtered = [...leads]

        // Search term filter
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase()
            filtered = filtered.filter(
                (lead) =>
                    lead.name.toLowerCase().includes(searchLower) ||
                    lead.email.toLowerCase().includes(searchLower) ||
                    (lead.phone && lead.phone.toLowerCase().includes(searchLower)) ||
                    (lead.source && lead.source.toLowerCase().includes(searchLower)),
            )
        }

        // Status filter
        if (filters.status) {
            filtered = filtered.filter((lead) => lead.status === filters.status)
        }

        // Assigned user filter
        if (filters.assignedTo) {
            if (filters.assignedTo === "unassigned") {
                filtered = filtered.filter((lead) => !lead.assignedTo)
            } else {
                filtered = filtered.filter((lead) => lead.assignedTo?._id === filters.assignedTo)
            }
        }

        // Tags filter
        if (filters.tags.length > 0) {
            filtered = filtered.filter((lead) => lead.tags && lead.tags.some((tag) => filters.tags.includes(tag._id || tag)))
        }

        // Source filter
        if (filters.source) {
            filtered = filtered.filter(
                (lead) => lead.source && lead.source.toLowerCase().includes(filters.source.toLowerCase()),
            )
        }

        // Date range filter
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom)
            filtered = filtered.filter((lead) => new Date(lead.createdAt) >= fromDate)
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo)
            toDate.setHours(23, 59, 59, 999) // End of day
            filtered = filtered.filter((lead) => new Date(lead.createdAt) <= toDate)
        }

        setFilteredLeads(filtered)
    }

    const clearFilters = () => {
        setFilters({
            status: "",
            assignedTo: "",
            tags: [],
            source: "",
            dateFrom: "",
            dateTo: "",
            searchTerm: "",
        })
        setFilteredLeads(leads)
    }

    const handleFilterTagToggle = (tagId) => {
        setFilters((prev) => ({
            ...prev,
            tags: prev.tags.includes(tagId) ? prev.tags.filter((id) => id !== tagId) : [...prev.tags, tagId],
        }))
    }

    useEffect(() => {
        setFilteredLeads(leads)
    }, [leads])

    useEffect(() => {
        applyFilters()
    }, [filters, leads])

    const renderModal = (isOpen, closeModal, title, content) =>
        isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">{title}</h2>
                    {content}
                    <button onClick={closeModal} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        Close
                    </button>
                </div>
            </div>
        )

    const renderUserManagement = () => (
        <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">User Management ({users.length})</h2>
                <button
                    onClick={() => setShowUserModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Add New User
                </button>
            </div>

            {users.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No users found.</p>
                    <button
                        onClick={() => setShowUserModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Add Your First User
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                        <thead>
                            <tr className="bg-gray-100 text-left">
                                <th className="px-4 py-2 border">Name</th>
                                <th className="px-4 py-2 border">Email</th>
                                <th className="px-4 py-2 border">Role</th>
                                <th className="px-4 py-2 border">Created At</th>
                                <th className="px-4 py-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((userItem) => (
                                <tr key={userItem._id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2 border font-medium">{userItem.name}</td>
                                    <td className="px-4 py-2 border">{userItem.email}</td>
                                    <td className="px-4 py-2 border">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium capitalize ${userItem.role === "super-admin"
                                                    ? "bg-red-100 text-red-800"
                                                    : userItem.role === "sub-admin"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-blue-100 text-blue-800"
                                                }`}
                                        >
                                            {userItem.role.replace("-", " ")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 border">{new Date(userItem.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 border">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditUser(userItem)}
                                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(userItem._id, userItem.name)}
                                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                disabled={userItem._id === user?.id}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )

    const renderLeadManagement = () => (
        <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Lead Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button onClick={() => setShowLeadModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded">
                    Add New Lead
                </button>
                <input type="file" ref={fileInputRef} accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />
                <button className="px-4 py-2 border border-gray-400 text-gray-800 rounded" onClick={handleImportClick}>
                    Import from Excel
                </button>
                <button className="px-4 py-2 border border-gray-400 text-gray-800 rounded" onClick={handleExportLeads}>
                    Export Leads
                </button>
            </div>
        </div>
    )

    const renderLeadsList = () => (
        <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Leads ({filteredLeads.length})</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowTagModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Manage Tags
                    </button>
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Advanced Filter
                    </button>
                </div>
            </div>

            {filteredLeads.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                        {leads.length === 0 ? "No leads found." : "No leads match the current filters."}
                    </p>
                    {leads.length === 0 ? (
                        <button
                            onClick={() => setShowLeadModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Add Your First Lead
                        </button>
                    ) : (
                        <button onClick={clearFilters} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                        <thead>
                            <tr className="bg-gray-100 text-left">
                                <th className="px-4 py-2 border">Name</th>
                                <th className="px-4 py-2 border">Email</th>
                                <th className="px-4 py-2 border">Phone</th>
                                <th className="px-4 py-2 border">Source</th>
                                <th className="px-4 py-2 border">Status</th>
                                <th className="px-4 py-2 border">Tags</th>
                                <th className="px-4 py-2 border">Notes</th>
                                <th className="px-4 py-2 border">Assigned To</th>
                                <th className="px-4 py-2 border">Created At</th>
                                <th className="px-4 py-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map((lead) => (
                                <tr key={lead._id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2 border">{lead.name}</td>
                                    <td className="px-4 py-2 border">{lead.email}</td>
                                    <td className="px-4 py-2 border">{lead.phone || "N/A"}</td>
                                    <td className="px-4 py-2 border">{lead.source || "N/A"}</td>
                                    <td className="px-4 py-2 border">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${lead.status === "New"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : lead.status === "Contacted"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : lead.status === "Qualified"
                                                            ? "bg-green-100 text-green-800"
                                                            : lead.status === "Lost"
                                                                ? "bg-red-100 text-red-800"
                                                                : lead.status === "Won"
                                                                    ? "bg-purple-100 text-purple-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 border">
                                        {lead.tags && lead.tags.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {lead.tags.map((tag, index) => (
                                                    <span
                                                        key={tag._id || index}
                                                        className={`px-2 py-1 rounded text-xs font-medium`}
                                                        style={{
                                                            backgroundColor:
                                                                tag.color === "red"
                                                                    ? "#fee2e2"
                                                                    : tag.color === "orange"
                                                                        ? "#fed7aa"
                                                                        : tag.color === "yellow"
                                                                            ? "#fef3c7"
                                                                            : tag.color === "green"
                                                                                ? "#dcfce7"
                                                                                : tag.color === "blue"
                                                                                    ? "#dbeafe"
                                                                                    : tag.color === "purple"
                                                                                        ? "#e9d5ff"
                                                                                        : "#e5e7eb",
                                                            color:
                                                                tag.color === "red"
                                                                    ? "#991b1b"
                                                                    : tag.color === "orange"
                                                                        ? "#9a3412"
                                                                        : tag.color === "yellow"
                                                                            ? "#92400e"
                                                                            : tag.color === "green"
                                                                                ? "#166534"
                                                                                : tag.color === "blue"
                                                                                    ? "#1e40af"
                                                                                    : tag.color === "purple"
                                                                                        ? "#7c3aed"
                                                                                        : "#374151",
                                                        }}
                                                    >
                                                        {tag.name || tag}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            "No tags"
                                        )}
                                    </td>
                                    <td className="px-4 py-2 border">
                                        {lead.notes && lead.notes.length > 0 ? (
                                            <div className="max-w-xs">
                                                <div className="text-xs text-gray-600 mb-1">
                                                    {lead.notes.length} note{lead.notes.length > 1 ? "s" : ""}
                                                </div>
                                                <div className="text-sm truncate">{lead.notes[0].text}</div>
                                                {lead.notes.length > 1 && (
                                                    <div className="text-xs text-gray-500">+{lead.notes.length - 1} more</div>
                                                )}
                                            </div>
                                        ) : (
                                            "No notes"
                                        )}
                                    </td>
                                    <td className="px-4 py-2 border">
                                        {lead.assignedTo?.name ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                                {lead.assignedTo.name}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 border">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 border">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditLead(lead)}
                                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLead(lead._id, lead.name)}
                                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )

    const renderActivityLogs = () => (
        <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Recent Activity Logs</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                {logs.length > 0 ? (
                    logs.map((log, index) => (
                        <li key={index}>
                            [{new Date(log.timestamp).toLocaleString()}] {log.action}
                        </li>
                    ))
                ) : (
                    <li>No recent activity found</li>
                )}
            </ul>
        </div>
    )

    const renderUserForm = () => (
        <form onSubmit={handleUserFormSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                >
                    <option value="sub-admin">Sub-Admin</option>
                    <option value="support-agent">Support Agent</option>
                </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Create User
            </button>
        </form>
    )

    const renderEditUserForm = () => (
        <form onSubmit={handleUserUpdateSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Password (leave blank to keep current)</label>
                <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    placeholder="Enter new password or leave blank"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                >
                    <option value="sub-admin">Sub-Admin</option>
                    <option value="support-agent">Support Agent</option>
                </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Update User
            </button>
        </form>
    )

    const renderLeadForm = () => (
        <form onSubmit={handleLeadFormSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Source</label>
                <input
                    type="text"
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                >
                    {["New", "Contacted", "Qualified", "Lost", "Won"].map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select
                    value={leadForm.assignedTo}
                    onChange={(e) => setLeadForm({ ...leadForm, assignedTo: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                >
                    <option value="">Select User (Optional)</option>
                    {assignableUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.name} ({user.role.replace("-", " ")})
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                {tags.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                        {tags.map((tag) => (
                            <label key={tag._id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={leadForm.tags.includes(tag._id)}
                                    onChange={() => handleTagToggle(tag._id)}
                                    className="rounded"
                                />
                                <span
                                    className="px-2 py-1 rounded text-xs font-medium"
                                    style={{
                                        backgroundColor: tag.color === "red" ? "#fee2e2" : "#e5e7eb",
                                        color: tag.color === "red" ? "#991b1b" : "#374151",
                                    }}
                                >
                                    {tag.name}
                                </span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No tags available</p>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    rows="4"
                />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Create Lead
            </button>
        </form>
    )

    const renderEditLeadForm = () => (
        <form onSubmit={handleLeadUpdateSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Source</label>
                <input
                    type="text"
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                >
                    {["New", "Contacted", "Qualified", "Lost", "Won"].map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select
                    value={leadForm.assignedTo}
                    onChange={(e) => setLeadForm({ ...leadForm, assignedTo: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                >
                    <option value="">Select User (Optional)</option>
                    {assignableUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.name} ({user.role.replace("-", " ")})
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                {tags.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                        {tags.map((tag) => (
                            <label key={tag._id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={leadForm.tags.includes(tag._id)}
                                    onChange={() => handleTagToggle(tag._id)}
                                    className="rounded"
                                />
                                <span
                                    className="px-2 py-1 rounded text-xs font-medium"
                                    style={{
                                        backgroundColor: tag.color === "red" ? "#fee2e2" : "#e5e7eb",
                                        color: tag.color === "red" ? "#991b1b" : "#374151",
                                    }}
                                >
                                    {tag.name}
                                </span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No tags available</p>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                    className="mt-1 p-2 w-full border rounded"
                    rows="4"
                />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Update Lead
            </button>
        </form>
    )

    const calculateLeadStats = () => {
        const stats = {
            New: 0,
            Contacted: 0,
            Qualified: 0,
            Lost: 0,
            Won: 0,
        }

        leads.forEach((lead) => {
            if (stats.hasOwnProperty(lead.status)) {
                stats[lead.status]++
            }
        })

        return stats
    }

    const renderLeadStats = () => {
        const stats = calculateLeadStats()

        return (
            <div className="bg-white rounded-xl shadow p-4">
                <h2 className="text-xl font-semibold mb-4">Lead Status Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(stats).map(([status, count]) => (
                        <div key={status} className="p-4 bg-indigo-100 rounded-xl text-center">
                            <p className="text-lg font-medium">{status}</p>
                            <p className="text-2xl font-bold">{count}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderTagManagement = () => (
        <div className="space-y-4">
            <form onSubmit={editingTag ? handleTagUpdateSubmit : handleTagFormSubmit} className="space-y-4 border-b pb-4">
                <h3 className="text-lg font-semibold">{editingTag ? "Edit Tag" : "Create New Tag"}</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tag Name</label>
                    <input
                        type="text"
                        value={tagForm.name}
                        onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                        className="mt-1 p-2 w-full border rounded"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Color</label>
                    <select
                        value={tagForm.color}
                        onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                        className="mt-1 p-2 w-full border rounded"
                    >
                        <option value="red">Red</option>
                        <option value="orange">Orange</option>
                        <option value="yellow">Yellow</option>
                        <option value="green">Green</option>
                        <option value="blue">Blue</option>
                        <option value="purple">Purple</option>
                        <option value="gray">Gray</option>
                    </select>
                </div>
                <div className="flex space-x-2">
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        {editingTag ? "Update Tag" : "Create Tag"}
                    </button>
                    {editingTag && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingTag(null)
                                setTagForm({ name: "", color: "red" })
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </form>

            <div>
                <h3 className="text-lg font-semibold mb-3">Existing Tags ({tags.length})</h3>
                {tags.length === 0 ? (
                    <p className="text-gray-500">No tags found. Create your first tag above.</p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {tags.map((tag) => (
                            <div key={tag._id} className="flex items-center justify-between p-3 border rounded">
                                <div className="flex items-center space-x-3">
                                    <span
                                        className="px-3 py-1 rounded text-sm font-medium"
                                        style={{
                                            backgroundColor:
                                                tag.color === "red"
                                                    ? "#fee2e2"
                                                    : tag.color === "orange"
                                                        ? "#fed7aa"
                                                        : tag.color === "yellow"
                                                            ? "#fef3c7"
                                                            : tag.color === "green"
                                                                ? "#dcfce7"
                                                                : tag.color === "blue"
                                                                    ? "#dbeafe"
                                                                    : tag.color === "purple"
                                                                        ? "#e9d5ff"
                                                                        : "#e5e7eb",
                                            color:
                                                tag.color === "red"
                                                    ? "#991b1b"
                                                    : tag.color === "orange"
                                                        ? "#9a3412"
                                                        : tag.color === "yellow"
                                                            ? "#92400e"
                                                            : tag.color === "green"
                                                                ? "#166534"
                                                                : tag.color === "blue"
                                                                    ? "#1e40af"
                                                                    : tag.color === "purple"
                                                                        ? "#7c3aed"
                                                                        : "#374151",
                                        }}
                                    >
                                        {tag.name}
                                    </span>
                                    <span className="text-sm text-gray-500 capitalize">({tag.color})</span>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEditTag(tag)}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTag(tag._id, tag.name)}
                                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )

    const renderAdvancedFilter = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Search Term</label>
                <input
                    type="text"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    placeholder="Search by name, email, phone, or source..."
                    className="mt-1 p-2 w-full border rounded"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="mt-1 p-2 w-full border rounded"
                    >
                        <option value="">All Statuses</option>
                        {["New", "Contacted", "Qualified", "Lost", "Won"].map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <select
                        value={filters.assignedTo}
                        onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                        className="mt-1 p-2 w-full border rounded"
                    >
                        <option value="">All Users</option>
                        <option value="unassigned">Unassigned</option>
                        {assignableUsers.map((user) => (
                            <option key={user._id} value={user._id}>
                                {user.name} ({user.role.replace("-", " ")})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Source</label>
                <input
                    type="text"
                    value={filters.source}
                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                    placeholder="Filter by source..."
                    className="mt-1 p-2 w-full border rounded"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date From</label>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="mt-1 p-2 w-full border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Date To</label>
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="mt-1 p-2 w-full border rounded"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                {tags.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                        {tags.map((tag) => (
                            <label key={tag._id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.tags.includes(tag._id)}
                                    onChange={() => handleFilterTagToggle(tag._id)}
                                    className="rounded"
                                />
                                <span
                                    className="px-2 py-1 rounded text-xs font-medium"
                                    style={{
                                        backgroundColor:
                                            tag.color === "red"
                                                ? "#fee2e2"
                                                : tag.color === "orange"
                                                    ? "#fed7aa"
                                                    : tag.color === "yellow"
                                                        ? "#fef3c7"
                                                        : tag.color === "green"
                                                            ? "#dcfce7"
                                                            : tag.color === "blue"
                                                                ? "#dbeafe"
                                                                : tag.color === "purple"
                                                                    ? "#e9d5ff"
                                                                    : "#e5e7eb",
                                        color:
                                            tag.color === "red"
                                                ? "#991b1b"
                                                : tag.color === "orange"
                                                    ? "#9a3412"
                                                    : tag.color === "yellow"
                                                        ? "#92400e"
                                                        : tag.color === "green"
                                                            ? "#166534"
                                                            : tag.color === "blue"
                                                                ? "#1e40af"
                                                                : tag.color === "purple"
                                                                    ? "#7c3aed"
                                                                    : "#374151",
                                    }}
                                >
                                    {tag.name}
                                </span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No tags available</p>
                )}
            </div>

            <div className="flex space-x-2 pt-4 border-t">
                <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Apply Filters
                </button>
                <button
                    onClick={() => {
                        clearFilters()
                        setShowFilterModal(false)
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                    Clear All
                </button>
            </div>
        </div>
    )

    // Loading 
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    // Error 
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                    <p className="text-gray-600">Redirecting to login...</p>
                </div>
            </div>
        )
    }

    // No role 
    if (!role) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                        <p className="font-bold">Authentication Issue</p>
                        <p>Unable to determine user role. Please log in again.</p>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 capitalize">Dashboard - {role.replace("-", " ")}</h1>
                        {user && <p className="text-gray-600 mt-1">Welcome back, {user.name || user.email}</p>}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Logout
                    </button>
                </div>

                {role === "super-admin" && (
                    <>
                        {renderLeadStats()}
                        {renderUserManagement()}
                        {renderLeadManagement()}
                        {renderLeadsList()}
                        {renderActivityLogs()}
                    </>
                )}
                {role === "sub-admin" && (
                    <>
                        {renderLeadStats()}
                        {renderLeadManagement()}
                        {renderLeadsList()}
                        {renderActivityLogs()}
                    </>
                )}
                {role === "support-agent" && (
                    <>
                        {renderLeadStats()}
                        {renderLeadsList()}
                    </>
                )}

                {renderModal(showUserModal, () => setShowUserModal(false), "Add New User", renderUserForm())}
                {renderModal(showEditUserModal, () => setShowEditUserModal(false), "Edit User", renderEditUserForm())}
                {renderModal(showLeadModal, () => setShowLeadModal(false), "Add New Lead", renderLeadForm())}
                {renderModal(showEditLeadModal, () => setShowEditLeadModal(false), "Edit Lead", renderEditLeadForm())}
                {renderModal(
                    showTagModal,
                    () => {
                        setShowTagModal(false)
                        setEditingTag(null)
                        setTagForm({ name: "", color: "red" })
                    },
                    "Manage Tags",
                    renderTagManagement(),
                )}
                {renderModal(showFilterModal, () => setShowFilterModal(false), "Advanced Filter", renderAdvancedFilter())}
            </div>
        </div>
    )
}
