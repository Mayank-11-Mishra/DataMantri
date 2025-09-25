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
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Dashboard Analytics", url: "/dashboard-analytics", icon: BarChart, adminOnly: true },
  { title: "Upload Utility", url: "/upload-utility", icon: Upload },
  { title: "Data Sources Builder", url: "/data-sources", icon: Database },
  { title: "Data Mart Builder", url: "/data-marts", icon: Boxes },
  { title: "Dashboard Builder", url: "/dashboard-builder", icon: LayoutDashboard },
  { title: "Database Management Suite", url: "/database-management", icon: Server, adminOnly: true },
  { title: "Access Management", url: "/access-management", icon: Shield, adminOnly: true },
  { title: "Scheduler", url: "/scheduler", icon: Calendar },
  { title: "Theme & Chart Libraries", url: "/theme-library", icon: Palette },
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
            <BarChart3 className="h-6 w-6 text-sidebar-primary" />
            {!isCollapsed && (
              <span className="font-bold text-sidebar-foreground">DataMantri</span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                            {navigationItems
                .filter(item => !item.adminOnly || (user?.is_admin))
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