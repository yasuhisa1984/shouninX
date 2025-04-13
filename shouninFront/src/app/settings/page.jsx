"use client";
import React from "react";

function MainComponent() {
  const settingsGroups = [
    {
      title: "ユーザー設定",
      icon: "fa-user",
      items: [
        {
          name: "ユーザープロファイル",
          description: "プロフィール情報の確認と編集",
          link: "/setting/profile",
          icon: "fa-id-card",
        },
        {
          name: "通知設定",
          description: "メールやアプリ内通知の設定",
          link: "/setting/notification",
          icon: "fa-bell",
        },
      ],
    },
    {
      title: "承認設定",
      icon: "fa-check-circle",
      items: [
        {
          name: "承認グループ設定",
          description: "承認者グループの管理",
          link: "/setting/approver-group",
          icon: "fa-users",
        },
        {
          name: "委任設定",
          description: "承認権限の委任管理",
          link: "/setting/delegate",
          icon: "fa-exchange-alt",
        },
        {
          name: "承認フロー設定",
          description: "承認ワークフローの設定",
          link: "/setting/approval",
          icon: "fa-sitemap",
        },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">システム設定</h1>

      <div className="space-y-8">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <i className={`fas ${group.icon} text-blue-500 mr-2`}></i>
              {group.title}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item, itemIndex) => (
                <a
                  key={itemIndex}
                  href={item.link}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <i
                        className={`fas ${item.icon} text-blue-500 text-xl`}
                      ></i>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <i className="fas fa-chevron-right text-gray-400"></i>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">システムバージョン: 1.0.0</div>
          <a
            href="/api-docs"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <i className="fas fa-book mr-1"></i>
            API仕様書
          </a>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;