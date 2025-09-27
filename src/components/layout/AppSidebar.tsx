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
  Server
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

  const navigationItems = [
  { title: "Analytics", url: "/analytics", icon: BarChart, adminOnly: true },
  { title: "Data Management Suite", url: "/database-management", icon: Server, adminOnly: true },
  { title: "Dashboards", url: "/dashboard", icon: Home },
  { title: "Dashboard Builder", url: "/dashboard-builder", icon: LayoutDashboard },
  { title: "Theme & Chart Builder", url: "/theme-library", icon: Palette },
  { title: "Scheduler", url: "/scheduler", icon: Calendar },
  { title: "Access Management", url: "/access-management", icon: Shield, adminOnly: true },
  { title: "Upload Utility", url: "/upload-utility", icon: Upload },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
    const { user, logout } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  const handleLogout = () => {
    logout();
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            {user?.organization_logo_url ? (
              <img src={user.organization_logo_url} alt={`${user.organization_name} Logo`} className="h-8 w-8 object-contain" />
            ) : (
              <BarChart3 className="h-6 w-6 text-sidebar-primary" />
            )}
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sidebar-foreground">{user?.organization_name || 'DataMantri'}</span>
                {user?.organization_name && <span className="text-xs text-muted-foreground">Powered by DataMantri</span>}
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                            {navigationItems
                .filter(item => !item.adminOnly || (user?.role === 'admin' || user?.role === 'super_admin'))
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Logout</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          )}
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}