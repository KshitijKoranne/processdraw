"use client";

import ProductionProcessDraw from "./processdraw/ProductionProcessDraw";

export default function ProcessDrawV2({ cloud }: { cloud?: any }) {
  return <ProductionProcessDraw cloud={cloud} />;
}
