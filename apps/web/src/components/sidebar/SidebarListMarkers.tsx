import { CollapsibleSectionHeader } from "../ui/collapsible-section-header";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArchiveIcon, CircleCheckIcon, Clock3Icon, PinIcon } from "lucide-react";
import { type ReactNode, useLayoutEffect } from "react";
import { cn } from "~/lib/utils";
import {
  animateSidebarLayoutChanges,
  sidebarMarkerId,
  type SidebarListMarker,
} from "../Sidebar.logic";
import { SIDEBAR_SORTABLE_DRAG_DISABLED } from "./SidebarThreadRow";

function SortableSidebarMarker(props: {
  marker: SidebarListMarker;
  className?: string;
  children?: ReactNode;
  revealOverflow?: boolean;
  "data-testid"?: string;
}) {
  const { node, setNodeRef, transform, transition } = useSortable({
    id: sidebarMarkerId(props.marker),
    disabled: SIDEBAR_SORTABLE_DRAG_DISABLED,
    animateLayoutChanges: animateSidebarLayoutChanges,
  });
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- keeps the projected drop box inside the scroll viewport as drag transforms move it
  useLayoutEffect(() => {
    if (props.revealOverflow && transform?.y !== undefined) {
      node.current?.firstElementChild?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [node, props.revealOverflow, transform?.y]);
  return (
    <li
      ref={setNodeRef}
      data-thread-selection-safe
      data-testid={props["data-testid"]}
      className={cn("list-none", props.className)}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: props.marker.endsWith("-placeholder") ? "none" : transition,
        visibility: transform?.scaleY === 0 ? "hidden" : undefined,
      }}
    >
      {props.children}
    </li>
  );
}

export function SidebarSectionPlaceholder(props: {
  marker: "active-placeholder" | "settled-placeholder";
  label: string;
  showHint: boolean;
  isDropTarget: boolean;
}) {
  return (
    <SortableSidebarMarker
      marker={props.marker}
      data-testid={`sidebar-${props.marker}`}
      className="relative mx-0.5 -mb-px h-0"
      // Revealing on every drag scrolls the list out from under the pointer.
      revealOverflow={
        props.marker === "settled-placeholder" && props.showHint && props.isDropTarget
      }
    >
      {props.showHint ? (
        <div
          className={cn(
            "absolute inset-x-0 top-0 flex h-9 items-center justify-center rounded-md border border-dashed border-sidebar-foreground/25 text-xs text-sidebar-foreground/80",
            props.isDropTarget && "border-primary/40 bg-primary/5 text-primary",
          )}
        >
          {props.label}
        </div>
      ) : null}
    </SortableSidebarMarker>
  );
}

function SidebarDragBoundaryLabel(props: { label: string; isDropTarget?: boolean | undefined }) {
  return (
    <div className="sidebar-drag-boundary-label absolute inset-x-2 top-1 flex h-4 items-center gap-2">
      <span
        className={cn(
          "shrink-0 text-xs font-medium",
          props.isDropTarget ? "text-primary" : "text-sidebar-foreground/80",
        )}
      >
        {props.label}
      </span>
      <span
        aria-hidden
        className={cn(
          "h-px flex-1",
          props.isDropTarget ? "bg-primary/50" : "bg-sidebar-foreground/25",
        )}
      />
    </div>
  );
}

export function SidebarRecentHeader({ label }: { readonly label: string }) {
  return (
    <SortableSidebarMarker
      marker="recent-header"
      data-testid="sidebar-recent-header"
      className="mx-0.5 flex h-8 items-center px-2 text-xs font-medium text-sidebar-muted-foreground"
    >
      {label}
    </SortableSidebarMarker>
  );
}

const stageHeaders = {
  "pinned-header": {
    id: "pinned",
    icon: PinIcon,
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  "pinned-divider": {
    id: "in-progress",
    icon: Clock3Icon,
    className: "bg-info/10 text-info-foreground",
  },
  "completed-header": {
    id: "completed",
    icon: CircleCheckIcon,
    className: "bg-warning/10 text-warning-foreground",
  },
  "settled-header": {
    id: "settled",
    icon: ArchiveIcon,
    className: "bg-sidebar-foreground/5 text-sidebar-muted-foreground",
  },
} as const;

export function SidebarSectionHeader(props: {
  marker: keyof typeof stageHeaders | "snoozed-header";
  label: string;
  count: number;
  className?: string;
  dragging?: boolean;
  boundary?: "drag" | "hidden" | undefined;
  isDropTarget?: boolean;
  toggle: { expanded: boolean; onToggle: () => void };
}) {
  const stage = props.marker === "snoozed-header" ? null : stageHeaders[props.marker];
  const shelf = stage?.id ?? "snoozed";
  const Icon = stage?.icon;
  if (props.boundary !== undefined) {
    return (
      <SortableSidebarMarker
        marker={props.marker}
        data-testid={`sidebar-${props.marker}`}
        className="pointer-events-none relative mx-0.5 -mb-px h-0"
      >
        {props.boundary === "drag" ? (
          <SidebarDragBoundaryLabel label={props.label} isDropTarget={props.isDropTarget} />
        ) : null}
      </SortableSidebarMarker>
    );
  }
  return (
    <SortableSidebarMarker
      marker={props.marker}
      data-testid={`sidebar-${props.marker}`}
      className={cn("relative mx-0.5 h-8 rounded-md", stage?.className, props.className)}
    >
      <CollapsibleSectionHeader
        data-sidebar-row={`shelf:${shelf}`}
        onClick={props.toggle.onToggle}
        expanded={props.toggle.expanded}
        tone={
          props.isDropTarget
            ? "accent"
            : props.dragging
              ? "emphasized"
              : stage
                ? "inherit"
                : "muted"
        }
        data-testid={`sidebar-${shelf}-shelf-toggle`}
        accessory={<span className="font-normal tabular-nums">{props.count}</span>}
      >
        <span className="flex items-center gap-1.5">
          {Icon ? <Icon aria-hidden className="size-3.5 shrink-0" /> : null}
          <span className="truncate">{props.label}</span>
        </span>
      </CollapsibleSectionHeader>
    </SortableSidebarMarker>
  );
}
