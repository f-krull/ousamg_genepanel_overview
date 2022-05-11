export const formatDate = (d: Date) => d.toISOString().substring(0, 10);

export const formatCoverage = (c: number | undefined): string => {
  if (c === undefined) {
    return naSymbol;
  }
  return `${(c * 100).toFixed(1)}%`;
};

export const formatSegdup = formatCoverage;

export const naSymbol = "-";
