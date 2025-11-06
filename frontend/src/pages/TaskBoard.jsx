import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const LS_KEY = "kanban_v1";

const INITIAL = {
  columnOrder: ["todo", "doing", "done"],
  columns: {
    todo: { id: "todo", title: "Todo", taskIds: ["t1", "t2", "t3"] },
    doing: { id: "doing", title: "In Progress", taskIds: ["t4"] },
    done: { id: "done", title: "Done", taskIds: [] },
  },
  tasks: {
    t1: { id: "t1", title: "Design Kanban card UI", label: "Medium", due: "Dec 15", asg: "SC" },
    t2: { id: "t2", title: "Implement drag & drop", label: "High",   due: "Dec 16", asg: "JD" },
    t3: { id: "t3", title: "Create TaskDetail route", label: "Low",    due: "Dec 18", asg: "LW" },
    t4: { id: "t4", title: "Refactor board state",    label: "Medium", due: "Dec 19", asg: "MK" },
  },
};

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
    {children}
  </span>
);

const TaskCard = ({ task, index }) => (
  <Draggable draggableId={task.id} index={index}>
    {(p, s) => (
      <div
        ref={p.innerRef}
        {...p.draggableProps}
        {...p.dragHandleProps}
        className={`rounded-2xl border bg-white p-3 shadow-sm transition hover:shadow ${
          s.isDragging ? "rotate-1 shadow-lg" : ""
        }`}
      >
        <div className="font-medium leading-snug">{task.title}</div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <Pill>{task.label}</Pill>
          <span>•</span>
          <span>{task.due}</span>
          <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[11px]">
            {task.asg}
          </span>
        </div>
      </div>
    )}
  </Draggable>
);

const Column = ({ column, tasks }) => (
  <div className="flex min-h-[560px] flex-col rounded-2xl border bg-gray-50 overflow-hidden">
    {/* header cột */}
    <div className="flex items-center justify-between border-b px-4 py-3 bg-gray-50">
      <h3 className="font-semibold">{column.title}</h3>
      <span className="text-xs text-gray-500">{tasks.length}</span>
    </div>

    {/* vùng thả */}
    <Droppable droppableId={column.id} type="TASK">
      {(p, s) => (
        <div
          ref={p.innerRef}
          {...p.droppableProps}
          className={`flex-1 space-y-3 overflow-auto px-3 py-3 ${
            s.isDraggingOver ? "bg-indigo-50/60" : ""
          }`}
        >
          {tasks.map((t, i) => (
            <TaskCard key={t.id} task={t} index={i} />
          ))}
          {p.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

export default function TaskBoard() {
  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || INITIAL;
    } catch {
      return INITIAL;
    }
  });

  // lưu lại mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, [data]);

  const onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const start = data.columns[source.droppableId];
    const end = data.columns[destination.droppableId];

    // cùng cột → reorder
    if (start.id === end.id) {
      const ids = [...start.taskIds];
      ids.splice(source.index, 1);
      ids.splice(destination.index, 0, draggableId);
      setData((d) => ({
        ...d,
        columns: { ...d.columns, [start.id]: { ...start, taskIds: ids } },
      }));
      return;
    }

    // khác cột → move
    const startIds = [...start.taskIds];
    startIds.splice(source.index, 1);
    const endIds = [...end.taskIds];
    endIds.splice(destination.index, 0, draggableId);

    setData((d) => ({
      ...d,
      columns: {
        ...d.columns,
        [start.id]: { ...start, taskIds: startIds },
        [end.id]: { ...end, taskIds: endIds },
      },
    }));
  };

  return (
    // thanh tieu de page va nut them task
    <div className="mx-auto max-w-[1200px] p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Kanban Board</h1>
          <p className="text-sm text-gray-500">
            Drag & drop để đổi trạng thái (local state).
          </p>
        </div>
        <button
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => {
            const id = `t${Date.now()}`;
            setData((d) => ({
              ...d,
              tasks: {
                ...d.tasks,
                [id]: { id, title: "New task", label: "Low", due: "Dec 20", asg: "AR" },
              },
              columns: {
                ...d.columns,
                todo: { ...d.columns.todo, taskIds: [id, ...d.columns.todo.taskIds] },
              },
            }));
          }}
        >
          + New Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-3">
          {data.columnOrder.map((cid) => {
            const col = data.columns[cid];
            const tasks = col.taskIds.map((tid) => data.tasks[tid]);
            return <Column key={cid} column={col} tasks={tasks} />;
          })}
        </div>
      </DragDropContext>
    </div>
  );
}