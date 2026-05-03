import React from "react";
import axios from "../api/axios";

export default function TaskCard({ task, refresh }) {
  
  const updateStatus = async (status) => {
    try {
      await axios.put(`/tasks/${task._id}`, { status });
      refresh(); // reload tasks
    } catch (err) {
      console.error(err);
    }
  };

  const getColor = () => {
    if (task.status === "done") return "#4caf50";
    if (task.status === "in-progress") return "#ff9800";
    return "#f44336";
  };

  return (
    <div style={styles.card}>
      <h4>{task.title}</h4>
      <p>{task.description}</p>

      <p>
        <strong>Status:</strong>{" "}
        <span style={{ color: getColor() }}>{task.status}</span>
      </p>

      <p>
        <strong>Deadline:</strong>{" "}
        {task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}
      </p>

      {/* STATUS BUTTONS */}
      <div style={styles.buttons}>
        <button onClick={() => updateStatus("todo")}>To Do</button>
        <button onClick={() => updateStatus("in-progress")}>In Progress</button>
        <button onClick={() => updateStatus("done")}>Done</button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #ddd",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "10px",
    background: "#fff",
  },
  buttons: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
};