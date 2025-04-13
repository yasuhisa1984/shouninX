"use client";
import React, { useEffect, useState } from "react";

function MainComponent() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    systemNotifications: true,
    deadlineAlerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET", tenantId: "t001" }),
      });

      if (!response.ok) {
        throw new Error("通知設定の取得に失敗しました");
      }

      const data = await response.json();
      setPreferences(data.preferences || preferences);
    } catch (err) {
      console.error(err);
      setError("通知設定の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/update-notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "t001",
          preferences: preferences,
        }),
      });

      if (!response.ok) {
        throw new Error("通知設定の保存に失敗しました");
      }

      setSuccessMessage("設定を保存しました");
    } catch (err) {
      console.error(err);
      setError("通知設定の保存に失敗しました");
    }
  };

  if (loading) {
    return <></>;
  }

  return <></>;
}

export default MainComponent;
