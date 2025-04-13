"use client";
import React from "react";

function MainComponent() {
  const Layout = window.getLayout?.() || (({ children }) => children);
  const [error, setError] = useState(null);

  useEffect(() => {
    // インラインでスタイルを定義
    const style = document.createElement("style");
    style.textContent = `
      .api-docs pre {
        background-color: #f3f4f6;
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
      }
      .api-docs code {
        font-family: monospace;
      }
      .api-docs h3 {
        color: #1a56db;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 api-docs">
        <h1 className="text-3xl font-bold mb-8">API仕様書</h1>

        <div className="space-y-12">
          {/* フォーム管理 API */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">フォーム管理 API</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-2">POST /api/forms</h3>
                <p className="text-gray-600 mb-4">
                  フォームの取得・作成・更新・削除を行います
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">リクエストボディ</h4>
                <pre className="text-sm">
                  {`{
  "method": "GET" | "POST" | "PUT" | "DELETE",  // 実行する操作
  "tenantId": "string",                         // テナントID
  "name": "string",                             // フォーム名（POST/PUT時）
  "schemaJson": object                          // フォームのスキーマ定義（POST/PUT時）
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">レスポンス (200 OK)</h4>
                <pre className="text-sm">
                  {`{
  "forms": [
    {
      "id": "uuid",
      "name": "string",
      "schema_json": "string",
      "created_at": "date-time"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* 申請管理 API */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">申請管理 API</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-2">POST /api/requests</h3>
                <p className="text-gray-600 mb-4">
                  申請の作成・取得・更新を行います
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">リクエストボディ</h4>
                <pre className="text-sm">
                  {`{
  "method": "GET" | "POST" | "PUT",             // 実行する操作
  "tenantId": "string",                         // テナントID
  "formId": "uuid",                             // フォームID（POST時必須）
  "dataJson": "string",                         // 申請データ（JSON文字列、POST時必須）
  "attachments": [                              // 添付ファイル情報（オプション）
    {
      "url": "string",
      "type": "string"
    }
  ],
  "approvalSteps": ["string"]                   // 承認ステップ設定（オプション）
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">レスポンス (200 OK)</h4>
                <pre className="text-sm">
                  {`{
  "requests": [
    {
      "id": "uuid",
      "form_name": "string",
      "data_json": "string",
      "status": "pending" | "approved" | "rejected",
      "created_at": "date-time",
      "attachments": [
        {
          "id": "uuid",
          "file_url": "string",
          "file_type": "string"
        }
      ],
      "approval_steps": [
        {
          "id": "uuid",
          "step_number": "integer",
          "status": "pending" | "approved" | "rejected",
          "approver_id": "string",
          "comment": "string"
        }
      ]
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* 承認管理 API */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">承認管理 API</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  POST /api/approvals
                </h3>
                <p className="text-gray-600 mb-4">申請の承認・却下を行います</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">リクエストボディ</h4>
                <pre className="text-sm">
                  {`{
  "tenantId": "string",                         // テナントID
  "requestId": "uuid",                          // 申請ID
  "action": "approve" | "reject",               // 承認アクション
  "comment": "string"                           // 承認コメント
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">レスポンス (200 OK)</h4>
                <pre className="text-sm">
                  {`{
  "success": boolean,
  "message": "string"
}`}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default MainComponent;