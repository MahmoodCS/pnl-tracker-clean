/* Robinhood PnL Tracker
   A beautiful, modern PnL tracking application with calendar visualization
   Supports mock data, CSV import, and future Robinhood API integration
*/

(function () {
    // DOM elements
    const accessOverlay = document.getElementById('accessOverlay');
    const accessForm = document.getElementById('accessForm');
    const accessEmailInput = document.getElementById('accessEmail');
    const accessCouponInput = document.getElementById('accessCoupon');
    const accessError = document.getElementById('accessError');
    const monthLabel = document.getElementById('monthLabel');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const daysGrid = document.getElementById('daysGrid');
    const totalPnlEl = document.getElementById('totalPnl');
    const tradingDaysEl = document.getElementById('tradingDays');
    const winRateEl = document.getElementById('winRate');
    const bestDayEl = document.getElementById('bestDay');
    const worstDayEl = document.getElementById('worstDay');
    const tooltip = document.getElementById('tooltip');
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettings = document.getElementById('closeSettings');
    const saveSettings = document.getElementById('saveSettings');
    const dataSourceSelect = document.getElementById('dataSource');
    const currencySelect = document.getElementById('currency');
    const themeSelect = document.getElementById('theme');
    const exportCSVBtn = document.getElementById('exportCSV');
    const exportPDFBtn = document.getElementById('exportPDF');
    const notificationContainer = document.getElementById('notificationContainer');
    const miniChart = document.getElementById('miniChart');
    const chartLine = document.getElementById('chartLine');
    const pnlTypeSelect = document.getElementById('pnlType');
    const viewModeSelect = document.getElementById('viewMode');
    const reportTypeSelect = document.getElementById('reportType');
    const privacyModeSelect = document.getElementById('privacyMode');
    const monthlyPnlEl = document.getElementById('monthlyPnl');
    const weeklyTotalsEl = document.getElementById('weeklyTotals');
    const accountBadge = document.getElementById('accountBadge');
    const accountEmailEl = document.getElementById('accountEmail');
    const accountPlanEl = document.getElementById('accountPlan');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const manageBillingBtn = document.getElementById('manageBillingBtn');
    const signOutBtn = document.getElementById('signOutBtn');
  
    // Application state
    let viewDate = new Date();
    let tradingData = new Map();
    let settings = {
        dataSource: 'mock',
        currency: 'USD',
        theme: 'auto',
        apiKey: '',
        csvData: null,
        viewMode: 'percent',
        privacyMode: 'show',
        pnlType: 'gross',
        reportType: 'aggregate'
    };
    
    // Load settings from storage
    loadSettings();
    // Access control
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').toLowerCase());
    }

    function normalizeCoupon(code) {
        return String(code || '').trim().toUpperCase();
    }

    function evaluateCouponPlan(code) {
        const normalized = normalizeCoupon(code);
        if (!normalized) return { plan: 'free', tier: 1 };
        
        // Special full access coupon codes
        const fullAccessCodes = new Set(['FULLACCESS', 'PREMIUM2024', 'MAHMOODVIP', 'UNLOCKALL', 'FREEPREMIUM']);
        if (fullAccessCodes.has(normalized)) {
            return { plan: 'tier3', tier: 3 };
        }
        
        // Tier 2 codes ($5/month equivalent)
        const tier2Codes = new Set(['TIER2', 'PORTFOLIO', 'BASIC', 'STARTER']);
        if (tier2Codes.has(normalized) || normalized.startsWith('T2')) {
            return { plan: 'tier2', tier: 2 };
        }
        
        // Tier 3 codes ($10/month equivalent) 
        const tier3Codes = new Set(['TIER3', 'PREMIUM', 'PRO', 'ADVANCED', 'LIFETIME', 'BETA']);
        if (tier3Codes.has(normalized) || normalized.startsWith('VIP') || normalized.startsWith('T3')) {
            return { plan: 'tier3', tier: 3 };
        }
        
        return { plan: 'free', tier: 1 };
    }

    function getAccess(cb) {
        chrome.storage.sync.get(['pnlAccess'], (result) => {
            cb(result.pnlAccess || null);
        });
    }

    function setAccess(access, cb) {
        chrome.storage.sync.set({ pnlAccess: access }, () => cb && cb());
    }

    function showAccessOverlay() {
        if (accessOverlay) {
            accessOverlay.style.display = 'flex';
        }
    }

    function hideAccessOverlay() {
        if (accessOverlay) {
            accessOverlay.style.display = 'none';
        }
    }

    function initAccessGate() {
        getAccess((access) => {
            if (access && access.granted && isValidEmail(access.email)) {
                // Already granted
                render();
                setTimeout(() => {
                    showNotification('info', access.plan === 'premium' ? 'Welcome Premium ✨' : 'Welcome', 'Access granted. Enjoy PnL Tracker!', 4000);
                }, 600);
                updateAccountBadge(access);
                return;
            }
            // Not granted yet
            showAccessOverlay();
        });

        if (accessForm) {
            accessForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = (accessEmailInput && accessEmailInput.value || '').trim();
                const coupon = accessCouponInput && accessCouponInput.value;
                if (!isValidEmail(email)) {
                    if (accessError) {
                        accessError.textContent = 'Please enter a valid email address.';
                        accessError.style.display = 'block';
                    }
                    return;
                }

                const planInfo = evaluateCouponPlan(coupon);
                const newAccess = {
                    email,
                    plan: planInfo.plan,
                    granted: true,
                    grantedAt: Date.now(),
                };
                setAccess(newAccess, () => {
                    hideAccessOverlay();
                    showNotification('success', 'Access Granted', planInfo.premium ? 'Premium features unlocked.' : 'You now have access.', 4000, { force: true });
                    render();
                    updateAccountBadge(newAccess);
                });
            });
        }
    }

    function updateAccountBadge(access) {
        if (!accountBadge || !accountEmailEl || !accountPlanEl) return;
        accountEmailEl.textContent = access.email;
        accountPlanEl.textContent = access.plan;
        accountBadge.style.display = 'flex';
    }

    function handleApplyCoupon() {
        if (!applyCouponBtn) return;
        applyCouponBtn.addEventListener('click', () => {
            const code = prompt('Enter coupon code');
            if (!code) return;
            const planInfo = evaluateCouponPlan(code);
            getAccess((access) => {
                if (!access) return;
                const updated = { ...access, plan: planInfo.plan };
                setAccess(updated, () => {
                    updateAccountBadge(updated);
                    showNotification(planInfo.premium ? 'success' : 'info', 'Coupon Applied', planInfo.premium ? 'Premium unlocked.' : 'Coupon accepted.');
                });
            });
        });
    }

    function handleSignOut() {
        if (!signOutBtn) return;
        signOutBtn.addEventListener('click', () => {
            if (!confirm('Sign out and remove local access?')) return;
            chrome.storage.sync.remove(['pnlAccess'], () => {
                accountBadge && (accountBadge.style.display = 'none');
                showAccessOverlay();
            });
        });
    }

    function postJSON(url, body) {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body || {})
        }).then(r => r.json());
    }

    function handleUpgrade() {
        if (!upgradeBtn) return;
        upgradeBtn.addEventListener('click', () => {
            getAccess(async (access) => {
                if (!access || !access.email) {
                    showNotification('error', 'Not signed in', 'Please sign in first.');
                    return;
                }
                try {
                    const res = await postJSON('http://localhost:8000/api/checkout', { email: access.email });
                    if (res && res.url) {
                        window.open(res.url, '_blank');
                    } else {
                        showNotification('error', 'Checkout Error', res.error || 'Could not start checkout.');
                    }
                } catch (e) {
                    showNotification('error', 'Checkout Error', 'Please run server.py with Stripe keys.');
                }
            });
        });
    }

    function handleManageBilling() {
        if (!manageBillingBtn) return;
        manageBillingBtn.addEventListener('click', () => {
            getAccess(async (access) => {
                if (!access || !access.email) {
                    showNotification('error', 'Not signed in', 'Please sign in first.');
                    return;
                }
                try {
                    const res = await postJSON('http://localhost:8000/api/portal', { email: access.email });
                    if (res && res.url) {
                        window.open(res.url, '_blank');
                    } else {
                        showNotification('error', 'Portal Error', res.error || 'Could not open billing portal.');
                    }
                } catch (e) {
                    showNotification('error', 'Portal Error', 'Please run server.py with Stripe keys.');
                }
            });
        });
    }

  
    // Utility functions
    function monthYearLabel(date) {
        return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    }
    
    function formatCurrency(amount, currency = settings.currency) {
        const symbols = { USD: '$', EUR: '€', GBP: '£' };
        return `${symbols[currency] || '$'}${Math.abs(amount).toFixed(2)}`;
    }
    
    function formatPercentage(value) {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    }
    
    function formatValue(value, isPercent = false) {
        if (settings.privacyMode === 'hide') {
            return isPercent ? '***%' : '***';
        }
        
        if (isPercent) {
            return formatPercentage(value);
        } else {
            return formatCurrency(value);
        }
    }
    
    function formatDollarValue(value) {
        if (settings.privacyMode === 'hide') {
            return '***';
        }
        
        const sign = value >= 0 ? '+' : '';
        return `${sign}${formatCurrency(Math.abs(value))}`;
    }
    
    function showTooltip(element, content) {
        const rect = element.getBoundingClientRect();
        tooltip.innerHTML = content;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        tooltip.classList.add('show');
    }
    
    function hideTooltip() {
        tooltip.classList.remove('show');
    }
    
    // Settings management
    function loadSettings() {
        chrome.storage.sync.get(['pnlSettings'], (result) => {
            if (result.pnlSettings) {
                settings = { ...settings, ...result.pnlSettings };
                dataSourceSelect.value = settings.dataSource;
                currencySelect.value = settings.currency;
                themeSelect.value = settings.theme;
                applyTheme(settings.theme);
            }
        });
    }
    
    function saveSettingsToStorage() {
        chrome.storage.sync.set({ pnlSettings: settings });
    }
    
    // Notification system (throttled and deduplicated)
    let __lastNotifAt = 0;
    const __recentNotifKeys = [];
    function showNotification(type, title, message, duration = 5000, options = {}) {
        const now = Date.now();
        const key = `${type}|${title}|${message}`;
        const MIN_INTERVAL_MS = 2000;
        const RECENT_WINDOW_MS = 5000;
        const MAX_VISIBLE = 2;
        const force = !!options.force;
        
        // Remove expired recent keys
        while (__recentNotifKeys.length && now - __recentNotifKeys[0].time > RECENT_WINDOW_MS) {
            __recentNotifKeys.shift();
        }
        
        // Deduplicate recent identical notifications
        if (__recentNotifKeys.some(e => e.key === key) && !force) return;
        
        // Rate limit informational toasts
        if (!force && type === 'info' && (now - __lastNotifAt) < MIN_INTERVAL_MS) return;
        __lastNotifAt = now;
        __recentNotifKeys.push({ key, time: now });
        
        // Cap max visible
        const visible = Array.from(notificationContainer.querySelectorAll('.notification'));
        if (visible.length >= MAX_VISIBLE) {
            const removable = visible.find(n => n.classList.contains('info')) || visible[0];
            if (removable) removable.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
            <button class="notification-close">×</button>
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        });
        
        notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('hide');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
    
    // Theme management
    function applyTheme(theme) {
        if (theme === 'auto') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }
    
    // Export functionality
    function exportToCSV() {
        const data = Array.from(tradingData.values());
        if (data.length === 0) {
            showNotification('warning', 'No Data', 'No trading data available to export');
            return;
        }
        
        const headers = ['date', 'pnl', 'trades', 'volume', 'symbol'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                row.date,
                row.pnlPercent,
                row.trades || 0,
                row.volume || 0,
                row.symbol || 'UNKNOWN'
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pnl-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('success', 'Export Complete', 'CSV file downloaded successfully');
    }
    
    function exportToPDF() {
        showNotification('info', 'PDF Export', 'PDF export feature coming soon!');
    }
    
    // Performance insights
    function generateInsights(stats) {
        const insights = [];
        
        if (stats.winRate > 70) {
            insights.push('🎯 Excellent win rate! You\'re on fire!');
        } else if (stats.winRate < 30) {
            insights.push('⚠️ Consider reviewing your trading strategy');
        }
        
        if (stats.totalPnl > 20) {
            insights.push('🚀 Outstanding monthly performance!');
        } else if (stats.totalPnl < -10) {
            insights.push('📉 Tough month, but every trader has them');
        }
        
        if (stats.tradingDays > 15) {
            insights.push('📊 Very active trading month');
        } else if (stats.tradingDays < 5) {
            insights.push('💤 Quiet trading month');
        }
        
        return insights;
    }
    
    // Update monthly summary
    function updateMonthlySummary(stats) {
        const totalPnl = stats.totalPnl;
        const isPercent = settings.viewMode === 'percent';
        
        if (isPercent) {
            monthlyPnlEl.textContent = formatValue(totalPnl, true);
        } else {
            // Convert percentage to dollar amount (simplified calculation)
            const dollarAmount = totalPnl * 1000; // Assuming $1000 base
            monthlyPnlEl.textContent = formatDollarValue(dollarAmount);
        }
        
        monthlyPnlEl.className = `summary-value ${totalPnl < 0 ? 'negative' : ''}`;
    }
    
    // Update weekly totals
    function updateWeeklyTotals(data) {
        if (!data || data.length === 0) {
            weeklyTotalsEl.innerHTML = '';
            return;
        }
        
        // Group data by weeks
        const weeks = {};
        data.forEach(entry => {
            const date = new Date(entry.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weeks[weekKey]) {
                weeks[weekKey] = { pnl: 0, trades: 0, count: 0 };
            }
            
            weeks[weekKey].pnl += entry.pnlPercent;
            weeks[weekKey].trades += entry.trades || 0;
            weeks[weekKey].count++;
        });
        
        // Create weekly total elements
        weeklyTotalsEl.innerHTML = '';
        Object.values(weeks).forEach(week => {
            const weekEl = document.createElement('div');
            weekEl.className = 'weekly-total';
            
            const isPercent = settings.viewMode === 'percent';
            const pnlValue = isPercent ? week.pnl : week.pnl * 1000; // Convert to dollars
            
            weekEl.innerHTML = `
                <div class="weekly-pnl ${week.pnl >= 0 ? 'positive' : 'negative'}">
                    ${isPercent ? formatValue(week.pnl, true) : formatDollarValue(pnlValue)}
                </div>
                <div class="weekly-trades">${week.trades} trades</div>
            `;
            
            weeklyTotalsEl.appendChild(weekEl);
        });
    }
    
    // Mini chart rendering
    function renderMiniChart(data) {
        if (!data || data.length === 0) {
            chartLine.style.display = 'none';
            return;
        }
        
        chartLine.style.display = 'block';
        
        // Sort data by date
        const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        const pnlValues = sortedData.map(d => d.pnlPercent);
        
        if (pnlValues.length === 0) return;
        
        // Find min and max for scaling
        const minPnl = Math.min(...pnlValues);
        const maxPnl = Math.max(...pnlValues);
        const range = maxPnl - minPnl || 1; // Avoid division by zero
        
        // Create SVG path
        const width = miniChart.offsetWidth;
        const height = miniChart.offsetHeight;
        const stepX = width / (pnlValues.length - 1);
        
        let pathData = '';
        pnlValues.forEach((value, index) => {
            const x = index * stepX;
            const y = height - ((value - minPnl) / range) * height;
            
            if (index === 0) {
                pathData += `M ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
            }
        });
        
        // Create or update SVG
        let svg = miniChart.querySelector('svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            miniChart.appendChild(svg);
        }
        
        // Create path element
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', 'url(#gradient)');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        
        // Create gradient definition
        let defs = svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.appendChild(defs);
        }
        
        let gradient = defs.querySelector('linearGradient');
        if (!gradient) {
            gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', 'gradient');
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('x2', '100%');
            gradient.setAttribute('y2', '0%');
            defs.appendChild(gradient);
        }
        
        // Update gradient colors based on performance
        const isPositive = pnlValues[pnlValues.length - 1] > 0;
        const color1 = isPositive ? '#10b981' : '#ef4444';
        const color2 = isPositive ? '#059669' : '#dc2626';
        
        gradient.innerHTML = `
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        `;
        
        // Clear and add path
        svg.innerHTML = '';
        svg.appendChild(defs);
        svg.appendChild(path);
    }
  
    // Render calendar shell for the given viewDate
    function renderCalendar(date) {
        daysGrid.innerHTML = '';
        daysGrid.classList.add('loading');
        
        const year = date.getFullYear();
        const month = date.getMonth();
        monthLabel.textContent = monthYearLabel(date);
        
        const firstOfMonth = new Date(year, month, 1);
        const startWeekday = firstOfMonth.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const totalCells = 42;
        const prevMonthDays = startWeekday;
        
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'day';
            const dayIndex = i - prevMonthDays + 1;
            
            if (dayIndex < 1 || dayIndex > daysInMonth) {
                cell.classList.add('out-month');
                cell.innerHTML = `<div class="date"></div>`;
            } else {
                const y = year;
                const m = month + 1;
                const d = String(dayIndex).padStart(2, '0');
                const mm = String(m).padStart(2, '0');
                const isoDate = `${y}-${mm}-${d}`;
                
                cell.setAttribute('data-date', isoDate);
                cell.innerHTML = `
                    <div class="date">${dayIndex}</div>
                    <div class="pnl">—</div>
                    <div class="trades">0 trades</div>
                    <div class="day-icon">📄</div>
                `;
                
                // Add click event for tooltip
                cell.addEventListener('click', () => {
                    const data = tradingData.get(isoDate);
                    if (data) {
                        const content = `
                            <div style="font-weight: 600; margin-bottom: 4px;">${new Date(isoDate).toLocaleDateString()}</div>
                            <div>PnL: ${formatPercentage(data.pnlPercent)}</div>
                            <div>Trades: ${data.trades}</div>
                            ${data.volume ? `<div>Volume: ${formatCurrency(data.volume)}</div>` : ''}
                        `;
                        showTooltip(cell, content);
                    }
                });
                
                // Add hover events
                cell.addEventListener('mouseenter', () => {
                    const data = tradingData.get(isoDate);
                    if (data) {
                        const content = `
                            <div style="font-weight: 600; margin-bottom: 4px;">${new Date(isoDate).toLocaleDateString()}</div>
                            <div>PnL: ${formatPercentage(data.pnlPercent)}</div>
                            <div>Trades: ${data.trades}</div>
                        `;
                        showTooltip(cell, content);
                    }
                });
                
                cell.addEventListener('mouseleave', hideTooltip);
            }
            
            daysGrid.appendChild(cell);
        }
    }
  
    // Enhanced mock data generation with more realistic patterns
    function generateMockData(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const results = [];
        
        // Generate 8-16 trading days with more realistic patterns
        const numDays = Math.floor(Math.random() * 9) + 8;
        const chosen = new Set();
        
        // Prefer weekdays for trading
        const weekdays = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (date.getDay() >= 1 && date.getDay() <= 5) { // Monday to Friday
                weekdays.push(day);
            }
        }
        
        // Choose mostly weekdays
        while (chosen.size < numDays) {
            const day = weekdays[Math.floor(Math.random() * weekdays.length)];
            chosen.add(day);
        }
        
        chosen.forEach((day) => {
            const sign = Math.random() > 0.4 ? 1 : -1; // Slight bias toward positive
            const pnl = parseFloat(((Math.random() * 12) + 0.5).toFixed(2)) * sign;
            const trades = Math.floor(Math.random() * 5) + 1;
            const volume = Math.floor(Math.random() * 50000) + 1000;
            const mm = String(month + 1).padStart(2, '0');
            const dd = String(day).padStart(2, '0');
            
            results.push({
                date: `${year}-${mm}-${dd}`,
                pnlPercent: pnl,
                trades,
                volume,
                symbol: ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN'][Math.floor(Math.random() * 5)]
            });
        });
        
        return results;
    }
    
    // Robinhood API integration (placeholder for future implementation)
    async function fetchRobinhoodData(year, month) {
        // This would integrate with Robinhood's API when available
        // For now, return mock data with a note
        console.log('Robinhood API integration coming soon...');
        await delay(1000);
        return generateMockData(year, month);
    }
    
    // CSV data processing
    function processCSVData(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const results = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header.toLowerCase()] = values[index];
                });
                
                // Convert to our format
                if (row.date && row.pnl) {
                    results.push({
                        date: row.date,
                        pnlPercent: parseFloat(row.pnl),
                        trades: parseInt(row.trades) || 1,
                        volume: parseFloat(row.volume) || 0,
                        symbol: row.symbol || 'UNKNOWN'
                    });
                }
            }
        }
        
        return results;
    }
  
    // Main data fetching function with multiple sources
    async function fetchTradingData(year, month) {
        try {
            daysGrid.classList.add('loading');
            
            let data = [];
            
            switch (settings.dataSource) {
                case 'mock':
                    await delay(500);
                    data = generateMockData(year, month);
                    break;
                    
                case 'csv':
                    if (settings.csvData) {
                        data = processCSVData(settings.csvData);
                        // Filter by month
                        data = data.filter(entry => {
                            const entryDate = new Date(entry.date);
                            return entryDate.getFullYear() === year && entryDate.getMonth() === month;
                        });
                    } else {
                        throw new Error('No CSV data available. Please import a CSV file in settings.');
                    }
                    break;
                    
                case 'api':
                    data = await fetchRobinhoodData(year, month);
                    break;
                    
                default:
                    data = generateMockData(year, month);
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching trading data:', error);
            // Fallback to mock data
            return generateMockData(year, month);
        } finally {
            daysGrid.classList.remove('loading');
        }
    }
  
    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  
    // Enhanced calendar population with advanced statistics
    async function populateAndCompute(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Fetch data
        const data = await fetchTradingData(year, month);
        
        // Store data globally for tooltips
        tradingData.clear();
        data.forEach(entry => tradingData.set(entry.date, entry));
        
        // Calculate statistics
        const stats = calculateStatistics(data);
        
        // Update calendar cells
        const cells = daysGrid.querySelectorAll('.day[data-date]');
        cells.forEach(cell => {
            const iso = cell.getAttribute('data-date');
            const pnlEl = cell.querySelector('.pnl');
            const tradesEl = cell.querySelector('.trades');
            
            const entry = tradingData.get(iso);
            if (!entry) {
                cell.classList.remove('positive', 'negative', 'neutral');
                cell.classList.add('neutral');
                pnlEl.textContent = '—';
                tradesEl.textContent = '';
            } else {
                const pnl = Number(entry.pnlPercent);
                const trades = Number(entry.trades);
                
                // Update text based on view mode
                const isPercent = settings.viewMode === 'percent';
                if (isPercent) {
                    pnlEl.textContent = formatValue(pnl, true);
                } else {
                    const dollarAmount = pnl * 1000; // Convert to dollars
                    pnlEl.textContent = formatDollarValue(dollarAmount);
                }
                tradesEl.textContent = trades > 0 ? `${trades} trade${trades > 1 ? 's' : ''}` : '0 trades';
                
                // Update colors
                cell.classList.remove('positive', 'negative', 'neutral');
                if (pnl > 0) {
                    cell.classList.add('positive');
                } else if (pnl < 0) {
                    cell.classList.add('negative');
                } else {
                    cell.classList.add('neutral');
                }
            }
        });
        
        // Update statistics panel
        updateStatisticsPanel(stats);
    }
    
    // Calculate comprehensive statistics
    function calculateStatistics(data) {
        if (data.length === 0) {
            return {
                totalPnl: 0,
                tradingDays: 0,
                winRate: 0,
                bestDay: null,
                worstDay: null,
                avgPnl: 0,
                totalVolume: 0
            };
        }
        
        const tradingDays = data.filter(entry => entry.trades > 0);
        const totalPnl = data.reduce((sum, entry) => sum + entry.pnlPercent, 0);
        const winningDays = tradingDays.filter(entry => entry.pnlPercent > 0);
        const winRate = tradingDays.length > 0 ? (winningDays.length / tradingDays.length) * 100 : 0;
        
        const bestDay = data.reduce((best, current) => 
            current.pnlPercent > best.pnlPercent ? current : best, data[0]);
        const worstDay = data.reduce((worst, current) => 
            current.pnlPercent < worst.pnlPercent ? current : worst, data[0]);
        
        const avgPnl = tradingDays.length > 0 ? totalPnl / tradingDays.length : 0;
        const totalVolume = data.reduce((sum, entry) => sum + (entry.volume || 0), 0);
        
        return {
            totalPnl,
            tradingDays: tradingDays.length,
            winRate,
            bestDay,
            worstDay,
            avgPnl,
            totalVolume
        };
    }
    
    // Track shown insights per month (session-level)
    const __shownInsightMonths = new Set();

    // Update statistics panel with calculated values
    function updateStatisticsPanel(stats) {
        totalPnlEl.textContent = formatPercentage(stats.totalPnl);
        tradingDaysEl.textContent = stats.tradingDays.toString();
        winRateEl.textContent = `${stats.winRate.toFixed(1)}%`;
        
        if (stats.bestDay) {
            bestDayEl.textContent = formatPercentage(stats.bestDay.pnlPercent);
        } else {
            bestDayEl.textContent = '—';
        }
        
        if (stats.worstDay) {
            worstDayEl.textContent = formatPercentage(stats.worstDay.pnlPercent);
        } else {
            worstDayEl.textContent = '—';
        }
        
        // Update monthly summary
        updateMonthlySummary(stats);
        
        // Update weekly totals
        updateWeeklyTotals(data);
        
        // Render mini chart
        renderMiniChart(data);
        
        // Show performance insights (once per month per session)
        const insights = generateInsights(stats);
        const monthKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;
        if (insights.length > 0 && !__shownInsightMonths.has(monthKey)) {
            __shownInsightMonths.add(monthKey);
            setTimeout(() => {
                showNotification('info', 'Performance Insight', insights[0], 6000);
            }, 600);
        }
    }
  
    // Main rendering function
    async function render() {
        renderCalendar(viewDate);
        await populateAndCompute(viewDate);
    }
    
    // Event handlers
    prevBtn.addEventListener('click', async () => {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        await render();
    });
    
    nextBtn.addEventListener('click', async () => {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        await render();
    });
    
    // Settings modal handlers
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });
    
    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    saveSettings.addEventListener('click', () => {
        settings.dataSource = dataSourceSelect.value;
        settings.currency = currencySelect.value;
        settings.theme = themeSelect.value;
        saveSettingsToStorage();
        applyTheme(settings.theme);
        settingsModal.style.display = 'none';
        
        showNotification('success', 'Settings Saved', 'Your preferences have been updated');
        
        // Refresh data if source changed
        render();
    });
    
    // Export event handlers
    exportCSVBtn.addEventListener('click', exportToCSV);
    exportPDFBtn.addEventListener('click', exportToPDF);
    
    // Theme change handler
    themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });
    
    // View mode and privacy mode handlers
    viewModeSelect.addEventListener('change', (e) => {
        settings.viewMode = e.target.value;
        saveSettingsToStorage();
        render();
    });
    
    privacyModeSelect.addEventListener('change', (e) => {
        settings.privacyMode = e.target.value;
        saveSettingsToStorage();
        render();
    });
    
    pnlTypeSelect.addEventListener('change', (e) => {
        settings.pnlType = e.target.value;
        saveSettingsToStorage();
        render();
    });
    
    reportTypeSelect.addEventListener('change', (e) => {
        settings.reportType = e.target.value;
        saveSettingsToStorage();
        render();
    });
    
    // CSV file input handler
    function handleCSVUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                settings.csvData = e.target.result;
                settings.dataSource = 'csv';
                dataSourceSelect.value = 'csv';
                saveSettingsToStorage();
                render();
            };
            reader.readAsText(file);
        }
    }
    
    // Add CSV file input to settings modal
    const csvInput = document.createElement('input');
    csvInput.type = 'file';
    csvInput.accept = '.csv';
    csvInput.style.display = 'none';
    csvInput.addEventListener('change', handleCSVUpload);
    document.body.appendChild(csvInput);
    
    // Add CSV upload button to settings
    const csvUploadBtn = document.createElement('button');
    csvUploadBtn.textContent = '📁 Upload CSV';
    csvUploadBtn.style.cssText = 'width: 100%; padding: 8px; margin-top: 8px; background: var(--gradient-primary); border: none; color: white; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;';
    csvUploadBtn.addEventListener('click', () => csvInput.click());
    
    const settingsContent = settingsModal.querySelector('div');
    settingsContent.appendChild(csvUploadBtn);
    
    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Don't interfere with input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                prevBtn.click();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextBtn.click();
                break;
            case 'Escape':
                e.preventDefault();
                settingsModal.style.display = 'none';
                break;
            case 's':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    settingsBtn.click();
                }
                break;
            case 'r':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    render();
                    showNotification('info', 'Refreshed', 'Data has been refreshed');
                }
                break;
            case 'e':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    exportToCSV();
                }
                break;
            case 'h':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    showNotification('info', 'Keyboard Shortcuts', 
                        '← → Navigate months | Ctrl+S Settings | Ctrl+R Refresh | Ctrl+E Export | Esc Close');
                }
                break;
        }
    });
    
    // Click outside modal to close
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // Initialize access gate (will render after access granted)
    initAccessGate();
    
    // Show welcome notification after access
    handleApplyCoupon();
    handleSignOut();
    handleUpgrade();
    handleManageBilling();
    getAccess((access) => {
        if (access && access.granted) {
            setTimeout(() => {
                showNotification('info', 'Welcome! 🎉', 
                    'Press Ctrl+H for keyboard shortcuts. Click any day for details!', 6000);
            }, 1500);
        }
    });
    
    // Expose debugging functions
    window.__RobinhoodPnL = {
        refresh: () => render(),
        setMonth: (y, m0) => {
            viewDate = new Date(y, m0, 1);
            render();
        },
        getSettings: () => settings,
        setSettings: (newSettings) => {
            settings = { ...settings, ...newSettings };
            saveSettingsToStorage();
            render();
        },
        addMockData: (data) => {
            data.forEach(entry => tradingData.set(entry.date, entry));
            render();
        }
    };
    
})();
  