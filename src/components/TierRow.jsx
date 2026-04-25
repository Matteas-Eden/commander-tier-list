import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import SortableCard from "./SortableCard";

export default function TierRow({ id, label, color, items, allCards, isPool }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      className={`flex items-stretch min-h-[100px] ${isPool ? "" : "border-b border-slate-700"}`}
    >
      {!isPool && (
        <div
          className={`${color} w-24 flex items-center justify-center text-2xl font-black text-slate-900`}
        >
          {label}
        </div>
      )}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 bg-slate-900/50 flex flex-wrap gap-2"
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          {items.map((cardId) => (
            <SortableCard
              key={cardId}
              id={cardId}
              card={allCards.find((c) => c.id === cardId)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
