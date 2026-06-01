import React, { useState } from 'react';
import { X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTabsStore } from '@/shared/stores/tabsStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, closeTab, switchTab, closeAllTabs, canOpenMore } = useTabsStore();
  const [scrollPosition, setScrollPosition] = useState(0);

  if (tabs.length === 0) return null;

  const tabsContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      const newPosition = direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;

      tabsContainerRef.current.scrollLeft = newPosition;
      setScrollPosition(newPosition);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 px-2 py-1.5">
      {/* Scroll Left */}
      {scrollPosition > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Tabs Container */}
      <div
        ref={tabsContainerRef}
        className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-all whitespace-nowrap flex-shrink-0',
              activeTabId === tab.id
                ? 'bg-white border-blue-400 shadow-sm'
                : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
            )}
            onClick={() => switchTab(tab.id)}
            title={`${tab.paciente_nombre} - ${tab.nhc} - ${tab.modulo_activo}`}
          >
            {tab.icon && <span className="text-lg">{tab.icon}</span>}

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{tab.paciente_nombre}</p>
              <p className="text-xs text-slate-600 truncate">{tab.nhc}</p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="rounded hover:bg-red-100 transition-colors p-0.5"
              title="Cerrar pestaña"
            >
              <X className="w-3 h-3 text-slate-500 hover:text-red-600" />
            </button>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Opciones de pestañas"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!canOpenMore()}>
            Nueva pestaña
          </DropdownMenuItem>
          <DropdownMenuItem onClick={closeAllTabs} disabled={tabs.length === 0}>
            Cerrar todas las pestañas
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            {tabs.length}/{5} pestañas abiertas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {tabs.length >= 5 && (
        <div className="text-xs text-slate-500 px-2 border-l border-slate-300">
          Máximo alcanzado (5/5)
        </div>
      )}
    </div>
  );
};

export default TabBar;

