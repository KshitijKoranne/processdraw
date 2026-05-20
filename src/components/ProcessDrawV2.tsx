"use client";

import WorkflowSafeProcessDraw from "./processdraw/WorkflowSafeProcessDraw";

export default function ProcessDrawV2({ cloud }: { cloud?: any }) {
  return <WorkflowSafeProcessDraw cloud={cloud} />;
}
