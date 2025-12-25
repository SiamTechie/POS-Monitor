/**
 * POS Monitor Enhanced - Firebase Dashboard
 * Real-time monitoring dashboard with Firebase integration
 */

// ========== FIREBASE CONFIGURATION ==========
const firebaseConfig = {
    apiKey: "AIzaSyARQrby2xDPI0NU7PVF-13ZZzF9N-DYTwo",
    authDomain: "pos-monitor-7bcaf.firebaseapp.com",
    databaseURL: "https://pos-monitor-7bcaf-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pos-monitor-7bcaf",
    storageBucket: "pos-monitor-7bcaf.firebasestorage.app",
    messagingSenderId: "558212427792",
    appId: "1:558212427792:web:3b123886c9d1e052af5a95"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ========== STATE MANAGEMENT ==========
let state = {
    branches: {},
    filteredBranches: [],
    currentFilter: 'all',
    searchQuery: '',
    connected: false,
    editMode: false,
    branchToDelete: null,
    currentView: 'grid' // 'grid' or 'table'
};

// ========== DOM ELEMENTS ==========
const elements = {
    // Summary cards
    totalBranches: document.getElementById('totalBranches'),
    goodBranches: document.getElementById('goodBranches'),
    warningBranches: document.getElementById('warningBranches'),
    criticalBranches: document.getElementById('criticalBranches'),

    // Controls
    searchInput: document.getElementById('searchInput'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    manageBtn: document.getElementById('manageBtn'),
    infoBtn: document.getElementById('infoBtn'),
    viewGridBtn: document.getElementById('viewGridBtn'),
    viewTableBtn: document.getElementById('viewTableBtn'),
    hamburgerBtn: document.getElementById('hamburgerBtn'),
    actionButtons: document.getElementById('actionButtons'),

    // Content areas
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    branchesGrid: document.getElementById('branchesGrid'),
    branchesTableContainer: document.getElementById('branchesTableContainer'),
    branchesTableBody: document.getElementById('branchesTableBody'),

    // Status
    connectionStatus: document.getElementById('connectionStatus'),
    lastUpdate: document.getElementById('lastUpdate'),

    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteBranchName: document.getElementById('deleteBranchName'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

    // Info Modal
    infoModal: document.getElementById('infoModal'),
    closeInfoBtn: document.getElementById('closeInfoBtn')
};

// ========== FIREBASE LISTENERS ==========

/**
 * Setup Firebase real-time listeners
 */
function setupFirebaseListeners() {
    // Listen for connection status
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', (snapshot) => {
        state.connected = snapshot.val() === true;
        updateConnectionStatus();
    });

    // Listen for branch data changes
    const branchesRef = database.ref('branches');
    branchesRef.on('value', (snapshot) => {
        const data = snapshot.val();

        if (data) {
            state.branches = data;
            updateDashboard();
        } else {
            showEmptyState();
        }
    });

    console.log('✅ Firebase listeners initialized');
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus() {
    const statusDot = elements.connectionStatus.querySelector('.status-dot');
    const statusText = elements.connectionStatus.querySelector('.status-text');

    if (state.connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

// ========== UI RENDERING ==========

/**
 * Update entire dashboard
 */
function updateDashboard() {
    const branches = Object.entries(state.branches).map(([name, data]) => ({
        name,
        ...data.current
    }));

    if (branches.length === 0) {
        showEmptyState();
        return;
    }

    // Update summary
    updateSummary(branches);

    // Apply filters
    applyFilters(branches);

    // Update last update time
    updateLastUpdateTime();

    // Hide loading, show content
    elements.loadingState.style.display = 'none';
    elements.emptyState.style.display = 'none';
    elements.branchesGrid.style.display = 'grid';
}

/**
 * Update summary cards
 */
function updateSummary(branches) {
    const total = branches.length;
    const good = branches.filter(b => b.status === 'good').length;
    const warning = branches.filter(b => b.status === 'warning').length;
    const critical = branches.filter(b => b.status === 'critical').length;

    elements.totalBranches.textContent = total;
    elements.goodBranches.textContent = good;
    elements.warningBranches.textContent = warning;
    elements.criticalBranches.textContent = critical;
}

/**
 * Render branch card with enhanced metrics
 */
function createBranchCard(branch) {
    const statusClass = branch.status || 'warning';
    const statusLabel = {
        'good': '✓ Good',
        'warning': '⚠ Warning',
        'critical': '✗ Critical'
    }[statusClass] || '? Unknown';

    const deleteBtn = state.editMode ?
        `<button class="delete-branch-btn" data-branch="${branch.name}" title="ลบสาขานี้">❌</button>` : '';

    return `
        <div class="branch-card status-${statusClass} ${state.editMode ? 'edit-mode' : ''}">
            <div class="branch-header">
                <div class="branch-name">${branch.name}</div>
                <div class="branch-header-actions">
                    ${deleteBtn}
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </div>
            </div>
            
            <div class="branch-metrics">
                <div class="metric">
                    <div class="metric-label">POS Server</div>
                    <div class="metric-value">
                        ${branch.pos_ping || '--'}<span class="metric-unit">ms</span>
                    </div>
                </div>
                
                <div class="metric">
                    <div class="metric-label">Internet</div>
                    <div class="metric-value">
                        ${branch.google_ping || '--'}<span class="metric-unit">ms</span>
                    </div>
                </div>
                
                <div class="metric">
                    <div class="metric-label">HTTP Response</div>
                    <div class="metric-value">
                        ${branch.http_response || '--'}<span class="metric-unit">ms</span>
                    </div>
                </div>
            </div>
            
            <div class="diagnosis-section">
                <div class="diagnosis-label">📋 Diagnosis:</div>
                <div class="diagnosis-text">${branch.diagnosis || 'No data'}</div>
                ${branch.recommendation ? `
                    <div class="recommendation-text">💡 ${branch.recommendation}</div>
                ` : ''}
            </div>
            
            <div class="branch-footer">
                <span>🕐 ${branch.timestamp_thai || '--'}</span>
            </div>
        </div>
    `;
}

/**
 * Render branches based on current filter
 */
function renderBranches(branches) {
    if (branches.length === 0) {
        elements.branchesGrid.innerHTML = '<p class="no-results">No branches match your filter</p>';
        elements.branchesTableBody.innerHTML = '<tr><td colspan="7" class="no-results">No branches match your filter</td></tr>';
        return;
    }

    // Render Grid View
    elements.branchesGrid.innerHTML = branches.map(createBranchCard).join('');

    // Render Table View
    elements.branchesTableBody.innerHTML = branches.map(createTableRow).join('');
}

/**
 * Create table row for branch
 */
function createTableRow(branch) {
    const statusClass = branch.status || 'warning';
    const statusLabel = {
        'good': '✓ Good',
        'warning': '⚠ Warning',
        'critical': '✗ Critical'
    }[statusClass] || '? Unknown';

    const deleteBtn = state.editMode ?
        `<button class="delete-branch-btn-sm" data-branch="${branch.name}" title="ลบ">❌</button>` : '';

    return `
        <tr class="status-row-${statusClass}">
            <td>
                ${deleteBtn}
                <strong>${branch.name}</strong>
            </td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td>${branch.pos_ping || '--'} ms</td>
            <td>${branch.google_ping || '--'} ms</td>
            <td>${branch.http_response || '--'} ms</td>
            <td class="diagnosis-cell">${branch.diagnosis || 'No data'}</td>
            <td>${branch.timestamp_thai || '--'}</td>
        </tr>
    `;
}

/**
 * Toggle view mode (Grid/Table)
 */
function setViewMode(mode) {
    state.currentView = mode;

    // Update button states
    elements.viewGridBtn.classList.toggle('active', mode === 'grid');
    elements.viewTableBtn.classList.toggle('active', mode === 'table');

    // Show/hide containers
    if (mode === 'grid') {
        elements.branchesGrid.style.display = 'grid';
        elements.branchesTableContainer.style.display = 'none';
    } else {
        elements.branchesGrid.style.display = 'none';
        elements.branchesTableContainer.style.display = 'block';
    }
}

/**
 * Show info modal
 */
function showInfoModal() {
    elements.infoModal.style.display = 'flex';
}

/**
 * Hide info modal
 */
function hideInfoModal() {
    elements.infoModal.style.display = 'none';
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    elements.actionButtons.classList.toggle('show');
    elements.hamburgerBtn.classList.toggle('active');
}

/**
 * Update last update timestamp
 */
function updateLastUpdateTime() {
    const now = new Date();
    elements.lastUpdate.textContent = now.toLocaleTimeString('th-TH');
}

/**
 * Show empty state
 */
function showEmptyState() {
    elements.loadingState.style.display = 'none';
    elements.emptyState.style.display = 'block';
    elements.branchesGrid.style.display = 'none';
}

// ========== FILTERING & SEARCH ==========

/**
 * Apply filters and search
 */
function applyFilters(branches) {
    let filtered = [...branches];

    // Apply status filter
    if (state.currentFilter !== 'all') {
        filtered = filtered.filter(b => b.status === state.currentFilter);
    }

    // Apply search
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(b =>
            b.name.toLowerCase().includes(query)
        );
    }

    // Sort by status (critical first)
    filtered.sort((a, b) => {
        const statusOrder = { critical: 0, warning: 1, good: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    renderBranches(filtered);
}

/**
 * Set filter
 */
function setFilter(filter) {
    state.currentFilter = filter;

    // Update button states
    elements.filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    // Re-apply filters
    const branches = Object.entries(state.branches).map(([name, data]) => ({
        name,
        ...data.current
    }));
    applyFilters(branches);
}

/**
 * Handle search input
 */
function handleSearch(query) {
    state.searchQuery = query;

    // Re-apply filters
    const branches = Object.entries(state.branches).map(([name, data]) => ({
        name,
        ...data.current
    }));
    applyFilters(branches);
}

// ========== MANAGE MODE & DELETE ==========

/**
 * Toggle edit mode
 */
function toggleEditMode() {
    state.editMode = !state.editMode;

    // Update button text
    elements.manageBtn.innerHTML = state.editMode ? '✓ Done' : '🗑️ Manage';
    elements.manageBtn.classList.toggle('active', state.editMode);

    // Re-render to show/hide delete buttons
    const branches = Object.entries(state.branches).map(([name, data]) => ({
        name,
        ...data.current
    }));
    applyFilters(branches);

    console.log(`📝 Edit mode: ${state.editMode ? 'ON' : 'OFF'}`);
}

/**
 * Show delete confirmation modal
 */
function showDeleteModal(branchName) {
    state.branchToDelete = branchName;
    elements.deleteBranchName.textContent = branchName;
    elements.deleteModal.style.display = 'flex';
}

/**
 * Hide delete confirmation modal
 */
function hideDeleteModal() {
    state.branchToDelete = null;
    elements.deleteModal.style.display = 'none';
}

/**
 * Delete branch from Firebase
 */
async function deleteBranch() {
    const branchName = state.branchToDelete;
    if (!branchName) return;

    try {
        console.log(`🗑️ Deleting branch: ${branchName}`);

        // Delete from Firebase
        await database.ref(`branches/${branchName}`).remove();

        // Remove from local state
        delete state.branches[branchName];

        console.log(`✅ Branch "${branchName}" deleted successfully`);

        // Hide modal
        hideDeleteModal();

        // Update dashboard
        updateDashboard();

    } catch (error) {
        console.error('❌ Error deleting branch:', error);
        alert(`เกิดข้อผิดพลาดในการลบ: ${error.message}`);
        hideDeleteModal();
    }
}

/**
 * Handle delete button click on branch card or table row
 */
function handleDeleteClick(event) {
    const btn = event.target.closest('.delete-branch-btn, .delete-branch-btn-sm');
    if (btn) {
        const branchName = btn.dataset.branch;
        showDeleteModal(branchName);
    }
}

// ========== EVENT LISTENERS ==========

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Filter buttons
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // Manage button
    elements.manageBtn.addEventListener('click', toggleEditMode);

    // Delete button clicks (event delegation)
    elements.branchesGrid.addEventListener('click', handleDeleteClick);

    // Table delete button clicks (event delegation)
    elements.branchesTableBody.addEventListener('click', handleDeleteClick);

    // Modal buttons
    elements.cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    elements.confirmDeleteBtn.addEventListener('click', deleteBranch);

    // Close modal on overlay click
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            hideDeleteModal();
        }
    });

    // View toggle buttons
    elements.viewGridBtn.addEventListener('click', () => setViewMode('grid'));
    elements.viewTableBtn.addEventListener('click', () => setViewMode('table'));

    // Info button
    elements.infoBtn.addEventListener('click', () => {
        showInfoModal();
        // Close mobile menu after clicking
        elements.actionButtons.classList.remove('show');
        elements.hamburgerBtn.classList.remove('active');
    });
    elements.closeInfoBtn.addEventListener('click', hideInfoModal);
    elements.infoModal.addEventListener('click', (e) => {
        if (e.target === elements.infoModal) {
            hideInfoModal();
        }
    });

    // Hamburger menu (mobile)
    elements.hamburgerBtn.addEventListener('click', toggleMobileMenu);

    // Close mobile menu when clicking action buttons
    elements.manageBtn.addEventListener('click', () => {
        elements.actionButtons.classList.remove('show');
        elements.hamburgerBtn.classList.remove('active');
    });
}

// ========== INITIALIZATION ==========

/**
 * Initialize dashboard
 */
function init() {
    console.log('🚀 Initializing POS Monitor Enhanced Dashboard...');

    // Setup event listeners
    initEventListeners();

    // Setup Firebase listeners
    setupFirebaseListeners();

    console.log('✅ Dashboard ready!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
