import React, { useState } from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { PinLockScreen } from './components/PinLockScreen';
import { AppShell } from './components/AppShell';
import { DashboardView } from './components/DashboardView';
import { KanbanView } from './components/KanbanView';
import { ProjectDetailSheet } from './components/ProjectDetailSheet';
import { NewProjectModal } from './components/NewProjectModal';
import { CalendarView, BlockDateModal } from './components/CalendarView';
import { ClientsView, ClientModal } from './components/ClientsView';
import { QuotesView, QuoteBuilderModal } from './components/QuotesView';
import { SettingsView } from './components/SettingsView';
import { ProjectStatus } from './types/studio';

const StudioWorkspace: React.FC = () => {
  const {
    isLocked,
    activeTab,
    quickCreateModal,
    setQuickCreateModal,
  } = useStudio();

  const [kanbanInitialStatus, setKanbanInitialStatus] =
    useState<ProjectStatus>('en_edicion');

  if (isLocked) {
    return <PinLockScreen />;
  }

  return (
    <>
      <AppShell>
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'kanban' && (
          <KanbanView
            onCreateInStatus={(st) => {
              setKanbanInitialStatus(st);
              setQuickCreateModal('project');
            }}
          />
        )}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'clients' && <ClientsView />}
        {activeTab === 'quotes' && <QuotesView />}
        {activeTab === 'settings' && <SettingsView />}
      </AppShell>

      {/* Slide-over Project Sheet accessible from any view */}
      <ProjectDetailSheet />

      {/* Global Speed-Dial Quick Create Modals */}
      {quickCreateModal === 'project' && (
        <NewProjectModal
          initialStatus={kanbanInitialStatus}
          onClose={() => setQuickCreateModal(null)}
        />
      )}
      {quickCreateModal === 'client' && (
        <ClientModal onClose={() => setQuickCreateModal(null)} />
      )}
      {quickCreateModal === 'quote' && (
        <QuoteBuilderModal onClose={() => setQuickCreateModal(null)} />
      )}
      {quickCreateModal === 'block_date' && (
        <BlockDateModal onClose={() => setQuickCreateModal(null)} />
      )}
    </>
  );
};

export function App() {
  return (
    <StudioProvider>
      <StudioWorkspace />
    </StudioProvider>
  );
}

export default App;
