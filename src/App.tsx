import React, { useMemo, useState } from 'react';
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
import { ClientPortalView } from './components/ClientPortalView';
import { ProjectStatus } from './types/studio';

const StudioWorkspace: React.FC = () => {
  const {
    isLocked,
    activeTab,
    quickCreateModal,
    setQuickCreateModal,
    previewPortalProjectId,
    setPreviewPortalProjectId,
    projects,
    clients,
    settings,
  } = useStudio();

  const [kanbanInitialStatus, setKanbanInitialStatus] =
    useState<ProjectStatus>('en_edicion');

  // Editor in-app live preview of Client Portal
  if (previewPortalProjectId) {
    const targetProject = projects.find((p) => p.id === previewPortalProjectId);
    if (targetProject) {
      const cli = clients.find((c) => c.id === targetProject.clientId);
      return (
        <ClientPortalView
          projectId={targetProject.id}
          previewData={{
            project: targetProject,
            studioName: settings.studioName,
            editorName: settings.editorName,
            currency: settings.currency,
            clientName: cli?.name,
            onExitPreview: () => setPreviewPortalProjectId(null),
          }}
        />
      );
    }
  }

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

      <ProjectDetailSheet />

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
  // Check if opened as a Public Client Tracking Link (?portal=proj-xxx)
  const publicPortalProjectId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('portal');
  }, []);

  if (publicPortalProjectId) {
    return <ClientPortalView projectId={publicPortalProjectId} />;
  }

  return (
    <StudioProvider>
      <StudioWorkspace />
    </StudioProvider>
  );
}

export default App;
