import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
  const { id: projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [progressEdit, setProgressEdit] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await API.get(`/tasks?project=${projectId}`);
    setTasks(data.tasks);

    const init = {};
    data.tasks.forEach(t => {
      init[t._id] = { progress: t.progress || 0 };
    });
    setProgressEdit(init);
  };

  const updateProgress = async (id) => {
    const p = parseInt(progressEdit[id].progress);

    const updates = { progress: p };

    if (p >= 100) updates.status = 'done';
    else if (p > 0) updates.status = 'in-progress';
    else updates.status = 'todo';

    await API.put(`/tasks/${id}`, updates);
    fetchTasks();
  };

  return (
    <div style={{ maxWidth: '900px', margin: 'auto' }}>

      <h2>Tasks</h2>

      {tasks.map(task => {
        const isMyTask =
          task.assignedTo?._id === user?._id ||
          task.assignedTo === user?._id;

        const isOver =
          task.dueDate &&
          new Date(task.dueDate) < new Date() &&
          task.progress !== 100;

        return (
          <div key={task._id} style={{
            padding: '15px',
            marginBottom: '15px',
            border: '1px solid #ddd',
            background: isMyTask ? '#f0f9ff' : 'white'
          }}>

            <h4>{task.title}</h4>
            <p>{task.description}</p>

            <p>Status: {task.status}</p>
            <p>Progress: {task.progress || 0}%</p>

            {task.dueDate && (
              <p style={{ color: isOver ? 'red' : 'black' }}>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </p>
            )}

            {/* Progress Bar */}
            <div style={{ height: '8px', background: '#eee' }}>
              <div style={{
                width: `${task.progress || 0}%`,
                height: '100%',
                background: '#6366f1'
              }} />
            </div>

            {/* Edit Progress */}
            {(user?.role === 'admin' || isMyTask) && (
              <div style={{ marginTop: '10px' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressEdit[task._id]?.progress || 0}
                  onChange={(e) =>
                    setProgressEdit({
                      ...progressEdit,
                      [task._id]: {
                        progress: Number(e.target.value)
                      }
                    })
                  }
                />

                <button onClick={() => updateProgress(task._id)}>
                  Update
                </button>
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
};

export default Tasks;