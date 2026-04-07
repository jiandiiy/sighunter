import { useState } from "react";

import SigImageAdminPage from "./pages/SigImageAdminPage";

export default function AdminRouter() {
  const [tab, setTab] = useState<"card" | "resource">("card");

  return (
    <div>
      <div>
        <button onClick={() => setTab("card")}>카드 관리</button>
      </div>

      {tab === "card" && <SigImageAdminPage />}
    </div>
  );
}