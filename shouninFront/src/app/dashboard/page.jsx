"use client";

import React, { useEffect, useState } from "react";

function MainComponent() {
  const [dashboardData, setDashboardData] = useState({
    forms: { total: 0, recent: [] },
    requests: { total: 0, recent: [] },
    pendingApprovals: { total: 0, recent: [] },
    ocrDocuments: { total: 0, recent: [] },
    notifications: { total: 0, recent: [] },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const responses = await Promise.all([
        fetch("/api/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "GET", tenantId: "t001" }),
        }),
        fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "GET", tenantId: "t001" }),
        }),
        fetch("/api/approvals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "GET", tenantId: "t001" }),
        }),
        fetch("/api/ocr_documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "GET", tenantId: "t001" }),
        }),
        fetch("/api/list_notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId: "t001" }),
        }),
      ]);

      const [forms, requests, approvals, ocr, notifications] =
        await Promise.all(
          responses.map(async (response) => {
            if (!response.ok) {
              throw new Error(`API error: ${response.statusText}`);
            }
            return response.json();
          })
        );

      setDashboardData({
        forms: {
          total: forms.forms?.length || 0,
          recent: (forms.forms || []).slice(0, 5),
        },
        requests: {
          total: requests.requests?.length || 0,
          recent: (requests.requests || []).slice(0, 5),
        },
        pendingApprovals: {
          total: approvals.pending?.length || 0,
          recent: (approvals.pending || []).slice(0, 5),
        },
        ocrDocuments: {
          total: ocr.documents?.length || 0,
          recent: (ocr.documents || []).slice(0, 5),
        },
        notifications: {
          total: notifications.notifications?.length || 0,
          recent: (notifications.notifications || []).slice(0, 5),
        },
      });
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="フォーム管理"
          icon="fa-wpforms"
          count={dashboardData.forms.total}
          items={dashboardData.forms.recent}
          itemRenderer={(form) => (
            <a href={`/form/${form.id}`} className="hover:underline">
              {form.name}
            </a>
          )}
          link="/form"
          actionText="フォーム作成"
          actionLink="/form/new"
        />

        <DashboardCard
          title="申請管理"
          icon="fa-file-alt"
          count={dashboardData.requests.total}
          items={dashboardData.requests.recent}
          itemRenderer={(request) => (
            <a href={`/request/${request.id}`} className="hover:underline">
              {request.form_name || "未設定"}
            </a>
          )}
          link="/request"
          actionText="新規申請"
          actionLink="/request/new"
        />

        <DashboardCard
          title="承認待ち"
          icon="fa-clock"
          count={dashboardData.pendingApprovals.total}
          items={dashboardData.pendingApprovals.recent}
          itemRenderer={(approval) => (
            <a href={`/approval/${approval.id}`} className="hover:underline">
              {approval.request_name || "未設定"}
            </a>
          )}
          link="/approval"
          actionText="承認一覧"
          actionLink="/approval"
        />

        <DashboardCard
          title="OCR処理"
          icon="fa-file-image"
          count={dashboardData.ocrDocuments.total}
          items={dashboardData.ocrDocuments.recent}
          itemRenderer={(doc) => (
            <a href={`/ocr/${doc.id}`} className="hover:underline">
              {doc.filename}
            </a>
          )}
          link="/ocr"
          actionText="OCR実行"
          actionLink="/ocr/upload"
        />

        <DashboardCard
          title="通知"
          icon="fa-bell"
          count={dashboardData.notifications.total}
          items={dashboardData.notifications.recent}
          itemRenderer={(notification) => (
            <a
              href={`/notification/${notification.id}`}
              className="hover:underline"
            >
              {notification.title}
            </a>
          )}
          link="/notification"
          actionText="全て見る"
          actionLink="/notification"
        />

        <DashboardCard
          title="設定"
          icon="fa-cog"
          items={[
            { name: "承認グループ設定", link: "/setting/approver-group" },
            { name: "委任設定", link: "/setting/delegate" },
            { name: "通知設定", link: "/setting/notification" },
            { name: "承認フロー設定", link: "/setting/approval" },
            { name: "ユーザープロファイル", link: "/setting/profile" },
          ]}
          itemRenderer={(item) => (
            <a
              href={item.link}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {item.name}
            </a>
          )}
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  icon,
  count,
  items = [],
  itemRenderer,
  link,
  actionText,
  actionLink,
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <i className={`fas ${icon} text-blue-500 mr-2`}></i>
          {title}
        </h2>
        {typeof count === "number" && (
          <span className="text-2xl font-bold text-blue-600">{count}</span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="text-gray-700 hover:bg-gray-50 p-2 rounded transition-colors"
          >
            {itemRenderer(item)}
          </div>
        ))}
      </div>

      {actionText && actionLink && (
        <div className="mt-4">
          <a
            href={actionLink}
            className="block w-full bg-blue-500 text-white text-center py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            {actionText}
          </a>
        </div>
      )}

      {link && (
        <div className="mt-2 text-right">
          <a
            href={link}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            すべて表示 →
          </a>
        </div>
      )}
    </div>
  );
}

export default MainComponent;
