"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navigation: NavItem[] = [
  { name: "Trang chủ", href: "/", icon: <Home className="w-5 h-5" /> },
  { name: "Đơn hàng", href: "/orders", icon: <Package className="w-5 h-5" /> },
  { name: "Báo cáo", href: "/reports", icon: <BarChart3 className="w-5 h-5" /> },
  { name: "Nhân viên", href: "/employees", icon: <Users className="w-5 h-5" /> },
  { name: "Cài đặt", href: "/settings", icon: <Settings className="w-5 h-5" /> },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      }`}>
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo and Toggle Button */}
          <div className="flex items-center justify-between px-3 mb-6">
            <div className={`flex items-center flex-shrink-0 transition-opacity duration-300 ${
              sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 px-3'
            }`}>
              <div className="text-3xl mr-3">🦞</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Seefood</h1>
                <p className="text-xs text-gray-500">Quản lý hải sản</p>
              </div>
            </div>

            {/* Collapse/Expand button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                sidebarCollapsed ? 'mx-auto' : ''
              }`}
              title={sidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors relative group
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  {item.icon}
                  <span className={`transition-all duration-300 ${
                    sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 ml-3'
                  }`}>
                    {item.name}
                  </span>

                  {/* Tooltip when collapsed */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section at bottom */}
          {user && (
            <div className="flex-shrink-0 px-3 pb-3">
              <div className={`flex items-center p-3 bg-gray-50 rounded-lg ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(user.full_name || user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className={`ml-3 flex-1 min-w-0 transition-all duration-300 ${
                  sidebarCollapsed ? 'opacity-0 w-0 ml-0' : 'opacity-100'
                }`}>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white border-r border-gray-200 z-50 lg:hidden">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🦞</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Seefood</h1>
                  <p className="text-xs text-gray-500">Quản lý hải sản</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          {/* Page title and actions slot */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center">
            <div className="relative flex flex-1" id="header-actions-slot"></div>
          </div>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-x-2 rounded-full p-1.5 hover:bg-gray-100 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(user.full_name || user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user.full_name || user.username}</p>
                    <p className="text-xs text-gray-500 font-normal">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Hồ sơ</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
