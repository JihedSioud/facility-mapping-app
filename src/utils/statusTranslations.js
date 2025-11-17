const EN_MAP = new Map([
  ["تعمل", "Operational"],
  ["لا تعمل", "Not operational"],
  ["متوقفة جزئياً", "Partially operational"],
  ["تعمل بشكل جزئي", "Partially operational"],
  [
    "تعمل ولكن لا يمكن الوصول اليه بسبب الوضع الأمني",
    "Operational (unreachable due to security)",
  ],
  [
    "تعمل ولكن لا يمكن الوصول اليه لسبب أخر (يرجى التحديد)",
    "Operational (unreachable for another reason)",
  ],
]);

const AR_MAP = new Map([
  ["operational", "عاملة"],
  ["active", "عاملة"],
  ["not operational", "غير عاملة"],
  ["inactive", "غير عاملة"],
  ["partially operational", "تعمل جزئياً"],
  ["tعمل", "عاملة"],
  ["لا تعمل", "غير عاملة"],
  ["متوقفة جزئياً", "تعمل جزئياً"],
  ["تعمل بشكل جزئي", "تعمل جزئياً"],
  [
    "operational (unreachable due to security)",
    "عاملة (يتعذر الوصول بسبب الوضع الأمني)",
  ],
  [
    "operational (unreachable for another reason)",
    "عاملة (يتعذر الوصول لسبب آخر)",
  ],
]);

export function translateStatus(status, locale = "en") {
  if (!status) {
    return "";
  }
  const key = status.toString().trim();
  const lower = key.toLowerCase();

  if (locale === "ar") {
    return AR_MAP.get(lower) ?? AR_MAP.get(key) ?? key;
  }

  return EN_MAP.get(key) ?? key;
}

export function translateStatuses(statuses = [], locale = "en") {
  return statuses.map((status) => ({
    value: status,
    label: translateStatus(status, locale),
  }));
}
