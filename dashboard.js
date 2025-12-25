/**
 * POS Monitor Dashboard - JavaScript
 * Handles data fetching, filtering, and UI updates
 */

// ========== CONFIGURATION ==========
const CONFIG = {
    // Google Sheets configuration
    // Option 1: Use Google Sheets API (recommended for production)
    SHEETS_API_KEY: 'YOUR_GOOGLE_SHEETS_API_KEY',
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
    RANGE: 'Sheet1!A2:E', // Skip header row

    // Option 2: Use Apps Script Web App (simpler setup)
    // Create a doGet() function in Apps Script to return JSON data
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbySiln3ub8M1B99JZzKZrYLffiBKJg0D00F1BC1kGEG3VsBPxGsxpVcf_0VLKM4jLh9vw/exec',

    // Refresh interval (milliseconds)
    REFRESH_INTERVAL: 60000, // 1 minute

    // Performance thresholds (ms)
    THRESHOLDS: {
        GOOD: 150,      // < 150ms = Good
        WARNING: 300,   // 150-300ms = Warning
        CRITICAL: 300   // > 300ms = Critical
    }
};

// ========== STATE MANAGEMENT ==========
let state = {
    branches: [],
    filteredBranches: [],
    currentFilter: 'all',
    currentView: 'grid',
    searchQuery: '',
    lastUpdate: null
};

// ========== DOM ELEMENTS ==========
const elements = {
    // Summary cards
    totalBranches: document.getElementById('totalBranches'),
    goodBranches: document.getElementById('goodBranches'),
    warningBranches: document.getElementById('warningBranches'),
    criticalBranches: document.getElementById('criticalBranches'),

    // Controls
    refreshBtn: document.getElementById('refreshBtn'),
    searchInput: document.getElementById('searchInput'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    viewBtns: document.querySelectorAll('.view-btn'),

    // Content areas
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    branchesGrid: document.getElementById('branchesGrid'),
    branchesTable: document.getElementById('branchesTable'),
    branchesTableBody: document.getElementById('branchesTableBody'),

    // Last update
    lastUpdate: document.getElementById('lastUpdate')
};

// ========== DATA FETCHING ==========

/**
 * Fetch data from Google Sheets
 * This is a demo function - you need to implement actual data fetching
 */
async function fetchBranchData() {
    try {
        // PRODUCTION MODE: Fetch real data from Apps Script
        console.log('📡 Fetching data from:', CONFIG.APPS_SCRIPT_URL);

        const response = await fetch(CONFIG.APPS_SCRIPT_URL);
        const result = await response.json();

        console.log('✅ Data received:', result);

        // Check if response is successful
        if (result.success === false) {
            throw new Error(result.error || 'Failed to fetch data');
        }

        // Return the data array
        return result.data || [];

    } catch (error) {
        console.error('❌ Error fetching data:', error);

        // Fallback to demo data if API fails
        console.warn('⚠️ Falling back to demo data');
        return generateDemoData();
    }
}

/**
 * Parse Google Sheets data into branch objects
 */
function parseGoogleSheetsData(rows) {
    // Group by branch name and get latest entry for each
    const branchMap = new Map();

    rows.forEach(row => {
        const [timestamp, branchName, avgLatency, maxLatency, samples] = row;

        const branch = {
            name: branchName,
            avgLatency: parseInt(avgLatency),
            maxLatency: parseInt(maxLatency),
            samples: parseInt(samples),
            timestamp: timestamp,
            status: getStatus(parseInt(avgLatency))
        };

        // Keep only the latest entry for each branch
        if (!branchMap.has(branchName) ||
            new Date(timestamp) > new Date(branchMap.get(branchName).timestamp)) {
            branchMap.set(branchName, branch);
        }
    });

    return Array.from(branchMap.values());
}

/**
 * Determine status based on average latency
 */
function getStatus(avgLatency) {
    if (avgLatency < CONFIG.THRESHOLDS.GOOD) return 'good';
    if (avgLatency < CONFIG.THRESHOLDS.WARNING) return 'warning';
    return 'critical';
}

/**
 * Generate demo data for testing
 */
function generateDemoData() {
    const branches = [
        'สาขาสีลม', 'สาขาสยาม', 'สาขาอโศก', 'สาขาเอกมัย', 'สาขาทองหล่อ',
        'สาขาพระราม 9', 'สาขาลาดพร้าว', 'สาขารัชดา', 'สาขาบางนา', 'สาขาเมกา',
        'สาขาเซ็นทรัล', 'สาขาพารากอน', 'สาขาเอ็มควอเทียร์', 'สาขาเกตเวย์', 'สาขาเทอมินอล'
    ];

    return branches.map(name => {
        const avgLatency = Math.floor(Math.random() * 500) + 50;
        const maxLatency = avgLatency + Math.floor(Math.random() * 200);

        return {
            name,
            avgLatency,
            maxLatency,
            samples: Math.floor(Math.random() * 10) + 10,
            timestamp: new Date(Date.now() - Math.random() * 900000).toLocaleString('th-TH'),
            status: getStatus(avgLatency)
        };
    });
}

// ========== UI RENDERING ==========

/**
 * Update summary cards
 */
function updateSummary() {
    const total = state.branches.length;
    const good = state.branches.filter(b => b.status === 'good').length;
    const warning = state.branches.filter(b => b.status === 'warning').length;
    const critical = state.branches.filter(b => b.status === 'critical').length;

    elements.totalBranches.textContent = total;
    elements.goodBranches.textContent = good;
    elements.warningBranches.textContent = warning;
    elements.criticalBranches.textContent = critical;
}

/**
 * Render branch card (grid view)
 */
function createBranchCard(branch) {
    return `
        <div class="branch-card status-${branch.status}">
            <div class="branch-header">
                <div class="branch-name">${branch.name}</div>
                <span class="status-badge ${branch.status}">
                    ${branch.status === 'good' ? '✓ Good' :
            branch.status === 'warning' ? '⚠ Warning' :
                '✗ Critical'}
                </span>
            </div>
            
            <div class="branch-metrics">
                <div class="metric">
                    <div class="metric-label">Avg Latency</div>
                    <div class="metric-value">
                        ${branch.avgLatency}<span class="metric-unit">ms</span>
                    </div>
                </div>
                
                <div class="metric">
                    <div class="metric-label">Max Latency</div>
                    <div class="metric-value">
                        ${branch.maxLatency}<span class="metric-unit">ms</span>
                    </div>
                </div>
            </div>
            
            <div class="branch-footer">
                <span>📊 ${branch.samples} samples</span>
                <span>🕐 ${branch.timestamp}</span>
            </div>
        </div>
    `;
}

/**
 * Render table row (table view)
 */
function createTableRow(branch) {
    const statusIcon = branch.status === 'good' ? '🟢' :
        branch.status === 'warning' ? '🟡' : '🔴';

    return `
        <tr>
            <td>${statusIcon}</td>
            <td><strong>${branch.name}</strong></td>
            <td>${branch.avgLatency} ms</td>
            <td>${branch.maxLatency} ms</td>
            <td>${branch.samples}</td>
            <td>${branch.timestamp}</td>
        </tr>
    `;
}

/**
 * Render branches based on current view
 */
function renderBranches() {
    const branches = state.filteredBranches;

    // Hide all views first
    elements.loadingState.style.display = 'none';
    elements.emptyState.style.display = 'none';
    elements.branchesGrid.style.display = 'none';
    elements.branchesTable.style.display = 'none';

    // Show empty state if no data
    if (branches.length === 0) {
        elements.emptyState.style.display = 'block';
        return;
    }

    // Render based on current view
    if (state.currentView === 'grid') {
        elements.branchesGrid.innerHTML = branches.map(createBranchCard).join('');
        elements.branchesGrid.style.display = 'grid';
    } else {
        elements.branchesTableBody.innerHTML = branches.map(createTableRow).join('');
        elements.branchesTable.style.display = 'block';
    }
}

/**
 * Update last update timestamp
 */
function updateLastUpdateTime() {
    const now = new Date();
    elements.lastUpdate.textContent = now.toLocaleTimeString('th-TH');
    state.lastUpdate = now;
}

// ========== FILTERING & SEARCH ==========

/**
 * Apply filters and search
 */
function applyFilters() {
    let filtered = [...state.branches];

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

    state.filteredBranches = filtered;
    renderBranches();
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

    applyFilters();
}

/**
 * Set view mode
 */
function setView(view) {
    state.currentView = view;

    // Update button states
    elements.viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    renderBranches();
}

/**
 * Handle search input
 */
function handleSearch(query) {
    state.searchQuery = query;
    applyFilters();
}

// ========== DATA LOADING ==========

/**
 * Load and display data
 */
async function loadData() {
    try {
        // Show loading state
        elements.loadingState.style.display = 'block';
        elements.branchesGrid.style.display = 'none';
        elements.branchesTable.style.display = 'none';
        elements.emptyState.style.display = 'none';

        // Fetch data
        const data = await fetchBranchData();

        // Update state
        state.branches = data;
        state.filteredBranches = data;

        // Update UI
        updateSummary();
        renderBranches();
        updateLastUpdateTime();

    } catch (error) {
        console.error('Failed to load data:', error);
        elements.loadingState.style.display = 'none';
        elements.emptyState.style.display = 'block';
    }
}

/**
 * Refresh data
 */
async function refreshData() {
    elements.refreshBtn.disabled = true;
    elements.refreshBtn.innerHTML = '<span class="btn-icon">⏳</span> Refreshing...';

    await loadData();

    elements.refreshBtn.disabled = false;
    elements.refreshBtn.innerHTML = '<span class="btn-icon">🔄</span> Refresh';
}

// ========== EVENT LISTENERS ==========

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Refresh button
    elements.refreshBtn.addEventListener('click', refreshData);

    // Filter buttons
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // View toggle buttons
    elements.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => setView(btn.dataset.view));
    });

    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // Auto-refresh
    setInterval(loadData, CONFIG.REFRESH_INTERVAL);
}

// ========== INITIALIZATION ==========

/**
 * Initialize dashboard
 */
async function init() {
    console.log('🚀 Initializing POS Monitor Dashboard...');

    // Setup event listeners
    initEventListeners();

    // Load initial data
    await loadData();

    console.log('✅ Dashboard ready!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
