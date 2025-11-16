const STATUS_TRANSLATIONS = {
  "تعمل": "Operational",
  "لا تعمل": "Not operational",
  "متوقفة جزئياً": "Partially operational",
  "تعمل بشكل جزئي": "Partially operational",
  "تعمل ولكن لا يمكن الوصول اليه بسبب الوضع الأمني":
    "Operational (unreachable due to security)",
  "تعمل ولكن لا يمكن الوصول اليه لسبب أخر (يرجى التحديد)":
    "Operational (unreachable for another reason)",
};

export function translateStatus(status) {
  if (!status) {
    return "";
  }
  const key = typeof status === "string" ? status.trim() : status;
  return STATUS_TRANSLATIONS[key] ?? key;
}

export function translateStatuses(statuses = []) {
  return statuses.map((status) => ({
    value: status,
    label: translateStatus(status),
  }));
}
