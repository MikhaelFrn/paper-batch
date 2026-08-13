import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublisherBadge } from "@/components/comic-card";
import { AvatarCropDialog } from "@/components/avatar-crop-dialog";
import { useMyProfile, useUpdateMyProfile, useUploadMyAvatar } from "@/hooks/useProfiles";
import { useUserCollection } from "@/hooks/useUserComics";
import {
  useFavoriteSeries,
  useFavoritePublishers,
  useFavoriteCreators,
} from "@/hooks/useFavorites";
import { useMyLists, useList } from "@/hooks/useLists";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { getCurrentUser, updateAuthUser } from "@/services/auth";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/_shell/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Comic Vault" },
      { name: "description", content: "Manage your Comic Vault profile and collection stats." },
      { property: "og:title", content: "My profile — Comic Vault" },
      { property: "og:description", content: "Edit your details and see your collection at a glance." },
    ],
  }),
  component: Profile,
});

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-center">
      <div className="font-display text-3xl">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function Profile() {
  const { t } = useTranslation();
  const profile = useMyProfile();
  const navigate = useNavigate();
  const update = useUpdateMyProfile();
  const uploadAvatar = useUploadMyAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const collection = useUserCollection();
  const favSeries = useFavoriteSeries();
  const favPublishers = useFavoritePublishers();
  const favCreators = useFavoriteCreators();
  const lists = useMyLists();
  const wishlistList = lists.data?.find((l) => l.type === "wishlist");
  const wishlistDetail = useList(wishlistList?.id);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const handleCancel = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    navigate({ to: "/profile" });
  }
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
      try {
        await update.mutateAsync({
          username,
          display_name: displayName,
        });
        await updateAuthUser({
          email,
        });
        toast.success(t.profile.informationUpdated);
        navigate({ to: "/profile" });
        } catch (error) {
          toast.error(t.profile.invalidInfo);
        }
  }
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file next time
    if (!file) return;
    setPendingAvatarFile(file);
  }
  const handleAvatarCropped = (blob: Blob) => {
    setPendingAvatarFile(null);
    uploadAvatar.mutate(blob, {
      onSuccess: () => toast.success(t.profile.profilePictureUpdated),
      onError: (error) => toast.error(error instanceof Error ? error.message : t.profile.uploadFailed),
    });
  }

  const entries = collection.data ?? [];
  const stats = {
    owned: entries.filter((e) => e.owned).length,
    read: entries.filter((e) => e.read).length,
    wishlist: wishlistDetail.data?.list_items?.length ?? 0,
    favorites:
      (favSeries.data?.length ?? 0) +
      (favPublishers.data?.length ?? 0) +
      (favCreators.data?.length ?? 0),
    lists: lists.data?.length ?? 0,
    totalIssues: entries.length,
  };

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data?.display_name ?? profile.data?.username ?? "");
      setUsername(profile.data?.username ?? "");
    }
  }, [profile.data]);
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      setEmail(user?.email ?? "");
    };
    loadUser();
  }, []);

  return (
    <div>
      <PageHeader eyebrow={t.profile.eyebrow} title={t.profile.title} description={t.profile.description} />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-primary/50">
                <AvatarImage src={profile.data?.avatar_url ?? ""} alt={displayName || username} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white">{initials(displayName || username || "?")}</AvatarFallback>
              </Avatar>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarFile}
              />
              <Button
                size="icon"
                type="button"
                aria-label={t.profile.changeProfilePicture}
                disabled={uploadAvatar.isPending}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 font-display text-xl tracking-wide">{displayName || "—"}</div>
            <div className="text-xs text-muted-foreground">@{username || "—"}</div>
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-muted/40 p-2"><div className="font-semibold">{stats.owned}</div><div className="text-muted-foreground">{t.profile.owned}</div></div>
              <div className="rounded bg-muted/40 p-2"><div className="font-semibold">{stats.read}</div><div className="text-muted-foreground">{t.profile.read}</div></div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader><CardTitle>{t.profile.accountDetails}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="profile-username">{t.profile.username}</Label><Input id="profile-username" value={username} onChange={(e) => setUsername(e.target.value)}/></div>
              <div><Label htmlFor="profile-display-name">{t.profile.displayName}</Label><Input id="profile-display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)}/></div>
              <div className="sm:col-span-2"><Label htmlFor="profile-email">{t.profile.email}</Label><Input id="profile-email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="sm:col-span-2">
                <Label>{t.profile.password}</Label>
                <div className="mt-2 flex items-center justify-between rounded-md border border-border p-3">
                  <span className="text-sm text-muted-foreground">
                    {t.profile.resetPasswordDescription}
                  </span>
                  <Button type="button" variant="outline" onClick={() => navigate({ to: "/forgot-password" })}>
                    {t.profile.resetPassword}
                  </Button>
                </div>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={(e) => handleCancel(e)}>{t.profile.cancel}</Button>
                <Button hover:brightness-1="true" onClick={(e) => handleClick(e)}>{t.profile.saveChanges}</Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-display mb-3 text-lg tracking-wide">{t.profile.collectionStats}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t.profile.owned} value={stats.owned} />
              <Stat label={t.profile.read} value={stats.read} />
              <Stat label={t.profile.wishlist} value={stats.wishlist} />
              <Stat label={t.profile.favorites} value={stats.favorites} />
              <Stat label={t.profile.customLists} value={stats.lists} />
              <Stat label={t.profile.totalIssues} value={stats.totalIssues.toLocaleString()} />
              <Stat label={t.profile.publishers} value={favPublishers.data?.length ?? 0} />
              <Stat label={t.profile.series} value={favSeries.data?.length ?? 0} />
            </div>
          </div>

          <Card className="border-border/60">
            <CardHeader><CardTitle>{t.profile.tasteProfile}</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{t.profile.favoritePublishers}</div>
                <div className="flex flex-wrap gap-2">{(favPublishers.data ?? []).map((p) => <PublisherBadge key={p.id} publisher={p.name} />)}</div>
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{t.profile.favoriteSeries}</div>
                <div className="flex flex-wrap gap-2">{(favSeries.data ?? []).map((s) => <Link key={s.id} to="/search" search={{ q: s.name }} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs hover:border-primary/40 hover:text-primary">{s.name}</Link>)}</div>
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{t.profile.favoriteCreators}</div>
                <div className="flex flex-wrap gap-2">{(favCreators.data ?? []).map((c) => <span key={c.id} className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">{[c.first_name, c.last_name].filter(Boolean).join(" ")}</span>)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AvatarCropDialog
        file={pendingAvatarFile}
        onCancel={() => setPendingAvatarFile(null)}
        onCropped={handleAvatarCropped}
      />
    </div>
  );
}
