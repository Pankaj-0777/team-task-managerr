// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectTaskMap, setProjectTaskMap] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'admin') {
          // Admin: fetch all projects + all their tasks
          const projectsRes = await API.get('/projects');
          const allProjects = projectsRes.data.projects;
          setProjects(allProjects);

          if (allProjects.length > 0) {
            const taskPromises = allProjects.map(p => API.get(`/tasks?project=${p._id}`));
            const taskResults = await Promise.all(taskPromises);
            const allTasks = taskResults.flatMap(r => r.data.tasks);
            setTasks(allTasks);

            // Build project → tasks map
            const map = {};
            allProjects.forEach((p, i) => {
              map[p._id] = {
                name: p.name,
                tasks: taskResults[i].data.tasks,
              };
            });
            setProjectTaskMap(map);
          }
        } else {
          // Member: fetch their assigned tasks + all projects they belong to
          const [tasksRes, projectsRes] = await Promise.all([
            API.get('/tasks/my-tasks'),
            API.get('/projects'),
          ]);
          const myTasks = tasksRes.data.tasks;
          const myProjects = projectsRes.data.projects;
          setTasks(myTasks);
          setProjects(myProjects);

          // Build per-project progress for member
          const map = {};
          myProjects.forEach(p => {
            const projectTasks = myTasks.filter(
              t => t.project?._id === p._id || t.project === p._id
            );
            map[p._id] = { name: p.name, tasks: projectTasks };
          });
          setProjectTaskMap(map);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // ── Stat calculations ──────────────────────────────
  const total = tasks.length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  ).length;
  const unassigned = tasks.filter(t => !t.assignedTo).length;

  // Admin stats
  const adminStats = [
    { label: 'Total Tasks', value: total, color: '#6366f1', bg: '#eef2ff', icon: '📋' },
    { label: 'To Assign', value: unassigned, color: '#f59e0b', bg: '#fffbeb', icon: '📤' },
    { label: 'In Progress', value: inProgress, color: '#8b5cf6', bg: '#f5f3ff', icon: '⚙️' },
    { label: 'Completed', value: done, color: '#10b981', bg: '#ecfdf5', icon: '✅' },
    { label: 'Overdue', value: overdue, color: '#ef4444', bg: '#fef2f2', icon: '⚠️' },
  ];

  // Member stats
  const memberStats = [
    { label: 'My Tasks', value: total, color: '#6366f1', bg: '#eef2ff', icon: '📋' },
    { label: 'To Do', value: todo, color: '#f59e0b', bg: '#fffbeb', icon: '📝' },
    { label: 'In Progress', value: inProgress, color: '#8b5cf6', bg: '#f5f3ff', icon: '⚙️' },
    { label: 'Completed', value: done, color: '#10b981', bg: '#ecfdf5', icon: '✅' },
    { label: 'Overdue', value: overdue, color: '#ef4444', bg: '#fef2f2', icon: '⚠️' },
  ];

  const stats = user?.role === 'admin' ? adminStats : memberStats;

  // ── Member workload (admin only) ───────────────────
  const memberMap = {};
  tasks.forEach(task => {
    if (task.assignedTo) {
      const name = task.assignedTo.name || 'Unknown';
      if (!memberMap[name]) memberMap[name] = { todo: 0, inProgress: 0, done: 0, total: 0 };
      memberMap[name].total++;
      if (task.status === 'todo') memberMap[name].todo++;
      if (task.status === 'in-progress') memberMap[name].inProgress++;
      if (task.status === 'done') memberMap[name].done++;
    }
  });

  if (loading) return (
    <div style={styles.loadingWrap}>
      <div style={styles.pulse}>⏳</div>
      <p style={{ color: '#64748b', marginTop: '12px' }}>Loading your dashboard...</p>
    </div>
  );

  return (
    <div style={styles.page}>

      {/* ── Header ───────────────────────────────────── */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>👋 Welcome back, {user?.name}!</h2>
          <p style={styles.sub}>
            {user?.role === 'admin'
              ? '🛡️ Admin — Full project & team overview'
              : '👤 Your personal progress & task summary'}
          </p>
        </div>
        <div style={{
          ...styles.roleBadge,
          background: user?.role === 'admin' ? '#1e293b' : '#6366f1',
        }}>
          {user?.role === 'admin' ? '🛡️ Admin' : '👤 Member'}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────── */}
      <div style={styles.statGrid}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ ...styles.statCard, background: stat.bg }}>
            <div style={styles.statIcon}>{stat.icon}</div>
            <div style={{ ...styles.statValue, color: stat.color }}>{stat.value}</div>
            <div style={styles.statLabel}>{stat.label}</div>
            {total > 0 && (
              <div style={styles.miniBarWrap}>
                <div style={{
                  ...styles.miniBarFill,
                  width: `${Math.round((stat.value / total) * 100)}%`,
                  background: stat.color,
                }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── MEMBER: Project Progress ─────────────────── */}
      {user?.role === 'member' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📁 My Progress by Project</h3>
          {Object.entries(projectTaskMap).filter(([, p]) => p.tasks.length > 0).length === 0 ? (
            <div style={styles.emptyBox}>
              <p style={styles.emptyIcon}>📭</p>
              <p style={styles.emptyText}>No tasks assigned to you in any project yet.</p>
            </div>
          ) : (
            Object.entries(projectTaskMap)
              .filter(([, p]) => p.tasks.length > 0)
              .map(([pid, proj]) => {
                const pTotal = proj.tasks.length;
                const pDone = proj.tasks.filter(t => t.status === 'done').length;
                const pInProgress = proj.tasks.filter(t => t.status === 'in-progress').length;
                const pTodo = proj.tasks.filter(t => t.status === 'todo').length;
                const pct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
                const pOverdue = proj.tasks.filter(t =>
                  t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
                ).length;

                return (
                  <div key={pid} style={styles.projectCard}>
                    <div style={styles.projectHeader}>
                      <div style={styles.projectName}>
                        <span style={styles.projectDot} />
                        {proj.name}
                      </div>
                      <div style={styles.projectBadges}>
                        {pOverdue > 0 && (
                          <span style={styles.overduePill}>⚠️ {pOverdue} overdue</span>
                        )}
                        <span style={styles.pctPill}>{pct}% done</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                    </div>

                    {/* Mini stats row */}
                    <div style={styles.miniStatsRow}>
                      <span style={styles.miniStat}>
                        <span style={{ color: '#f59e0b' }}>●</span> {pTodo} To Do
                      </span>
                      <span style={styles.miniStat}>
                        <span style={{ color: '#8b5cf6' }}>●</span> {pInProgress} In Progress
                      </span>
                      <span style={styles.miniStat}>
                        <span style={{ color: '#10b981' }}>●</span> {pDone} Done
                      </span>
                      <span style={styles.miniStat}>
                        <span style={{ color: '#64748b' }}>●</span> {pTotal} Total
                      </span>
                    </div>

                    {/* Task list for this project */}
                    <div style={styles.projectTaskList}>
                      {proj.tasks.map(task => {
                        const isOver = task.dueDate &&
                          new Date(task.dueDate) < new Date() &&
                          task.status !== 'done';
                        return (
                          <div key={task._id} style={{
                            ...styles.projectTaskRow,
                            borderLeft: `3px solid ${
                              isOver ? '#ef4444' :
                              task.status === 'done' ? '#10b981' :
                              task.status === 'in-progress' ? '#8b5cf6' : '#f59e0b'
                            }`,
                          }}>
                            <div>
                              <span style={styles.taskName}>{task.title}</span>
                              {task.dueDate && (
                                <span style={{
                                  ...styles.dueChip,
                                  color: isOver ? '#ef4444' : '#64748b',
                                }}>
                                  📅 {new Date(task.dueDate).toLocaleDateString()}
                                  {isOver ? ' ⚠️' : ''}
                                </span>
                              )}
                            </div>
                            <span style={{
                              ...styles.statusPill,
                              background:
                                task.status === 'done' ? '#dcfce7' :
                                task.status === 'in-progress' ? '#ede9fe' : '#fef3c7',
                              color:
                                task.status === 'done' ? '#16a34a' :
                                task.status === 'in-progress' ? '#7c3aed' : '#b45309',
                            }}>
                              {task.status === 'done' ? '✅ Done' :
                               task.status === 'in-progress' ? '⚙️ In Progress' : '📝 To Do'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ── ADMIN: Member Workload Table ─────────────── */}
      {user?.role === 'admin' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>👥 Member Workload</h3>
          {Object.entries(memberMap).length === 0 ? (
            <div style={styles.emptyBox}>
              <p style={styles.emptyIcon}>👥</p>
              <p style={styles.emptyText}>No tasks assigned to members yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={styles.th}>Member</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>📝 To Do</th>
                    <th style={styles.th}>⚙️ In Progress</th>
                    <th style={styles.th}>✅ Done</th>
                    <th style={styles.th}>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(memberMap).map(([name, counts], i) => {
                    const pct = counts.total > 0
                      ? Math.round((counts.done / counts.total) * 100) : 0;
                    return (
                      <tr key={name} style={{
                        background: i % 2 === 0 ? '#f8fafc' : 'white',
                        borderTop: '1px solid #f1f5f9',
                      }}>
                        <td style={styles.td}>
                          <div style={styles.memberCell}>
                            <div style={styles.avatar}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <span>{name}</span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, fontWeight: '700' }}>{counts.total}</td>
                        <td style={{ ...styles.td, color: '#f59e0b' }}>{counts.todo}</td>
                        <td style={{ ...styles.td, color: '#8b5cf6' }}>{counts.inProgress}</td>
                        <td style={{ ...styles.td, color: '#10b981' }}>{counts.done}</td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={styles.barTrack}>
                              <div style={{
                                ...styles.barFill,
                                width: `${pct}%`,
                                background: pct === 100 ? '#10b981' :
                                  pct > 50 ? '#6366f1' : '#f59e0b',
                              }} />
                            </div>
                            <span style={styles.pctText}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ADMIN: Project Overview ───────────────────── */}
      {user?.role === 'admin' && Object.keys(projectTaskMap).length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📁 Project Overview</h3>
          <div style={styles.projectGrid}>
            {Object.entries(projectTaskMap).map(([pid, proj]) => {
              const pTotal = proj.tasks.length;
              const pDone = proj.tasks.filter(t => t.status === 'done').length;
              const pOverdue = proj.tasks.filter(t =>
                t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
              ).length;
              const pct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

              return (
                <div key={pid} style={styles.projectMiniCard}>
                  <div style={styles.projectMiniName}>{proj.name}</div>
                  <div style={styles.progressTrack}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${pct}%`,
                      background: pct === 100 ? '#10b981' : '#6366f1',
                    }} />
                  </div>
                  <div style={styles.projectMiniStats}>
                    <span>{pTotal} tasks</span>
                    <span style={{ color: '#10b981' }}>{pDone} done</span>
                    {pOverdue > 0 && (
                      <span style={{ color: '#ef4444' }}>⚠️ {pOverdue} overdue</span>
                    )}
                    <span style={{ fontWeight: '700', color: '#6366f1' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Overdue Tasks ────────────────────────────── */}
      {overdue > 0 && (
        <div style={styles.overdueSection}>
          <h3 style={styles.sectionTitle}>⚠️ Overdue Tasks</h3>
          {tasks
            .filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done')
            .map(task => {
              const daysLate = Math.ceil(
                (new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={task._id} style={styles.overdueRow}>
                  <div>
                    <strong style={{ color: '#1e293b' }}>{task.title}</strong>
                    {task.assignedTo?.name && (
                      <span style={styles.chip}>👤 {task.assignedTo.name}</span>
                    )}
                    {task.project?.name && (
                      <span style={styles.chip}>📁 {task.project.name}</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ef4444', fontSize: '13px' }}>
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    <div style={{ color: '#b91c1c', fontSize: '11px', fontWeight: '700' }}>
                      {daysLate} day{daysLate > 1 ? 's' : ''} late
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── Recent Tasks ─────────────────────────────── */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          {user?.role === 'admin' ? '📋 All Recent Tasks' : '📋 My Recent Tasks'}
        </h3>
        {tasks.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyIcon}>📭</p>
            <p style={styles.emptyText}>
              {user?.role === 'admin'
                ? 'No tasks yet. Go to Projects to create some!'
                : 'No tasks assigned to you yet.'}
            </p>
          </div>
        ) : (
          tasks.slice(0, 8).map(task => {
            const isOver = task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              task.status !== 'done';
            return (
              <div key={task._id} style={{
                ...styles.taskRow,
                borderLeft: `3px solid ${
                  isOver ? '#ef4444' :
                  task.status === 'done' ? '#10b981' :
                  task.status === 'in-progress' ? '#8b5cf6' : '#f59e0b'
                }`,
              }}>
                <div>
                  <div style={styles.taskName}>{task.title}</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {task.project?.name && (
                      <span style={styles.chip}>📁 {task.project.name}</span>
                    )}
                    {task.assignedTo?.name && (
                      <span style={styles.chip}>👤 {task.assignedTo.name}</span>
                    )}
                    {task.dueDate && (
                      <span style={{ ...styles.chip, color: isOver ? '#ef4444' : '#64748b' }}>
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                        {isOver ? ' ⚠️' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{
                  ...styles.statusPill,
                  background:
                    task.status === 'done' ? '#dcfce7' :
                    task.status === 'in-progress' ? '#ede9fe' : '#fef3c7',
                  color:
                    task.status === 'done' ? '#16a34a' :
                    task.status === 'in-progress' ? '#7c3aed' : '#b45309',
                }}>
                  {task.status === 'done' ? '✅ Done' :
                   task.status === 'in-progress' ? '⚙️ In Progress' : '📝 To Do'}
                </span>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────
const styles = {
  page: { maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px' },
  pulse: { fontSize: '40px', animation: 'pulse 1s infinite' },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px solid #f1f5f9',
  },
  title: { margin: '0 0 6px', color: '#0f172a', fontSize: '24px', fontWeight: '800' },
  sub: { margin: 0, color: '#64748b', fontSize: '14px' },
  roleBadge: {
    color: 'white', padding: '8px 18px', borderRadius: '20px',
    fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px',
  },

  statGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '16px', marginBottom: '32px',
  },
  statCard: {
    padding: '20px', borderRadius: '16px', textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s',
  },
  statIcon: { fontSize: '26px', marginBottom: '8px' },
  statValue: { fontSize: '38px', fontWeight: '800', lineHeight: 1 },
  statLabel: { color: '#64748b', fontSize: '12px', marginTop: '6px', fontWeight: '600' },
  miniBarWrap: { height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '12px' },
  miniBarFill: { height: '100%', borderRadius: '2px' },

  section: {
    background: 'white', borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '24px', marginBottom: '24px',
  },
  sectionTitle: { margin: '0 0 20px', color: '#0f172a', fontSize: '16px', fontWeight: '700' },

  // Member project cards
  projectCard: {
    border: '1px solid #e2e8f0', borderRadius: '12px',
    padding: '16px', marginBottom: '16px',
  },
  projectHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '12px',
  },
  projectName: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a' },
  projectDot: {
    width: '10px', height: '10px', borderRadius: '50%',
    background: '#6366f1', display: 'inline-block',
  },
  projectBadges: { display: 'flex', gap: '8px' },
  overduePill: {
    background: '#fef2f2', color: '#ef4444',
    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
  },
  pctPill: {
    background: '#eff6ff', color: '#3b82f6',
    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
  },
  progressTrack: {
    height: '8px', background: '#f1f5f9', borderRadius: '4px',
    marginBottom: '10px', overflow: 'hidden',
  },
  progressFill: { height: '100%', background: '#6366f1', borderRadius: '4px', transition: 'width 0.6s ease' },
  miniStatsRow: { display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' },
  miniStat: { fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' },
  projectTaskList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  projectTaskRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', background: '#f8fafc', borderRadius: '8px',
  },

  // Admin project grid
  projectGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px',
  },
  projectMiniCard: {
    border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px',
  },
  projectMiniName: { fontWeight: '700', color: '#0f172a', marginBottom: '10px', fontSize: '14px' },
  projectMiniStats: {
    display: 'flex', justifyContent: 'space-between', marginTop: '8px',
    fontSize: '12px', color: '#64748b', flexWrap: 'wrap', gap: '4px',
  },

  // Admin table
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: {
    padding: '12px 16px', textAlign: 'left', fontSize: '12px',
    color: '#64748b', fontWeight: '700', borderBottom: '2px solid #f1f5f9',
  },
  td: { padding: '14px 16px', color: '#1e293b' },
  memberCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%', background: '#6366f1',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', fontSize: '14px',
  },
  barTrack: { flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', minWidth: '80px' },
  barFill: { height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' },
  pctText: { fontSize: '13px', fontWeight: '700', color: '#64748b', minWidth: '36px' },

  // Overdue
  overdueSection: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '16px', padding: '24px', marginBottom: '24px',
  },
  overdueRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #fecaca',
  },

  // Shared
  chip: {
    display: 'inline-block', fontSize: '11px', color: '#64748b',
    background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px',
    border: '1px solid #e2e8f0', marginLeft: '6px',
  },
  taskRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderRadius: '10px', marginBottom: '8px',
    background: '#f8fafc',
  },
  taskName: { color: '#0f172a', fontWeight: '600', fontSize: '14px' },
  dueChip: { fontSize: '11px', marginLeft: '8px' },
  statusPill: {
    padding: '5px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
  },
  emptyBox: { textAlign: 'center', padding: '32px', background: '#f8fafc', borderRadius: '10px' },
  emptyIcon: { fontSize: '36px', margin: '0 0 8px' },
  emptyText: { color: '#94a3b8', margin: 0, fontSize: '14px' },
};

export default Dashboard;