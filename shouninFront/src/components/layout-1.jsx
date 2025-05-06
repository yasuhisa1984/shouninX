"use client";
import React, { useState } from "react";

/**
 * MainLayoutコンポーネント:
 *  - モバイルメニューの開閉
 *  - メニューリスト表示
 *  - childrenでメインコンテンツを受け取る
 */
export default function MainLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // サーバーサイドでは window が無いので保護
  const location =
    typeof window !== "undefined" ? window.location.pathname : "";

  const menuItems = [
    { path: "/", label: "ダッシュボード", icon: "fa-home" },
    { path: "/request", label: "申請一覧", icon: "fa-list" },
    { path: "/forms", label: "フォーム管理", icon: "fa-file-alt" },
    { path: "/ocr/documents", label: "OCR管理", icon: "fa-file-image" },
    { path: "/settings/approvals", label: "承認設定", icon: "fa-check-circle" },
    { path: "/settings/notifications", label: "通知設定", icon: "fa-bell" },
    { path: "/settings/profile", label: "ユーザー設定", icon: "fa-user" },
  ];

  const isActive = (path) => {
    // ルート("/")だけ特別扱い
    if (path === "/") {
      return location === "/";
    }
    // それ以外は pathで始まるかどうか
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen flex">
      {/* サイドメニュー */}
      <div
        className={`fixed md:relative md:flex flex-col w-64 bg-[#1a237e] text-white h-screen transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-[#3949ab]">
          <h1 className="text-2xl font-bold">ShouninX</h1>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center px-6 py-3 text-sm ${
                isActive(item.path)
                  ? "bg-[#3949ab]"
                  : "hover:bg-[#283593] transition-colors"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className={`fas ${item.icon} w-5`}></i>
              <span className="ml-3">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* メイン表示 */}
      <div className="flex-1">
        {/* モバイル時のトップバー */}
        <div className="md:hidden bg-[#1a237e] text-white p-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-2xl"
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>

        <main className="p-6">
          {children}
        </main>
      </div>

      {/* モバイルメニューが開いている時の背景クリック */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}
