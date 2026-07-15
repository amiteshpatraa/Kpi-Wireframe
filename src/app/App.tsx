import { useState } from 'react';
import type { PageId } from './components/Sidebar';
import { GlobalNavBar } from './components/GlobalNavBar';
import { FixedLeftFilterSidebar } from './components/FixedLeftFilterSidebar';

import { GatewayPage } from './components/GatewayPage';
import { ExecutiveGateway } from './components/ExecutiveGateway';
import { OverviewPage } from './components/OverviewPage';


import { CopqPage } from './components/CopqPage';
import { BprPage } from './components/BprPage';
import { OtifPage } from './components/OtifPage';
import { InventoryPage } from './components/InventoryPage';
import { TraceabilityPage } from './components/TraceabilityPage';
import { FilterProvider } from './contexts/FilterContext';
import { useDefaultFilters, FilterState, TimeTrendFilter } from './components/TimeTrendFilter'; // Import state hook

type AppState = 'gateway' | 'executive' | 'app';

export default function App() {
  const [appState, setAppState] = useState<AppState>('gateway');
  const [currentPage, setCurrentPage] = useState<PageId>('overview');

  // Shared global filter state declared here
  const [filters, setFilters] = useState<FilterState>(useDefaultFilters());

  const renderContent = () => {
    if (appState === 'gateway') {
      return <GatewayPage onEnter={() => setAppState('executive')} />;
    }

    if (appState === 'executive') {
      return (
        <ExecutiveGateway
          onEnterDashboard={(pageId) => {
            setCurrentPage(pageId);
            setAppState('app');
          }}
          onBack={() => setAppState('gateway')}
        />
      );
    }

    const renderPage = () => {
      switch (currentPage) {
        // case 'overview': return <OverviewPage filters={filters} onChange={setFilters} />;
        case 'copq': return <CopqPage filters={filters} onChange={setFilters} />;
        case 'bpr': return <BprPage filters={filters} onChange={setFilters} />;
        case 'otif': return <OtifPage filters={filters} onChange={setFilters} />;
        case 'inventory': return <InventoryPage filters={filters} onChange={setFilters} />;
        case 'traceability': return <TraceabilityPage filters={filters} onChange={setFilters} />;
        default: return <OverviewPage filters={filters} onChange={setFilters} />;
      }
    };

    return (
      <div className="flex h-screen w-screen bg-[#F8F9FA] overflow-hidden select-none">

        {/* Workspace (Locked viewport height) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">

          {/* Pinned Top Navbar (Freeze pane row 1) */}
          <GlobalNavBar
            filters={filters}
            onChange={setFilters}
            currentPage={currentPage}
            onNavigate={(target) => {
              if (target === 'executive') {
                setAppState('executive');
              } else {
                setCurrentPage(target);
              }
            }}
          />

          {/* Pinned Consolidated Filter Bar (Freeze pane row 2) */}
          <TimeTrendFilter
            filters={filters}
            onChange={setFilters}
          />

          {/* 3. Main Workspace Area: Sidebar (Left) + Page Content (Right) */}
          <div className="flex-grow flex overflow-hidden">
            <FixedLeftFilterSidebar filters={filters} onChange={setFilters} />
            <div className="flex-grow overflow-y-auto">
              {renderPage()}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <FilterProvider>
      {renderContent()}
    </FilterProvider>
  );
}