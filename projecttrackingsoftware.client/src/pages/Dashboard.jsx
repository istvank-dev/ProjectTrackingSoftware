import React, { useState, useEffect } from "react";
import { authService, taskService } from "../services/api";
import AuthorizedView from "../components/AuthorizedView";
import { useAuth } from "../context/AuthContext";

// Simple inline styles (your existing modalStyles object)
const modalStyles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 4,
    minWidth: 300,
    maxWidth: 500,
  },
};

// Modal for editing tasks
const TaskEditModal = ({ task, onSave, onClose }) => {
  const [name, setName] = useState(task.content);
  const [description, setDescription] = useState(task.description || "");

  const handleSave = () => {
    onSave({ ...task, content: name, description });
  };

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <h3>Edit Task</h3>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
        </label>
        <label>
          Description:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", height: 100 }}
          />
        </label>
        <div style={{ marginTop: 10, textAlign: "right" }}>
          <button onClick={handleSave} style={{ marginRight: 10 }}>
            Save
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [response, setResponse] = useState(null);

  const [tasks, setTasks] = useState({});
  const [columns, setColumns] = useState({
    "col-1": { id: "col-1", title: "To Do", taskIds: [], visible: true },
    "col-2": {
      id: "col-2",
      title: "In Progress",
      taskIds: [],
      visible: true,
    },
    "col-3": { id: "col-3", title: "Done", taskIds: [], visible: true },
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [selectedColumnToAdd, setSelectedColumnToAdd] = useState("col-1");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingTask, setEditingTask] = useState(null);

  const handleApiCall = async (apiFunc, name) => {
    try {
      const data = await apiFunc();
      setResponse({ name, data });
    } catch (error) {
      setResponse({ name, error: error.message });
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const apiTasks = await taskService.getAllTasks();
      console.log(apiTasks)
      const taskMap = {};
      const colTaskIds = { "col-1": [], "col-2": [], "col-3": [] };

      apiTasks.forEach((task) => {
        const taskId = task.id;
        const columnIndex = task.columnIndex ?? 0;

        taskMap[taskId] = {
          id: taskId,
          content: task.projectName || task.content,
          description: task.description || "",
          ColumnIndex: task.columnIndex,
        };

        const colKey = `col-${columnIndex + 1}`;
        if (colTaskIds[colKey]) colTaskIds[colKey].push(taskId);
      });

      setTasks(taskMap);
      setColumns((prev) => ({
        ...prev,
        "col-1": { ...prev["col-1"], taskIds: colTaskIds["col-1"] || [] },
        "col-2": { ...prev["col-2"], taskIds: colTaskIds["col-2"] || [] },
        "col-3": { ...prev["col-3"], taskIds: colTaskIds["col-3"] || [] },
      }));
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  };

  // Add task
  const addTask = async () => {
  if (!newTaskContent.trim()) return;
  try {
    const ColumnIndex = parseInt(selectedColumnToAdd.replace("col-", "")) - 1;
    const newTask = {
      ProjectName: newTaskContent,
      description: "",
      ColumnIndex,
    };

    // Wait for full response with id
    const createdTask = await taskService.createTask(newTask);
    
    // Defensive check - log if task is missing expected fields
    console.log('Created task:', createdTask);
    
    if (!createdTask?.id) {
      throw new Error('Created task missing id');
    }

    // Update tasks FIRST with complete data
    setTasks((prev) => ({
      ...prev,
      [createdTask.id]: {
        id: createdTask.id,
        content: createdTask.ProjectName || newTaskContent, // fallback
        description: createdTask.description || "",
        ColumnIndex: createdTask.ColumnIndex ?? ColumnIndex,
      },
    }));

    // Then update columns
    setColumns((prev) => ({
      ...prev,
      [selectedColumnToAdd]: {
        ...prev[selectedColumnToAdd],
        taskIds: [...prev[selectedColumnToAdd].taskIds, createdTask.id],
      },
    }));

    setNewTaskContent("");
  } catch (error) {
    console.error("Failed to add task:", error);
  }
};


  // Remove task
  const removeTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);

      setTasks((prev) => {
        const copy = { ...prev };
        delete copy[taskId];
        return copy;
      });

      setColumns((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([colId, col]) => [
            colId,
            { ...col, taskIds: col.taskIds.filter((id) => id !== taskId) },
          ]),
        ),
      );
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Move task left or right between columns, and persist ColumnIndex
  const moveTask = (taskId, direction) => {
    const colIds = Object.keys(columns);
    const currentColId = colIds.find((colId) =>
      columns[colId].taskIds.includes(taskId),
    );
    const idx = colIds.indexOf(currentColId);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= colIds.length) return;

    const newColId = colIds[newIdx];

    setColumns((prev) => {
      const sourceCol = prev[currentColId];
      const targetCol = prev[newColId];
      return {
        ...prev,
        [currentColId]: {
          ...sourceCol,
          taskIds: sourceCol.taskIds.filter((id) => id !== taskId),
        },
        [newColId]: {
          ...targetCol,
          taskIds: [...targetCol.taskIds, taskId],
        },
      };
    });

    setTasks((prev) => {
      const updated = {
        ...prev[taskId],
        ColumnIndex: newIdx,
      };

      // persist move
      taskService
        .updateTask(taskId, {
          projectName: updated.content,
          description: updated.description,
          columnIndex: newIdx,
        })
        .catch((err) => console.error("Failed to move task:", err));
      return { ...prev, [taskId]: updated };
    });
  };

  // Edit task handlers
  const openEditModal = (task) => setEditingTask(task);
  const closeEditModal = () => setEditingTask(null);

  const saveTaskChanges = async (updatedTask) => {
    try {
      const taskData = {
        ProjectName: updatedTask.content,
        description: updatedTask.description,
        ColumnIndex: updatedTask.ColumnIndex ?? 0,
      };
      await taskService.updateTask(updatedTask.id, taskData);
      setTasks((prev) => ({ ...prev, [updatedTask.id]: updatedTask }));
    } catch (error) {
      console.error("Failed to update task:", error);
    }
    closeEditModal();
  };

  // Column controls
  const toggleColumnVisibility = (colId) => {
    setColumns((prev) => ({
      ...prev,
      [colId]: { ...prev[colId], visible: !prev[colId].visible },
    }));
  };

  const deleteColumn = (colId) => {
    const taskIdsToDelete = columns[colId].taskIds;
    setTasks((prev) => {
      const copy = { ...prev };
      taskIdsToDelete.forEach((id) => delete copy[id]);
      return copy;
    });
    setColumns((prev) => {
      const copy = { ...prev };
      delete copy[colId];
      return copy;
    });
  };

  const addColumn = () => {
    if (!newColumnTitle.trim()) return;
    const newId = "col-" + Date.now();
    setColumns((prev) => ({
      ...prev,
      [newId]: { id: newId, title: newColumnTitle, taskIds: [], visible: true },
    }));
    setNewColumnTitle("");
  };

  const colIds = Object.keys(columns);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "10px",
          borderBottom: "1px solid #ccc",
        }}
      >
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome, {user?.username}! (Role: {user?.role})
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#d9534f",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#c9302c")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#d9534f")}
        >
          Logout
        </button>
      </div>

      <AuthorizedView>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() =>
              handleApiCall(authService.getAuthorizedData, "Authorized Only")
            }
          >
            Test Authorized Endpoint
          </button>
          <button
            onClick={() =>
              handleApiCall(authService.getWeather, "Weather Forecast")
            }
          >
            Get Weather
          </button>
        </div>
      </AuthorizedView>

      <br />

      <AuthorizedView roles={["Admin"]}>
        <div
          style={{
            border: "1px solid purple",
            padding: "10px",
            marginTop: "10px",
          }}
        >
          <h3>Admin Zone</h3>
          <button
            onClick={() =>
              handleApiCall(authService.getAdminData, "Admin Endpoint")
            }
          >
            Test Admin Only
          </button>
        </div>
      </AuthorizedView>

      <div
        style={{
          fontFamily: "Arial, sans-serif",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Menu + Add task row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 10,
          }}
        >
          {/* Hamburger menu */}
          <div style={{ position: "relative", margin: 10 }}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ fontSize: 24, cursor: "pointer" }}
            >
              &#9776;
            </button>
            {isMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "35px",
                  left: 0,
                  background: "#eee",
                  padding: 10,
                  borderRadius: 4,
                  width: 270,
                  zIndex: 1000,
                }}
              >
                <h3>Column Customization</h3>
                {colIds.map((colId) => (
                  <div
                    key={colId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span>{columns[colId].title}</span>
                    <div>
                      <button
                        onClick={() => toggleColumnVisibility(colId)}
                        style={{ marginRight: 6 }}
                      >
                        {columns[colId].visible ? "Hide" : "Show"}
                      </button>
                      <button
                        onClick={() => deleteColumn(colId)}
                        style={{ color: "red" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 10 }}>
                  <input
                    type="text"
                    placeholder="New column title"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    style={{ width: "100%", marginBottom: 6, padding: 4 }}
                  />
                  <button
                    onClick={addColumn}
                    style={{
                      width: "100%",
                      backgroundColor: "#007bff",
                      color: "#fff",
                      padding: 6,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Add Column
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add new task */}
          <div
            style={{
              padding: 10,
              display: "flex",
              gap: 10,
              alignItems: "center",
              flex: 1,
            }}
          >
            <input
              type="text"
              placeholder="New task content"
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
              style={{ flex: 1, padding: 6 }}
            />
            <select
              value={selectedColumnToAdd}
              onChange={(e) => setSelectedColumnToAdd(e.target.value)}
              style={{ padding: 6 }}
            >
              {colIds
                .filter((id) => columns[id].visible)
                .map((colId) => (
                  <option key={colId} value={colId}>
                    {columns[colId].title}
                  </option>
                ))}
            </select>
            <button
              onClick={addTask}
              style={{
                padding: "6px 12px",
                backgroundColor: "#772c32ff",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Board */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: 10,
            overflowX: "auto",
            flexGrow: 1,
          }}
        >
          {colIds.map((colId) => {
            const col = columns[colId];
            if (!col.visible) return null;

            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: "#515255ff",
                  padding: 10,
                  width: 270,
                  minHeight: 400,
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h4>{col.title}</h4>
                {col.taskIds.map((taskId) => {
                  const task = tasks[taskId];
                  if (!task) return null;

                  return (
                    <div
                      key={task.id}
                      style={{
                        padding: 10,
                        marginBottom: 8,
                        minHeight: 50,
                        backgroundColor: "#161d22ff",
                        color: "white",
                        borderRadius: 4,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        onClick={() => openEditModal(task)}
                        style={{ flexGrow: 1 }}
                      >
                        {task.content}
                      </div>
                      <div>
                        <button
                          onClick={() => removeTask(task.id)}
                          style={{
                            marginRight: 8,
                            backgroundColor: "transparent",
                            border: "none",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                          aria-label={`Remove task ${task.content}`}
                        >
                          &times;
                        </button>
                        <button
                          onClick={() => moveTask(task.id, -1)}
                          disabled={colIds.indexOf(colId) === 0}
                          aria-label="Move task left"
                        >
                          ◄
                        </button>
                        <button
                          onClick={() => moveTask(task.id, 1)}
                          disabled={
                            colIds.indexOf(colId) === colIds.length - 1
                          }
                          aria-label="Move task right"
                        >
                          ►
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Edit modal */}
        {editingTask && (
          <TaskEditModal
            task={editingTask}
            onSave={saveTaskChanges}
            onClose={closeEditModal}
          />
        )}
      </div>

      {response && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#333",
            borderRadius: "5px",
          }}
        >
          <h4>{response.name} Response:</h4>
          <pre style={{ textAlign: "left" }}>
            {JSON.stringify(response.data || response.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
