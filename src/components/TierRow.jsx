import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import SortableCard from "./SortableCard";

export default function TierRow({ id, label, color, items, allCards, isPool }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex items-stretch min-h-[125px]">
      {!isPool && (
        <div
          className={`${color} w-24 flex items-center justify-center text-2xl font-black text-ctp-slate`}
        >
          {label}
        </div>
      )}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 bg-ctp-crust flex flex-wrap gap-2"
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
