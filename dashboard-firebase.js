/**
 * POS Monitor Enhanced - Firebase Dashboard
 * Real-time monitoring dashboard with Firebase integration
 */

// ========== FIREBASE CONFIGURATION ==========
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
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
    connected: false
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

    // Content areas
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    branchesGrid: document.getElementById('branchesGrid'),

    // Status
    connectionStatus: document.getElementById('connectionStatus'),
    lastUpdate: document.getElementById('lastUpdate')
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

    return `
        <div class="branch-card status-${statusClass}">
            <div class="branch-header">
                <div class="branch-name">${branch.name}</div>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
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
        return;
    }

    elements.branchesGrid.innerHTML = branches.map(createBranchCard).join('');
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
