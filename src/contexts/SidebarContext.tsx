import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
  pinned: boolean;
  setPinned: (pinned: boolean) => void;
  togglePin: () => void;
  activeContext: string | null;
  setActiveContext: (context: string | null) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [activeContext, setActiveContext] = useState<string | null>(null);

  const toggle = () => setCollapsed((prev) => !prev);
  const togglePin = () => {
    setPinned((prev) => {
      const newPinned = !prev;
      if (!newPinned) {
        // When unpinning, close contextual sidebar
        setActiveContext(null);
      }
      return newPinned;
    });
  };

  return (
    <SidebarContext.Provider 
      value={{ 
        collapsed, 
        setCollapsed, 
        toggle, 
        pinned, 
        setPinned, 
        togglePin,
        activeContext,
        setActiveContext,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
