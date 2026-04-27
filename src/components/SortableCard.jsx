import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableCard({ id, card }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-20 aspect-3/4 overflow-hidden rounded hover:ring-2 ring-blue-500 transition-all"
    >
      <img
        src={card.image}
        alt={card.name}
        className="w-full h-full object-cover pointer-events-none"
      />
    </div>
  );
}
