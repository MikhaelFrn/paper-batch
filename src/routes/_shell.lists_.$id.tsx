import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { X, ListChecks, Pencil, Trash2, Users, LogOut } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ComicCard } from "@/components/comic-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useList,
  useUpdateList,
  useDeleteList,
  useRemoveIssueFromList,
  useListMembers,
  useAddListMember,
  useRemoveListMember,
} from "@/hooks/useLists";
import { useSearchProfiles } from "@/hooks/useProfiles";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { issueToComic } from "@/lib/comic-adapters";
import type { ListMemberRole } from "@/lib/types";

export const Route = createFileRoute("/_shell/lists_/$id")({
  head: () => ({
    meta: [
      { title: "List · Comic Vault" },
      { name: "description", content: "A curated list of comics." },
    ],
  }),
  component: ListDetail,
});

/** Owner-only: search-by-username + role pick to add, remove any non-owner
 * member. Collaborators can add comics to the list but never remove them —
 * enforced by RLS, not just hidden here. */
function CollaboratorsDialog({
  listId,
  currentUserId,
}: {
  listId: string;
  currentUserId: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const members = useListMembers(listId);
  const searchResults = useSearchProfiles(debouncedQuery);
  const addMember = useAddListMember();
  const removeMember = useRemoveListMember();

  const memberIds = new Set((members.data ?? []).map((m) => m.user_id));
  const candidates = (searchResults.data ?? []).filter(
    (p) => p.id !== currentUserId && !memberIds.has(p.id),
  );

  const handleAdd = (userId: string, role: ListMemberRole) => {
    addMember.mutate(
      { listId, userId, role },
      {
        onSuccess: () => {
          toast.success("Collaborator added.");
          setQuery("");
        },
        onError: () => toast.error("Couldn't add that collaborator."),
      },
    );
  };

  const handleRemove = (userId: string) => {
    removeMember.mutate(
      { listId, userId },
      { onError: () => toast.error("Couldn't remove that collaborator.") },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Users className="h-4 w-4" />Collaborators</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collaborators</DialogTitle>
          <DialogDescription>Editors can add comics to this list. They can't remove anything — only you can.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Add by username</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search username…" />
            {candidates.length > 0 && (
              <div className="mt-2 space-y-2">
                {candidates.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                    <span className="truncate">{p.display_name ?? p.username}</span>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="outline" disabled={addMember.isPending} onClick={() => handleAdd(p.id, "viewer")}>Viewer</Button>
                      <Button size="sm" disabled={addMember.isPending} onClick={() => handleAdd(p.id, "editor")}>Editor</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Current members</Label>
            {(members.data ?? []).map((m) => (
              <div key={m.user_id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                <span className="truncate">
                  {m.profile?.display_name ?? m.profile?.username ?? "Unknown user"}
                  {m.user_id === currentUserId ? " (you)" : ""}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{m.role}</span>
                  {m.role !== "owner" && (
                    <button
                      type="button"
                      onClick={() => handleRemove(m.user_id)}
                      title="Remove collaborator"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ListDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const list = useList(id);
  const currentUser = useCurrentUser();
  const members = useListMembers(id);
  const updateList = useUpdateList();
  const deleteList = useDeleteList();
  const removeIssue = useRemoveIssueFromList();
  const leaveList = useRemoveListMember();

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  if (list.isLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!list.data) {
    return (
      <div className="py-20 text-center">
        <div className="font-display text-4xl">Not found</div>
        <p className="mt-2 text-muted-foreground">That list doesn't exist, or isn't yours.</p>
        <Link to="/lists" className="mt-4 inline-block text-primary">Back to lists</Link>
      </div>
    );
  }

  const data = list.data;
  const items = data.list_items
    .map((it) => (it.issue ? { comic: issueToComic(it.issue, { wishlist: data.type === "wishlist" }), issueId: it.issue.id } : null))
    .filter((x): x is NonNullable<typeof x> => !!x);

  const isOwner = !!currentUser.data && data.owner_id === currentUser.data.id;
  const isMember = !!currentUser.data && (members.data ?? []).some((m) => m.user_id === currentUser.data!.id);

  const openEdit = () => {
    setName(data.name);
    setDescription(data.description ?? "");
    setIsPublic(data.visibility === "public");
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!name.trim()) {
      toast.error("Name can't be empty.");
      return;
    }
    updateList.mutate(
      { id: data.id, patch: { name: name.trim(), description: description.trim() || null, visibility: isPublic ? "public" : "private" } },
      {
        onSuccess: () => {
          toast.success("List updated.");
          setEditOpen(false);
        },
        onError: () => toast.error("Couldn't update that list."),
      },
    );
  };

  const handleDelete = () => {
    deleteList.mutate(data.id, {
      onSuccess: () => {
        toast.success("List deleted.");
        navigate({ to: "/lists" });
      },
      onError: () => toast.error("Couldn't delete that list."),
    });
  };

  const handleRemove = (issueId: string) => {
    removeIssue.mutate(
      { listId: data.id, issueId },
      { onError: () => toast.error("Couldn't remove that issue.") },
    );
  };

  const handleLeave = () => {
    if (!currentUser.data) return;
    leaveList.mutate(
      { listId: data.id, userId: currentUser.data.id },
      {
        onSuccess: () => {
          toast.success("Left the list.");
          navigate({ to: "/lists" });
        },
        onError: () => toast.error("Couldn't leave that list."),
      },
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow={data.type === "custom" ? "Custom list" : data.type === "wishlist" ? "Wishlist" : "Reading list"}
        title={data.name}
        description={data.description || `${items.length} issue${items.length === 1 ? "" : "s"}`}
        actions={
          <div className="flex gap-2">
            {isOwner && <CollaboratorsDialog listId={data.id} currentUserId={currentUser.data?.id} />}
            {isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-4 w-4" />Edit</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"><Trash2 className="h-4 w-4" />Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{data.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the list and its items. This can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {!isOwner && isMember && (
              <Button variant="outline" size="sm" onClick={handleLeave} disabled={leaveList.isPending}>
                <LogOut className="h-4 w-4" />Leave list
              </Button>
            )}
          </div>
        }
      />

      {items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border py-20 text-center">
          <ListChecks className="mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-medium">This list is empty</div>
          <div className="text-sm text-muted-foreground">Add comics to it from any comic's detail page.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {items.map(({ comic, issueId }) => (
            <div key={comic.id} className="group relative">
              <ComicCard comic={comic} />
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemove(issueId)}
                  title="Remove from list"
                  className="absolute -right-2 -top-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-lg group-hover:flex"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit list</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Public</Label>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={updateList.isPending}>
              {updateList.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
