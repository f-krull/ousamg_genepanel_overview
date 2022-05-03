import React = require("react");

export function Description({
  k,
  v,
}: {
  k: React.ReactNode;
  v: React.ReactNode;
}) {
  return (
    <div className="row mb-3">
      <div className="col-sm-2 text-muted">{k}</div>
      <div className="col-sm-10">{v}</div>
    </div>
  );
}
