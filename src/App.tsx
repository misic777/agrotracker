import { Route, Routes } from "react-router-dom";
import RequireAccess from "./auth/RequireAccess";
import Layout from "./components/Layout";
import NotFoundPage from "./components/NotFoundPage";
import LoginPage from "./features/auth/LoginPage";
import BalancePage from "./features/balance/BalancePage";
import CostsPage from "./features/costs/CostsPage";
import HomePage from "./features/home/HomePage";
import HouseholdPage from "./features/household/HouseholdPage";
import HouseholdSetupPage from "./features/household/HouseholdSetupPage";
import IncomePage from "./features/income/IncomePage";
import ParcelDetailPage from "./features/parcels/ParcelDetailPage";
import ParcelsPage from "./features/parcels/ParcelsPage";

export default function App() {
  return (
    <Routes>
      {/* Open to everyone */}
      <Route path="prijava" element={<LoginPage />} />
      <Route path="gazdinstvo/novo" element={<HouseholdSetupPage />} />

      {/* Signed-in household members, or the demo */}
      <Route element={<RequireAccess />}>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="parcele" element={<ParcelsPage />} />
          <Route path="parcele/:id" element={<ParcelDetailPage />} />
          <Route path="troskovi" element={<CostsPage />} />
          <Route path="prihodi" element={<IncomePage />} />
          <Route path="bilans" element={<BalancePage />} />
          <Route path="gazdinstvo" element={<HouseholdPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
