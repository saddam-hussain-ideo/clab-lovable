
import { FC } from "react";
import { getAdminMenuItems } from "@/components/admin/layout/menuItems";

// Define the type based on the structure returned by getAdminMenuItems
type AdminMenuItemType = ReturnType<typeof getAdminMenuItems>[0];

interface AdminMenuItemProps {
  item: AdminMenuItemType;
  activeTab: string;
  handleTabChange: (value: string) => void;
  sidebarOpen: boolean;
}

export const AdminMenuItem: FC<AdminMenuItemProps> = ({
  item,
  activeTab,
  handleTabChange,
  sidebarOpen
}) => {
  return (
    <button
      onClick={() => handleTabChange(item.id)}
      className={`flex items-center w-full px-4 py-3 rounded-md transition-colors ${
        activeTab === item.id
          ? 'bg-[#2a0f3a] text-purple-300'
          : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-white'
      } ${!sidebarOpen && 'md:justify-center'}`}
    >
      <div className="flex items-center">
        {item.icon}
        <span className={`ml-3 transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'
        }`}>
          {item.label}
        </span>
      </div>
    </button>
  );
};
