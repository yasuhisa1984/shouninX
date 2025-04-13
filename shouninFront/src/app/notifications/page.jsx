"use client";
import React, { useEffect, useState } from "react";

function MainComponent() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/list-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "t001",
          filter,
          page,
          itemsPerPage,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "リクエストが多すぎます。しばらく待ってから再試行してください。"
          );
        }
        throw new Error("通知の取得に失敗しました");
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (err) {
      console.error("通知の取得エラー:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const toggleReadStatus = async (notificationId, currentStatus) => {
    try {
      setError(null);
      const response = await fetch("/api/mark-notification-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "t001",
          notificationId,
          read: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("通知の状態の更新に失敗しました");
      }

      await fetchNotifications();
    } catch (err) {
      console.error("通知状態の更新エラー:", err);
      setError(err.message);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "approval_request":
        return "fa-file-signature";
      case "approval_result":
        return "fa-check-circle";
      case "ocr_complete":
        return "fa-file-alt";
      case "batch_complete":
        return "fa-tasks";
      default:
        return "fa-bell";
    }
  };

  const content = (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-8">通知一覧</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="space-x-2">
            <button
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
              className={`px-4 py-2 rounded transition-colors ${
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => {
                setFilter("unread");
                setPage(1);
              }}
              className={`px-4 py-2 rounded transition-colors ${
                filter === "unread"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              未読のみ
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 transition-colors ${
                notification.read ? "bg-gray-50" : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="text-xl text-blue-500">
                    <i
                      className={`fas ${getNotificationIcon(
                        notification.type
                      )}`}
                    ></i>
                  </div>
                  <div>
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-gray-600">
                      {notification.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString(
                        "ja-JP"
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    toggleReadStatus(notification.id, notification.read)
                  }
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={notification.read ? "未読にする" : "既読にする"}
                >
                  <i
                    className={`fas ${
                      notification.read ? "fa-envelope-open" : "fa-envelope"
                    }`}
                  ></i>
                </button>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              通知はありません
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
              aria-label="前のページ"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
              aria-label="次のページ"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">読み込み中...</div>
        </div>
      </Layout>
    );
  }

  return <Layout>{content}</Layout>;
}

export default MainComponent;
