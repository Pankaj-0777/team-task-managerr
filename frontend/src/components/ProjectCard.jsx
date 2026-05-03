import React from "react";

export default function ProjectCard({ project }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>{project.name}</h3>

      <p style={styles.desc}>{project.description}</p>

      <p>
        <strong>Join Code:</strong>{" "}
        <span style={styles.code}>{project.joinCode}</span>
      </p>

      <div>
        <strong>Members:</strong>
        <div style={styles.members}>
          {project.members.map((m) => (
            <span key={m._id} style={styles.member}>
              {m.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #ddd",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "15px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  title: {
    marginBottom: "5px",
  },
  desc: {
    color: "#555",
    marginBottom: "10px",
  },
  code: {
    background: "#f4f4f4",
    padding: "3px 8px",
    borderRadius: "5px",
  },
  members: {
    marginTop: "8px",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  member: {
    background: "#e3f2fd",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
  },
};