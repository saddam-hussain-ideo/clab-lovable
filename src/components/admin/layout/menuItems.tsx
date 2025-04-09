
import { 
  LayoutDashboard, PieChart, Settings, Users, FileText, 
  HelpCircle, Box, MessageSquare, Coins, CreditCard, Image, 
  BarChart, Award
} from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  active: boolean;
}

export const getAdminMenuItems = (activeItem: string): MenuItem[] => [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    href: "/admin",
    active: activeItem === "dashboard",
  },
  {
    id: "users",
    label: "User Management",
    icon: <Users size={20} />,
    href: "/admin/users",
    active: activeItem === "users",
  },
  {
    id: "articles",
    label: "Articles",
    icon: <FileText size={20} />,
    href: "/admin/articles",
    active: activeItem === "articles",
  },
  {
    id: "content",
    label: "Page Content",
    icon: <Box size={20} />,
    href: "/admin/content",
    active: activeItem === "content",
  },
  {
    id: "quiz",
    label: "Quiz Management",
    icon: <Award size={20} />,
    href: "/admin/quiz",
    active: activeItem === "quiz",
  },
  {
    id: "social",
    label: "Social Media",
    icon: <MessageSquare size={20} />,
    href: "/admin/social",
    active: activeItem === "social",
  },
  {
    id: "token",
    label: "Token Manager",
    icon: <Coins size={20} />,
    href: "/admin/token",
    active: activeItem === "token",
  },
  {
    id: "presale",
    label: "Presale Management",
    icon: <BarChart size={20} />,
    href: "/admin/presale",
    active: activeItem === "presale",
  },
  {
    id: "payments",
    label: "Payments",
    icon: <CreditCard size={20} />,
    href: "/admin/payments",
    active: activeItem === "payments",
  },
  {
    id: "banners",
    label: "Banners",
    icon: <Image size={20} />,
    href: "/admin/banners",
    active: activeItem === "banners",
  },
  {
    id: "logos",
    label: "Partner Logos",
    icon: <Image size={20} />,
    href: "/admin/logos",
    active: activeItem === "logos",
  },
  {
    id: "tickers",
    label: "Crypto Tickers",
    icon: <BarChart size={20} />,
    href: "/admin/tickers",
    active: activeItem === "tickers",
  },
  {
    id: "advertisements",
    label: "Advertisements",
    icon: <Image size={20} />,
    href: "/admin/advertisements",
    active: activeItem === "advertisements",
  },
  {
    id: "faq",
    label: "FAQ Management",
    icon: <HelpCircle size={20} />,
    href: "/admin/faq",
    active: activeItem === "faq",
  },
  {
    id: "tokenomics",
    label: "Tokenomics",
    icon: <PieChart size={20} />,
    href: "/admin/tokenomics",
    active: activeItem === "tokenomics",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={20} />,
    href: "/admin?tab=settings", // This will direct to dashboard with settings tab
    active: activeItem === "settings",
  },
];
