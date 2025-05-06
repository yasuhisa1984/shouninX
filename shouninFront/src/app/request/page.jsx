"use client";
import React, { useEffect, useState } from "react";

function MainComponent() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("http://localhost:8000/requests/", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`申請一覧の取得に失敗しました [${response.status}] ${response.statusText}`);
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
      setError("申請一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const statusText = {
      pending: "承認待ち",
      approved: "承認済み",
      rejected: "却下",
    };

    return (
      <span className={`px-2 py-1 rounded text-sm ${statusConfig[status] || "bg-gray-100 text-gray-800"}`}>
        {statusText[status] || "未設定"}
      </span>
    );
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">申請一覧</h1>
        <a
          href="/request/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <i className="fas fa-plus mr-2"></i>新規申請
        </a>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                申請日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                フォーム名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(request.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {request.form_name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(request.status || "pending")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  申請がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">申請詳細</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">フォーム名</h3>
                <p>{selectedRequest.form_name || "-"}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">申請日時</h3>
                <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">ステータス</h3>
                <div className="mt-1">
                  {getStatusBadge(selectedRequest.status || "pending")}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">申請内容</h3>
                <div className="mt-2 space-y-2">
                  {Object.entries(JSON.parse(selectedRequest.data_json || "{}")).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4">
                      <div className="font-medium text-gray-600">{key}</div>
                      <div className="col-span-2">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {Array.isArray(selectedRequest.approval_steps) && (
                <div>
                  <h3 className="font-medium text-gray-700">承認履歴</h3>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.approval_steps.map((step, index) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-4">
                        <div className="text-sm text-gray-600">ステップ {step.step_number}</div>
                        <div>{getStatusBadge(step.status || "pending")}</div>
                        {step.comment && <div className="mt-1 text-gray-600">{step.comment}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;

