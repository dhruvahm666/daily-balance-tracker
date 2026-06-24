import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import {
  CATEGORIES,
  CATEGORY_COLORS,
  RECOMMENDED,
  TIMES_OF_DAY,
  formatDuration,
  todayKey,
  type Category,
  type TimeOfDay,
} from "@/lib/activities/types";
import { useActivities } from "@/lib/activities/store";
import {
  generateSuggestions,
  totalsByCategory,
} from "@/lib/activities/suggestions";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Rhythm" },
      { name: "description", content: "Log and review today's activities." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { items, add, update, remove, ready } = useActivities();
  const today = todayKey();
  const todayItems = useMemo(
    () => items.filter((i) => i.date === today),
    [items, today],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Today
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AddActivityForm onAdd={add} />
          <ActivityList
            items={todayItems}
            onUpdate={update}
            onRemove={remove}
            loading={!ready}
          />
        </div>

        <div className="space-y-6">
          <StatsCard items={todayItems} />
          <SuggestionsCard items={todayItems} />
        </div>
      </div>
    </div>
  );
}

function AddActivityForm({
  onAdd,
}: {
  onAdd: ReturnType<typeof useActivities>["add"];
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Work");
  const [duration, setDuration] = useState("30");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("Morning");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const d = Number(duration);
    if (!name.trim() || !d || d <= 0) {
      toast.error("Add a name and a valid duration.");
      return;
    }
    onAdd({
      name: name.trim(),
      category,
      duration: d,
      timeOfDay,
      date: todayKey(),
    });
    setName("");
    setDuration("30");
    toast.success("Activity logged");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Log an activity</CardTitle>
        <CardDescription>Quickly add what you've just done.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-6">
          <div className="md:col-span-3">
            <Label htmlFor="name">Activity</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deep work on report"
              className="mt-1.5"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
            >
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: CATEGORY_COLORS[c] }}
                      />
                      {c}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dur">Duration</Label>
            <Input
              id="dur"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Time of day</Label>
            <Select
              value={timeOfDay}
              onValueChange={(v) => setTimeOfDay(v as TimeOfDay)}
            >
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMES_OF_DAY.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4 flex items-end">
            <Button type="submit" className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add activity
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ActivityList({
  items,
  onUpdate,
  onRemove,
  loading,
}: {
  items: ReturnType<typeof useActivities>["items"];
  onUpdate: ReturnType<typeof useActivities>["update"];
  onRemove: ReturnType<typeof useActivities>["remove"];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today's log</CardTitle>
        <CardDescription>
          {items.length} {items.length === 1 ? "activity" : "activities"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            Nothing logged yet. Add your first activity above.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((it) => (
              <ActivityRow
                key={it.id}
                item={it}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: ReturnType<typeof useActivities>["items"][number];
  onUpdate: ReturnType<typeof useActivities>["update"];
  onRemove: ReturnType<typeof useActivities>["remove"];
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<Category>(item.category);
  const [duration, setDuration] = useState(String(item.duration));
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(item.timeOfDay);

  function save() {
    const d = Number(duration);
    if (!name.trim() || !d) return;
    onUpdate(item.id, { name: name.trim(), category, duration: d, timeOfDay });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="grid gap-2 py-3 md:grid-cols-12 md:items-center">
        <Input
          className="md:col-span-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
          <SelectTrigger className="md:col-span-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="md:col-span-2"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as TimeOfDay)}>
          <SelectTrigger className="md:col-span-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMES_OF_DAY.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-1 md:col-span-1">
          <Button size="icon" variant="ghost" onClick={save} aria-label="Save">
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(false)}
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className="h-9 w-1.5 shrink-0 rounded-full"
        style={{ background: CATEGORY_COLORS[item.category] }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{item.name}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="font-normal">
            {item.category}
          </Badge>
          <span>{item.timeOfDay}</span>
          <span>·</span>
          <span>{formatDuration(item.duration)}</span>
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setEditing(true)}
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          onRemove(item.id);
          toast.success("Activity removed");
        }}
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

function StatsCard({
  items,
}: {
  items: ReturnType<typeof useActivities>["items"];
}) {
  const totals = totalsByCategory(items);
  const data = CATEGORIES.map((c) => ({
    name: c,
    value: totals[c],
    color: CATEGORY_COLORS[c],
  })).filter((d) => d.value > 0);
  const totalMin = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today's breakdown</CardTitle>
        <CardDescription>
          {totalMin > 0
            ? `${formatDuration(totalMin)} logged`
            : "Add activities to see your stats."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-44">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatDuration(v)}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
              No data yet
            </div>
          )}
        </div>
        <div className="space-y-3">
          {CATEGORIES.map((c) => {
            const cur = totals[c];
            const rec = RECOMMENDED[c];
            const pct = Math.min(100, Math.round((cur / rec) * 100));
            return (
              <div key={c}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: CATEGORY_COLORS[c] }}
                    />
                    <span className="font-medium">{c}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {formatDuration(cur)} / {formatDuration(rec)}
                  </span>
                </div>
                <Progress
                  value={pct}
                  className="h-1.5"
                  style={
                    {
                      // tint the progress indicator via inline style on the bar
                    } as React.CSSProperties
                  }
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestionsCard({
  items,
}: {
  items: ReturnType<typeof useActivities>["items"];
}) {
  const suggestions = useMemo(() => generateSuggestions(items), [items]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Smart suggestions</CardTitle>
        <CardDescription>Personalized nudges for a balanced day.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="rounded-lg border bg-accent/40 p-3 text-sm leading-snug"
            >
              {s}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
