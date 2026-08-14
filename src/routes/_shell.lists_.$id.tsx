import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { X, ListChecks, Pencil, Trash2, Users, LogOut } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ComicCard } from "@/components/comic-card";
import { ComicGrid } from "@/components/comic-grid";
import { EmptyState, CenteredMessage, NotFoundState } from "@/components/state-blocks";
import { ListFormFields } from "@/components/list-form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useTranslation } from "@/i18n";
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
 * enforced by RLS, not just hidden here.
 *
 * Openable by any member, not just the owner — otherwise a viewer/editor
 * added to a list has no way to see who owns it or who else is on it. The
 * add-by-username search and remove buttons stay owner-only; everyone else
 * gets the same roster in read-only form. */
function CollaboratorsDialog({
  listId,
  currentUserId,
  isOwner,
}: {
  listId: string;
  currentUserId: string | undefined;
  isOwner: boolean;
}) {
  const { t } = useTranslation();
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
          toast.success(t.lists.collaboratorAdded);
          setQuery("");
        },
        onError: () => toast.error(t.lists.addCollaboratorFailed),
      },
    );
  };

  const handleRemove = (userId: string) => {
    removeMember.mutate(
      { listId, userId },
      { onError: () => toast.error(t.lists.removeCollaboratorFailed) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Users className="h-4 w-4" />{t.lists.collaborators}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.lists.collaborators}</DialogTitle>
          <DialogDescription>
            {isOwner ? t.lists.collaboratorsDialogDescription : t.lists.collaboratorsDialogDescriptionReadOnly}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isOwner && (
            <div>
              <Label htmlFor="collaborator-search">{t.lists.addByUsername}</Label>
              <Input
                id="collaborator-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.lists.searchUsernamePlaceholder}
              />
              {candidates.length > 0 && (
                <div className="mt-2 space-y-2">
                  {candidates.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                      <span className="truncate">{p.display_name ?? p.username}</span>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" variant="outline" disabled={addMember.isPending} onClick={() => handleAdd(p.id, "viewer")}>{t.lists.roleViewer}</Button>
                        <Button size="sm" disabled={addMember.isPending} onClick={() => handleAdd(p.id, "editor")}>{t.lists.roleEditor}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t.lists.currentMembers}</Label>
            {(members.data ?? []).map((m) => (
              <div key={m.user_id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                <span className="truncate">
                  {m.profile?.display_name ?? m.profile?.username ?? t.lists.unknownUser}
                  {m.user_id === currentUserId ? ` ${t.lists.you}` : ""}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {m.role === "editor" ? t.lists.roleEditor : m.role === "viewer" ? t.lists.roleViewer : m.role}
                  </span>
                  {isOwner && m.role !== "owner" && (
                    <button
                      type="button"
                      onClick={() => handleRemove(m.user_id)}
                      title={t.lists.removeCollaborator(m.profile?.display_name ?? m.profile?.username ?? t.lists.unknownUser)}
                      aria-label={t.lists.removeCollaborator(m.profile?.display_name ?? m.profile?.username ?? t.lists.unknownUser)}
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
  const { t } = useTranslation();
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
    return <CenteredMessage message={t.common.loading} />;
  }
  if (!list.data) {
    return (
      <NotFoundState
        title={t.common.notFound}
        description={t.lists.listNotFound}
        backTo="/lists"
        backLabel={t.lists.backToLists}
      />
    );
  }

  const data = list.data;
  const items = data.list_items
    .map((it) => (it.issue ? { comic: issueToComic(it.issue, { wishlist: data.type === "wishlist" }), issueId: it.issue.id } : null))
    .filter((x): x is NonNullable<typeof x> => !!x);

  const isOwner = !!currentUser.data && data.owner_id === currentUser.data.id;
  const isMember = !!currentUser.data && (members.data ?? []).some((m) => m.user_id === currentUser.data!.id);
  const ownerMember = (members.data ?? []).find((m) => m.role === "owner");

  const openEdit = () => {
    setName(data.name);
    setDescription(data.description ?? "");
    setIsPublic(data.visibility === "public");
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!name.trim()) {
      toast.error(t.lists.nameEmpty);
      return;
    }
    updateList.mutate(
      { id: data.id, patch: { name: name.trim(), description: description.trim() || null, visibility: isPublic ? "public" : "private" } },
      {
        onSuccess: () => {
          toast.success(t.lists.listUpdated);
          setEditOpen(false);
        },
        onError: () => toast.error(t.lists.updateFailed),
      },
    );
  };

  const handleDelete = () => {
    deleteList.mutate(data.id, {
      onSuccess: () => {
        toast.success(t.lists.listDeleted);
        navigate({ to: "/lists" });
      },
      onError: () => toast.error(t.lists.deleteFailed),
    });
  };

  const handleRemove = (issueId: string) => {
    removeIssue.mutate(
      { listId: data.id, issueId },
      { onError: () => toast.error(t.lists.removeIssueFailed) },
    );
  };

  const handleLeave = () => {
    if (!currentUser.data) return;
    leaveList.mutate(
      { listId: data.id, userId: currentUser.data.id },
      {
        onSuccess: () => {
          toast.success(t.lists.leftList);
          navigate({ to: "/lists" });
        },
        onError: () => toast.error(t.lists.leaveFailed),
      },
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow={data.type === "custom" ? t.lists.customList : data.type === "wishlist" ? t.lists.wishlistType : t.lists.readingList}
        title={data.name}
        description={[
          data.description || t.lists.itemsCount(items.length),
          !isOwner && ownerMember
            ? t.lists.ownedBy(ownerMember.profile?.display_name ?? ownerMember.profile?.username ?? t.lists.unknownUser)
            : null,
        ].filter(Boolean).join(" · ")}
        actions={
          <div className="flex gap-2">
            {(isOwner || isMember) && (
              <CollaboratorsDialog listId={data.id} currentUserId={currentUser.data?.id} isOwner={isOwner} />
            )}
            {isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-4 w-4" />{t.lists.edit}</Button>
                {!data.is_default ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm"><Trash2 className="h-4 w-4" />{t.lists.delete}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.lists.deleteListTitle(data.name)}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.lists.deleteListDescription}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>{t.lists.delete}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button variant="outline" size="sm" disabled title={t.lists.defaultListCantDelete}>
                    <Trash2 className="h-4 w-4" />{t.lists.delete}
                  </Button>
                )}
              </>
            )}
            {!isOwner && isMember && (
              <Button variant="outline" size="sm" onClick={handleLeave} disabled={leaveList.isPending}>
                <LogOut className="h-4 w-4" />{t.lists.leaveList}
              </Button>
            )}
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState icon={ListChecks} title={t.lists.emptyListTitle} description={t.lists.emptyListDescription} />
      ) : (
        <ComicGrid>
          {items.map(({ comic, issueId }) => (
            <div key={comic.id} className="group relative">
              <ComicCard comic={comic} />
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemove(issueId)}
                  title={t.lists.removeFromList(comic.series, comic.issue)}
                  aria-label={t.lists.removeFromList(comic.series, comic.issue)}
                  className="absolute -right-2 -top-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-lg group-hover:flex group-focus-within:flex"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </ComicGrid>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.lists.editListTitle}</DialogTitle>
          </DialogHeader>
          <ListFormFields
            idPrefix="edit-list"
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
            isPublic={isPublic}
            onPublicChange={setIsPublic}
          />
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={updateList.isPending}>
              {updateList.isPending ? t.lists.saving : t.lists.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
