import { Link } from "@tanstack/react-router";
import { ListPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyLists } from "@/hooks/useLists";

/** "Add to list" dropdown, shared by the single-issue (comic detail) and
 * bulk (volume detail) add flows — same list picker either way, only the
 * mutation and toast copy differ, so those stay with the caller via `onAdd`.
 * Viewer-role lists are excluded: collaborators there can see a list but
 * not add to it, enforced by RLS regardless, but no point offering an
 * action that'll just fail. */
export function AddToListMenu({
  issueIds,
  isPending,
  onAdd,
  addToListLabel,
  noListsYetLabel,
  size,
  newListLink,
}: {
  issueIds: string[];
  isPending: boolean;
  onAdd: (listId: string, listName: string) => void;
  addToListLabel: string;
  noListsYetLabel: string;
  size?: "sm" | "default";
  /** Trailing "+ New list" item — only the single-issue menu shows this. */
  newListLink?: { label: string };
}) {
  const lists = useMyLists();
  const addableLists = (lists.data ?? []).filter((l) => l.myRole !== "viewer");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} disabled={issueIds.length === 0 || isPending}>
          <ListPlus className="h-4 w-4" />{addToListLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        {addableLists.length === 0 ? (
          <DropdownMenuItem disabled>{noListsYetLabel}</DropdownMenuItem>
        ) : (
          addableLists.map((l) => (
            <DropdownMenuItem key={l.id} onClick={() => onAdd(l.id, l.name)}>
              {l.name}
            </DropdownMenuItem>
          ))
        )}
        {newListLink && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/lists"><Plus className="mr-2 h-4 w-4" />{newListLink.label}</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
