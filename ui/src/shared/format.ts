export const formatDate = (d: Date) => d.toISOString().substring(0, 10);

export const formatCoverage = (c: number | undefined): string => {
  if (c === undefined) {
    return naSymbol;
  }
  return `${(c * 100).toFixed(1)}%`;
};

export const formatSegdup = formatCoverage;

export function formatDateFn(d: Date = new Date()) {
  const dyr = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
  const dmo = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(d);
  const ddy = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);
  let dhr = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    hour12: false,
  }).format(d);
  let dmi = new Intl.DateTimeFormat("en", { minute: "2-digit" }).format(d);
  let dsc = new Intl.DateTimeFormat("en", { second: "2-digit" }).format(d);
  // h, m, s won't be zero-padded, we have to fix this
  dhr = dhr.padStart(2, "0");
  dmi = dmi.padStart(2, "0");
  dsc = dsc.padStart(2, "0");
  return `${dyr}-${dmo}-${ddy}_${dhr}-${dmi}-${dsc}`;
}

export const naSymbol = "-";
