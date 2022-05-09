import React = require("react");

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="d-flex mb-3">
        <hr className="my-auto flex-grow-1" />
        <div className="text-muted px-4 small">{title}</div>
        <hr className="my-auto flex-grow-1" />
      </div>
      {children}
    </div>
  );
}
