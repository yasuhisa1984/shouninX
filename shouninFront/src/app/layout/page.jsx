"use client";
import React from "react";

function MainComponent({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              <a href="/" className="flex items-center px-4">
                <span className="text-xl font-bold text-blue-600">
                  ワークフローシステム
                </span>
              </a>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <button className="flex items-center text-gray-700 hover:text-gray-900">
                  <i className="fas fa-bell text-xl mr-4"></i>
                </button>
              </div>
              <div className="relative">
                <button className="flex items-center text-gray-700 hover:text-gray-900">
                  <i className="fas fa-user-circle text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        <aside
          className={`bg-gray-800 text-white w-64 fixed h-full transition-transform duration-300 ease-in-out transform md:relative md:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4">
            <nav className="space-y-2">
              <a
                href="/dashboard"
                className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
              >
                <i className="fas fa-home mr-3"></i>
                <span>ダッシュボード</span>
              </a>
              <a
                href="/form"
                className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
              >
                <i className="fas fa-wpforms mr-3"></i>
                <span>フォーム管理</span>
              </a>
              <a
                href="/request"
                className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
              >
                <i className="fas fa-file-alt mr-3"></i>
                <span>申請管理</span>
              </a>
              <a
                href="/approval"
                className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
              >
                <i className="fas fa-check-circle mr-3"></i>
                <span>承認管理</span>
              </a>
              <a
                href="/ocr"
                className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
              >
                <i className="fas fa-file-image mr-3"></i>
                <span>OCR処理</span>
              </a>
              <a
                href="/settings"
                className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
              >
                <i className="fas fa-cog mr-3"></i>
                <span>設定</span>
              </a>
            </nav>
          </div>
        </aside>

        <main className="flex-1 bg-gray-100">
          <div className="p-6">{children}</div>
        </main>
      </div>

      <footer className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <div className="text-gray-500 text-sm">
              © 2025 ワークフローシステム
            </div>
            <div className="flex space-x-4">
              <a
                href="/api-docs"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                API仕様書
              </a>
              <a
                href="/help"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ヘルプ
              </a>
            </div>
          </div>
        </div>
      </footer>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
}

export default MainComponent;