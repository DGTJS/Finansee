const businessTimeZone = "America/Sao_Paulo";

export function getBusinessMonth(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: businessTimeZone }).format(date).slice(0, 7);
}

export function getBusinessMonthRange(date = new Date()) {
  const month = getBusinessMonth(date);
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

export function getBusinessDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: businessTimeZone }).format(date);
}
