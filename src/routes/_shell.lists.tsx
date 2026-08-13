import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Globe, Plus, Bookmark, BookOpen, ListChecks, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyLists, useCreateList } from "@/hooks/useLists";
import type { ListType, ListVisibility } from "@/lib/types";
import { useTranslation } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_shell/lists")({
  head: () => ({
    meta: [
      { title: "Lists · Comic Vault" },
      { name: "description", content: "Your wishlist, reading list, and custom collections in one place." },
      { property: "og:title", content: "Comic lists — Comic Vault" },
      { property: "og:description", content: "Curate, rank, and share your own comic collections." },
    ],
  }),
  component: Lists,
});

const TYPE_ICON: Record<ListType, typeof Bookmark> = {
  wishlist: Bookmark,
  reading: BookOpen,
  custom: ListChecks,
};

// A shared list's banner is recolored by role so it reads at a glance
// during a grid-scan, not just via the small text badge in the corner —
// that's the whole point ("make lists that aren't yours more obvious").
// CSS vars (styles.css), not inline oklch, so light mode gets its own
// fading-toward-pale variant instead of inheriting the dark theme's
// fading-toward-black one.
const ROLE_GRADIENT: Record<"editor" | "viewer", string> = {
  editor: "var(--gradient-list-editor)",
  viewer: "var(--gradient-list-viewer)",
};

function NewListDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ListType>("custom");
  const [isPublic, setIsPublic] = useState(false);
  const createList = useCreateList();

  const reset = () => {
    setName("");
    setDescription("");
    setType("custom");
    setIsPublic(false);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error(t.lists.nameRequired);
      return;
    }
    createList.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        type,
        visibility: (isPublic ? "public" : "private") as ListVisibility,
      },
      {
        onSuccess: () => {
          toast.success(t.lists.listCreated);
          reset();
          setOpen(false);
        },
        onError: () => toast.error(t.lists.createFailed),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" />{t.lists.newList}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.lists.createDialogTitle}</DialogTitle>
          <DialogDescription>{t.lists.createDialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="new-list-name">{t.lists.nameLabel}</Label>
            <Input
              id="new-list-name"
              placeholder={t.lists.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-list-description">{t.lists.descriptionLabel}</Label>
            <Textarea
              id="new-list-description"
              placeholder={t.lists.descriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-list-type">{t.lists.typeLabel}</Label>
            <Select value={type} onValueChange={(v) => setType(v as ListType)}>
              <SelectTrigger id="new-list-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">{t.lists.typeCustom}</SelectItem>
                <SelectItem value="wishlist">{t.lists.typeWishlist}</SelectItem>
                <SelectItem value="reading">{t.lists.typeReading}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="new-list-public">{t.lists.publicLabel}</Label>
            <Switch id="new-list-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={createList.isPending}>
            {createList.isPending ? t.lists.creating : t.lists.createList}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Lists() {
  const { t } = useTranslation();
  const lists = useMyLists();
  const rows = lists.data ?? [];

  const TYPE_LABEL: Record<ListType, string> = {
    wishlist: t.lists.typeWishlist,
    reading: t.lists.typeReading,
    custom: t.lists.typeCustom,
  };
  const ROLE_LABEL: Record<"editor" | "viewer", string> = {
    editor: t.lists.roleEditor,
    viewer: t.lists.roleViewer,
  };

  return (
    <div>
      <PageHeader
        eyebrow={t.lists.eyebrow}
        title={t.lists.title}
        description={t.lists.description(rows.length)}
        actions={<NewListDialog />}
      />

      {lists.isLoading ? (
        <div className="py-10 text-sm text-muted-foreground">{t.lists.loadingLists}</div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border py-20 text-center">
          <ListChecks className="mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-medium">{t.lists.noListsYet}</div>
          <div className="text-sm text-muted-foreground">{t.lists.noListsDescription}</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((list) => {
            const isPublic = list.visibility === "public";
            const Icon = TYPE_ICON[list.type];
            const bannerGradient =
              list.myRole === "editor" || list.myRole === "viewer"
                ? ROLE_GRADIENT[list.myRole]
                : "var(--gradient-list-owner)";
            return (
              <Link key={list.id} to="/lists/$id" params={{ id: list.id }}>
                <Card className="group cursor-pointer overflow-hidden border-border/60 transition hover:border-primary/40">
                  <div className="relative h-32 w-full" style={{ backgroundImage: bannerGradient }}>
                    <div className="absolute inset-0 opacity-25 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)", backgroundSize: "8px 8px" }} />
                    <span className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white">
                      {isPublic ? <Globe className="inline h-3 w-3" /> : <Lock className="inline h-3 w-3" />} {isPublic ? t.lists.public : t.lists.private}
                    </span>
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white">
                      <Icon className="h-3 w-3" /> {TYPE_LABEL[list.type]}
                    </span>
                  </div>
                  <CardHeader className="flex-row items-center justify-between gap-2">
                    <CardTitle className="font-display tracking-wide">{list.name}</CardTitle>
                    {list.myRole !== "owner" && (
                      <Badge variant="outline" className="shrink-0 gap-1 text-[10px]">
                        <Users className="h-3 w-3" />
                        {ROLE_LABEL[list.myRole]}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{list.description ?? ""}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
