"use client";

// npx shadcn-ui@latest add checkbox
// npm  i react-use-measure
import { ReactNode, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  Reorder,
  motion,
  useDragControls,
} from "framer-motion";
import useMeasure from "react-use-measure";

import { cn } from "@/lib/utils";
import { ISequence } from "@/lib/types";

export type Item = {
  order: number;
  text: string;
  checked: boolean;
  id: number;
  description: string;
};

interface SortableListItemProps<T> {
  item: T;
  order: number;
  disabled: boolean;
  renderExtra?: (item: T) => React.ReactNode;
  isExpanded?: boolean;
  className?: string;
  handleDrag: () => void;
}

function SortableListItem({
  item,
  renderExtra,
  handleDrag,
  className,
  disabled,
}: SortableListItemProps<ISequence & { order: number }>) {
  let [ref, bounds] = useMeasure();
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggable] = useState(true);
  const dragControls = useDragControls();

  const handleDragStart = (event: any) => {
    setIsDragging(true);
    dragControls.start(event, { snapToCursor: true });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    handleDrag();
  };

  if (disabled) {
    return (
      <motion.div
        className={cn("", className)}
        key={item.id}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          height: bounds.height > 0 ? bounds.height : undefined,
          transition: {
            type: "spring",
            bounce: 0,
            duration: 0.4,
          },
        }}
        exit={{
          opacity: 0,
          transition: {
            duration: 0.05,
            type: "spring",
            bounce: 0.1,
          },
        }}
        layout
        layoutId={`item-${item.id}`}
      >
        <motion.div layout="position">
          {/* List Item Children */}
          {renderExtra && renderExtra(item)}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className={cn("", className)} key={item.id}>
      <Reorder.Item
        value={item}
        className={cn(
          "relative",
          "rounded-md cursor-grab",
          !isDragging ? "w-7/10" : "w-full",
        )}
        key={item.id}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          height: bounds.height > 0 ? bounds.height : undefined,
          transition: {
            type: "spring",
            bounce: 0,
            duration: 0.4,
          },
        }}
        exit={{
          opacity: 0,
          transition: {
            duration: 0.05,
            type: "spring",
            bounce: 0.1,
          },
        }}
        layout
        layoutId={`item-${item.id}`}
        dragControls={dragControls}
        onDragEnd={handleDragEnd}
        style={{
          position: "relative",
          overflow: "hidden",
        }}
        whileDrag={{ zIndex: 9999 }}
      >
        <div ref={ref} className="">
          <motion.div layout="position">
            {/* List Item Children */}
            {renderExtra && renderExtra(item)}
          </motion.div>
        </div>
        <div
          onPointerDown={isDraggable ? handleDragStart : undefined}
          style={{ touchAction: "none" }}
        />
      </Reorder.Item>
    </motion.div>
  );
}

SortableListItem.displayName = "SortableListItem";

interface SortableListProps<T> {
  items: T[];
  disabled: boolean;
  onReorder: (newOrder: T[]) => void;
  renderItem: (item: T, disabled: boolean) => ReactNode;
}

function SortableList({
  items,
  disabled,
  renderItem,
  onReorder,
}: SortableListProps<ISequence>) {
  if (items && !disabled) {
    return (
      <LayoutGroup>
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={onReorder}
          className="flex flex-col space-y-4"
        >
          <AnimatePresence>
            {items?.map((item) => renderItem(item, disabled))}
          </AnimatePresence>
        </Reorder.Group>
      </LayoutGroup>
    );
  }
  if (items && disabled) {
    return (
      <LayoutGroup>
        <div className="flex flex-col space-y-4">
          <AnimatePresence>
            {items?.map((item) => renderItem(item, disabled))}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    );
  }
  return null;
}

SortableList.displayName = "SortableList";

export { SortableList, SortableListItem };
