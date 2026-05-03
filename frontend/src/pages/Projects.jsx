import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedProject, setExpandedProject] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin') fetchAllUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(data.projects);
    } catch (err) {
      setError('Failed to load projects');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data } = await API.get('/auth/users');
      setAllUsers(data.users);
    } catch (err) {
      console.error('Failed to load users');
    }
  };

  const handleCreate = async () => {
    if (!name) return setError('Project name is required');
    setError('');
    try {
      await API.post('/projects', { name, description });
      setName('');
      setDescription('');
      setSuccess('Project created!');
      setTimeout(() => setSuccess(''), 3000);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleAddMember = async (projectId, userId) => {
    try {
      await API.post(`/projects/${projectId}/members`, { userId });
      setSuccess('Member added!');
      setTimeout(() => setSuccess(''), 2000);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    try {
      await API.delete(`/projects/${projectId}/members/${userId}`);
      fetchProjects();
    } catch (err) {
      setError('Failed to remove member');
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await API.delete(`/projects/${projectId}`);
      fetchProjects();
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📁 Projects</h2>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Admin: Create project */}
      {user?.role === 'admin' && (
        <div style={styles.form}>
          <h3 style={styles.formTitle}>➕ Create New Project</h3>
          <input style={styles.input} placeholder="Project Name *"
            value={name} onChange={e => setName(e.target.value)} />
          <input style={styles.input} placeholder="Description (optional)"
            value={description} onChange={e => setDescription(e.target.value)} />
          <button style={styles.btn} onClick={handleCreate}>
            + Create Project
          </button>
        </div>
      )}

      {/* Projects list */}
      {projects.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📭</p>
          <p style={{ color: '#94a3b8' }}>
            {user?.role === 'admin'
              ? 'No projects yet. Create one above!'
              : 'You have not been added to any project yet. Ask your admin.'}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map(project => {
            const isExpanded = expandedProject === project._id;
            const memberIds = project.members?.map(m => m._id) || [];
            const nonMembers = allUsers.filter(u => !memberIds.includes(u._id));

            return (
              <div key={project._id} style={styles.card}>

                {/* Card header */}
                <div style={styles.cardTop}>
                  <div>
                    <h3 style={styles.cardTitle}>{project.name}</h3>
                    <p style={styles.cardDesc}>
                      {project.description || 'No description'}
                    </p>
                  </div>
                  <div style={styles.cardActions}>
                    <span style={{
                      ...styles.statusBadge,
                      background: project.status === 'active' ? '#dcfce7' :
                        project.status === 'completed' ? '#dbeafe' : '#fef3c7',
                      color: project.status === 'active' ? '#16a34a' :
                        project.status === 'completed' ? '#1d4ed8' : '#b45309',
                    }}>
                      {project.status}
                    </span>
                    {user?.role === 'admin' && (
                      <button style={styles.deleteBtn}
                        onClick={() => handleDelete(project._id)}>🗑️</button>
                    )}
                  </div>
                </div>

                {/* Members preview */}
                <div style={styles.membersRow}>
                  <span style={styles.membersLabel}>
                    👥 {project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}:
                  </span>
                  <div style={styles.avatarRow}>
                    {project.members?.slice(0, 4).map(m => (
                      <div key={m._id} style={styles.avatarSmall} title={m.name}>
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {project.members?.length > 4 && (
                      <div style={styles.avatarSmall}>+{project.members.length - 4}</div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={styles.btnRow}>
                  <button style={styles.viewBtn}
                    onClick={() => navigate(`/projects/${project._id}/tasks`)}>
                    View Tasks →
                  </button>
                  {user?.role === 'admin' && (
                    <button style={styles.manageBtn}
                      onClick={() => setExpandedProject(isExpanded ? null : project._id)}>
                      {isExpanded ? 'Close ▲' : '👥 Manage Members'}
                    </button>
                  )}
                </div>

                {/* Expanded member management */}
                {isExpanded && user?.role === 'admin' && (
                  <div style={styles.memberPanel}>
                    <p style={styles.panelTitle}>Current Members</p>
                    {project.members?.length === 0 && (
                      <p style={styles.noMembers}>No members yet.</p>
                    )}
                    {project.members?.map(m => (
                      <div key={m._id} style={styles.memberRow}>
                        <div style={styles.memberInfo}>
                          <div style={styles.avatar}>{m.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={styles.memberName}>{m.name}</div>
                            <div style={styles.memberEmail}>{m.email} · {m.role}</div>
                          </div>
                        </div>
                        <button style={styles.removeBtn}
                          onClick={() => handleRemoveMember(project._id, m._id)}>
                          Remove
                        </button>
                      </div>
                    ))}

                    {/* Add member dropdown */}
                    {nonMembers.length > 0 && (
                      <div style={styles.addMemberRow}>
                        <p style={styles.panelTitle}>Add Member</p>
                        <div style={styles.addMemberControls}>
                          <select style={styles.select} id={`add-${project._id}`}>
                            <option value="">Select a user...</option>
                            {nonMembers.map(u => (
                              <option key={u._id} value={u._id}>
                                {u.name} ({u.role})
                              </option>
                            ))}
                          </select>
                          <button style={styles.addBtn} onClick={() => {
                            const sel = document.getElementById(`add-${project._id}`);
                            if (sel.value) handleAddMember(project._id, sel.value);
                          }}>
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '960px', margin: '0 auto', paddingBottom: '40px' },
  heading: { color: '#0f172a', marginBottom: '24px' },
  error: { background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  success: { background: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  form: {
    background: 'white', padding: '24px', borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '28px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  formTitle: { margin: '0 0 4px', color: '#0f172a' },
  input: {
    padding: '10px 14px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px',
  },
  btn: {
    background: '#6366f1', color: 'white', border: 'none',
    padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
  },
  emptyBox: {
    textAlign: 'center', padding: '60px', background: 'white',
    borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  grid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: {
    background: 'white', borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '24px',
    border: '1px solid #f1f5f9',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  cardTitle: { margin: '0 0 4px', color: '#0f172a', fontSize: '18px' },
  cardDesc: { margin: 0, color: '#64748b', fontSize: '14px' },
  cardActions: { display: 'flex', alignItems: 'center', gap: '8px' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },
  membersRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  membersLabel: { fontSize: '13px', color: '#64748b' },
  avatarRow: { display: 'flex', gap: '4px' },
  avatarSmall: {
    width: '28px', height: '28px', borderRadius: '50%', background: '#6366f1',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: '700', border: '2px solid white',
  },
  btnRow: { display: 'flex', gap: '10px' },
  viewBtn: {
    background: '#0f172a', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
  },
  manageBtn: {
    background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
  },
  memberPanel: {
    marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px',
  },
  panelTitle: { fontWeight: '700', color: '#0f172a', margin: '0 0 12px', fontSize: '14px' },
  noMembers: { color: '#94a3b8', fontSize: '14px' },
  memberRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px',
  },
  memberInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%', background: '#6366f1',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', fontSize: '15px',
  },
  memberName: { fontWeight: '600', color: '#0f172a', fontSize: '14px' },
  memberEmail: { color: '#64748b', fontSize: '12px' },
  removeBtn: {
    background: '#fee2e2', color: '#dc2626', border: 'none',
    padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
  },
  addMemberRow: { marginTop: '16px' },
  addMemberControls: { display: 'flex', gap: '10px' },
  select: {
    flex: 1, padding: '10px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px',
  },
  addBtn: {
    background: '#6366f1', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
  },
};

export default Projects;