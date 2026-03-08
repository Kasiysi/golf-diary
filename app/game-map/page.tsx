"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { useEntries } from "@/lib/entries-context";
import { getAllConnections, addConnection } from "@/lib/entry-connections";
import { useEntryDetail } from "@/lib/entry-detail-context";
import type { DiaryEntry } from "@/lib/types";
import { Map, Link2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const COLUMN_X = { left: 80, center: 340, right: 600 };
const ROW_HEIGHT = 72;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;
const MASTERS_GREEN = "#006747";
const NODE_BORDER = {
  problem: "border-red-500",
  drill: "border-[var(--accent)]",
  "coach-advice": "border-[var(--accent)]",
  feel: "border-blue-500",
} as const;

function entryLabel(entry: DiaryEntry): string {
  const part1 = entry.instruction ?? (entry.entryType === "problem" && entry.problemNotes ? entry.problemNotes : entry.notes);
  const part2 = entry.entryType === "problem" && entry.cure ? entry.cure : "";
  const text = (part1 ?? part2) || "Untitled";
  return String(text).slice(0, 50);
}

/** Custom node: white, rounded, Montserrat; border by type (Problem=red, Drill/Coach=green, Feel=blue). */
function EntryNode({ data, selected }: NodeProps<{ entry: DiaryEntry; label: string }>) {
  const entryType = data.entry?.entryType ?? "feel";
  const borderClass = NODE_BORDER[entryType] ?? "border-[var(--border)]";
  return (
    <div
      className={cn(
        "font-sans rounded-xl border-2 shadow-sm px-3 py-2 text-sm text-[var(--foreground)]",
        "bg-white min-w-[180px] max-w-[220px]",
        borderClass,
        selected && "ring-2 ring-[var(--accent)]/40"
      )}
      style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
    >
      <p className="line-clamp-2 break-words">{data.label}</p>
    </div>
  );
}

const nodeTypes = { entry: EntryNode };

export default function GameMapPage() {
  const entries = useEntries();
  const openEntryDetail = useEntryDetail()?.openEntryDetail;
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [connectionVersion, setConnectionVersion] = useState(0);

  const { initialNodes, initialEdges } = useMemo(() => {
    const sortNewestFirst = (a: DiaryEntry, b: DiaryEntry) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    const problems = [...entries].filter((e) => e.entryType === "problem").sort(sortNewestFirst);
    const center = [...entries]
      .filter((e) => e.entryType === "drill" || e.entryType === "coach-advice")
      .sort(sortNewestFirst);
    const feels = [...entries].filter((e) => e.entryType === "feel").sort(sortNewestFirst);

    const nodes: Node<{ entry: DiaryEntry; label: string }>[] = [];
    let yLeft = 24,
      yCenter = 24,
      yRight = 24;

    problems.forEach((entry) => {
      nodes.push({
        id: entry.id,
        type: "entry",
        position: { x: COLUMN_X.left, y: yLeft },
        data: { entry, label: entryLabel(entry) },
      });
      yLeft += ROW_HEIGHT;
    });
    center.forEach((entry) => {
      nodes.push({
        id: entry.id,
        type: "entry",
        position: { x: COLUMN_X.center, y: yCenter },
        data: { entry, label: entryLabel(entry) },
      });
      yCenter += ROW_HEIGHT;
    });
    feels.forEach((entry) => {
      nodes.push({
        id: entry.id,
        type: "entry",
        position: { x: COLUMN_X.right, y: yRight },
        data: { entry, label: entryLabel(entry) },
      });
      yRight += ROW_HEIGHT;
    });

    const connections = getAllConnections();
    const edges: Edge[] = connections
      .filter((c) => entries.some((e) => e.id === c.entryId) && entries.some((e) => e.id === c.linkedEntryId))
      .map((c, i) => ({
        id: `e-${c.id}-${i}`,
        source: c.entryId,
        target: c.linkedEntryId,
        style: { stroke: MASTERS_GREEN, strokeWidth: 2 },
      }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [entries, connectionVersion]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<{ entry: DiaryEntry; label: string }>) => {
      if (connectionMode) {
        const id = node.id;
        if (!connectionSource) {
          setConnectionSource(id);
          return;
        }
        if (connectionSource === id) return;
        addConnection(connectionSource, id);
        setConnectionVersion((v) => v + 1);
        setConnectionSource(null);
        return;
      }
      const entry = node.data?.entry;
      if (entry && openEntryDetail) openEntryDetail(entry);
    },
    [connectionMode, connectionSource, openEntryDetail]
  );

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white shadow-sm shrink-0">
        <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Map className="h-5 w-5 text-[var(--accent)]" />
            <h1 className="font-heading text-xl font-semibold text-[var(--heading)]">
              Game Map
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {connectionMode && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {connectionSource ? "Valitse toinen merkintä" : "Valitse ensimmäinen merkintä"}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setConnectionMode((m) => !m);
                setConnectionSource(null);
              }}
              className={cn(
                "p-2 rounded-lg border transition-colors",
                connectionMode
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-white border-[var(--border)] hover:bg-[var(--muted)]"
              )}
              title={connectionMode ? "Sulje linkitystila" : "Luo linkitys"}
            >
              {connectionMode ? <X className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="px-4 pb-2 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <span>Problems</span>
          <span>Drills / Coach</span>
          <span>Feels</span>
        </div>
      </header>
      <div className="flex-1 w-full h-[calc(100vh-7rem)] min-h-[400px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          style={{ background: "var(--background)" }}
        >
          <Background color="var(--border)" gap={16} size={1} />
          <Controls className="!border-[var(--border)] !bg-white !shadow-[var(--shadow-sm)]" />
        </ReactFlow>
      </div>
    </div>
  );
}
