import type { PlatformRole } from "@/lib/auth/roles";
import { DESIGNER_ROSTER, resolveDesignerAlias } from "@/lib/team/designers";
import type { Database } from "@/types/database";

type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
type IssueRow = Database["public"]["Tables"]["ticket_issues"]["Row"];

export type DashboardMode =
  | "pm"
  | "qc"
  | "designer"
  | "distribution"
  | "transmission"
  | "client";

export type WorkspaceScreen = "dashboard" | "tickets";

export type WorkspaceTicket = {
  id: string;
  title: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "New" | "In Progress" | "Under Review" | "Complete" | "On Hold";
  legacyStatus: string;
  projectType: "Distribution" | "Transmission" | "Other";
  team: "Alpha" | "Bravo" | "Charlie";
  designerId: string;
  designerName: string;
  dueDate: string;
  timeInQueueDays: number;
  tags: string[];
  issueCount: number;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  poleCode: string;
  documentFlags: string[];
};

export type DesignerPoolMember = {
  id: string;
  name: string;
  team: "Alpha" | "Bravo" | "Charlie";
  availability: "Available" | "Busy" | "Offline";
  workload: number;
};

export type ImportedFolderBatch = {
  id: string;
  folderName: string;
  title: string;
  description: string;
  dueDate: string;
  priority: WorkspaceTicket["priority"];
  projectType: WorkspaceTicket["projectType"];
  team: WorkspaceTicket["team"];
  designerName: string;
  tags: string[];
  files: string[];
  documentFlags: string[];
  missingDocuments: string[];
};

export type DraftTicketInput = {
  title: string;
  description: string;
  dueDate: string;
  projectType: WorkspaceTicket["projectType"];
  team: WorkspaceTicket["team"];
  designerName: string;
  tags: string[];
  cloudLink: string;
  attachmentNames: string[];
};

const REQUIRED_QC_DOCS = ["Material List", "BM"];
export const REQUIRED_QC_DOCUMENTS = REQUIRED_QC_DOCS;

function hash(input: string) {
  let value = 0;

  for (let index = 0; index < input.length; index += 1) {
    value = (value << 5) - value + input.charCodeAt(index);
    value |= 0;
  }

  return Math.abs(value);
}

export function getPriorityFromDueDate(dueDateInput: string | null | undefined) {
  if (!dueDateInput) return "Medium" as const;

  const dueDate = new Date(dueDateInput);
  if (Number.isNaN(dueDate.getTime())) return "Medium" as const;

  const now = new Date();
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilDue <= 1) return "Critical" as const;
  if (daysUntilDue <= 3) return "High" as const;
  if (daysUntilDue <= 7) return "Medium" as const;
  return "Low" as const;
}

export function parseDueDateInput(input: string) {
  const trimmed = input.trim();

  if (!trimmed) return null;

  if (trimmed.toLowerCase() === "today") {
    return new Date().toISOString();
  }

  if (trimmed.toLowerCase() === "tomorrow") {
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function mapStatus(status: TicketRow["status"]): WorkspaceTicket["status"] {
  switch (status) {
    case "Submitted":
      return "New";
    case "In QA":
      return "Under Review";
    case "Approved":
      return "Complete";
    case "Rejected":
      return "On Hold";
    default:
      return "In Progress";
  }
}

function inferProjectType(ticket: TicketRow): WorkspaceTicket["projectType"] {
  const value = hash(ticket.id + ticket.client_name) % 3;

  if (value === 0) return "Distribution";
  if (value === 1) return "Transmission";
  return "Other";
}

function inferTeam(ticket: TicketRow): WorkspaceTicket["team"] {
  const value = hash(ticket.pole_code) % 3;

  if (value === 0) return "Alpha";
  if (value === 1) return "Bravo";
  return "Charlie";
}

function pickDesigner(ticket: TicketRow) {
  return resolveDesignerAlias(ticket.designer_id);
}

function inferDueDate(ticket: TicketRow, issueCount: number) {
  const updatedAt = new Date(ticket.updated_at);
  const statusOffset = {
    Submitted: 2,
    "In QA": 1,
    "Issues Found": 0,
    Rework: 3,
    Approved: 8,
    Rejected: -1,
  }[ticket.status];
  const variability = (hash(ticket.id) % 4) - issueCount;

  return new Date(
    updatedAt.getTime() + (statusOffset + variability) * 24 * 60 * 60 * 1000,
  ).toISOString();
}

function classifyDocument(name: string) {
  const value = name.toLowerCase();

  if (value.includes("material list") || value.includes("mat list")) return "Material List";
  if (value.includes("bill of materials") || /\bbm\b/.test(value)) return "BM";
  if (value.endsWith(".dwg") || value.includes("plan")) return "Drawing";
  if (value.endsWith(".pdf")) return "PDF";
  if (value.endsWith(".xlsx") || value.endsWith(".xls")) return "Spreadsheet";
  if (value.endsWith(".png") || value.endsWith(".jpg") || value.endsWith(".jpeg")) return "Photo";

  return "Reference";
}

function inferDocumentFlags(ticket: TicketRow, issues: IssueRow[]) {
  const flags = new Set<string>();

  if (issues.some((issue) => issue.title.toLowerCase().includes("material"))) {
    flags.add("Material List");
  }

  if (hash(ticket.id) % 2 === 0) {
    flags.add("BM");
  }

  flags.add("Drawing");

  return Array.from(flags);
}

function buildDescription(ticket: TicketRow, issues: IssueRow[]) {
  const issuePreview = issues[0]?.title;

  if (issuePreview) {
    return `${ticket.client_name} needs review attention. Latest issue: ${issuePreview}.`;
  }

  return `${ticket.client_name} ${ticket.pole_code} is being tracked through the PM platform with scoped team and designer assignment.`;
}

export function buildWorkspaceTickets(tickets: TicketRow[], issues: IssueRow[]) {
  const issuesByTicket = new Map<string, IssueRow[]>();

  issues.forEach((issue) => {
    const list = issuesByTicket.get(issue.ticket_id) ?? [];
    list.push(issue);
    issuesByTicket.set(issue.ticket_id, list);
  });

  return tickets.map((ticket) => {
    const assignedIssues = issuesByTicket.get(ticket.id) ?? [];
    const designer = pickDesigner(ticket);
    const createdAt = new Date(ticket.created_at);
    const dueDate = inferDueDate(ticket, assignedIssues.length);
    const projectType = inferProjectType(ticket);
    const team = inferTeam(ticket);
    const documentFlags = inferDocumentFlags(ticket, assignedIssues);

    return {
      id: ticket.id,
      title: `${ticket.client_name} / ${ticket.pole_code}`,
      description: buildDescription(ticket, assignedIssues),
      priority: getPriorityFromDueDate(dueDate),
      status: mapStatus(ticket.status),
      legacyStatus: ticket.status,
      projectType,
      team,
      designerId: designer.id,
      designerName: designer.name,
      dueDate,
      timeInQueueDays: Number(
        ((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)).toFixed(1),
      ),
      tags: [projectType, team, ticket.status, ...documentFlags],
      issueCount: assignedIssues.length,
      attachmentCount: documentFlags.length + 1,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      clientName: ticket.client_name,
      poleCode: ticket.pole_code,
      documentFlags,
    } satisfies WorkspaceTicket;
  });
}

export function buildDesignerPool(tickets: WorkspaceTicket[]): DesignerPoolMember[] {
  return DESIGNER_ROSTER.map((designer) => {
    const workload = tickets.filter((ticket) => ticket.designerName === designer.name).length;
    const availability =
      workload >= 4 ? "Busy" : workload === 0 ? "Offline" : "Available";

    return {
      id: designer.id,
      name: designer.name,
      team: designer.team,
      availability,
      workload,
    };
  });
}

export function getDashboardTitle(mode: DashboardMode) {
  switch (mode) {
    case "qc":
      return "QC Review Dashboard";
    case "distribution":
      return "Distribution Dashboard";
    case "transmission":
      return "Transmission Dashboard";
    case "designer":
      return "Designer Dashboard";
    case "client":
      return "Client Dashboard";
    default:
      return "PM Overview";
  }
}

export function getDashboardFocus(mode: DashboardMode) {
  switch (mode) {
    case "qc":
      return "Review readiness, document completeness, and due-date pressure.";
    case "designer":
      return "Assigned work, turnaround, and revision pressure.";
    case "distribution":
      return "Distribution-specific intake, timelines, and designer load.";
    case "transmission":
      return "Transmission queue health, timeline, and critical path visibility.";
    case "client":
      return "Read-only project progress, due dates, and document visibility.";
    default:
      return "Cross-team visibility, overdue risk, and workload planning.";
  }
}

export function scopeTicketsByMode(
  tickets: WorkspaceTicket[],
  mode: DashboardMode,
  options?: {
    designerName?: string | null;
    teamLabels?: string[];
    roles?: PlatformRole[];
  },
) {
  const teamLabels = options?.teamLabels ?? [];
  const teamScopedTickets =
    teamLabels.length > 0 ? tickets.filter((ticket) => teamLabels.includes(ticket.team)) : tickets;

  switch (mode) {
    case "qc":
      return teamScopedTickets.filter((ticket) =>
        ["New", "In Progress", "Under Review", "On Hold"].includes(ticket.status),
      );
    case "designer":
      return options?.designerName
        ? teamScopedTickets.filter((ticket) => ticket.designerName === options.designerName)
        : teamScopedTickets;
    case "distribution":
      return teamScopedTickets.filter((ticket) => ticket.projectType === "Distribution");
    case "transmission":
      return teamScopedTickets.filter((ticket) => ticket.projectType === "Transmission");
    case "client":
      return teamScopedTickets.filter((ticket) =>
        ["Distribution", "Transmission"].includes(ticket.projectType),
      );
    default:
      return teamScopedTickets;
  }
}

export function createDraftTicket(input: DraftTicketInput) {
  const dueDate = input.dueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const tags = input.tags.filter(Boolean);
  const documentFlags = input.attachmentNames.map(classifyDocument);

  return {
    id: `DRAFT-${Date.now()}`,
    title: input.title,
    description: input.description,
    priority: getPriorityFromDueDate(dueDate),
    status: "New",
    legacyStatus: "Draft",
    projectType: input.projectType,
    team: input.team,
    designerId: `${input.designerName.toLowerCase().replaceAll(" ", "-")}-id`,
    designerName: input.designerName,
    dueDate,
    timeInQueueDays: 0,
    tags: unique([input.projectType, input.team, ...tags, ...documentFlags]),
    issueCount: 0,
    attachmentCount: input.attachmentNames.length + (input.cloudLink ? 1 : 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clientName: input.title,
    poleCode: input.projectType === "Distribution" ? "DIST-DRAFT" : "TRAN-DRAFT",
    documentFlags,
  } satisfies WorkspaceTicket;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function inferBatchFolderName(file: File) {
  const relativePath = file.webkitRelativePath || file.name;
  const parts = relativePath.split("/").filter(Boolean);

  if (parts.length >= 3) {
    return parts[1];
  }

  if (parts.length >= 2) {
    return parts[0];
  }

  return file.name.replace(/\.[^.]+$/, "");
}

export function buildImportBatches(
  files: File[],
  options: {
    dueDatePrompt: string;
    defaultTeam: WorkspaceTicket["team"];
    defaultDesignerName: string;
  },
) {
  const grouped = new Map<string, File[]>();

  files.forEach((file) => {
    const folderName = inferBatchFolderName(file);
    const list = grouped.get(folderName) ?? [];
    list.push(file);
    grouped.set(folderName, list);
  });

  return Array.from(grouped.entries()).map(([folderName, folderFiles], index) => {
    const documentFlags = unique(folderFiles.map((file) => classifyDocument(file.name)));
    const missingDocuments = REQUIRED_QC_DOCS.filter(
      (documentType) => !documentFlags.includes(documentType),
    );
    const folderDueDate =
      parseDueDateInput(folderName) ?? parseDueDateInput(options.dueDatePrompt) ?? "";
    const projectType =
      folderName.toLowerCase().includes("trans") ? "Transmission" : "Distribution";

    return {
      id: `import-${index}-${folderName}`,
      folderName,
      title: `${folderName} QC intake`,
      description: `Imported from ${folderName}. ${documentFlags.join(", ")} detected from the folder structure.`,
      dueDate: folderDueDate,
      priority: getPriorityFromDueDate(folderDueDate),
      projectType,
      team: options.defaultTeam,
      designerName: options.defaultDesignerName,
      tags: unique(["Imported Folder", projectType, ...documentFlags]),
      files: folderFiles.map((file) => file.webkitRelativePath || file.name),
      documentFlags,
      missingDocuments,
    } satisfies ImportedFolderBatch;
  });
}
