import React, { useState, useEffect } from "react";
import { authService, taskService, projectService } from "../services/api";
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

  //TODO project id from projects page
  const { user, logout } = useAuth();
  const [response, setResponse] = useState(null);

  const [tasks, setTasks] = useState({});
    const [columns, setColumns] = useState({});

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [selectedColumnToAdd, setSelectedColumnToAdd] = useState("col-1");
  const [newColumnTitle, setNewColumnTitle] = useState("");
    const [editingTask, setEditingTask] = useState(null);
    const [project, setProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const projectId = activeProjectId;
    const [newProjectName, setNewProjectName] = useState("");
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [inviteUsername, setInviteUsername] = useState("");


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
        if (!activeProjectId) return;

        loadProject(activeProjectId);
        loadTasks(activeProjectId);
    }, [activeProjectId]);

    useEffect(() => {
        if (!project) return;

        // Reset column-dependent UI state
        setSelectedColumnToAdd("col-0");
        setIsMenuOpen(false);
        setEditingTask(null);

    }, [project]);



    useEffect(() => {
        const loadProjects = async () => {
            try {
                const data = await projectService.getAll();
                setProjects(data);

                if (data.length > 0) {
                    setActiveProjectId(data[0].id); // key line
                }
            } catch (err) {
                console.error("Failed to load projects:", err);
            }
        };

        loadProjects();
    }, []);


    const buildColumns = (project, tasks) => {
        const columns = {};

        project.columnNames.forEach((name, index) => {
            columns[`col-${index}`] = {
                id: `col-${index}`,
                title: name,
                taskIds: [],
                visible: true,
            };
        });

        Object.values(tasks).forEach(task => {
            const colKey = `col-${task.columnIndex}`;
            if (columns[colKey]) {
                columns[colKey].taskIds.push(task.id);
            }
        });

        return columns;
    };



    const loadProject = async () => {
        try {
            const data = await projectService.getOneProject(activeProjectId);
            setProject(data);
        } catch (error) {
            console.error("Failed to load project:", error);
        }
    };



    const loadTasks = async (projectId) => {
        try {
            const data = await projectService.getOneProject(projectId);

            const taskMap = {};
            data.tasks.forEach(task => {
                taskMap[task.id] = {
                    id: task.id,
                    content: task.projectName,
                    columnIndex: task.columnIndex,
                };
            });

            setTasks(taskMap);
            setColumns(buildColumns(data, taskMap));

        } catch (err) {
            console.error("Failed to load tasks:", err);
        }

        console.log("Loading finished");
    };

    const createProject = async () => {
        if (!newProjectName.trim()) {
            alert("Project name is required");
            return;
        }

        try {
            setIsCreatingProject(true);

            const created = await projectService.createProject({
                name: newProjectName,
                columnNames: ["To Do", "In Progress", "Done"],
            });

            // Reload projects
            const updatedProjects = await projectService.getAll();
            setProjects(updatedProjects);

            // Select the newly created project
            setActiveProjectId(created.id);

            setNewProjectName("");
        } catch (err) {
            console.error("Failed to create project:", err);
            alert("Failed to create project");
        } finally {
            setIsCreatingProject(false);
        }
    };

    const leaveProject = async () => {
        if (!activeProjectId) return;

        const confirmed = window.confirm(
            "Are you sure you want to leave this project?"
        );
        if (!confirmed) return;

        try {
            await projectService.leaveProject(activeProjectId);

            // Reload projects
            const updated = await projectService.getAll();
            setProjects(updated);

            // Select another project or clear selection
            if (updated.length > 0) {
                setActiveProjectId(updated[0].id);
            } else {
                setActiveProjectId(null);
                setProject(null);
                setTasks({});
            }
        } catch (err) {
            console.error("Failed to leave project:", err);
            alert("Failed to leave project");
        }
    };


  // Add task
  const addTask = async () => {
  if (!newTaskContent.trim()) return;
  try {
      const newTask = {
          projectId,
          projectName: newTaskContent,
      };


    // Wait for full response with id
    const createdTask = await taskService.createTask(newTask);
      // now persist column index
      await taskService.updateTask(createdTask.id, {
          id: createdTask.id,
          projectId,
          projectName: createdTask.projectName,
          columnIndex: Object.keys(columns).indexOf(selectedColumnToAdd),
      });
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
              content: createdTask.projectName,
              description: "",
              columnIndex: parseInt(selectedColumnToAdd.replace("col-", "")) - 1,
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
      console.log("Selected column:", selectedColumnToAdd);
      console.log("Created task columnIndex:", createdTask.columnIndex);

      await loadProject();
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
        await loadProject();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Move task left or right between columns, and persist ColumnIndex
    const moveTask = async (taskId, direction) => {
        const colIds = Object.keys(columns);

        const currentColId = colIds.find((colId) =>
            columns[colId].taskIds.includes(taskId)
        );

        const idx = colIds.indexOf(currentColId);
        const newIdx = idx + direction;

        if (newIdx < 0 || newIdx >= colIds.length) return;

        const newColId = colIds[newIdx];

        setColumns((prev) => ({
            ...prev,
            [currentColId]: {
                ...prev[currentColId],
                taskIds: prev[currentColId].taskIds.filter((id) => id !== taskId),
            },
            [newColId]: {
                ...prev[newColId],
                taskIds: [...prev[newColId].taskIds, taskId],
            },
        }));

        setTasks((prev) => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                columnIndex: newIdx,
            },
        }));

        try {
            await taskService.updateTask(taskId, {
                projectName: tasks[taskId].content,
                projectId,
                description: tasks[taskId].description,
                columnIndex: newIdx,
            });

            await loadProject();
        } catch (err) {
            console.error("Failed to move task:", err);
        }
    };


  // Edit task handlers
  const openEditModal = (task) => setEditingTask(task);
  const closeEditModal = () => setEditingTask(null);

  const saveTaskChanges = async (updatedTask) => {
    try {
      const taskData = {
        ProjectName: updatedTask.content,
        projectId: projectId,
        description: updatedTask.description,
          columnIndex: updatedTask.columnIndex ?? 0,
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

    const addColumn = async () => {
        if (!newColumnTitle.trim()) return;

        try {
            await projectService.addColumn(activeProjectId, newColumnTitle);

            // Reload canonical project + tasks
            await loadTasks(activeProjectId);

            setNewColumnTitle("");
        } catch (err) {
            console.error("Failed to add column:", err);
        }
        console.log("column ran?");
    };


  const colIds = Object.keys(columns);

  return (
      <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select
                  value={activeProjectId ?? ""}
                  onChange={(e) => setActiveProjectId(e.target.value)}
                  disabled={projects.length === 0}
              >
                  {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                          {p.name}
                      </option>
                  ))}
              </select>
              <button
                  onClick={leaveProject}
                  disabled={!activeProjectId}
                  style={{ backgroundColor: "#d9534f", color: "white" }}
              >
                  Leave Project
              </button>


              <input
                  type="text"
                  placeholder="New project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
              />

              <button
                  onClick={createProject}
                  disabled={isCreatingProject}
              >
                  Create Project
              </button>
          </div>

          <div style={{ marginTop: "10px" }}>
              <input
                  type="text"
                  placeholder="Invite username"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  style={{ marginRight: "8px" }}
              />
              <button
                  onClick={async () => {
                      if (!inviteUsername.trim()) return;

                      try {
                          await projectService.inviteUser(activeProjectId, inviteUsername);
                          await loadProject(); // refresh users
                          setInviteUsername("");
                      } catch (err) {
                          alert(err.message);
                      }
                  }}
              >
                  Invite
              </button>
          </div>

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

              <div style={{ marginBottom: "10px" }}>
                  <label>
                      Project:&nbsp;
                      <select
                          value={activeProjectId ?? ""}
                          onChange={(e) => setActiveProjectId(e.target.value)}
                          disabled={projects.length === 0}
                      >
                          {projects.map(p => (
                              <option key={p.id} value={p.id}>
                                  {p.name}
                              </option>
                          ))}
                      </select>
                  </label>
              </div>

        <div>
                  <h1>Dashboard</h1>

                  {project && (
                      <div style={{ marginBottom: "10px" }}>
                          <strong>{project.name}</strong>
                          <div>Completion: {project.completetion}%</div>

                          <div
                              style={{
                                  width: "100%",
                                  height: "10px",
                                  backgroundColor: "#ccc",
                                  borderRadius: "5px",
                                  overflow: "hidden",
                                  marginTop: "4px"
                              }}
                          >
                              <div
                                  style={{
                                      width: `${project.completetion}%`,
                                      height: "100%",
                                      backgroundColor: "#4caf50"
                                  }}
                              />
                          </div>
                      </div>
                  )}
                  {project && (
                      <div
                          style={{
                              marginTop: "10px",
                              padding: "10px",
                              border: "1px solid #444",
                              borderRadius: "4px",
                              maxWidth: "300px",
                          }}
                      >
                          <h4 style={{ marginBottom: "6px" }}>Project members</h4>

                          {project.users.length === 0 ? (
                              <p style={{ fontStyle: "italic" }}>No members</p>
                          ) : (
                              <ul style={{ paddingLeft: "18px", margin: 0 }}>
                                  {project.users.map((username) => (
                                      <li key={username}>{username}</li>
                                  ))}
                              </ul>
                          )}
                      </div>
                  )}

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

          {/* <AuthorizedView>
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
      </AuthorizedView> */}

      <br />

          {/*<AuthorizedView roles={["Admin"]}>
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
          </AuthorizedView>  */}
          
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
                      <button hidden={true}
                          onClick={async () => {
                              try {
                                  const result = await taskService.ping();
                                  console.log("Ping result:", result);
                                  alert(result);
                              } catch (err) {
                                  console.error(err);
                                  alert("Ping failed");
                              }
                          }}
                          style={{
                              padding: "6px 12px",
                              backgroundColor: "#772c32ff",
                              color: "white",
                              border: "none",
                              cursor: "pointer",
                          }}
                      >
                          Ping
                      </button>
                      <button hidden={true}
                          onClick={async () => {
                              try {
                                  const result = await taskService.createTaskRaw();

                                  console.log("CreateTask result:", result);
                                  alert("Task created! Check console.");
                              } catch (err) {
                                  console.error("CreateTask failed:", err);
                                  alert("Create task failed");
                              }
                          }}
                      >
                          Create Task (raw)
                      </button>
                      <button hidden={true}
                          onClick={async () => {
                              try {
                                  const result = await taskService.createTask({
                                      projectId: activeProjectId,
                                      projectName: "Create payload test"
                                  }
                                  );

                                  console.log("Post result:", result);
                                  alert("Post created! Check console.");
                              } catch (err) {
                                  console.error("Post failed:", err);
                                  alert("Post task failed");
                              }
                              


                          }}
                      >
                          Post test
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
