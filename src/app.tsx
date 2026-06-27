import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import CodeGeneratorPage from "@/pages/CodeGeneratorPage/CodeGeneratorPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CodeGeneratorPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
