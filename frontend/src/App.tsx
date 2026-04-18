import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import AdministrationFinanceStructurePage from '@/app/administracion/estructura-financiera/page';
import AdministrationPage from '@/app/administracion/page';
import AdministrationPlatformPage from '@/app/administracion/plataforma/page';
import AdministrationRedesignMvpPage from '@/app/administracion/rediseno-mvp/page';
import AdministrationUsersPage from '@/app/administracion/usuarios/page';
import SharedEntitiesPage from '@/app/compartidos/page';
import ConfigurationPage from '@/app/configuracion/page';
import EntitiesPage from '@/app/entidades/page';
import IncomesPage from '@/app/ingresos/page';
import LoginPage from '@/app/login/page';
import ProfilePage from '@/app/mi-perfil/page';
import HomePage from '@/app/page';
import GeneralRecordsPage from '@/app/registro-general/page';
import { AppShell } from '@/components/layout/app-shell';
import { EntityDetailWorkspace } from '@/features/entities/components/entity-detail-workspace';

function EntityDetailRoute() {
  const { entityId = '' } = useParams();

  return (
    <AppShell>
      <EntityDetailWorkspace entityId={entityId} />
    </AppShell>
  );
}

function DocumentTitleSync() {
  const location = useLocation();

  useEffect(() => {
    const titleMap = new Map<string, string>([
      ['/', 'Control Financiero'],
      ['/login', 'Login | Control Financiero'],
      ['/entidades', 'Entidades | Control Financiero'],
      ['/compartidos', 'Compartidos | Control Financiero'],
      ['/registro-general', 'Registro general | Control Financiero'],
      ['/ingresos', 'Ingresos | Control Financiero'],
      ['/mi-perfil', 'Mi perfil | Control Financiero'],
      ['/configuracion', 'Configuracion | Control Financiero'],
      ['/administracion', 'Administracion | Control Financiero'],
      ['/administracion/usuarios', 'Usuarios del sistema | Control Financiero'],
      [
        '/administracion/estructura-financiera',
        'Estructura financiera | Control Financiero',
      ],
      ['/administracion/plataforma', 'Ajustes de plataforma | Control Financiero'],
      ['/administracion/rediseno-mvp', 'Rediseño MVP | Control Financiero'],
    ]);

    if (location.pathname.startsWith('/entidades/')) {
      document.title = 'Detalle de entidad | Control Financiero';
      return;
    }

    document.title = titleMap.get(location.pathname) ?? 'Control Financiero';
  }, [location.pathname]);

  return null;
}

export function App() {
  return (
    <>
      <DocumentTitleSync />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/entidades" element={<EntitiesPage />} />
        <Route path="/entidades/:entityId" element={<EntityDetailRoute />} />
        <Route path="/compartidos" element={<SharedEntitiesPage />} />
        <Route path="/registro-general" element={<GeneralRecordsPage />} />
        <Route path="/ingresos" element={<IncomesPage />} />
        <Route path="/configuracion" element={<ConfigurationPage />} />
        <Route path="/administracion" element={<AdministrationPage />} />
        <Route path="/administracion/usuarios" element={<AdministrationUsersPage />} />
        <Route
          path="/administracion/estructura-financiera"
          element={<AdministrationFinanceStructurePage />}
        />
        <Route
          path="/administracion/plataforma"
          element={<AdministrationPlatformPage />}
        />
        <Route
          path="/administracion/rediseno-mvp"
          element={<AdministrationRedesignMvpPage />}
        />
        <Route path="/mi-perfil" element={<ProfilePage />} />
        <Route path="/ajustes" element={<Navigate to="/administracion/plataforma" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
