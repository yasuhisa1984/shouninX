"use client";
import React from "react";

function MainComponent() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [approvalSteps, setApprovalSteps] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET", tenantId: "t001" }),
      });

      if (!response.ok) {
        throw new Error("フォーム一覧の取得に失敗しました");
      }

      const data = await response.json();
      setForms(data.forms || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("フォーム一覧の取得に失敗しました");
      setLoading(false);
    }
  };

  const addApprovalStep = () => {
    setApprovalSteps([
      ...approvalSteps,
      { id: Date.now(), approvers: [], order: approvalSteps.length + 1 },
    ]);
  };

  const removeApprovalStep = (stepId) => {
    setApprovalSteps(approvalSteps.filter((step) => step.id !== stepId));
  };

  const moveApprovalStep = (stepId, direction) => {
    const stepIndex = approvalSteps.findIndex((step) => step.id === stepId);
    if (
      (direction === "up" && stepIndex === 0) ||
      (direction === "down" && stepIndex === approvalSteps.length - 1)
    )
      return;

    const newSteps = [...approvalSteps];
    const temp = newSteps[stepIndex];
    newSteps[stepIndex] = newSteps[stepIndex + (direction === "up" ? -1 : 1)];
    newSteps[stepIndex + (direction === "up" ? -1 : 1)] = temp;
    setApprovalSteps(newSteps);
  };

  const updateApprovers = (stepId, approvers) => {
    setApprovalSteps(
      approvalSteps.map((step) =>
        step.id === stepId ? { ...step, approvers } : step
      )
    );
  };

  const saveApprovalFlow = async () => {
    if (!selectedForm) return;

    try {
      const response = await fetch("/api/approval_settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "t001",
          formId: selectedForm.id,
          approvalSteps,
        }),
      });

      if (!response.ok) {
        throw new Error("承認フロー設定の保存に失敗しました");
      }

      setError(null);
    } catch (err) {
      console.error(err);
      setError("承認フロー設定の保存に失敗しました");
    }
  };

  if (loading) {
    return <></>;
  }

  return <></>;
}

export default MainComponent;