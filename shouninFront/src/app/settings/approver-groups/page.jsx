"use client";
import React from "react";

function MainComponent() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/approver_groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET", tenantId: "t001" }),
      });

      if (!response.ok) {
        throw new Error("承認者グループの取得に失敗しました");
      }

      const data = await response.json();
      setGroups(data.groups || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("承認者グループの取得に失敗しました");
      setLoading(false);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setGroupForm({ name: group.name, description: group.description });
    setMembers(group.members || []);
    setEditMode(false);
  };

  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setGroupForm({ name: "", description: "" });
    setMembers([]);
    setEditMode(true);
  };

  const handleSaveGroup = async () => {
    try {
      const method = selectedGroup ? "PUT" : "POST";
      const response = await fetch("/api/approver_groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          tenantId: "t001",
          id: selectedGroup?.id,
          group: {
            ...groupForm,
            members,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("グループの保存に失敗しました");
      }

      fetchGroups();
      setEditMode(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("グループの保存に失敗しました");
    }
  };

  const handleDeleteGroup = async () => {
    if (
      !selectedGroup ||
      !window.confirm("このグループを削除してもよろしいですか？")
    )
      return;

    try {
      const response = await fetch("/api/approver_groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "DELETE",
          tenantId: "t001",
          id: selectedGroup.id,
        }),
      });

      if (!response.ok) {
        throw new Error("グループの削除に失敗しました");
      }

      fetchGroups();
      setSelectedGroup(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("グループの削除に失敗しました");
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
      <h1 className="text-3xl font-bold mb-8">承認者グループ設定</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">グループ一覧</h2>
            <button
              onClick={handleCreateGroup}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              <i className="fas fa-plus mr-2"></i>
              新規グループ
            </button>
          </div>

          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`border p-4 rounded cursor-pointer transition-colors ${
                  selectedGroup?.id === group.id
                    ? "border-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleGroupSelect(group)}
              >
                <div className="font-medium">{group.name}</div>
                <div className="text-sm text-gray-600">
                  メンバー: {group.members?.length || 0}名
                </div>
              </div>
            ))}
            {groups.length === 0 && (
              <div className="text-gray-500 text-center py-4">
                グループはまだありません
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">
            {editMode ? "グループ編集" : "グループ詳細"}
          </h2>

          {selectedGroup || editMode ? (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">グループ名</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={groupForm.name}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, name: e.target.value })
                  }
                  disabled={!editMode}
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">説明</label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={groupForm.description}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, description: e.target.value })
                  }
                  disabled={!editMode}
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">メンバー</label>
                {editMode ? (
                  <select
                    multiple
                    className="w-full p-2 border rounded"
                    value={members}
                    onChange={(e) =>
                      setMembers(
                        Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        )
                      )
                    }
                  >
                    <option value="user1">ユーザー1</option>
                    <option value="user2">ユーザー2</option>
                    <option value="user3">ユーザー3</option>
                  </select>
                ) : (
                  <div className="bg-gray-50 p-4 rounded">
                    {members.length > 0 ? (
                      members.map((member, index) => (
                        <div key={index} className="flex items-center py-1">
                          <i className="fas fa-user mr-2 text-gray-500"></i>
                          {member}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">メンバーはいません</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {editMode ? (
                  <button
                    onClick={handleSaveGroup}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  >
                    <i className="fas fa-save mr-2"></i>
                    保存
                  </button>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    編集
                  </button>
                )}
                {selectedGroup && (
                  <button
                    onClick={handleDeleteGroup}
                    className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              左側のリストからグループを選択するか、新規グループを作成してください
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;