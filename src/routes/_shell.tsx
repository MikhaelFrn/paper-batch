import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { fetchServerUser } from "@/services/auth-server";
import { useFixStuckBodyPointerEvents } from "@/hooks/useFixStuckBodyPointerEvents";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/_shell")({
  beforeLoad: async ({ location }) => {
    const user = await fetchServerUser();
    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: ShellLayout,
});

function ShellLayout() {
  useFixStuckBodyPointerEvents();
  const { t } = useTranslation();

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        {t.nav.skipToMainContent}
      </a>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
