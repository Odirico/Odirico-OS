"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import type { UserContext } from "@/lib/auth/roles";
import { useSettings } from "@/lib/settings/client";
import {
  REQUIRED_QC_DOCUMENTS,
  buildDesignerPool,
  buildImportBatches,
  buildWorkspaceTickets,
  createDraftTicket,
  getDashboardFocus,
  getPriorityFromDueDate,
  parseDueDateInput,
  scopeTicketsByMode,
  type DashboardMode,
  type WorkspaceScreen,
  type WorkspaceTicket,
} from "@/lib/tickets/workspace";
import type { Database } from "@/types/database";

type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
type IssueRow = Database["public"]["Tables"]["ticket_issues"]["Row"];

type TicketWorkspaceProps = {
  initialTickets: TicketRow[];
  initialIssues: IssueRow[];
  userContext: UserContext;
  screen: WorkspaceScreen;
};

type FilterState = {
  priority: string;
  status: string;
  projectType: string;
  team: string;
  designer: string;
};

type SavedPreset = {
  id: string;
  label: string;
  filters: FilterState;
};

type DraftForm = {
  title: string;
  description: string;
  projectType: WorkspaceTicket["projectType"];
  team: WorkspaceTicket["team"];
  designerName: string;
  dueDatePrompt: string;
  dueDate: string;
  tags: string;
  cloudLink: string;
  attachmentNames: string[];
};

const FILTERS_KEY = "poleqa-ticket-filters-v3";
const PRESETS_KEY = "poleqa-filter-presets-v3";

const defaultFilters: FilterState = {
  priority: "All",
  status: "All",
  projectType: "All",
  team: "All",
  designer: "All",
};

function normalizeTeam(value: string | undefined): WorkspaceTicket["team"] {
  if (value === "Bravo" || value === "Charlie") return value;
  return "Alpha";
}

function createDefaultDraft(userContext: UserContext): DraftForm {
  return {
    title: "",
    description: "",
    projectType: "Distribution",
    team: normalizeTeam(userContext.teamLabels[0]),
    designerName: userContext.designerName ?? "Avery Stone",
    dueDatePrompt: "",
    dueDate: "",
    tags: "",
    cloudLink: "",
    attachmentNames: [],
  };
}

function toCsv(tickets: WorkspaceTicket[]) {
  const header = [
    "ID",
    "Title",
    "Priority",
    "Status",
    "Project Type",
    "Team",
    "Designer",
    "Due Date",
    "Time In Queue",
  ];

  const rows = tickets.map((ticket) => [
    ticket.id,
    ticket.title,
    ticket.priority,
    ticket.status,
    ticket.projectType,
    ticket.team,
    ticket.designerName,
    ticket.dueDate.slice(0, 10),
    String(ticket.timeInQueueDays),
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function getMissingDocuments(ticket: WorkspaceTicket) {
  return REQUIRED_QC_DOCUMENTS.filter((documentType) => !ticket.documentFlags.includes(documentType));
}

export function TicketWorkspace({
  initialTickets,
  initialIssues,
  userContext,
  screen,
}: TicketWorkspaceProps) {
  const settings = useSettings(userContext.user.email);
  const [mode, setMode] = useState<DashboardMode>(userContext.defaultMode);
  const [tickets, setTickets] = useState<WorkspaceTicket[]>(() =>
    buildWorkspaceTickets(initialTickets, initialIssues),
  );
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [search, setSearch] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [draft, setDraft] = useState<DraftForm>(() => createDefaultDraft(userContext));
  const [notice, setNotice] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [importDueDatePrompt, setImportDueDatePrompt] = useState("");
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const deferredSearch = useDeferredValue(search);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const savedFilters = window.localStorage.getItem(`${FILTERS_KEY}-${screen}`);
      const savedPresets = window.localStorage.getItem(PRESETS_KEY);

      if (savedFilters) {
        setFilters({ ...defaultFilters, ...(JSON.parse(savedFilters) as Partial<FilterState>) });
      }

      if (savedPresets) {
        setPresets(JSON.parse(savedPresets) as SavedPreset[]);
      }
    } catch {
      // Ignore storage failures in constrained browsers.
    }
  }, [screen]);

  useEffect(() => {
    window.localStorage.setItem(`${FILTERS_KEY}-${screen}`, JSON.stringify(filters));
  }, [filters, screen]);

  useEffect(() => {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!userContext.allowedModes.includes(mode)) {
      setMode(userContext.defaultMode);
    }
  }, [mode, userContext.allowedModes, userContext.defaultMode]);

  useEffect(() => {
    const preferredMode = settings.userSettings.preferredDashboardMode;

    if (preferredMode !== "auto" && userContext.allowedModes.includes(preferredMode)) {
      setMode(preferredMode);
    }
  }, [settings.userSettings.preferredDashboardMode, userContext.allowedModes]);

  const designerPool = useMemo(() => buildDesignerPool(tickets), [tickets]);
  const scopedTickets = useMemo(
    () =>
      scopeTicketsByMode(tickets, mode, {
        designerName: userContext.designerName,
        teamLabels: userContext.teamLabels,
        roles: userContext.roles,
      }),
    [mode, tickets, userContext.designerName, userContext.roles, userContext.teamLabels],
  );
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const derivedDueDate = draft.dueDate || parseDueDateInput(draft.dueDatePrompt) || "";
  const derivedPriority = getPriorityFromDueDate(derivedDueDate);

  const filteredTickets = useMemo(() => {
    return scopedTickets
      .filter((ticket) => (filters.priority === "All" ? true : ticket.priority === filters.priority))
      .filter((ticket) => (filters.status === "All" ? true : ticket.status === filters.status))
      .filter((ticket) =>
        filters.projectType === "All" ? true : ticket.projectType === filters.projectType,
      )
      .filter((ticket) => (filters.team === "All" ? true : ticket.team === filters.team))
      .filter((ticket) =>
        filters.designer === "All" ? true : ticket.designerName === filters.designer,
      )
      .filter((ticket) => {
        if (!normalizedSearch) return true;

        const haystack = [
          ticket.id,
          ticket.title,
          ticket.description,
          ticket.projectType,
          ticket.team,
          ticket.designerName,
          ...ticket.tags,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
      .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());
  }, [filters, normalizedSearch, scopedTickets]);

  const importBatches = useMemo(
    () =>
      buildImportBatches(importFiles, {
        dueDatePrompt: importDueDatePrompt,
        defaultTeam: normalizeTeam(userContext.teamLabels[0]),
        defaultDesignerName: userContext.designerName ?? designerPool[0]?.name ?? "Avery Stone",
      }),
    [designerPool, importDueDatePrompt, importFiles, userContext.designerName, userContext.teamLabels],
  );

  const overdueCount = filteredTickets.filter(
    (ticket) => new Date(ticket.dueDate).getTime() < Date.now() && ticket.status !== "Complete",
  ).length;
  const urgentCount = filteredTickets.filter((ticket) =>
    ["Critical", "High"].includes(ticket.priority),
  ).length;
  const missingDocsCount = filteredTickets.filter(
    (ticket) => getMissingDocuments(ticket).length > 0,
  ).length;
  const myQueueCount = userContext.designerName
    ? filteredTickets.filter((ticket) => ticket.designerName === userContext.designerName).length
    : filteredTickets.length;
  const spotlightTickets = filteredTickets.slice(0, 6);

  const dashboardCards = useMemo(() => {
    switch (mode) {
      case "qc":
        return [
          { id: "my-queue", label: "Review Queue", value: filteredTickets.length, detail: "Tickets currently visible to QC." },
          { id: "missing-docs", label: "Missing Docs", value: missingDocsCount, detail: "Tickets missing BM or material list." },
          { id: "urgent", label: "Critical Due", value: urgentCount, detail: "Due soon enough to trigger escalation." },
          { id: "overdue", label: "Overdue", value: overdueCount, detail: "Past due date and not yet complete." },
        ];
      case "designer":
        return [
          { id: "my-queue", label: "Assigned Queue", value: myQueueCount, detail: "Tickets assigned to this designer context." },
          { id: "urgent", label: "Due This Week", value: urgentCount, detail: "Prioritized automatically from due dates." },
          { id: "overdue", label: "Needs Revision", value: filteredTickets.filter((ticket) => ticket.status === "In Progress").length, detail: "Work currently in active revision or response." },
          { id: "missing-docs", label: "Docs Attached", value: filteredTickets.reduce((total, ticket) => total + ticket.attachmentCount, 0), detail: "Reference files visible from the designer queue." },
        ];
      case "client":
        return [
          { id: "my-queue", label: "Visible Projects", value: filteredTickets.length, detail: "Read-only tickets scoped to client-safe visibility." },
          { id: "missing-docs", label: "On Schedule", value: filteredTickets.filter((ticket) => ticket.priority === "Low" || ticket.priority === "Medium").length, detail: "Projects not currently marked urgent." },
          { id: "urgent", label: "At Risk", value: urgentCount, detail: "Near-term dates that need attention." },
          { id: "overdue", label: "Completed", value: filteredTickets.filter((ticket) => ticket.status === "Complete").length, detail: "Completed milestones in the visible scope." },
        ];
      default:
        return [
          { id: "my-queue", label: "Active Tickets", value: filteredTickets.length, detail: "Current scoped workload." },
          { id: "urgent", label: "Urgent", value: urgentCount, detail: "Urgency derived from due date rather than manual entry." },
          { id: "overdue", label: "Overdue", value: overdueCount, detail: "Past due and still not complete." },
          { id: "missing-docs", label: "Designer Pool", value: designerPool.filter((member) => member.availability !== "Offline").length, detail: "Available designers in the visible pool." },
        ];
    }
  }, [designerPool, filteredTickets, missingDocsCount, mode, myQueueCount, overdueCount, urgentCount]);

  const prioritizedCards = useMemo(() => {
    const preferredMetric = settings.userSettings.primaryMetric;

    return [...dashboardCards].sort((left, right) => {
      const leftRank = left.id === preferredMetric ? 0 : 1;
      const rightRank = right.id === preferredMetric ? 0 : 1;
      return leftRank - rightRank;
    });
  }, [dashboardCards, settings.userSettings.primaryMetric]);

  function updateFilter<Key extends keyof FilterState>(key: Key, value: FilterState[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(defaultFilters);
    setSearch("");
  }

  function savePreset() {
    const nextPreset: SavedPreset = {
      id: `${Date.now()}`,
      label: `Preset ${presets.length + 1}`,
      filters,
    };

    setPresets((current) => [...current, nextPreset]);
  }

  function applyPreset(preset: SavedPreset) {
    setFilters(preset.filters);
  }

  function exportCsv() {
    const blob = new Blob([toCsv(filteredTickets)], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pm-platform-report.csv";
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  function exportPdf() {
    window.print();
  }

  function handleDueDatePromptChange(value: string) {
    const parsed = parseDueDateInput(value);

    setDraft((current) => ({
      ...current,
      dueDatePrompt: value,
      dueDate: parsed ?? current.dueDate,
    }));
  }

  function submitDraft() {
    if (!draft.title.trim()) {
      setDraftError("A short ticket title is required.");
      return;
    }

    if (!derivedDueDate) {
      setDraftError("Add a due date or a due date prompt so urgency can be calculated.");
      return;
    }

    const nextTicket = createDraftTicket({
      title: draft.title.trim(),
      description:
        draft.description.trim() ||
        `Auto-generated ticket for ${draft.title.trim()} with urgency driven by due date.`,
      dueDate: derivedDueDate,
      projectType: draft.projectType,
      team: draft.team,
      designerName: draft.designerName,
      tags: draft.tags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      cloudLink: draft.cloudLink.trim(),
      attachmentNames: draft.attachmentNames,
    });

    setTickets((current) => [nextTicket, ...current]);
    setDraft(createDefaultDraft(userContext));
    setDraftError(null);
    setIsComposerOpen(false);
    setNotice("Ticket created with urgency calculated from the due date.");
  }

  function handleFolderSelection(files: FileList | null) {
    setImportFiles(files ? Array.from(files) : []);
  }

  function commitImport() {
    if (importBatches.length === 0) {
      setNotice("Choose a folder with document files before importing.");
      return;
    }

    const importedTickets = importBatches.map((batch) =>
      createDraftTicket({
        title: batch.title,
        description: `${batch.description} Missing documents: ${batch.missingDocuments.join(", ") || "None"}.`,
        dueDate: batch.dueDate,
        projectType: batch.projectType,
        team: batch.team,
        designerName: batch.designerName,
        tags: [...batch.tags, ...batch.missingDocuments],
        cloudLink: "",
        attachmentNames: batch.files,
      }),
    );

    setTickets((current) => [...importedTickets, ...current]);
    setImportFiles([]);
    setImportDueDatePrompt("");
    setIsImportOpen(false);
    setNotice("Folder import created QC-ready ticket drafts from the document structure.");
  }

  const canCreateTickets = !userContext.isClientOnly;
  return (
    <div className="workspace-stack">
      <section className="panel workspace-toolbar">
        <div className="toolbar-row">
          <div>
            <p className="eyebrow">{screen === "dashboard" ? "Role cockpit" : "Ticket system"}</p>
            <h2>{settings.dashboardModeLabel(mode)}</h2>
            <p className="muted">{getDashboardFocus(mode)}</p>
          </div>

          <div className="toolbar-actions">
            {screen === "dashboard" ? (
              <Link className="primary-button" href="/tickets">
                Open Ticket Queue
              </Link>
            ) : (
              <>
                <button className="ghost-button" onClick={exportPdf} type="button">
                  Export PDF
                </button>
                <button className="ghost-button" onClick={exportCsv} type="button">
                  Export CSV
                </button>
                {userContext.canMassImport ? (
                  <button className="ghost-button" onClick={() => setIsImportOpen(true)} type="button">
                    Mass Import Folders
                  </button>
                ) : null}
                {canCreateTickets ? (
                  <button className="primary-button" onClick={() => setIsComposerOpen(true)} type="button">
                    New Ticket
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="dashboard-tabs">
          {userContext.allowedModes.map((dashboard) => (
            <button
              key={dashboard}
              className={dashboard === mode ? "chip-button active" : "chip-button"}
              onClick={() => setMode(dashboard)}
              type="button"
            >
              {settings.dashboardModeLabel(dashboard)}
            </button>
          ))}
        </div>

        <div className="context-row">
          <span className="status-pill">
            {userContext.roles.map((role) => settings.roleLabel(role)).join(" · ")}
          </span>
          <span className="status-pill">{userContext.displayName}</span>
          <span className="status-pill">Teams: {userContext.teamLabels.join(", ")}</span>
        </div>

        {screen === "tickets" ? (
          <>
            <div className="filter-grid">
              <label className="field">
                <span>Global Search</span>
                <input
                  ref={searchRef}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, tags, designer, folder docs..."
                  value={search}
                />
              </label>

              <label className="field">
                <span>Priority</span>
                <select onChange={(event) => updateFilter("priority", event.target.value)} value={filters.priority}>
                  {["All", "Critical", "High", "Medium", "Low"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Status</span>
                <select onChange={(event) => updateFilter("status", event.target.value)} value={filters.status}>
                  {["All", "New", "In Progress", "Under Review", "Complete", "On Hold"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Project Type</span>
                <select
                  onChange={(event) => updateFilter("projectType", event.target.value)}
                  value={filters.projectType}
                >
                  {["All", "Distribution", "Transmission", "Other"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Team</span>
                <select onChange={(event) => updateFilter("team", event.target.value)} value={filters.team}>
                  {["All", "Alpha", "Bravo", "Charlie"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Designer</span>
                <select onChange={(event) => updateFilter("designer", event.target.value)} value={filters.designer}>
                  <option value="All">All</option>
                  {designerPool.map((designer) => (
                    <option key={designer.id} value={designer.name}>
                      {designer.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="toolbar-actions">
              <button className="ghost-button" onClick={savePreset} type="button">
                Save Filter Preset
              </button>
              <button className="inline-link" onClick={resetFilters} type="button">
                Reset Filters
              </button>
            </div>

            {presets.length > 0 ? (
              <div className="preset-row">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    className="inline-link"
                    onClick={() => applyPreset(preset)}
                    type="button"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      {notice ? <p className="form-message panel">{notice}</p> : null}

      <section className="stats-grid">
        {prioritizedCards.map((card) => (
          <article className="stat-card" key={card.label}>
            <p className="muted">{card.label}</p>
            <strong>{card.value}</strong>
            <p className="muted">{card.detail}</p>
          </article>
        ))}
      </section>

      {screen === "dashboard" ? (
        <section className="panel-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Visibility</p>
                <h3>{mode === "qc" ? "Review pressure" : mode === "designer" ? "Assigned work" : "Cross-team snapshot"}</h3>
              </div>
              <span className="muted">{spotlightTickets.length} tickets in focus</span>
            </div>

            <ul className="ticket-list">
              {spotlightTickets.map((ticket) => (
                <li key={ticket.id}>
                  <div>
                    <Link href={`/tickets/${ticket.id}`}>
                      <strong>{ticket.title}</strong>
                    </Link>
                    <p className="muted">
                      Due {ticket.dueDate.slice(0, 10)} · {ticket.projectType} · {ticket.team}
                    </p>
                    <p className="muted">{ticket.description}</p>
                  </div>
                  <div className="stacked-meta">
                    <span className={`status-pill status-${ticket.status.toLowerCase().replaceAll(" ", "-")}`}>
                      {ticket.status}
                    </span>
                    <span className="status-pill">{ticket.priority}</span>
                  </div>
                </li>
              ))}
              {spotlightTickets.length === 0 ? (
                <li>No tickets match the current role scope.</li>
              ) : null}
            </ul>
          </article>

          <div className="sidebar-panels">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Data Entry</p>
                  <h3>Lower-friction intake</h3>
                </div>
              </div>
              <ul className="ticket-list">
                <li>
                  <div>
                    <strong>Priority is automatic</strong>
                    <p className="muted">Urgency is derived from the due date instead of a manual dropdown.</p>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Folder import creates QC drafts</strong>
                    <p className="muted">Material list and BM files are detected and attached to imported tickets.</p>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Visibility follows roles</strong>
                    <p className="muted">QC, designer, PM, and client modes now open into different default views.</p>
                  </div>
                </li>
              </ul>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Designer Pool</p>
                  <h3>Current availability</h3>
                </div>
              </div>
              <ul className="ticket-list">
                {designerPool.map((designer) => (
                  <li key={designer.id}>
                    <div>
                      <strong>{designer.name}</strong>
                      <p className="muted">
                        {designer.team} team · {designer.availability}
                      </p>
                    </div>
                    <span>{designer.workload} active</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      ) : (
        <section className="panel-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Working Queue</p>
                <h3>Structured ticket system</h3>
              </div>
              <span className="muted">{filteredTickets.length} visible tickets</span>
            </div>

            <div className="table-wrap">
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Status</th>
                    <th>Urgency</th>
                    <th>Project</th>
                    {!userContext.isClientOnly ? <th>Team</th> : null}
                    {!userContext.isClientOnly ? <th>Designer</th> : null}
                    <th>Due</th>
                    <th>Docs</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        {ticket.id.startsWith("DRAFT-") ? (
                          <div>
                            <strong>{ticket.title}</strong>
                            <p className="muted">{ticket.id}</p>
                          </div>
                        ) : (
                          <Link href={`/tickets/${ticket.id}`}>
                            <strong>{ticket.title}</strong>
                            <p className="muted">{ticket.id}</p>
                          </Link>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill status-${ticket.status.toLowerCase().replaceAll(" ", "-")}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>{ticket.priority}</td>
                      <td>{ticket.projectType}</td>
                      {!userContext.isClientOnly ? <td>{ticket.team}</td> : null}
                      {!userContext.isClientOnly ? <td>{ticket.designerName}</td> : null}
                      <td>{ticket.dueDate.slice(0, 10)}</td>
                      <td>{ticket.documentFlags.join(", ") || "None"}</td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={userContext.isClientOnly ? 6 : 8}>
                        No tickets match the current dashboard scope and filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>

          <div className="sidebar-panels">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Intake Logic</p>
                  <h3>What changed</h3>
                </div>
              </div>
              <ul className="ticket-list">
                <li>
                  <div>
                    <strong>Urgency comes from due date</strong>
                    <p className="muted">No manual priority selector. Due date or due date prompt sets urgency automatically.</p>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Mass import supports QC intake</strong>
                    <p className="muted">Import folder structures and create ticket drafts with detected BM/material-list documents.</p>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Role-based visibility</strong>
                    <p className="muted">This queue respects the role mode you selected at the top of the page.</p>
                  </div>
                </li>
              </ul>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">QC Risks</p>
                  <h3>Document completeness</h3>
                </div>
              </div>
              <ul className="ticket-list">
                {filteredTickets.slice(0, 5).map((ticket) => {
                  const missingDocuments = getMissingDocuments(ticket);

                  return (
                    <li key={`${ticket.id}-docs`}>
                      <div>
                        <strong>{ticket.title}</strong>
                        <p className="muted">
                          {missingDocuments.length > 0
                            ? `Missing: ${missingDocuments.join(", ")}`
                            : "Material list and BM detected."}
                        </p>
                      </div>
                      <span>{ticket.priority}</span>
                    </li>
                  );
                })}
              </ul>
            </article>
          </div>
        </section>
      )}

      {isComposerOpen ? (
        <section className="composer-backdrop">
          <div className="composer-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Ticket Creation</p>
                <h3>Reduced-entry intake</h3>
              </div>
              <button className="inline-link" onClick={() => setIsComposerOpen(false)} type="button">
                Close
              </button>
            </div>

            <div className="form-grid">
              <label className="field field-span-2">
                <span>Title</span>
                <input
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Fiber expansion package review"
                  value={draft.title}
                />
              </label>

              <label className="field field-span-2">
                <span>Description / Notes</span>
                <textarea
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Optional context, blockers, or internal notes..."
                  rows={4}
                  value={draft.description}
                />
              </label>

              <label className="field">
                <span>Due Date Prompt</span>
                <input
                  onChange={(event) => handleDueDatePromptChange(event.target.value)}
                  placeholder="Tomorrow, Apr 12 2026, next Friday..."
                  value={draft.dueDatePrompt}
                />
              </label>

              <label className="field">
                <span>Resolved Due Date</span>
                <input
                  onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  value={draft.dueDate ? draft.dueDate.slice(0, 10) : ""}
                />
              </label>

              <label className="field">
                <span>Auto Urgency</span>
                <div className="derived-card">
                  <strong>{derivedPriority}</strong>
                  <p className="muted">Calculated from the due date instead of manual entry.</p>
                </div>
              </label>

              <label className="field">
                <span>Project Type</span>
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      projectType: event.target.value as WorkspaceTicket["projectType"],
                    }))
                  }
                  value={draft.projectType}
                >
                  {["Distribution", "Transmission", "Other"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Team</span>
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      team: event.target.value as WorkspaceTicket["team"],
                    }))
                  }
                  value={draft.team}
                >
                  {["Alpha", "Bravo", "Charlie"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Designer Assignment</span>
                <input
                  list="designer-pool"
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, designerName: event.target.value }))
                  }
                  placeholder="Search designer pool"
                  value={draft.designerName}
                />
                <datalist id="designer-pool">
                  {designerPool.map((designer) => (
                    <option key={designer.id} value={designer.name} />
                  ))}
                </datalist>
              </label>

              <label className="field field-span-2">
                <span>Tags / Labels</span>
                <input
                  onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="permit, utility, expedited"
                  value={draft.tags}
                />
              </label>

              <label className="field field-span-2">
                <span>Cloud Storage Link</span>
                <input
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, cloudLink: event.target.value }))
                  }
                  placeholder="Google Drive or OneDrive link"
                  value={draft.cloudLink}
                />
              </label>

              <label className="field field-span-2">
                <span>Attachments</span>
                <input
                  multiple
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      attachmentNames: Array.from(event.target.files ?? []).map((file) => file.name),
                    }))
                  }
                  type="file"
                />
              </label>
            </div>

            {draftError ? <p className="form-error">{draftError}</p> : null}

            <div className="toolbar-actions">
              <button className="ghost-button" onClick={() => setIsComposerOpen(false)} type="button">
                Cancel
              </button>
              <button className="primary-button" onClick={submitDraft} type="button">
                Create Ticket
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isImportOpen ? (
        <section className="composer-backdrop">
          <div className="composer-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Mass Import</p>
                <h3>Import document folders into QC ticket drafts</h3>
              </div>
              <button className="inline-link" onClick={() => setIsImportOpen(false)} type="button">
                Close
              </button>
            </div>

            <div className="form-grid">
              <label className="field field-span-2">
                <span>Default Due Date Prompt</span>
                <input
                  onChange={(event) => setImportDueDatePrompt(event.target.value)}
                  placeholder="Friday, Apr 12 2026"
                  value={importDueDatePrompt}
                />
              </label>

              <label className="field field-span-2">
                <span>Folder Import</span>
                <input
                  {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
                  multiple
                  onChange={(event) => handleFolderSelection(event.target.files)}
                  type="file"
                />
              </label>
            </div>

            <div className="import-preview-grid">
              {importBatches.map((batch) => (
                <article className="panel import-card" key={batch.id}>
                  <div className="panel-header">
                    <div>
                      <h3>{batch.title}</h3>
                      <p className="muted">
                        {batch.projectType} · {batch.team} · {batch.priority}
                      </p>
                    </div>
                    <span className="status-pill">{batch.dueDate ? batch.dueDate.slice(0, 10) : "No due date"}</span>
                  </div>
                  <p className="muted">{batch.description}</p>
                  <p className="muted">Detected documents: {batch.documentFlags.join(", ") || "None"}</p>
                  <p className="muted">
                    Missing documents: {batch.missingDocuments.join(", ") || "None"}
                  </p>
                </article>
              ))}
              {importBatches.length === 0 ? (
                <article className="panel import-card">
                  <p className="muted">Choose a folder tree to preview the QC import batches.</p>
                </article>
              ) : null}
            </div>

            <div className="toolbar-actions">
              <button className="ghost-button" onClick={() => setIsImportOpen(false)} type="button">
                Cancel
              </button>
              <button className="primary-button" onClick={commitImport} type="button">
                Create Imported QC Tickets
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
