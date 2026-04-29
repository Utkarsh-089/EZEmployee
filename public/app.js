const loginPanel = document.getElementById("loginPanel");
const appPanel = document.getElementById("appPanel");
const employeePanel = document.getElementById("employeePanel");
const staffLoginForm = document.getElementById("staffLoginForm");
const employeeLoginForm = document.getElementById("employeeLoginForm");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetCodeResult = document.getElementById("resetCodeResult");
const demoAccounts = document.getElementById("demoAccounts");
const employeeDemoAccounts = document.getElementById("employeeDemoAccounts");
const employeeForm = document.getElementById("employeeForm");
const attendanceForm = document.getElementById("attendanceForm");
const leaveForm = document.getElementById("leaveForm");
const staffPasswordForm = document.getElementById("staffPasswordForm");
const staffSelfLeaveHint = document.getElementById("staffSelfLeaveHint");
const useOwnLeaveProfileButton = document.getElementById("useOwnLeaveProfile");
const employeeTableBody = document.getElementById("employeeTableBody");
const attendanceTableBody = document.getElementById("attendanceTableBody");
const leaveTableBody = document.getElementById("leaveTableBody");
const managerApprovalTableBody = document.getElementById("managerApprovalTableBody");
const activityFeed = document.getElementById("activityFeed");
const employeeAttendanceTableBody = document.getElementById("employeeAttendanceTableBody");
const employeeLeaveTableBody = document.getElementById("employeeLeaveTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const departmentFilter = document.getElementById("departmentFilter");
const exportButton = document.getElementById("exportButton");
const logoutButton = document.getElementById("logoutButton");
const resetButton = document.getElementById("resetButton");
const toast = document.getElementById("toast");
const formTitle = document.getElementById("formTitle");
const themeToggle = document.getElementById("themeToggle");
const openCreateModalButton = document.getElementById("openCreateModal");
const openCreateModalSecondaryButton = document.getElementById("openCreateModalSecondary");
const openEditHintButton = document.getElementById("openEditHint");
const employeeModal = document.getElementById("employeeModal");
const closeModalButton = document.getElementById("closeModalButton");
const modalBackdrop = document.getElementById("modalBackdrop");
const photoPreview = document.getElementById("photoPreview");
const employeePhoto = document.getElementById("employeePhoto");
const editingEmployeeId = document.getElementById("editingEmployeeId");
const statusChart = document.getElementById("statusChart");
const statusChartTotal = document.getElementById("statusChartTotal");
const statusLegend = document.getElementById("statusLegend");
const departmentChart = document.getElementById("departmentChart");
const roleChart = document.getElementById("roleChart");
const attendanceTrendChart = document.getElementById("attendanceTrendChart");
const departmentSummary = document.getElementById("departmentSummary");
const navItems = Array.from(document.querySelectorAll(".nav-item[data-target]"));
const managerApprovalsNav = document.getElementById("managerApprovalsNav");
const currentRoleBadge = document.getElementById("currentRoleBadge");
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarUserRole = document.getElementById("sidebarUserRole");
const sidebarRoleHeadline = document.getElementById("sidebarRoleHeadline");
const sidebarRoleDescription = document.getElementById("sidebarRoleDescription");
const attendanceEmployeeId = document.getElementById("attendanceEmployeeId");
const attendanceDate = document.getElementById("attendanceDate");
const attendanceStatus = document.getElementById("attendanceStatus");
const attendanceCheckIn = document.getElementById("attendanceCheckIn");
const attendanceCheckOut = document.getElementById("attendanceCheckOut");
const attendanceNotes = document.getElementById("attendanceNotes");
const leaveEmployeeId = document.getElementById("leaveEmployeeId");
const leaveType = document.getElementById("leaveType");
const leaveStartDate = document.getElementById("leaveStartDate");
const leaveEndDate = document.getElementById("leaveEndDate");
const leaveReason = document.getElementById("leaveReason");
const profileEmptyState = document.getElementById("profileEmptyState");
const profileContent = document.getElementById("profileContent");
const profilePhoto = document.getElementById("profilePhoto");
const profileName = document.getElementById("profileName");
const profileHeadline = document.getElementById("profileHeadline");
const profileEmployeeCode = document.getElementById("profileEmployeeCode");
const profileStatus = document.getElementById("profileStatus");
const profileEmail = document.getElementById("profileEmail");
const profileContact = document.getElementById("profileContact");
const profileJoinedOn = document.getElementById("profileJoinedOn");
const profileUpdatedAt = document.getElementById("profileUpdatedAt");
const profileNotes = document.getElementById("profileNotes");
const profileAttendanceSummary = document.getElementById("profileAttendanceSummary");
const profileLeaveSummary = document.getElementById("profileLeaveSummary");
const employeeLogoutButton = document.getElementById("employeeLogoutButton");
const employeePortalName = document.getElementById("employeePortalName");
const employeePortalCode = document.getElementById("employeePortalCode");
const employeePortalUsername = document.getElementById("employeePortalUsername");
const employeePortalRole = document.getElementById("employeePortalRole");
const employeePortalDepartment = document.getElementById("employeePortalDepartment");
const employeePortalStatus = document.getElementById("employeePortalStatus");
const employeePortalPhoto = document.getElementById("employeePortalPhoto");
const employeePortalNotes = document.getElementById("employeePortalNotes");
const employeeAttendanceForm = document.getElementById("employeeAttendanceForm");
const employeeAttendanceDate = document.getElementById("employeeAttendanceDate");
const employeeAttendanceStatus = document.getElementById("employeeAttendanceStatus");
const employeeAttendanceCheckIn = document.getElementById("employeeAttendanceCheckIn");
const employeeAttendanceCheckOut = document.getElementById("employeeAttendanceCheckOut");
const employeeAttendanceNotes = document.getElementById("employeeAttendanceNotes");
const employeeLeaveForm = document.getElementById("employeeLeaveForm");
const employeeLeaveType = document.getElementById("employeeLeaveType");
const employeeLeaveStartDate = document.getElementById("employeeLeaveStartDate");
const employeeLeaveEndDate = document.getElementById("employeeLeaveEndDate");
const employeeLeaveReason = document.getElementById("employeeLeaveReason");
const employeeProfileForm = document.getElementById("employeeProfileForm");
const employeeProfileName = document.getElementById("employeeProfileName");
const employeeProfileEmail = document.getElementById("employeeProfileEmail");
const employeeProfileContactNumber = document.getElementById("employeeProfileContactNumber");
const employeeProfileNotes = document.getElementById("employeeProfileNotes");
const employeeProfilePhoto = document.getElementById("employeeProfilePhoto");
const employeeProfilePhotoPreview = document.getElementById("employeeProfilePhotoPreview");
const employeePasswordForm = document.getElementById("employeePasswordForm");

const stats = {
  totalEmployees: document.getElementById("totalEmployees"),
  activeEmployees: document.getElementById("activeEmployees"),
  inactiveEmployees: document.getElementById("inactiveEmployees"),
  departmentCount: document.getElementById("departmentCount"),
  pendingLeaves: document.getElementById("pendingLeaves"),
  attendanceTodayTotal: document.getElementById("attendanceTodayTotal"),
};

const THEME_STORAGE_KEY = "ezemployee-theme";
const roleDescriptions = {
  Admin: {
    headline: "Administrative Control",
    description:
      "Full control over employees, attendance, deletion, and reporting workflows.",
  },
  HR: {
    headline: "HR Operations",
    description:
      "Can create and update employee records, manage attendance, and submit leave workflows.",
  },
  Manager: {
    headline: "Manager Workflow",
    description:
      "Can manage attendance and review leave requests while keeping directory access read-only.",
  },
  Employee: {
    headline: "Employee Self Service",
    description:
      "Can sign in personally to submit attendance and leave requests for only their own record.",
  },
};

const state = {
  authOptions: { staffAccounts: [], employeeAccounts: [] },
  currentUser: null,
  permissions: {},
  employees: [],
  dashboard: null,
  attendance: [],
  leaves: [],
  managerApprovals: [],
  selectedEmployeeId: null,
  selectedProfile: null,
  employeePhotoDataUrl: "",
  employeeProfilePhotoDataUrl: "",
  employeeDashboard: null,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function initialsFromName(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "EZ";
}

function avatarDataUrl(name) {
  const initials = initialsFromName(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="28" fill="#cfae73"></rect>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Segoe UI, Arial, sans-serif" font-size="54" font-weight="700" fill="#101821">
        ${initials}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "same-origin",
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(payload.error || payload || "Request failed.");
  }

  return payload;
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.style.background = isError ? "rgba(188, 71, 73, 0.96)" : "rgba(10, 18, 30, 0.96)";
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}

function setAuthenticated(authenticated, mode = "staff") {
  loginPanel.classList.toggle("hidden", authenticated);
  appPanel.classList.toggle("hidden", !authenticated || mode !== "staff");
  employeePanel.classList.toggle("hidden", !authenticated || mode !== "employee");
  if (!authenticated) {
    closeEmployeeModal();
  }
}

function clearResetSupport() {
  if (!resetCodeResult) {
    return;
  }
  resetCodeResult.textContent = "";
  resetCodeResult.classList.add("hidden");
}

function resetSessionState() {
  state.currentUser = null;
  state.permissions = {};
  state.employeeDashboard = null;
  state.selectedEmployeeId = null;
  state.selectedProfile = null;
  state.managerApprovals = [];
  state.employeeProfilePhotoDataUrl = "";
  resetEmployeeForm();
  renderProfile(null);
  clearResetSupport();
}

function getThemeLabel(theme) {
  return theme === "dark" ? "Dark Theme" : "Light Theme";
}

function applyTheme(theme) {
  const resolvedTheme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
  if (themeToggle) {
    themeToggle.textContent = getThemeLabel(resolvedTheme);
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  applyTheme(savedTheme || document.documentElement.getAttribute("data-theme") || "dark");
}

function openEmployeeModal() {
  employeeModal.classList.remove("hidden");
  employeeModal.setAttribute("aria-hidden", "false");
}

function closeEmployeeModal() {
  employeeModal.classList.add("hidden");
  employeeModal.setAttribute("aria-hidden", "true");
}

function activateNav(targetId) {
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.target === targetId);
  });
}

function setButtonVisibility(button, visible) {
  if (!button) {
    return;
  }
  button.classList.toggle("hidden", !visible);
}

function setFormEnabled(form, enabled) {
  if (!form) {
    return;
  }
  Array.from(form.elements).forEach((element) => {
    if (element instanceof HTMLElement) {
      element.disabled = !enabled;
    }
  });
}

function fillSelectOptions(select, employees, placeholder) {
  const currentValue = select.value;
  select.innerHTML = employees.length
    ? employees
        .map(
          (employee) =>
            `<option value="${employee.id}">${escapeHtml(employee.name)} (${escapeHtml(employee.employeeId)})</option>`
        )
        .join("")
    : `<option value="">${escapeHtml(placeholder)}</option>`;

  if (employees.some((employee) => String(employee.id) === currentValue)) {
    select.value = currentValue;
  }
}

function syncUserContext() {
  if (!state.currentUser) {
    return;
  }

  const roleMeta = roleDescriptions[state.currentUser.role] || roleDescriptions.Employee;
  sidebarAvatar.textContent = initialsFromName(state.currentUser.fullName);
  sidebarUserName.textContent = state.currentUser.fullName;
  sidebarUserRole.textContent = state.currentUser.role;
  sidebarRoleHeadline.textContent = roleMeta.headline;
  sidebarRoleDescription.textContent = roleMeta.description;
  currentRoleBadge.textContent = state.currentUser.role;

  setButtonVisibility(openCreateModalButton, Boolean(state.permissions.manageEmployees));
  setButtonVisibility(openCreateModalSecondaryButton, Boolean(state.permissions.manageEmployees));
  setButtonVisibility(openEditHintButton, Boolean(state.permissions.manageEmployees));
  setButtonVisibility(managerApprovalsNav, state.currentUser.role === "Manager");
  setButtonVisibility(
    staffSelfLeaveHint,
    state.currentUser.accountType === "staff" && Boolean(state.currentUser.employeeId) && Boolean(state.permissions.createLeaves)
  );
  document.getElementById("managerApprovalsSection")?.classList.toggle("hidden", state.currentUser.role !== "Manager");
  setFormEnabled(attendanceForm, Boolean(state.permissions.manageAttendance));
  setFormEnabled(leaveForm, Boolean(state.permissions.createLeaves));
  setFormEnabled(employeeAttendanceForm, Boolean(state.permissions.selfAttendance || state.permissions.manageAttendance));
  setFormEnabled(employeeLeaveForm, Boolean(state.permissions.selfLeave || state.permissions.createLeaves));
}

function syncSelfLeaveSelection() {
  if (!leaveEmployeeId || !state.currentUser?.employeeId) {
    return;
  }
  const selfId = String(state.currentUser.employeeId);
  const hasOption = Array.from(leaveEmployeeId.options).some((option) => option.value === selfId);
  if (hasOption && state.currentUser.accountType === "staff") {
    leaveEmployeeId.value = selfId;
  }
}

function resetEmployeeForm() {
  employeeForm.reset();
  editingEmployeeId.value = "";
  document.getElementById("formMode").value = "create";
  formTitle.textContent = "Add Employee";
  state.employeePhotoDataUrl = "";
  photoPreview.classList.add("hidden");
  photoPreview.removeAttribute("src");
}

function loadEmployeeIntoForm(employee) {
  document.getElementById("formMode").value = "edit";
  editingEmployeeId.value = employee.id;
  document.getElementById("employeeId").value = employee.employeeId;
  document.getElementById("name").value = employee.name;
  document.getElementById("email").value = employee.email;
  document.getElementById("contactNumber").value = employee.contactNumber;
  document.getElementById("department").value = employee.department || "";
  document.getElementById("role").value = employee.role || "";
  document.getElementById("joinedOn").value = employee.joinedOn || "";
  document.getElementById("status").value = employee.status || "Active";
  document.getElementById("notes").value = employee.notes || "";
  state.employeePhotoDataUrl = "";
  if (employee.photoPath) {
    photoPreview.src = employee.photoPath;
    photoPreview.classList.remove("hidden");
  } else {
    photoPreview.classList.add("hidden");
    photoPreview.removeAttribute("src");
  }
  formTitle.textContent = `Edit ${employee.employeeId}`;
}

function renderDemoAccounts(accounts) {
  demoAccounts.innerHTML = accounts
    .map(
      (account) => `
        <button class="demo-account" type="button" data-username="${escapeHtml(account.username)}" data-password="${escapeHtml(account.password)}">
          <span class="demo-role">${escapeHtml(account.role)}</span>
          <strong>${escapeHtml(account.username)}</strong>
          <small>${escapeHtml(account.password)}</small>
        </button>
      `
    )
    .join("");
}

function renderEmployeeDemoAccounts(accounts) {
  employeeDemoAccounts.innerHTML = accounts
    .map(
      (account) => `
        <button class="demo-account employee-demo-account" type="button" data-username="${escapeHtml(account.username)}" data-password="${escapeHtml(account.password)}">
          <span class="demo-role">${escapeHtml(account.employeeCode || account.role)}</span>
          <strong>${escapeHtml(account.fullName || account.username)}</strong>
          <small>${escapeHtml(account.username)} / ${escapeHtml(account.password)}</small>
        </button>
      `
    )
    .join("");
}

function renderMetricSummary(summary) {
  const metrics = summary.metrics;
  stats.totalEmployees.textContent = metrics.totalEmployees;
  stats.activeEmployees.textContent = metrics.activeEmployees;
  stats.inactiveEmployees.textContent = metrics.inactiveEmployees;
  stats.departmentCount.textContent = metrics.departmentCount;
  stats.pendingLeaves.textContent = metrics.pendingLeaves;

  const attendanceTodayTotal = summary.charts.attendanceToday.reduce((sum, item) => sum + item.value, 0);
  stats.attendanceTodayTotal.textContent = attendanceTodayTotal;
  statusChartTotal.textContent = metrics.totalEmployees;

  const totalEmployees = Math.max(metrics.totalEmployees, 1);
  const activeAngle = Math.round((metrics.activeEmployees / totalEmployees) * 360);
  statusChart.style.setProperty("--status-angle", `${activeAngle}deg`);
  statusLegend.innerHTML = [
    {
      label: "Active",
      value: `${metrics.activeEmployees} employees`,
      color: "var(--success)",
    },
    {
      label: "Inactive",
      value: `${metrics.inactiveEmployees} employees`,
      color: "var(--danger)",
    },
  ]
    .map(
      (item) => `
        <div class="legend-item">
          <span class="legend-dot" style="background:${item.color}"></span>
          <span class="legend-label">${escapeHtml(item.label)}</span>
          <span class="legend-value">${escapeHtml(item.value)}</span>
        </div>
      `
    )
    .join("");

  departmentSummary.innerHTML = summary.charts.departmentBreakdown.length
    ? summary.charts.departmentBreakdown
        .map((item) => `<span class="chip">${escapeHtml(item.label)}: ${escapeHtml(item.value)}</span>`)
        .join("")
    : '<span class="chip">No departments yet</span>';
}

function renderBarChart(container, items, emptyMessage) {
  container.innerHTML = items.length
    ? items
        .map((item) => {
          const maxValue = Math.max(...items.map((row) => row.value), 1);
          const width = Math.max(12, Math.round((item.value / maxValue) * 100));
          return `
            <div class="dept-row">
              <div class="dept-meta">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.value)} </span>
              </div>
              <div class="dept-bar">
                <div class="dept-bar-fill" style="width:${width}%"></div>
              </div>
            </div>
          `;
        })
        .join("")
    : `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
}

function renderTrendChart(items) {
  attendanceTrendChart.innerHTML = items.length
    ? items
        .map((item) => {
          const maxValue = Math.max(...items.map((row) => row.value), 1);
          const height = Math.max(16, Math.round((item.value / maxValue) * 100));
          return `
            <div class="trend-bar-group">
              <div class="trend-bar" style="height:${height}%"></div>
              <span>${escapeHtml(item.label.slice(5))}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </div>
          `;
        })
        .join("")
    : '<div class="empty-state">No trend data available.</div>';
}

function renderActivity(items) {
  activityFeed.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <article class="activity-item">
              <strong>${escapeHtml(item.actorUsername)}</strong>
              <p>${escapeHtml(item.description)}</p>
              <span>${escapeHtml(formatDateTime(item.createdAt))}</span>
            </article>
          `
        )
        .join("")
    : '<div class="empty-state">No recent activity yet.</div>';
}

function renderEmployees(employees) {
  if (!employees.length) {
    employeeTableBody.innerHTML =
      '<tr><td colspan="7" class="empty-state">No employee records match the current filters.</td></tr>';
    return;
  }

  employeeTableBody.innerHTML = employees
    .map((employee) => {
      const canEdit = Boolean(state.permissions.manageEmployees);
      const canDelete = Boolean(state.permissions.deleteEmployees);
      return `
        <tr>
          <td>${escapeHtml(employee.employeeId)}</td>
          <td>
            <div class="employee-cell">
              <img class="table-avatar" src="${escapeHtml(employee.photoPath || avatarDataUrl(employee.name))}" alt="${escapeHtml(employee.name)}" />
              <div>
                <strong>${escapeHtml(employee.name)}</strong><br />
                <span>${escapeHtml(employee.email)}</span>
              </div>
            </div>
          </td>
          <td>${escapeHtml(employee.department || "Unassigned")}</td>
          <td>${escapeHtml(employee.role || "Unassigned")}</td>
          <td><span class="status-pill ${employee.status === "Active" ? "active" : "inactive"}">${escapeHtml(employee.status)}</span></td>
          <td>${escapeHtml(formatDate(employee.joinedOn))}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="secondary" data-action="view" data-id="${employee.id}">View</button>
              ${canEdit ? `<button type="button" class="secondary" data-action="edit" data-id="${employee.id}">Edit</button>` : ""}
              ${canDelete ? `<button type="button" class="danger" data-action="delete" data-id="${employee.id}">Delete</button>` : ""}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderAttendance(records) {
  if (!records.length) {
    attendanceTableBody.innerHTML =
      '<tr><td colspan="3" class="empty-state">No attendance records available.</td></tr>';
    return;
  }

  attendanceTableBody.innerHTML = records
    .map(
      (record) => `
        <tr>
          <td>${escapeHtml(record.employeeName)}</td>
          <td>${escapeHtml(formatDate(record.attendanceDate))}</td>
          <td><span class="status-pill ${record.status === "Absent" ? "inactive" : "active"}">${escapeHtml(record.status)}</span></td>
        </tr>
      `
    )
    .join("");
}

function renderLeaves(leaves) {
  if (!leaves.length) {
    leaveTableBody.innerHTML =
      '<tr><td colspan="4" class="empty-state">No leave requests available.</td></tr>';
    return;
  }

  leaveTableBody.innerHTML = leaves
    .map(
      (leave) => `
        <tr>
          <td>${escapeHtml(leave.employeeName)}</td>
          <td>${escapeHtml(leave.leaveType)}</td>
          <td><span class="status-pill ${leave.status === "Rejected" ? "inactive" : "active"}">${escapeHtml(leave.status)}</span></td>
          <td><span class="muted-inline">${escapeHtml(leave.reviewedBy || leave.reviewerNotes || "Pending manager review")}</span></td>
        </tr>
      `
    )
    .join("");
}

function renderManagerApprovals(approvals) {
  if (!managerApprovalTableBody) {
    return;
  }
  if (!approvals.length) {
    managerApprovalTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No pending approvals.</td></tr>';
    return;
  }

  managerApprovalTableBody.innerHTML = approvals
    .map(
      (approval) => `
        <tr>
          <td>${escapeHtml(approval.employeeName)}<br /><span class="muted-inline">${escapeHtml(approval.employeeCode)}</span></td>
          <td>${escapeHtml(approval.department || "Unassigned")}</td>
          <td>${escapeHtml(formatDate(approval.startDate))} - ${escapeHtml(formatDate(approval.endDate))}</td>
          <td>${escapeHtml(approval.leaveType)}</td>
          <td>${escapeHtml(approval.reason || "-")}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="secondary" data-leave-action="approve" data-id="${approval.id}">Approve</button>
              <button type="button" class="danger" data-leave-action="reject" data-id="${approval.id}">Reject</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderProfile(profile) {
  state.selectedProfile = profile;
  if (!profile) {
    profileContent.classList.add("hidden");
    profileEmptyState.classList.remove("hidden");
    return;
  }

  const employee = profile.employee;
  profileEmptyState.classList.add("hidden");
  profileContent.classList.remove("hidden");
  profilePhoto.src = employee.photoPath || avatarDataUrl(employee.name);
  profileName.textContent = employee.name;
  profileHeadline.textContent = `${employee.department || "Unassigned"} - ${employee.role || "Unassigned"}`;
  profileEmployeeCode.textContent = employee.employeeId;
  profileStatus.textContent = employee.status;
  profileEmail.textContent = employee.email;
  profileContact.textContent = employee.contactNumber;
  profileJoinedOn.textContent = formatDate(employee.joinedOn);
  profileUpdatedAt.textContent = formatDateTime(employee.updatedAt);
  profileNotes.textContent = employee.notes || "No notes available.";

  profileAttendanceSummary.innerHTML = profile.attendanceSummary.length
    ? profile.attendanceSummary
        .map(
          (item) => `
            <div class="summary-item">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </div>
          `
        )
        .join("")
    : '<div class="empty-state">No attendance summary available.</div>';

  profileLeaveSummary.innerHTML = profile.leaveSummary.length
    ? profile.leaveSummary
        .map(
          (item) => `
            <div class="summary-item">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </div>
          `
        )
        .join("")
    : '<div class="empty-state">No leave summary available.</div>';
}

function renderEmployeeAttendanceRecords(records) {
  if (!records.length) {
    employeeAttendanceTableBody.innerHTML =
      '<tr><td colspan="4" class="empty-state">No attendance records available.</td></tr>';
    return;
  }

  employeeAttendanceTableBody.innerHTML = records
    .map(
      (record) => `
        <tr>
          <td>${escapeHtml(formatDate(record.attendanceDate))}</td>
          <td><span class="status-pill ${record.status === "Absent" ? "inactive" : "active"}">${escapeHtml(record.status)}</span></td>
          <td>${escapeHtml(record.checkIn || "-")}</td>
          <td>${escapeHtml(record.checkOut || "-")}</td>
        </tr>
      `
    )
    .join("");
}

function renderEmployeeLeaveRecords(leaves) {
  if (!leaves.length) {
    employeeLeaveTableBody.innerHTML =
      '<tr><td colspan="4" class="empty-state">No leave requests available.</td></tr>';
    return;
  }

  employeeLeaveTableBody.innerHTML = leaves
    .map(
      (leave) => `
        <tr>
          <td>${escapeHtml(leave.leaveType)}</td>
          <td>${escapeHtml(formatDate(leave.startDate))} - ${escapeHtml(formatDate(leave.endDate))}</td>
          <td><span class="status-pill ${leave.status === "Rejected" ? "inactive" : "active"}">${escapeHtml(leave.status)}</span></td>
          <td>${escapeHtml(leave.reviewerNotes || "-")}</td>
        </tr>
      `
    )
    .join("");
}

function renderEmployeePortal(data) {
  state.employeeDashboard = data;
  const employee = data.profile.employee;
  employeePortalName.textContent = employee.name;
  employeePortalCode.textContent = employee.employeeId;
  employeePortalUsername.textContent = `Username: ${data.account?.username || "-"}`;
  employeePortalRole.textContent = employee.role || "Employee";
  employeePortalDepartment.textContent = employee.department || "Unassigned Department";
  employeePortalStatus.textContent = employee.status;
  employeePortalPhoto.src = employee.photoPath || avatarDataUrl(employee.name);
  employeePortalNotes.textContent = employee.notes || "No notes available.";
  employeeProfileName.value = employee.name || "";
  employeeProfileEmail.value = employee.email || "";
  employeeProfileContactNumber.value = employee.contactNumber || "";
  employeeProfileNotes.value = employee.notes || "";
  employeeProfilePhotoPreview.src = employee.photoPath || avatarDataUrl(employee.name);
  employeeProfilePhotoPreview.classList.remove("hidden");
  state.employeeProfilePhotoDataUrl = "";
  if (employeeProfilePhoto) {
    employeeProfilePhoto.value = "";
  }
  renderEmployeeAttendanceRecords(data.attendance);
  renderEmployeeLeaveRecords(data.leaves);
}

function populateFiltersFromSummary(summary) {
  const currentValue = departmentFilter.value;
  const departmentOptions = summary.charts.departmentBreakdown
    .map((item) => `<option value="${escapeHtml(item.label)}">${escapeHtml(item.label)}</option>`)
    .join("");
  departmentFilter.innerHTML = `<option value="">All Departments</option>${departmentOptions}`;
  if ([...departmentFilter.options].some((option) => option.value === currentValue)) {
    departmentFilter.value = currentValue;
  }
}

async function fetchEmployeeProfile(employeeId) {
  try {
    const profile = await api(`/api/employees/${employeeId}`);
    state.selectedEmployeeId = employeeId;
    renderProfile(profile);
  } catch (error) {
    renderProfile(null);
    showToast(error.message, true);
  }
}

async function loadDashboard() {
  const response = await api("/api/dashboard");
  state.dashboard = response.summary;
  state.permissions = response.permissions || {};
  renderMetricSummary(state.dashboard);
  renderBarChart(departmentChart, state.dashboard.charts.departmentBreakdown, "No department data available.");
  renderBarChart(roleChart, state.dashboard.charts.roleBreakdown, "No role distribution available.");
  renderTrendChart(state.dashboard.charts.attendanceTrend);
  renderActivity(state.dashboard.recentActivity);
  populateFiltersFromSummary(state.dashboard);
  syncUserContext();
}

async function loadEmployees() {
  const query = new URLSearchParams();
  if (searchInput.value.trim()) {
    query.set("q", searchInput.value.trim());
  }
  if (statusFilter.value) {
    query.set("status", statusFilter.value);
  }
  if (departmentFilter.value) {
    query.set("department", departmentFilter.value);
  }

  const { employees } = await api(`/api/employees?${query.toString()}`);
  state.employees = employees;
  renderEmployees(employees);
  fillSelectOptions(attendanceEmployeeId, employees, "No employees available");
  fillSelectOptions(leaveEmployeeId, employees, "No employees available");
  syncSelfLeaveSelection();

  if (!state.selectedEmployeeId && employees.length) {
    await fetchEmployeeProfile(employees[0].id);
  }
}

async function loadAttendance() {
  const { records } = await api("/api/attendance");
  state.attendance = records;
  renderAttendance(records);
}

async function loadLeaves() {
  const { leaves } = await api("/api/leaves");
  state.leaves = leaves;
  renderLeaves(leaves);
}

async function loadManagerApprovals() {
  if (!state.permissions.reviewLeaves) {
    state.managerApprovals = [];
    renderManagerApprovals([]);
    return;
  }
  const { approvals } = await api("/api/manager/approvals");
  state.managerApprovals = approvals;
  renderManagerApprovals(approvals);
}

async function loadEmployeeDashboard() {
  const data = await api("/api/employee/dashboard");
  state.permissions = data.permissions || {};
  renderEmployeePortal(data);
  syncUserContext();
}

async function refreshAll() {
  if (state.currentUser?.accountType === "employee") {
    await loadEmployeeDashboard();
    return;
  }
  await Promise.all([loadDashboard(), loadEmployees(), loadAttendance(), loadLeaves()]);
  await loadManagerApprovals();
  if (state.selectedEmployeeId) {
    await fetchEmployeeProfile(state.selectedEmployeeId);
  }
}

async function readFileAsDataUrl(file) {
  if (!file) {
    return "";
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read the selected file."));
    reader.readAsDataURL(file);
  });
}

async function initializeAuthOptions() {
  const { staffAccounts, employeeAccounts } = await api("/api/auth/options");
  state.authOptions = {
    staffAccounts: staffAccounts || [],
    employeeAccounts: employeeAccounts || [],
  };
  renderDemoAccounts(state.authOptions.staffAccounts);
  renderEmployeeDemoAccounts(state.authOptions.employeeAccounts);
}

async function checkSession() {
  const session = await api("/api/session");
  const mode = session.user?.accountType === "employee" ? "employee" : "staff";
  setAuthenticated(session.authenticated, mode);
  state.currentUser = session.user;
  state.permissions = session.permissions || {};
  if (session.authenticated) {
    syncUserContext();
    await refreshAll();
  }
}

staffLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = {
      username: document.getElementById("loginUsername").value.trim(),
      password: document.getElementById("loginPassword").value,
    };
    const { user } = await api("/api/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.currentUser = user;
    setAuthenticated(true, "staff");
    activateNav("overviewSection");
    clearResetSupport();
    await refreshAll();
    showToast("Login successful.");
  } catch (error) {
    showToast(error.message, true);
  }
});

employeeLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = {
      username: document.getElementById("employeeLoginUsername").value.trim(),
      password: document.getElementById("employeeLoginPassword").value,
    };
    const { user } = await api("/api/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.currentUser = user;
    setAuthenticated(true, "employee");
    clearResetSupport();
    await refreshAll();
    showToast("Employee login successful.");
  } catch (error) {
    showToast(error.message, true);
  }
});

forgotPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = {
      username: document.getElementById("forgotUsername").value.trim(),
    };
    const response = await api("/api/password/forgot", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    resetCodeResult.textContent = `Reset code for ${payload.username}: ${response.resetCode} (valid until ${formatDateTime(response.expiresAt)})`;
    resetCodeResult.classList.remove("hidden");
    document.getElementById("resetUsername").value = payload.username;
    document.getElementById("resetCode").value = response.resetCode;
    showToast("Reset code generated.");
  } catch (error) {
    clearResetSupport();
    showToast(error.message, true);
  }
});

resetPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = {
      username: document.getElementById("resetUsername").value.trim(),
      resetCode: document.getElementById("resetCode").value.trim(),
      newPassword: document.getElementById("resetNewPassword").value,
    };
    await api("/api/password/reset", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    resetPasswordForm.reset();
    clearResetSupport();
    showToast("Password reset successfully.");
  } catch (error) {
    showToast(error.message, true);
  }
});

demoAccounts.addEventListener("click", (event) => {
  const button = event.target.closest(".demo-account");
  if (!button) {
    return;
  }
  document.getElementById("loginUsername").value = button.dataset.username;
  document.getElementById("loginPassword").value = button.dataset.password;
});

employeeDemoAccounts.addEventListener("click", (event) => {
  const button = event.target.closest(".demo-account");
  if (!button) {
    return;
  }
  document.getElementById("employeeLoginUsername").value = button.dataset.username;
  document.getElementById("employeeLoginPassword").value = button.dataset.password;
});

employeePhoto.addEventListener("change", async () => {
  const file = employeePhoto.files?.[0];
  if (!file) {
    state.employeePhotoDataUrl = "";
    photoPreview.classList.add("hidden");
    return;
  }

  try {
    state.employeePhotoDataUrl = await readFileAsDataUrl(file);
    photoPreview.src = state.employeePhotoDataUrl;
    photoPreview.classList.remove("hidden");
  } catch (error) {
    showToast(error.message, true);
  }
});

employeeProfilePhoto?.addEventListener("change", async () => {
  const file = employeeProfilePhoto.files?.[0];
  if (!file) {
    state.employeeProfilePhotoDataUrl = "";
    return;
  }

  try {
    state.employeeProfilePhotoDataUrl = await readFileAsDataUrl(file);
    employeeProfilePhotoPreview.src = state.employeeProfilePhotoDataUrl;
    employeeProfilePhotoPreview.classList.remove("hidden");
  } catch (error) {
    showToast(error.message, true);
  }
});

employeeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.permissions.manageEmployees) {
    showToast("Your role cannot manage employee records.", true);
    return;
  }

  const mode = document.getElementById("formMode").value;
  const payload = {
    employeeId: document.getElementById("employeeId").value.trim(),
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    contactNumber: document.getElementById("contactNumber").value.trim(),
    department: document.getElementById("department").value.trim(),
    role: document.getElementById("role").value.trim(),
    joinedOn: document.getElementById("joinedOn").value,
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value.trim(),
  };

  if (state.employeePhotoDataUrl) {
    payload.photoDataUrl = state.employeePhotoDataUrl;
    payload.photoFilename = employeePhoto.files?.[0]?.name || "employee-photo";
  }

  try {
    if (mode === "edit") {
      const employeeId = editingEmployeeId.value;
      await api(`/api/employees/${employeeId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      state.selectedEmployeeId = Number(employeeId);
      showToast("Employee updated successfully.");
    } else {
      const response = await api("/api/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      state.selectedEmployeeId = response.employee.id;
      showToast("Employee added successfully.");
    }
    resetEmployeeForm();
    closeEmployeeModal();
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
  }
});

attendanceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.permissions.manageAttendance) {
    showToast("Your role cannot manage attendance.", true);
    return;
  }

  const payload = {
    employeeId: Number(attendanceEmployeeId.value),
    attendanceDate: attendanceDate.value,
    status: attendanceStatus.value,
    checkIn: attendanceCheckIn.value,
    checkOut: attendanceCheckOut.value,
    notes: attendanceNotes.value.trim(),
  };

  try {
    await api("/api/attendance", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    attendanceForm.reset();
    attendanceDate.valueAsDate = new Date();
    showToast("Attendance saved successfully.");
    await Promise.all([loadDashboard(), loadAttendance()]);
    if (state.selectedEmployeeId) {
      await fetchEmployeeProfile(state.selectedEmployeeId);
    }
  } catch (error) {
    showToast(error.message, true);
  }
});

leaveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.permissions.createLeaves) {
    showToast("Your role cannot create leave requests.", true);
    return;
  }

  const payload = {
    employeeId: Number(leaveEmployeeId.value),
    leaveType: leaveType.value,
    startDate: leaveStartDate.value,
    endDate: leaveEndDate.value,
    reason: leaveReason.value.trim(),
  };

  try {
    await api("/api/leaves", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    leaveForm.reset();
    syncSelfLeaveSelection();
    const isSelfRequest = Number(payload.employeeId) === Number(state.currentUser?.employeeId || 0);
    showToast(isSelfRequest ? "Your leave request was submitted successfully." : "Leave request submitted successfully.");
    await Promise.all([loadDashboard(), loadLeaves()]);
    if (state.selectedEmployeeId) {
      await fetchEmployeeProfile(state.selectedEmployeeId);
    }
  } catch (error) {
    showToast(error.message, true);
  }
});

useOwnLeaveProfileButton?.addEventListener("click", () => {
  if (!state.currentUser?.employeeId) {
    showToast("No linked employee profile is connected to this staff account yet.", true);
    return;
  }
  leaveEmployeeId.value = String(state.currentUser.employeeId);
  showToast("Leave form switched to your own employee profile.");
});

staffPasswordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = {
      currentPassword: document.getElementById("staffCurrentPassword").value,
      newPassword: document.getElementById("staffNewPassword").value,
    };
    await api("/api/password/change", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    staffPasswordForm.reset();
    showToast("Password updated successfully.");
  } catch (error) {
    showToast(error.message, true);
  }
});

employeeAttendanceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!(state.permissions.selfAttendance || state.permissions.manageAttendance)) {
    showToast("Your account cannot submit attendance.", true);
    return;
  }

  const payload = {
    attendanceDate: employeeAttendanceDate.value,
    status: employeeAttendanceStatus.value,
    checkIn: employeeAttendanceCheckIn.value,
    checkOut: employeeAttendanceCheckOut.value,
    notes: employeeAttendanceNotes.value.trim(),
  };

  try {
    await api("/api/attendance", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    employeeAttendanceForm.reset();
    employeeAttendanceDate.valueAsDate = new Date();
    showToast("Attendance submitted successfully.");
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
  }
});

employeeProfileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = {
      name: employeeProfileName.value.trim(),
      email: employeeProfileEmail.value.trim(),
      contactNumber: employeeProfileContactNumber.value.trim(),
      notes: employeeProfileNotes.value.trim(),
    };
    if (state.employeeProfilePhotoDataUrl) {
      payload.photoDataUrl = state.employeeProfilePhotoDataUrl;
      payload.photoFilename = employeeProfilePhoto.files?.[0]?.name || "employee-profile-photo";
    }
    const response = await api("/api/employee/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    state.currentUser = response.user;
    showToast("Profile updated successfully.");
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
  }
});

employeePasswordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = {
      currentPassword: document.getElementById("employeeCurrentPassword").value,
      newPassword: document.getElementById("employeeNewPassword").value,
    };
    await api("/api/password/change", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    employeePasswordForm.reset();
    showToast("Employee password updated successfully.");
  } catch (error) {
    showToast(error.message, true);
  }
});

employeeLeaveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!(state.permissions.selfLeave || state.permissions.createLeaves)) {
    showToast("Your account cannot submit leave requests.", true);
    return;
  }

  const payload = {
    leaveType: employeeLeaveType.value,
    startDate: employeeLeaveStartDate.value,
    endDate: employeeLeaveEndDate.value,
    reason: employeeLeaveReason.value.trim(),
  };

  try {
    await api("/api/leaves", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    employeeLeaveForm.reset();
    showToast("Leave request submitted successfully.");
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
  }
});

employeeTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const employeeId = Number(button.dataset.id);
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) {
    showToast("Employee record is no longer available.", true);
    return;
  }

  if (button.dataset.action === "view") {
    activateNav("directorySection");
    await fetchEmployeeProfile(employeeId);
    return;
  }

  if (button.dataset.action === "edit") {
    activateNav("operationsSection");
    loadEmployeeIntoForm(employee);
    openEmployeeModal();
    return;
  }

  if (button.dataset.action === "delete") {
    const confirmed = window.confirm(`Delete employee ${employee.name} (${employee.employeeId})?`);
    if (!confirmed) {
      return;
    }

    try {
      await api(`/api/employees/${employeeId}`, { method: "DELETE" });
      if (state.selectedEmployeeId === employeeId) {
        state.selectedEmployeeId = null;
        renderProfile(null);
      }
      showToast("Employee deleted successfully.");
      await refreshAll();
    } catch (error) {
      showToast(error.message, true);
    }
  }
});

leaveTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-leave-action]");
  if (!button) {
    return;
  }

  const leaveId = button.dataset.id;
  const status = button.dataset.leaveAction === "approve" ? "Approved" : "Rejected";
  const reviewerNotes = window.prompt(`Add ${status.toLowerCase()} notes (optional):`, "") || "";

  try {
    await api(`/api/leaves/${leaveId}/review`, {
      method: "POST",
      body: JSON.stringify({ status, reviewerNotes }),
    });
    showToast(`Leave request ${status.toLowerCase()}.`);
    await Promise.all([loadDashboard(), loadLeaves()]);
    if (state.selectedEmployeeId) {
      await fetchEmployeeProfile(state.selectedEmployeeId);
    }
  } catch (error) {
    showToast(error.message, true);
  }
});

managerApprovalTableBody?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-leave-action]");
  if (!button) {
    return;
  }

  const leaveId = button.dataset.id;
  const status = button.dataset.leaveAction === "approve" ? "Approved" : "Rejected";
  const reviewerNotes = window.prompt(`Add ${status.toLowerCase()} notes (optional):`, "") || "";

  try {
    await api(`/api/leaves/${leaveId}/review`, {
      method: "POST",
      body: JSON.stringify({ status, reviewerNotes }),
    });
    showToast(`Leave request ${status.toLowerCase()}.`);
    await Promise.all([loadDashboard(), loadLeaves(), loadManagerApprovals()]);
    if (state.selectedEmployeeId) {
      await fetchEmployeeProfile(state.selectedEmployeeId);
    }
  } catch (error) {
    showToast(error.message, true);
  }
});

searchInput.addEventListener("input", () => {
  loadEmployees().catch((error) => showToast(error.message, true));
});

statusFilter.addEventListener("change", () => {
  loadEmployees().catch((error) => showToast(error.message, true));
});

departmentFilter.addEventListener("change", () => {
  loadEmployees().catch((error) => showToast(error.message, true));
});

logoutButton.addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST" });
    resetSessionState();
    setAuthenticated(false, "staff");
    showToast("Logged out.");
  } catch (error) {
    showToast(error.message, true);
  }
});

employeeLogoutButton.addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST" });
    resetSessionState();
    setAuthenticated(false, "staff");
    showToast("Logged out.");
  } catch (error) {
    showToast(error.message, true);
  }
});

exportButton.addEventListener("click", () => {
  window.location.href = "/api/reports/export.csv";
});

resetButton.addEventListener("click", resetEmployeeForm);

if (openCreateModalButton) {
  openCreateModalButton.addEventListener("click", () => {
    resetEmployeeForm();
    activateNav("operationsSection");
    openEmployeeModal();
  });
}

if (openCreateModalSecondaryButton) {
  openCreateModalSecondaryButton.addEventListener("click", () => {
    resetEmployeeForm();
    activateNav("operationsSection");
    openEmployeeModal();
  });
}

if (openEditHintButton) {
  openEditHintButton.addEventListener("click", () => {
    activateNav("directorySection");
    document.getElementById("directorySection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Select an employee from the directory and click View or Edit.");
  });
}

if (closeModalButton) {
  closeModalButton.addEventListener("click", closeEmployeeModal);
}

if (modalBackdrop) {
  modalBackdrop.addEventListener("click", closeEmployeeModal);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeEmployeeModal();
  }
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const targetId = item.dataset.target;
    activateNav(targetId);
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

initializeTheme();
attendanceDate.valueAsDate = new Date();

Promise.all([initializeAuthOptions(), checkSession()]).catch((error) => {
  showToast(error.message, true);
});
