import { requireSession } from "@/lib/auth/session";
import { hasAtLeast } from "@/lib/auth/roles";
import { listProjectTasksForAssignee } from "@/lib/models/task";

import { MyTasksList } from "./_components/my-tasks-list";
import type { MyTaskItem } from "./_lib/types";

export default async function MyTasksPage() {
  const session = await requireSession();
  const userId = session.user.id;
  const canMarkDone = hasAtLeast(session.user.role, "manager");

  const projectTasks = await listProjectTasksForAssignee(userId);

  const items: MyTaskItem[] = projectTasks.map<MyTaskItem>((t) => {
    const isDone = t.status === "done";
    const isInReview = t.status === "in_review";
    // Member: "my part is done" once it's at least in_review.
    // Manager+: only fully done counts.
    const isMyComplete = canMarkDone ? isDone : isDone || isInReview;
    // Member loses the ability to toggle once a manager has marked it done.
    const canToggle = canMarkDone ? true : !isDone;
    return {
      id: t.id,
      parentId: t.projectId,
      parentName: t.projectName,
      parentHref: `/dashboard/projects/${t.projectId}/tasks`,
      title: t.title,
      description: t.description,
      isMyComplete,
      isInReview,
      canToggle,
      dueDate: t.dueDate,
      completedAt: isDone ? t.updatedAt : "",
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  });

  const openCount = items.filter((i) => !i.isMyComplete).length;
  const doneCount = items.length - openCount;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          My tasks
        </h1>
        <p className="text-sm text-muted-foreground">
          {items.length === 0
            ? "You don't have any tasks assigned to you right now."
            : `${openCount} open · ${doneCount} done.`}
        </p>
        {!canMarkDone ? (
          <p className="text-[11px] text-muted-foreground/80">
            Tip: checking off a project task submits it for review — a manager
            marks it done.
          </p>
        ) : null}
      </div>

      <MyTasksList items={items} />
    </div>
  );
}
