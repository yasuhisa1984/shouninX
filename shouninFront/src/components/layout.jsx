"use client";
import React, { useState } from "react";

export default function MainLayout({ children }) {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState(null);

  const menuItems = [
    { icon: "fa-home", text: "ホーム", href: "/" },
    { icon: "fa-file-alt", text: "申請一覧", href: "/requests" },
    { icon: "fa-bell", text: "通知", href: "/notifications" },
    { icon: "fa-file-upload", text: "OCR", href: "/ocr/documents" },
    {
      icon: "fa-cog",
      text: "設定",
      subItems: [
        { text: "承認設定", href: "/settings/approvals" },
        { text: "承認グループ", href: "/settings/approver-groups" },
        { text: "代理承認", href: "/settings/delegates" },
        { text: "通知設定", href: "/settings/notifications" },
        { text: "プロフィール", href: "/settings/profile" },
      ],
    },
  ];

  const handleMenuClick = (item) => {
    if (item.subItems) {
      setOpenSubMenu(openSubMenu === item.text ? null : item.text);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm fixed w-full z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center">
            <button
              onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none md:hidden"
              aria-label="メニューを開く"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
            <h1 className="ml-4 text-xl font-bold text-gray-800">
              ワークフローシステム
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/notifications" className="text-gray-500 hover:text-gray-700" aria-label="通知">
              <i className="fas fa-bell text-xl"></i>
            </a>
            <a href="/settings/profile" className="text-gray-500 hover:text-gray-700" aria-label="プロフィール">
              <i className="fas fa-user-circle text-xl"></i>
            </a>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        <aside
          className={`fixed left-0 z-20 h-full bg-white shadow-lg transition-transform duration-300 transform ${
            isSideMenuOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:static md:w-64`}
        >
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.text}>
                  {item.subItems ? (
                    <div>
                      <button
                        onClick={() => handleMenuClick(item)}
                        className="flex items-center justify-between w-full px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-3">
                          <i className={`fas ${item.icon} w-5`}></i>
                          <span>{item.text}</span>
                        </div>
                        <i className={`fas fa-chevron-${openSubMenu === item.text ? "up" : "down"}`}></i>
                      </button>
                      {openSubMenu === item.text && (
                        <ul className="ml-8 mt-2 space-y-2">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.text}>
                              <a href={subItem.href} className="block px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100">
                                {subItem.text}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <a href={item.href} className="flex items-center space-x-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                      <i className={`fas ${item.icon} w-5`}></i>
                      <span>{item.text}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 p-6 md:ml-64">
          {isSideMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
              onClick={() => setIsSideMenuOpen(false)}
            ></div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
