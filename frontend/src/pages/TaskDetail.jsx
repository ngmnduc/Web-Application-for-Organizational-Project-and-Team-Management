
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getTaskById } from "../services/taskService";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Data có thể được truyền qua navigate state
  const taskFromState = location.state?.task || null;

  const [task, setTask] = useState(taskFromState);
  const [isLoading, setIsLoading] = useState(!taskFromState);
  const [error, setError] = useState(null);

  const currentUserRole = "Super Admin";
  const canManage = ["Manager", "Admin", "Super Admin"].includes(currentUserRole);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await getTaskById(taskId);
        // merge data từ server vào state (nếu có local)
        setTask(prev => ({ ...prev, ...data }));
      } catch (err) {
        setError("Failed to load task detail");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  if (isLoading && !task) {
    return <div className="p-8 text-sm text-gray-500">Loading task details...</div>;
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">{error}</div>;
  }

  if (!task) {
    return <div className="p-8 text-sm text-gray-500">Task not found.</div>;
  }

  const subtasks = task.subtasks || [];
  const attachments = task.attachments || [];
  const comments = task.comments || [];

  const displayPriority =
    typeof task.priority === "string"
      ? task.priority[0].toUpperCase() + task.priority.slice(1).toLowerCase()
      : task.priority;

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      
      {/* Back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to tasks
        </button>

        {canManage && (
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            + Create Sub-task
          </button>
        )}
      </div>

      {/* HEADER */}
      <div className="bg-white rounded-2xl border p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{task.title}</h1>
            <p className="text-sm text-gray-500">Task ID: {task._id || task.id}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Priority:</span>
            <span
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                ${
                  displayPriority === "High"
                    ? "bg-red-100 text-red-700"
                    : displayPriority === "Low"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }
              `}
            >
              {displayPriority}
            </span>
          </div>
        </div>
      </div>

      {/* GRID 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Description, Subtasks, Comments */}
        <div className="lg:col-span-2 space-y-6">

          {/* Description */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="flex justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Description</h2>
              {canManage && <button className="text-xs text-blue-600">Edit</button>}
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {task.description || "No description yet."}
            </p>
          </div>

          {/* Subtasks */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="flex justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Sub-tasks</h2>
              {canManage && (
                <button className="text-xs text-blue-600 hover:underline">
                  + Add Subtask
                </button>
              )}
            </div>

            {subtasks.length === 0 ? (
              <p className="text-sm text-gray-400">No subtasks yet.</p>
            ) : (
              <ul className="space-y-3">
                {subtasks.map((st) => (
                  <li key={st.id || st._id} className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={st.done} readOnly />
                      <span className="text-sm">{st.title}</span>
                    </div>
                    {canManage && <button className="text-xs text-red-500">Delete</button>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Comments ({comments.length})
            </h2>

            {/* Add comment */}
            <div className="mb-4">
              <textarea
                rows={3}
                className="w-full border rounded-xl px-3 py-2 text-sm"
                placeholder="Add a comment..."
              />
              <div className="mt-2 flex justify-end">
                <button className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs">
                  Comment
                </button>
              </div>
            </div>

            {comments.length === 0 ? (
              <p className="text-xs text-gray-400">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id || c._id} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gray-200 text-[10px] flex items-center justify-center">
                        {c.authorInitials || "??"}
                      </div>
                      <span className="font-medium">{c.authorName}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{c.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT: Properties + Attachments */}
        <div className="space-y-6">

          {/* Properties */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-4">Task Properties</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Assignee</span>
                <span>{task.assigneeName || "Unassigned"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span>{task.status}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Due date</span>
                <span>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "No due date"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Labels</span>
                <span>{(task.labels || []).join(", ") || "—"}</span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="flex justify-between mb-4">
              <h2 className="text-sm font-semibold">Attachments</h2>
              {canManage && <button className="text-xs text-blue-600">+ Add Link</button>}
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-gray-400">
                No attachments yet.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {attachments.map((a) => (
                  <li key={a.id || a._id} className="flex justify-between">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {a.title || a.url}
                    </a>
                    {canManage && (
                      <button className="text-xs text-red-500">
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskDetail;
