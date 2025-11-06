import {AnimatePresence} from "framer-motion";
import {AuthProvider} from "@/context/AuthContext.tsx";
import {Navigate, Route, Routes, useLocation} from "react-router-dom";
import NotFound from "@/pages/NotFound.tsx";
import {Login} from "@/pages/Authentication/Login.tsx";
import Authentication from "@/pages/Authentication";
import Layout from "@/components/layout/Layout";
import { Path } from "@/lib/types"
import NewHomePage from "@/pages/NewHomePage.tsx";
import {PrivateRoute} from "@/routes/PrivateRoute.tsx";
import CampaignPage from "@/pages/CampaignPage.tsx";
import CampaignDetailsPage from "@/pages/CampaignDetailsPage.tsx";
import ProspectsPage from "@/pages/ProspectsPage.tsx";
import KnowledgeBase from "@/pages/Agent/components/KnowledgeBase.tsx";
import WorkflowPage from "@/pages/WorkflowPage/WorkflowPage.tsx";
import AnalyticsPage from "@/pages/Analytics.tsx";
import Settings from "@/pages/SettingsPage.tsx";
import DomainConfigPage from "@/pages/DomainConfigPage.tsx";
import AdminDashboard from "@/pages/AdminDashboard.tsx";

export const AnimatedRoutes = ()=> {
  return (
    <AnimatePresence>
      <AuthProvider>
        <Routes location={useLocation()}>
          <Route key={Path.AUTH} path={Path.AUTH} element={<Authentication />}>
            <Route path={Path.LOGIN} element={<Login />} />
          </Route>
          <Route
            key={Path.HOME}
            path={Path.HOME}
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
            >
            <Route key={Path.HOME} index element={<NewHomePage />} />
            <Route key={Path.CAMPAIGN} path={Path.CAMPAIGN} element={<CampaignPage />} />
            <Route
              key={`${Path.CAMPAIGN}_DETAILS`}
              path={`${Path.CAMPAIGN}/:id`}
              element={<CampaignDetailsPage />}
            >
              <Route index element={<Navigate to="settings" replace />} />
              <Route key={Path.PROSPECTS} path={Path.PROSPECTS} element={<ProspectsPage />} />
              <Route key={Path.KNOWLEDGE_BASE} path={Path.KNOWLEDGE_BASE} element={<KnowledgeBase />} />
              <Route key={Path.WORKFLOW} path={Path.WORKFLOW} element={<WorkflowPage />} />
              <Route key={Path.ANALYTICS} path={Path.ANALYTICS} element={<AnalyticsPage />} />
              <Route key={Path.SETTINGS} path={Path.SETTINGS} element={<Settings />} />
            </Route>
            <Route key={Path.SETTINGS} path={Path.SETTINGS} element={<Settings />} />
            <Route key={Path.DOMAIN_CONFIGS} path={Path.DOMAIN_CONFIGS} element={<DomainConfigPage />} />
            <Route key={Path.ADMIN} path={Path.ADMIN} element={<AdminDashboard />} />
          </Route>
          <Route key="*" path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </AnimatePresence>
  );
};