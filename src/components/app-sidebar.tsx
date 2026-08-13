import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Library,
  Sparkles,
  ListChecks,
  Heart,
  ScanBarcode,
  Search,
  User,
  Settings,
  Zap,
  Mail,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/i18n";

const CONTACT_EMAIL = "comicvault.support@gmail.com";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));
  const { t } = useTranslation();

  const main = [
    { title: t.nav.dashboard, url: "/", icon: LayoutDashboard },
    { title: t.nav.inventory, url: "/inventory", icon: Library },
    { title: t.nav.newArrivals, url: "/new-arrivals", icon: Sparkles },
    { title: t.nav.search, url: "/search", icon: Search },
    { title: t.nav.scanComic, url: "/scan", icon: ScanBarcode },
  ];

  const collections = [
    { title: t.nav.lists, url: "/lists", icon: ListChecks },
    { title: t.nav.favorites, url: "/favorites", icon: Heart },
  ];

  const account = [
    { title: t.nav.profile, url: "/profile", icon: User },
    { title: t.nav.settings, url: "/settings", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary shadow-lg glow-marvel">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="font-display text-lg leading-none tracking-wide text-foreground">Comic Vault</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.discover}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} aria-label={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.collections}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {collections.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} aria-label={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.account}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {account.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} aria-label={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t.common.contact}>
              <a href={`mailto:${CONTACT_EMAIL}`} aria-label={`${t.common.contact} — ${CONTACT_EMAIL}`}>
                <Mail />
                <span>{t.common.contact}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <LanguageSwitcher className="w-full justify-center" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
