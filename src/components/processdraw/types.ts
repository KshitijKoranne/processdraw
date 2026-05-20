export type Side = "left" | "right";

export type SideItem = {
  id: string;
  type: "label" | "equipment" | "ipqc" | string;
  text: string;
  arrowDir: "left" | "right";
};

export type Block = {
  id: string;
  text: string;
  leftItems: SideItem[];
  rightItems: SideItem[];
};

export type Annotation = {
  id: string;
  text: string;
};

export type ArrowAnnotations = Record<number, {
  left: Annotation[];
  right: Annotation[];
}>;

export type DiagramRecord = {
  id?: string;
  _id?: string;
  name?: string;
  blocks?: Block[];
  arrowAnnotations?: ArrowAnnotations;
  settings?: { finalized?: boolean };
  status?: string;
  currentRevision?: number;
  revisionCount?: number;
  rejectionComment?: string;
  rejectedByName?: string;
  approvedByName?: string;
  isOwn?: boolean;
};

export type ModalState =
  | { type: "new" }
  | { type: "edit"; blockId: string }
  | { type: "side"; blockId: string; side: Side; sideType: string }
  | { type: "ann"; index: number; side: Side }
  | { type: "help" };

export type PickerState = { blockId: string; side: Side } | null;
export type BetweenState = { index: number } | null;
