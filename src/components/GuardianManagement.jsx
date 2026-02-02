/**
 * GuardianManagement Component
 * 
 * Complete CRUD operations for guardians with student association.
 * Features debounced search, CNIC lookup, and optimistic updates.
 */

import { useState, useCallback, useMemo } from 'react';
import { useFetch, useMutation, useDebounce } from '../hooks/useApi';
import { guardianService } from '../services/guardianService';
import '../fee.css';

// Relationship options
const RELATIONSHIPS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other', label: 'Other' },
];

// Initial form state
const INITIAL_FORM = {
  name: '',
  cnic: '',
  phone: '',
  email: '',
  relationship: 'father',
  occupation: '',
  address: '',
  emergencyContact: '',
};

export default function GuardianManagement() {
  // Tab state
  const [activeTab, setActiveTab] = useState('list');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  
  // CNIC search state
  const [cnicSearch, setCnicSearch] = useState('');
  const [cnicSearchResult, setCnicSearchResult] = useState(null);
  
  // Detail modal state
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Fetch guardians
  const {
    data: guardiansData,
    loading: guardiansLoading,
    error: guardiansError,
    refetch: refetchGuardians,
  } = useFetch(
    () => guardianService.list(debouncedSearch),
    [debouncedSearch]
  );
  
  // Create guardian mutation
  const {
    execute: createGuardian,
    loading: creating,
    error: createError,
  } = useMutation(
    async (data) => {
      const result = await guardianService.create(data);
      return result;
    },
    {
      onSuccess: () => {
        closeFormModal();
        refetchGuardians();
      },
    }
  );
  
  // Update guardian mutation
  const {
    execute: updateGuardian,
    loading: updating,
    error: updateError,
  } = useMutation(
    async ({ id, data }) => {
      const result = await guardianService.update(id, data);
      return result;
    },
    {
      onSuccess: () => {
        closeFormModal();
        refetchGuardians();
      },
    }
  );
  
  // Delete guardian mutation
  const {
    execute: deleteGuardian,
    loading: deleting,
  } = useMutation(
    async (id) => {
      const result = await guardianService.delete(id);
      return result;
    },
    {
      onSuccess: () => {
        refetchGuardians();
      },
    }
  );
  
  // CNIC search mutation
  const {
    execute: searchByCnic,
    loading: searchingCnic,
  } = useMutation(
    async (cnic) => {
      const result = await guardianService.searchByCNIC(cnic);
      return result;
    },
    {
      onSuccess: (result) => {
        setCnicSearchResult(result);
      },
    }
  );
  
  // Get guardian details
  const {
    execute: fetchGuardianDetails,
    loading: loadingDetails,
  } = useMutation(
    async (id) => {
      const result = await guardianService.getById(id);
      return result;
    },
    {
      onSuccess: (result) => {
        // Backend wraps data in { success, data, ... }
        const guardian = result?.data || result;
        setSelectedGuardian(guardian);
        setShowDetailModal(true);
      },
    }
  );
  
  // Close form modal and reset
  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
    setFormData(INITIAL_FORM);
    setEditingId(null);
  }, []);
  
  // Open add modal
  const openAddModal = useCallback(() => {
    setFormData(INITIAL_FORM);
    setEditingId(null);
    setShowFormModal(true);
  }, []);
  
  // Open edit modal
  const openEditModal = useCallback((guardian) => {
    setFormData({
      name: guardian.name || '',
      cnic: guardian.cnic || '',
      phone: guardian.phone || '',
      email: guardian.email || '',
      relationship: guardian.relationship || 'father',
      occupation: guardian.occupation || '',
      address: guardian.address || '',
      emergencyContact: guardian.emergencyContact || '',
    });
    setEditingId(guardian._id || guardian.id);
    setShowFormModal(true);
  }, []);
  
  // Handle form field change
  const handleFormChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // Submit form
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      return;
    }
    
    if (editingId) {
      await updateGuardian({ id: editingId, data: formData });
    } else {
      await createGuardian(formData);
    }
  }, [formData, editingId, createGuardian, updateGuardian]);
  
  // Handle delete
  const handleDelete = useCallback(async (guardian) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${guardian.name}"? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      await deleteGuardian(guardian._id || guardian.id);
    }
  }, [deleteGuardian]);
  
  // Handle CNIC search
  const handleCnicSearch = useCallback(async () => {
    if (cnicSearch.length >= 13) {
      await searchByCnic(cnicSearch.replace(/-/g, ''));
    }
  }, [cnicSearch, searchByCnic]);
  
  // Handle view details
  const handleViewDetails = useCallback(async (guardian) => {
    await fetchGuardianDetails(guardian._id || guardian.id);
  }, [fetchGuardianDetails]);
  
  // Format CNIC with dashes
  const formatCnic = useCallback((value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }, []);
  
  // Format phone number
  const formatPhone = useCallback((phone) => {
    if (!phone) return '-';
    return phone;
  }, []);
  
  // Get relationship label
  const getRelationshipLabel = useCallback((value) => {
    const found = RELATIONSHIPS.find(r => r.value === value);
    return found ? found.label : value;
  }, []);
  
  // Computed guardians list - backend wraps data in { success, data, ... }
  const guardians = guardiansData?.data || guardiansData?.guardians || guardiansData || [];
  
  // Statistics
  const stats = useMemo(() => {
    const total = Array.isArray(guardians) ? guardians.length : 0;
    let totalStudentsLinked = 0;
    
    if (Array.isArray(guardians)) {
      guardians.forEach(g => {
        totalStudentsLinked += parseInt(g.student_count || 0, 10);
      });
    }
    
    return { total, totalStudentsLinked };
  }, [guardians]);
  
  const formError = createError || updateError;
  
  return (
    <div className="fee-management guardian-management">
      <div className="page-header">
        <h2>👨‍👩‍👧‍👦 Guardian Management</h2>
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Guardian List
          </button>
          <button
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            CNIC Search
          </button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="analytics-dashboard">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Guardians</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Students Linked</div>
            <div className="stat-value">{stats.totalStudentsLinked}</div>
          </div>
        </div>
      </div>
      
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="filters-section">
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, CNIC, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn-primary" onClick={openAddModal}>
              + Add Guardian
            </button>
          </div>
          
          {/* Error Display */}
          {guardiansError && (
            <div className="alert alert-error">{guardiansError}</div>
          )}
          
          {/* Guardians Table */}
          {guardiansLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading guardians...</p>
            </div>
          ) : !Array.isArray(guardians) || guardians.length === 0 ? (
            <div className="empty-state">
              <p>No guardians found</p>
              <p>Add a guardian to get started</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>CNIC</th>
                    <th>Phone</th>
                    <th>Students</th>
                    <th>Occupation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guardians.map((guardian) => (
                    <tr key={guardian._id || guardian.id}>
                      <td>
                        <strong>{guardian.name}</strong>
                        {guardian.email && (
                          <div className="student-roll">{guardian.email}</div>
                        )}
                      </td>
                      <td>{guardian.cnic ? formatCnic(guardian.cnic) : '-'}</td>
                      <td>{formatPhone(guardian.phone)}</td>
                      <td>
                        <span className="status-badge status-partial">
                          {guardian.student_count || 0} linked
                        </span>
                      </td>
                      <td>{guardian.occupation || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-download"
                            onClick={() => handleViewDetails(guardian)}
                            title="View Details"
                            disabled={loadingDetails}
                          >
                            👁️
                          </button>
                          <button
                            className="btn-action btn-pay"
                            onClick={() => openEditModal(guardian)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDelete(guardian)}
                            title="Delete"
                            disabled={deleting}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {activeTab === 'search' && (
        <div className="generate-section">
          <h3>Search Guardian by CNIC</h3>
          <p>Enter a CNIC number to find if a guardian already exists in the system.</p>
          
          <div className="form-row" style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>CNIC Number</label>
              <input
                type="text"
                value={cnicSearch}
                onChange={(e) => setCnicSearch(formatCnic(e.target.value))}
                placeholder="12345-1234567-1"
                maxLength={15}
              />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <button
                className="btn-primary"
                onClick={handleCnicSearch}
                disabled={searchingCnic || cnicSearch.length < 13}
              >
                {searchingCnic ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          
          {cnicSearchResult && (
            <div style={{ marginTop: '1.5rem' }}>
              {cnicSearchResult.guardian ? (
                <div className="guardian-card">
                  <h4>{cnicSearchResult.guardian.name}</h4>
                  <div className="guardian-meta">
                    <span>📞 {cnicSearchResult.guardian.phone}</span>
                    <span>🪪 {formatCnic(cnicSearchResult.guardian.cnic)}</span>
                    <span>👔 {cnicSearchResult.guardian.occupation || 'N/A'}</span>
                  </div>
                  {cnicSearchResult.guardian.students?.length > 0 && (
                    <div className="students-linked">
                      <strong>Linked Students:</strong>
                      <div style={{ marginTop: '0.5rem' }}>
                        {cnicSearchResult.guardian.students.map((student, idx) => (
                          <span key={idx} className="student-chip">
                            {student.name || student}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="alert alert-error">
                  No guardian found with this CNIC number.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Guardian' : 'Add New Guardian'}</h3>
              <button className="modal-close" onClick={closeFormModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {formError && (
                <div className="alert alert-error">{formError}</div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>CNIC</label>
                    <input
                      type="text"
                      value={formData.cnic}
                      onChange={(e) => handleFormChange('cnic', formatCnic(e.target.value))}
                      placeholder="12345-1234567-1"
                      maxLength={15}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      required
                      placeholder="03001234567"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Relationship *</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => handleFormChange('relationship', e.target.value)}
                      required
                    >
                      {RELATIONSHIPS.map(rel => (
                        <option key={rel.value} value={rel.value}>
                          {rel.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Occupation</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => handleFormChange('occupation', e.target.value)}
                      placeholder="e.g., Engineer"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    placeholder="Full address"
                  />
                </div>
                
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <input
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => handleFormChange('emergencyContact', e.target.value)}
                    placeholder="Alternate phone number"
                  />
                </div>
                
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeFormModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={creating || updating || !formData.name || !formData.phone}
                  >
                    {creating || updating ? 'Saving...' : editingId ? 'Update Guardian' : 'Add Guardian'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Detail Modal */}
      {showDetailModal && selectedGuardian && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Guardian Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="voucher-summary">
                <p><strong>Name:</strong> {selectedGuardian.name || 'N/A'}</p>
                <p><strong>CNIC:</strong> {selectedGuardian.cnic ? formatCnic(selectedGuardian.cnic) : 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedGuardian.phone || 'N/A'}</p>
                <p><strong>Occupation:</strong> {selectedGuardian.occupation || 'N/A'}</p>
              </div>
              
              {selectedGuardian.students?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Linked Students ({selectedGuardian.students.length})</h4>
                  <div className="table-container" style={{ marginTop: '0.5rem' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Roll No</th>
                          <th>Relation</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGuardian.students.map((student, idx) => (
                          <tr key={idx}>
                            <td>{student.name}</td>
                            <td>{student.roll_no || '-'}</td>
                            <td>{student.relation || '-'}</td>
                            <td>
                              <span className={`status-badge ${student.is_active ? 'status-paid' : 'status-unpaid'}`}>
                                {student.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedGuardian);
                  }}
                >
                  Edit Guardian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
