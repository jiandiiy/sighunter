// 예시: src/components/GameCenter/Admin/index.jsx

import SigImageAdminPage from "./SigImageAdminPage";
import SigResourceAdminPage from "./SigResourceAdminPage";

function AdminRouter() {
  // 라우터 라이브러리에 따라 다르겠지만,
  // 간단한 예로 탭 전환 구조라고 치면:
  const [tab, setTab] = useState("card");

  return (
    <div>
      <div>
        <button onClick={() => setTab("card")}>카드 관리</button>
        <button onClick={() => setTab("resource")}>리소스 관리(이미지)</button>
      </div>

      {tab === "card" && <SigImageAdminPage />}
      {tab === "resource" && <SigResourceAdminPage />}
    </div>
  );
}