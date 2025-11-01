import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  Home,
  Upload,
  Database,
  Boxes,
  Palette,
  PieChart,
  LayoutDashboard,
  LogOut,
  Calendar,
  BarChart,
  Users,
  Shield,
  Server,
  Sparkles,
  Bell,
  FileCode
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  { title: "Homepage", url: "/dashboard", icon: Home },
  { title: "Data Management", url: "/database-management", icon: Server },
  { title: "Alert Management", url: "/alert-management", icon: Bell },
  { title: "All Dashboards", url: "/all-dashboards", icon: LayoutDashboard },
  { title: "Dashboard Builder", url: "/dashboard-builder", icon: PieChart },
  { title: "Dashboard Builder 2", url: "/dashboard-builder-v2", icon: Sparkles, badge: "NEW" },
  { title: "Code Importer", url: "/code-importer", icon: FileCode },
  { title: "Themes & Charts", url: "/themes-and-charts", icon: Palette },
  { title: "Scheduler", url: "/scheduler", icon: Calendar },
  { title: "Access Control", url: "/access-management", icon: Shield, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleLogout = () => {
    logout();
  };

  const isCollapsed = state === "collapsed";

  // Filter navigation items based on admin status
  const filteredNavigationItems = navigationItems.filter(
    item => !item.adminOnly || user?.is_admin
  );

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="py-2">
        {/* Logo Section - Cleaner, More Space */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            {user?.organization_logo_url ? (
              <img src={user.organization_logo_url} alt={`${user.organization_name} Logo`} className="h-9 w-9 object-contain" />
            ) : (
              <BarChart3 className="h-7 w-7 text-primary" />
            )}
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base text-sidebar-foreground">{user?.organization_name || 'DataMantri'}</span>
                {user?.organization_name && <span className="text-[11px] text-muted-foreground">Powered by DataMantri</span>}
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Better Spacing */}
        <SidebarGroup className="px-2 py-3">
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              NAVIGATION
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent className="mt-1">
            <SidebarMenu className="space-y-1">
              {filteredNavigationItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={`${
                            active 
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium' 
                              : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          } rounded-lg transition-all`}
                        >
                          <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                            {!isCollapsed && (
                              <>
                                <span className="flex-1 text-[13px] font-medium">{item.title}</span>
                                {item.badge && (
                                  <Badge className="ml-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] px-1.5 py-0.5 font-semibold">
                                    {item.badge}
                                  </Badge>
                                )}
                              </>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="text-sm">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Info - Cleaner */}
      <SidebarFooter className="mt-auto">
        <div className="p-3 border-t border-sidebar-border">
          {!isCollapsed ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-primary">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-sidebar-foreground truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
              {user?.is_admin && (
                <Badge variant="secondary" className="w-full justify-center text-[10px] font-semibold py-1">
                  Admin
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 text-[13px] font-medium"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer">
                    <span className="text-[13px] font-bold text-primary">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-sm">
                  <p className="font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-sm">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
