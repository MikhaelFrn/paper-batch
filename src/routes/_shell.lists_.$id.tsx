import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { X, ListChecks, Pencil, Trash2 } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/hooks/useLists";
import { issueToComic } from "@/lib/comic-adapters";

export const Route = createFileRoute("/_shell/lists_/$id")({
  head: () => ({
    meta: [
      { title: "List · Comic Vault" },
      { name: "description", content: "A curated list of comics." },
    ],
  }),
  component: ListDetail,
});

function ListDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const list = useList(id);
  const updateList = useUpdateList();
  const deleteList = useDeleteList();
  const removeIssue = useRemoveIssueFromList();

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

  return (
    <div>
      <PageHeader
        eyebrow={data.type === "custom" ? "Custom list" : data.type === "wishlist" ? "Wishlist" : "Reading list"}
        title={data.name}
        description={data.description || `${items.length} issue${items.length === 1 ? "" : "s"}`}
        actions={
          <div className="flex gap-2">
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
              <button
                type="button"
                onClick={() => handleRemove(issueId)}
                title="Remove from list"
                className="absolute -right-2 -top-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-lg group-hover:flex"
              >
                <X className="h-3.5 w-3.5" />
              </button>
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
