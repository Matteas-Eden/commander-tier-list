import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  rectIntersection,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import TierRow from "./TierRow";
import { compressToHash, decompressFromHash } from "../utils/hash";

const TIERS = [
  { id: "S", name: "S", color: "bg-red-500" },
  { id: "A", name: "A", color: "bg-orange-400" },
  { id: "B", name: "B", color: "bg-yellow-400" },
  { id: "C", name: "C", color: "bg-green-500" },
];

export default function TierListApp({ initialCommanders }) {
  const [items, setItems] = useState({
    S: [],
    A: [],
    B: [],
    C: [],
    unranked: initialCommanders.map((c) => c.id),
  });
  const [activeId, setActiveId] = useState(null);

  // Helper to find which container an item is in
  const findContainer = (id) => {
    if (id in items) return id;
    return Object.keys(items).find((key) => items[key].includes(id));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevents accidental drags when clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragOver(event) {
    const { active, over } = event;
    const overId = over?.id;

    // 1. If we aren't hovering over anything, or we're hovering over the same item, do nothing
    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(overId);

    // 2. Safety check: If we can't determine the containers, exit to prevent crashing
    if (!activeContainer || !overContainer) return;

    // 3. Only run this logic if we are moving from one tier/pool to a DIFFERENT one
    if (activeContainer !== overContainer) {
      setItems((prev) => {
        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];

        // Find the indexes for the items
        const activeIndex = activeItems.indexOf(active.id);
        const overIndex = overItems.indexOf(overId);

        let newIndex;
        if (overId in prev) {
          // We're hovering over the container background itself
          newIndex = overItems.length + 1;
        } else {
          // We're hovering over a specific card in another container
          const isBelowLastItem = over && activeIndex > overIndex;
          const modifier = isBelowLastItem ? 1 : 0;
          newIndex =
            overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
        }

        return {
          ...prev,
          // Remove from the old container
          [activeContainer]: [
            ...prev[activeContainer].filter((item) => item !== active.id),
          ],
          // Add to the new container at the calculated position
          [overContainer]: [
            ...prev[overContainer].slice(0, newIndex),
            items[activeContainer][activeIndex],
            ...prev[overContainer].slice(newIndex),
          ],
        };
      });
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over?.id);

    if (activeContainer && overContainer && active.id !== over.id) {
      setItems((prev) => ({
        ...prev,
        [overContainer]: arrayMove(
          prev[overContainer],
          prev[overContainer].indexOf(active.id),
          prev[overContainer].indexOf(over.id),
        ),
      }));
    }
    setActiveId(null);
  }

  const collisionDetectionStrategy = (args) => {
    // 1. Try rectIntersection first (very stable for rows)
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) return rectCollisions;

    // 2. Fallback to closestCenter if no direct intersection
    return closestCenter(args);
  };

  // Load state from URL on mount
  useEffect(() => {
    const loadUrlState = async () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;

      try {
        const savedState = await decompressFromHash(hash);

        // Safety check: ensure shared cards still exist in current config
        const validIds = initialCommanders.map((c) => c.id);
        const newState = { ...savedState };

        // Filter out any IDs that no longer exist in our data
        Object.keys(newState).forEach((tier) => {
          newState[tier] = newState[tier].filter((id) => validIds.includes(id));
        });

        // Add any NEW commanders from config that weren't in the shared link
        const currentIdsInState = Object.values(newState).flat();
        const missingIds = validIds.filter(
          (id) => !currentIdsInState.includes(id),
        );
        newState.unranked = [...newState.unranked, ...missingIds];

        setItems(newState);
      } catch (err) {
        console.error("URL State is invalid or corrupted", err);
      }
    };

    loadUrlState();
  }, [initialCommanders]);

  const handleShare = async () => {
    try {
      const hash = await compressToHash(items);
      window.location.hash = hash;

      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied! Share this URL to show your rankings.");
    } catch (err) {
      alert("Failed to generate share link.");
    }
  };

  const activeCard = initialCommanders.find((c) => c.id === activeId);

  return (
    <div className="flex flex-col gap-4 justify-center">
      <button
        onClick={handleShare}
        className="bg-indigo-600 hover:bg-indigo-500 text-white m-auto px-6 py-2 rounded-lg font-bold transition-all active:scale-95"
      >
        Save and Share
      </button>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            {TIERS.map((tier) => (
              <TierRow
                key={tier.id}
                id={tier.id}
                label={tier.name}
                color={tier.color}
                items={items[tier.id]}
                allCards={initialCommanders}
              />
            ))}
          </div>

          <div className="bg-slate-800 rounded-lg">
            <TierRow
              id="unranked"
              items={items.unranked}
              allCards={initialCommanders}
              isPool
            />
          </div>
        </div>

        <DragOverlay>
          {activeId && activeCard ? (
            <img
              src={activeCard?.image}
              className="w-20 rounded shadow-2xl"
              alt=""
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
