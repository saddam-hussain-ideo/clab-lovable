
import { FC } from "react";
import { XIcon, Menu } from "lucide-react";
import { AdminMenuItem } from "./AdminMenuItem";
import { getAdminMenuItems } from "./menuItems";

interface AdminSidebarProps {
  activeTab: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleTabChange: (tab: string) => void;
  isMobile: boolean;
}

export const AdminSidebar: FC<AdminSidebarProps> = ({
  activeTab,
  sidebarOpen,
  setSidebarOpen,
  handleTabChange,
  isMobile
}) => {
  const menuItems = getAdminMenuItems(activeTab);

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          className="fixed top-20 left-4 z-50 bg-gray-800 p-2 rounded-full"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <XIcon size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`bg-[#121212] h-screen overflow-y-auto fixed md:relative z-40 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64 translate-x-0" : "w-0 md:w-16 -translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className={`text-lg font-semibold transition-opacity duration-200 ${
              sidebarOpen ? "opacity-100" : "opacity-0 md:hidden"
            }`}>
              Admin Panel
            </h2>
            {!isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-white"
              >
                {sidebarOpen ? <XIcon size={18} /> : <Menu size={18} />}
              </button>
            )}
          </div>

          <div className="flex-1 py-4">
            <div className="space-y-1 px-2">
              {menuItems.map((item) => (
                <AdminMenuItem
                  key={item.label}
                  item={item}
                  activeTab={activeTab}
                  handleTabChange={handleTabChange}
                  sidebarOpen={sidebarOpen}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
