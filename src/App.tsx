import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import NotFoundPage from "./components/NotFoundPage";
import BalancePage from "./features/balance/BalancePage";
import CostsPage from "./features/costs/CostsPage";
import HomePage from "./features/home/HomePage";
import IncomePage from "./features/income/IncomePage";
import ParcelDetailPage from "./features/parcels/ParcelDetailPage";
import ParcelsPage from "./features/parcels/ParcelsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="parcele" element={<ParcelsPage />} />
        <Route path="parcele/:id" element={<ParcelDetailPage />} />
        <Route path="troskovi" element={<CostsPage />} />
        <Route path="prihodi" element={<IncomePage />} />
        <Route path="bilans" element={<BalancePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
