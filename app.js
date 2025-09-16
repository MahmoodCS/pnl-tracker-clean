/* Robinhood PnL Tracker - Website Version
   A beautiful, modern PnL tracking application with calendar visualization
   Supports mock data, CSV import, and future Robinhood API integration
*/

(function () {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
    });

    function initializeApp() {
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
        const monthlyPnlEl = document.getElementById('monthlyPnl');
        const weeklyTotalsEl = document.getElementById('weeklyTotals');
        
        // New DOM elements for redesigned layout
        const refreshBtn = document.getElementById('refreshBtn');
        const exportBtn = document.getElementById('exportBtn');
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        const calendarView = document.getElementById('calendarView');
        const analyticsView = document.getElementById('analyticsView');
        const portfolioView = document.getElementById('portfolioView');
        const calendarFilters = document.getElementById('calendarFilters');
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        
        // Sidebar elements
        const todayPnlEl = document.getElementById('todayPnl');
        const todayTradesEl = document.getElementById('todayTrades');
        const todayWinRateEl = document.getElementById('todayWinRate');
        const monthlyChangeEl = document.getElementById('monthlyChange');
        const monthBestDayEl = document.getElementById('monthBestDay');
        const monthWorstDayEl = document.getElementById('monthWorstDay');
        const monthlyTotalPnlEl = document.getElementById('monthlyTotalPnl');
        
        // Analytics elements
        const analyticsPeriodSelect = document.getElementById('analyticsPeriod');
        const currentStreakEl = document.getElementById('currentStreak');
        const bestStreakEl = document.getElementById('bestStreak');
        const worstStreakEl = document.getElementById('worstStreak');
        const maxDrawdownEl = document.getElementById('maxDrawdown');
        const sharpeRatioEl = document.getElementById('sharpeRatio');
        const volatilityEl = document.getElementById('volatility');
        
        // New analytics elements
        const avgDailyReturnEl = document.getElementById('avgDailyReturn');
        const consistencyScoreEl = document.getElementById('consistencyScore');
        const bestTradingDayEl = document.getElementById('bestTradingDay');
        const mostTradedSymbolEl = document.getElementById('mostTradedSymbol');
        const totalVolumeEl = document.getElementById('totalVolume');
        const activeTradingDaysEl = document.getElementById('activeTradingDays');
        const accountBadge = document.getElementById('accountBadge');
        const accountEmailEl = document.getElementById('accountEmail');
        const accountPlanEl = document.getElementById('accountPlan');
        const applyCouponBtn = document.getElementById('applyCouponBtn');
        const upgradeBtn = document.getElementById('upgradeBtn');
        const manageBillingBtn = document.getElementById('manageBillingBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        
        // Portfolio elements
        const addTradeBtn = document.getElementById('addTradeBtn');
        const recentTradesEl = document.getElementById('recentTrades');
        const topPerformersEl = document.getElementById('topPerformers');
        
        // Performance elements
        const totalPnlEl = document.getElementById('totalPnl');
        const tradingDaysEl = document.getElementById('tradingDays');
        const winRateEl = document.getElementById('winRate');
        const bestDayEl = document.getElementById('bestDay');
        const worstDayEl = document.getElementById('worstDay');
        const avgDailyEl = document.getElementById('avgDaily');
      
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
        // Access control (website)
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

        function getAccess() {
            try {
                const raw = localStorage.getItem('pnlAccess');
                return raw ? JSON.parse(raw) : null;
            } catch (_) {
                return null;
            }
        }

        function setAccess(access) {
            localStorage.setItem('pnlAccess', JSON.stringify(access));
        }

        function showAccessOverlay() {
            if (accessOverlay) accessOverlay.style.display = 'flex';
        }

        function hideAccessOverlay() {
            if (accessOverlay) accessOverlay.style.display = 'none';
        }

        function initAccessGate() {
            const access = getAccess();
            if (access && access.granted && isValidEmail(access.email)) {
                // Already granted
                render();
                setTimeout(() => {
                    showNotification('info', access.plan === 'premium' ? 'Welcome Premium ✨' : 'Welcome', 'Access granted. Enjoy PnL Tracker!', 4000);
                }, 600);
                updateAccountBadge(access);
            } else {
                showAccessOverlay();
            }

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
                    setAccess(newAccess);
                    hideAccessOverlay();
                    showNotification('success', 'Access Granted', planInfo.premium ? 'Premium features unlocked.' : 'You now have access.', 4000, { force: true });
                    render();
                    updateAccountBadge(newAccess);
                });
            }
        }

        function getTierLevel(access) {
            if (!access) return 1;
            return access.tier || (access.plan === 'tier2' ? 2 : access.plan === 'tier3' ? 3 : 1);
        }

        function canAccessView(view, access) {
            const tier = getTierLevel(access);
            switch (view) {
                case 'calendar': return tier >= 1; // All tiers
                case 'portfolio': return tier >= 2; // Tier 2+
                case 'analytics': return tier >= 3; // Tier 3 only
                default: return false;
            }
        }

        function updateAccountBadge(access) {
            if (!accountBadge || !accountEmailEl || !accountPlanEl) return;
            accountEmailEl.textContent = access.email;
            
            const tier = getTierLevel(access);
            const tierNames = { 1: 'Free', 2: 'Pro', 3: 'Premium' };
            accountPlanEl.textContent = tierNames[tier] || 'Free';
            accountPlanEl.className = `chip ${tier === 3 ? 'premium' : tier === 2 ? 'pro' : 'free'}`;
            accountBadge.style.display = 'flex';
            
            // Update view button states
            updateViewButtonStates(access);
        }

        function updateViewButtonStates(access) {
            const allToggleBtns = document.querySelectorAll('.toggle-btn');
            allToggleBtns.forEach(btn => {
                const view = btn.dataset.view;
                const hasAccess = canAccessView(view, access);
                
                if (!hasAccess) {
                    btn.classList.add('locked');
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                } else {
                    btn.classList.remove('locked');
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                }
            });
        }

        function handleApplyCoupon() {
            if (!applyCouponBtn) return;
            applyCouponBtn.addEventListener('click', () => {
                const code = prompt('Enter coupon code');
                if (!code) return;
                const planInfo = evaluateCouponPlan(code);
                const access = getAccess();
                if (!access) return;
                const updated = { ...access, plan: planInfo.plan };
                setAccess(updated);
                updateAccountBadge(updated);
                showNotification(planInfo.premium ? 'success' : 'info', 'Coupon Applied', planInfo.premium ? 'Premium unlocked.' : 'Coupon accepted.');
            });
        }

        function handleSignOut() {
            if (!signOutBtn) return;
            signOutBtn.addEventListener('click', () => {
                if (!confirm('Sign out and remove local access?')) return;
                localStorage.removeItem('pnlAccess');
                if (accountBadge) accountBadge.style.display = 'none';
                showAccessOverlay();
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
            upgradeBtn.addEventListener('click', async () => {
                const access = getAccess();
                if (!access || !access.email) {
                    showNotification('error', 'Not signed in', 'Please sign in first.');
                    return;
                }
                
                const currentTier = getTierLevel(access);
                if (currentTier >= 3) {
                    showNotification('info', 'Already Premium', 'You already have the highest tier!');
                    return;
                }
                
                // Show upgrade modal
                showUpgradeModal(currentTier, access.email);
            });
        }

        function showUpgradeModal(currentTier, email) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 5000; 
                display: flex; align-items: center; justify-content: center; padding: 20px;
            `;
            
            const tier2Price = '$5/month';
            const tier3Price = '$10/month';
            
            modal.innerHTML = `
                <div style="background: var(--bg-card); border-radius: 16px; padding: 24px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: var(--text-primary);">Upgrade Your Plan</h2>
                        <button id="closeUpgradeModal" style="background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 20px;">
                        <div class="pricing-card ${currentTier >= 2 ? 'current' : ''}" style="border: 2px solid ${currentTier >= 2 ? 'var(--accent-success)' : 'rgba(255,255,255,0.1)'}; border-radius: 12px; padding: 20px; background: var(--bg-tertiary);">
                            <div style="text-align: center;">
                                <h3 style="margin: 0 0 8px 0; color: var(--text-primary);">Pro Plan</h3>
                                <div style="font-size: 24px; font-weight: 700; color: var(--accent-success); margin-bottom: 12px;">${tier2Price}</div>
                                <ul style="list-style: none; padding: 0; margin: 0 0 16px 0; text-align: left;">
                                    <li style="margin-bottom: 8px; color: var(--text-secondary);">✓ Calendar View</li>
                                    <li style="margin-bottom: 8px; color: var(--text-secondary);">✓ Portfolio Management</li>
                                    <li style="margin-bottom: 8px; color: var(--text-muted);">✗ Advanced Analytics</li>
                                </ul>
                                <button class="upgrade-tier-btn" data-tier="2" data-price-id="price_1S85aALMcbxuOWs3eELFMFZ5" style="width: 100%; padding: 12px; border-radius: 8px; background: ${currentTier >= 2 ? 'var(--bg-tertiary)' : 'var(--gradient-success)'}; color: white; border: none; cursor: pointer; font-weight: 600;">
                                    ${currentTier >= 2 ? 'Current Plan' : 'Upgrade to Pro'}
                                </button>
                            </div>
                        </div>
                        
                        <div class="pricing-card ${currentTier >= 3 ? 'current' : ''}" style="border: 2px solid ${currentTier >= 3 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}; border-radius: 12px; padding: 20px; background: var(--bg-tertiary); position: relative;">
                            ${currentTier < 3 ? '<div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: var(--gradient-primary); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">POPULAR</div>' : ''}
                            <div style="text-align: center;">
                                <h3 style="margin: 0 0 8px 0; color: var(--text-primary);">Premium Plan</h3>
                                <div style="font-size: 24px; font-weight: 700; color: var(--accent-primary); margin-bottom: 12px;">${tier3Price}</div>
                                <ul style="list-style: none; padding: 0; margin: 0 0 16px 0; text-align: left;">
                                    <li style="margin-bottom: 8px; color: var(--text-secondary);">✓ Calendar View</li>
                                    <li style="margin-bottom: 8px; color: var(--text-secondary);">✓ Portfolio Management</li>
                                    <li style="margin-bottom: 8px; color: var(--text-secondary);">✓ Advanced Analytics</li>
                                    <li style="margin-bottom: 8px; color: var(--text-secondary);">✓ Priority Support</li>
                                </ul>
                                <button class="upgrade-tier-btn" data-tier="3" data-price-id="price_1S85aXLMcbxuOWs3VERhPncV" style="width: 100%; padding: 12px; border-radius: 8px; background: ${currentTier >= 3 ? 'var(--bg-tertiary)' : 'var(--gradient-primary)'}; color: white; border: none; cursor: pointer; font-weight: 600;">
                                    ${currentTier >= 3 ? 'Current Plan' : 'Upgrade to Premium'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; color: var(--text-muted); font-size: 12px;">
                        All plans include CSV import/export and basic features. Cancel anytime.
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal
            modal.querySelector('#closeUpgradeModal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
            
            // Handle tier upgrades
            modal.querySelectorAll('.upgrade-tier-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const tier = parseInt(btn.dataset.tier);
                    const priceId = btn.dataset.priceId;
                    
                    if (tier <= currentTier) return;
                    
                    try {
                        const res = await postJSON('/api/checkout', { 
                            email: email, 
                            priceId: priceId 
                        });
                        if (res && res.url) {
                            window.open(res.url, '_blank');
                            document.body.removeChild(modal);
                        } else {
                            showNotification('error', 'Checkout Error', res.error || 'Could not start checkout.');
                        }
                    } catch (e) {
                        showNotification('error', 'Checkout Error', 'Please ensure the server is running with Stripe keys.');
                    }
                });
            });
        }

        function handleManageBilling() {
            if (!manageBillingBtn) return;
            manageBillingBtn.addEventListener('click', async () => {
                const access = getAccess();
                if (!access || !access.email) {
                    showNotification('error', 'Not signed in', 'Please sign in first.');
                    return;
                }
                try {
                    const res = await postJSON('/api/portal', { email: access.email });
                    if (res && res.url) {
                        window.open(res.url, '_blank');
                    } else {
                        showNotification('error', 'Portal Error', res.error || 'Could not open billing portal.');
                    }
                } catch (e) {
                    showNotification('error', 'Portal Error', 'Please ensure the server is running with Stripe keys.');
                }
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
            if (!tooltip) return;
            const rect = element.getBoundingClientRect();
            tooltip.innerHTML = content;
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 10}px`;
            tooltip.classList.add('show');
        }
        
        function hideTooltip() {
            if (tooltip) tooltip.classList.remove('show');
        }
        
        // Settings management (using localStorage instead of Chrome storage)
        function loadSettings() {
            const savedSettings = localStorage.getItem('pnlSettings');
            if (savedSettings) {
                settings = { ...settings, ...JSON.parse(savedSettings) };
                
                // Update select elements if they exist
                if (dataSourceSelect) dataSourceSelect.value = settings.dataSource;
                if (currencySelect) currencySelect.value = settings.currency;
                if (themeSelect) themeSelect.value = settings.theme;
                
                applyTheme(settings.theme);
            }
        }
        
        function saveSettingsToStorage() {
            localStorage.setItem('pnlSettings', JSON.stringify(settings));
        }
        
        // Notification system (throttled and deduplicated)
        let __lastNotifAt = 0;
        const __recentNotifKeys = [];
        function showNotification(type, title, message, duration = 5000, options = {}) {
            if (!notificationContainer) return;
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
            
            // Cap max visible by removing oldest info notifications
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

        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme') || settings.theme || 'auto';
            const next = current === 'dark' ? 'light' : current === 'light' ? 'auto' : 'dark';
            settings.theme = next;
            saveSettingsToStorage();
            applyTheme(next);
            showNotification('info', 'Theme Updated', `Theme set to ${next}`);
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
            try {
                // Check if jsPDF is available
                if (typeof window.jspdf === 'undefined') {
                    showNotification('error', 'PDF Error', 'PDF library not loaded. Please refresh the page.');
                    return;
                }

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Get current data and statistics
                const data = Array.from(tradingData.values());
                const currentMonthData = data.filter(entry => {
                    const date = new Date(entry.date);
                    return date.getMonth() === viewDate.getMonth() && date.getFullYear() === viewDate.getFullYear();
                });
                const stats = calculateStatistics(currentMonthData);
                
                // PDF styling
                const primaryColor = [139, 92, 246]; // Purple
                const successColor = [34, 197, 94]; // Green
                const dangerColor = [239, 68, 68]; // Red
                const textColor = [55, 65, 81]; // Dark gray
                
                // Header
                doc.setFillColor(...primaryColor);
                doc.rect(0, 0, 210, 30, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.text('Robinhood P&L Tracker', 20, 20);
                
                // Date range
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const monthYear = monthYearLabel(viewDate);
                doc.text(`Report for ${monthYear}`, 20, 35);
                
                // Summary section
                doc.setFillColor(248, 250, 252);
                doc.rect(10, 45, 190, 40, 'F');
                
                doc.setTextColor(...textColor);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Monthly Summary', 20, 60);
                
                // Summary metrics
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                
                const totalPnl = stats.totalPnl;
                const totalDollar = totalPnl * 1000;
                const winRate = stats.tradingDays > 0 ? (stats.winningDays / stats.tradingDays) * 100 : 0;
                
                doc.text(`Total P&L: ${formatDollarValue(totalDollar)}`, 20, 75);
                doc.text(`Win Rate: ${winRate.toFixed(1)}%`, 120, 75);
                doc.text(`Trading Days: ${stats.tradingDays}`, 20, 85);
                doc.text(`Total Trades: ${stats.totalTrades}`, 120, 85);
                
                // Best and worst days
                if (stats.bestDay) {
                    doc.text(`Best Day: ${stats.bestDay.date} (+${stats.bestDay.pnlPercent.toFixed(2)}%)`, 20, 95);
                }
                if (stats.worstDay) {
                    doc.text(`Worst Day: ${stats.worstDay.date} (${stats.worstDay.pnlPercent.toFixed(2)}%)`, 120, 95);
                }
                
                // Trading data table
                doc.setFillColor(...primaryColor);
                doc.rect(10, 105, 190, 15, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Daily Trading Data', 20, 115);
                
                // Table headers
                doc.setTextColor(...textColor);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Date', 20, 130);
                doc.text('P&L %', 70, 130);
                doc.text('P&L $', 100, 130);
                doc.text('Trades', 140, 130);
                doc.text('Status', 170, 130);
                
                // Table data
                doc.setFont('helvetica', 'normal');
                let yPos = 140;
                const sortedData = currentMonthData.sort((a, b) => new Date(a.date) - new Date(b.date));
                
                sortedData.forEach((entry, index) => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                        
                        // Repeat headers on new page
                        doc.setFont('helvetica', 'bold');
                        doc.text('Date', 20, yPos);
                        doc.text('P&L %', 70, yPos);
                        doc.text('P&L $', 100, yPos);
                        doc.text('Trades', 140, yPos);
                        doc.text('Status', 170, yPos);
                        yPos = 30;
                        doc.setFont('helvetica', 'normal');
                    }
                    
                    const dollarAmount = entry.pnlPercent * 1000;
                    const status = entry.pnlPercent >= 0 ? 'Win' : 'Loss';
                    
                    doc.text(entry.date, 20, yPos);
                    doc.text(`${entry.pnlPercent.toFixed(2)}%`, 70, yPos);
                    doc.text(formatDollarValue(dollarAmount), 100, yPos);
                    doc.text(entry.trades.toString(), 140, yPos);
                    
                    // Color code the status
                    if (entry.pnlPercent >= 0) {
                        doc.setTextColor(...successColor);
                    } else {
                        doc.setTextColor(...dangerColor);
                    }
                    doc.text(status, 170, yPos);
                    doc.setTextColor(...textColor);
                    
                    yPos += 8;
                });
                
                // Analytics section
                if (yPos > 200) {
                    doc.addPage();
                    yPos = 20;
                } else {
                    yPos += 20;
                }
                
                doc.setFillColor(...primaryColor);
                doc.rect(10, yPos - 10, 190, 15, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Advanced Analytics', 20, yPos);
                
                yPos += 20;
                
                // Analytics data
                doc.setTextColor(...textColor);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                
                // Calculate additional metrics
                const returns = currentMonthData.map(d => d.pnlPercent);
                const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
                const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - avgReturn, 2), 0) / returns.length || 0;
                const volatility = Math.sqrt(variance);
                
                // Max drawdown
                let maxDrawdown = 0;
                let peak = 0;
                let runningTotal = 0;
                returns.forEach(ret => {
                    runningTotal += ret;
                    if (runningTotal > peak) peak = runningTotal;
                    const drawdown = peak - runningTotal;
                    maxDrawdown = Math.max(maxDrawdown, drawdown);
                });
                
                // Sharpe ratio
                const sharpeRatio = volatility !== 0 ? avgReturn / volatility : 0;
                
                doc.text(`Average Daily Return: ${avgReturn.toFixed(2)}%`, 20, yPos);
                doc.text(`Volatility: ${volatility.toFixed(2)}%`, 120, yPos);
                yPos += 10;
                doc.text(`Max Drawdown: ${maxDrawdown.toFixed(2)}%`, 20, yPos);
                doc.text(`Sharpe Ratio: ${sharpeRatio.toFixed(2)}`, 120, yPos);
                yPos += 10;
                doc.text(`Consistency Score: ${Math.round((winRate * 0.7) + ((100 - Math.min(volatility * 10, 100)) * 0.3))}/100`, 20, yPos);
                
                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(8);
                    doc.setTextColor(128, 128, 128);
                    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 290);
                    doc.text(`Page ${i} of ${pageCount}`, 170, 290);
                }
                
                // Save the PDF
                const fileName = `PnL_Report_${monthYear.replace(' ', '_')}.pdf`;
                doc.save(fileName);
                
                showNotification('success', 'PDF Exported', `Report saved as ${fileName}`);
                
            } catch (error) {
                console.error('PDF Export Error:', error);
                showNotification('error', 'Export Failed', 'Failed to generate PDF. Please try again.');
            }
        }
        
        // Print report functionality
        function printReport() {
            try {
                // Get current data and statistics
                const data = Array.from(tradingData.values());
                const currentMonthData = data.filter(entry => {
                    const date = new Date(entry.date);
                    return date.getMonth() === viewDate.getMonth() && date.getFullYear() === viewDate.getFullYear();
                });
                const stats = calculateStatistics(currentMonthData);
                
                // Create print-friendly HTML
                const printWindow = window.open('', '_blank', 'width=800,height=600');
                const monthYear = monthYearLabel(viewDate);
                
                const totalPnl = stats.totalPnl;
                const totalDollar = totalPnl * 1000;
                const winRate = stats.tradingDays > 0 ? (stats.winningDays / stats.tradingDays) * 100 : 0;
                
                // Calculate additional metrics
                const returns = currentMonthData.map(d => d.pnlPercent);
                const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
                const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - avgReturn, 2), 0) / returns.length || 0;
                const volatility = Math.sqrt(variance);
                
                // Max drawdown
                let maxDrawdown = 0;
                let peak = 0;
                let runningTotal = 0;
                returns.forEach(ret => {
                    runningTotal += ret;
                    if (runningTotal > peak) peak = runningTotal;
                    const drawdown = peak - runningTotal;
                    maxDrawdown = Math.max(maxDrawdown, drawdown);
                });
                
                // Sharpe ratio
                const sharpeRatio = volatility !== 0 ? avgReturn / volatility : 0;
                
                const printHTML = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>P&L Report - ${monthYear}</title>
                        <style>
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                margin: 0;
                                padding: 20px;
                                background: white;
                                color: #333;
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 30px;
                                padding: 20px;
                                background: linear-gradient(135deg, #8b5cf6, #a855f7);
                                color: white;
                                border-radius: 10px;
                            }
                            .header h1 {
                                margin: 0;
                                font-size: 28px;
                                font-weight: bold;
                            }
                            .header p {
                                margin: 5px 0 0 0;
                                font-size: 14px;
                                opacity: 0.9;
                            }
                            .summary-section {
                                background: #f8fafc;
                                padding: 20px;
                                border-radius: 10px;
                                margin-bottom: 20px;
                                border: 1px solid #e2e8f0;
                            }
                            .summary-grid {
                                display: grid;
                                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                                gap: 15px;
                                margin-top: 15px;
                            }
                            .summary-item {
                                text-align: center;
                                padding: 15px;
                                background: white;
                                border-radius: 8px;
                                border: 1px solid #e2e8f0;
                            }
                            .summary-label {
                                font-size: 12px;
                                color: #64748b;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                margin-bottom: 5px;
                            }
                            .summary-value {
                                font-size: 18px;
                                font-weight: bold;
                                font-family: 'Courier New', monospace;
                            }
                            .positive { color: #22c55e; }
                            .negative { color: #ef4444; }
                            .section-title {
                                font-size: 18px;
                                font-weight: bold;
                                margin: 20px 0 15px 0;
                                color: #1e293b;
                                border-bottom: 2px solid #8b5cf6;
                                padding-bottom: 5px;
                            }
                            .data-table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 20px;
                                background: white;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            }
                            .data-table th {
                                background: #8b5cf6;
                                color: white;
                                padding: 12px;
                                text-align: left;
                                font-weight: bold;
                            }
                            .data-table td {
                                padding: 10px 12px;
                                border-bottom: 1px solid #e2e8f0;
                            }
                            .data-table tr:nth-child(even) {
                                background: #f8fafc;
                            }
                            .analytics-grid {
                                display: grid;
                                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                                gap: 15px;
                                margin-bottom: 20px;
                            }
                            .analytics-card {
                                background: white;
                                padding: 15px;
                                border-radius: 8px;
                                border: 1px solid #e2e8f0;
                            }
                            .analytics-card h4 {
                                margin: 0 0 10px 0;
                                color: #8b5cf6;
                                font-size: 14px;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            }
                            .analytics-item {
                                display: flex;
                                justify-content: space-between;
                                margin-bottom: 8px;
                                font-size: 14px;
                            }
                            .footer {
                                text-align: center;
                                margin-top: 30px;
                                padding: 15px;
                                background: #f8fafc;
                                border-radius: 8px;
                                color: #64748b;
                                font-size: 12px;
                            }
                            @media print {
                                body { margin: 0; padding: 15px; }
                                .header { background: #8b5cf6 !important; -webkit-print-color-adjust: exact; }
                                .data-table th { background: #8b5cf6 !important; -webkit-print-color-adjust: exact; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Robinhood P&L Tracker</h1>
                            <p>Report for ${monthYear} • Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                        </div>
                        
                        <div class="summary-section">
                            <h2 class="section-title">Monthly Summary</h2>
                            <div class="summary-grid">
                                <div class="summary-item">
                                    <div class="summary-label">Total P&L</div>
                                    <div class="summary-value ${totalPnl >= 0 ? 'positive' : 'negative'}">${formatDollarValue(totalDollar)}</div>
                                </div>
                                <div class="summary-item">
                                    <div class="summary-label">Win Rate</div>
                                    <div class="summary-value">${winRate.toFixed(1)}%</div>
                                </div>
                                <div class="summary-item">
                                    <div class="summary-label">Trading Days</div>
                                    <div class="summary-value">${stats.tradingDays}</div>
                                </div>
                                <div class="summary-item">
                                    <div class="summary-label">Total Trades</div>
                                    <div class="summary-value">${stats.totalTrades}</div>
                                </div>
                            </div>
                        </div>
                        
                        <h2 class="section-title">Daily Trading Data</h2>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>P&L %</th>
                                    <th>P&L $</th>
                                    <th>Trades</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${currentMonthData.sort((a, b) => new Date(a.date) - new Date(b.date)).map(entry => {
                                    const dollarAmount = entry.pnlPercent * 1000;
                                    const status = entry.pnlPercent >= 0 ? 'Win' : 'Loss';
                                    const statusClass = entry.pnlPercent >= 0 ? 'positive' : 'negative';
                                    return `
                                        <tr>
                                            <td>${entry.date}</td>
                                            <td class="${statusClass}">${entry.pnlPercent.toFixed(2)}%</td>
                                            <td class="${statusClass}">${formatDollarValue(dollarAmount)}</td>
                                            <td>${entry.trades}</td>
                                            <td class="${statusClass}">${status}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                        
                        <h2 class="section-title">Advanced Analytics</h2>
                        <div class="analytics-grid">
                            <div class="analytics-card">
                                <h4>Performance Metrics</h4>
                                <div class="analytics-item">
                                    <span>Average Daily Return:</span>
                                    <span class="${avgReturn >= 0 ? 'positive' : 'negative'}">${avgReturn.toFixed(2)}%</span>
                                </div>
                                <div class="analytics-item">
                                    <span>Volatility:</span>
                                    <span>${volatility.toFixed(2)}%</span>
                                </div>
                                <div class="analytics-item">
                                    <span>Max Drawdown:</span>
                                    <span class="negative">${maxDrawdown.toFixed(2)}%</span>
                                </div>
                                <div class="analytics-item">
                                    <span>Sharpe Ratio:</span>
                                    <span>${sharpeRatio.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div class="analytics-card">
                                <h4>Best & Worst Days</h4>
                                <div class="analytics-item">
                                    <span>Best Day:</span>
                                    <span class="positive">${stats.bestDay ? `${stats.bestDay.date} (+${stats.bestDay.pnlPercent.toFixed(2)}%)` : '—'}</span>
                                </div>
                                <div class="analytics-item">
                                    <span>Worst Day:</span>
                                    <span class="negative">${stats.worstDay ? `${stats.worstDay.date} (${stats.worstDay.pnlPercent.toFixed(2)}%)` : '—'}</span>
                                </div>
                                <div class="analytics-item">
                                    <span>Consistency Score:</span>
                                    <span>${Math.round((winRate * 0.7) + ((100 - Math.min(volatility * 10, 100)) * 0.3))}/100</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>This report was generated by Robinhood P&L Tracker</p>
                            <p>For questions or support, please refer to the application documentation</p>
                        </div>
                    </body>
                    </html>
                `;
                
                printWindow.document.write(printHTML);
                printWindow.document.close();
                
                // Wait for content to load, then print
                printWindow.onload = function() {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                };
                
                showNotification('success', 'Print Ready', 'Print dialog opened successfully');
                
            } catch (error) {
                console.error('Print Error:', error);
                showNotification('error', 'Print Failed', 'Failed to generate print report. Please try again.');
            }
        }
        
        // CSV Import functionality
        function handleCSVImport(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.name.toLowerCase().endsWith('.csv')) {
                showNotification('error', 'Invalid File', 'Please select a CSV file.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const csvContent = e.target.result;
                    const importedData = parseCSVData(csvContent);
                    
                    if (importedData.size === 0) {
                        showNotification('error', 'Import Failed', 'No valid data found in CSV file.');
                        return;
                    }
                    
                    // Update settings to reflect imported data
                    settings.dataSource = 'csv';
                    settings.csvData = csvContent;
                    saveSettingsToStorage();
                    
                    // Clear current trading data
                    tradingData.clear();
                    
                    // Find the first month with data and navigate to it
                    const firstEntry = Array.from(importedData.values())[0];
                    if (firstEntry) {
                        const firstDate = new Date(firstEntry.date);
                        viewDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
                    }
                    
                    // Re-render the application with new data
                    render();
                    
                    showNotification('success', 'Import Successful', 
                        `Successfully imported ${importedData.size} trading records! Data will appear in the calendar for the corresponding months.`);
                    
                } catch (error) {
                    console.error('CSV Import Error:', error);
                    showNotification('error', 'Import Failed', 'Failed to parse CSV file. Please check the format.');
                }
            };
            
            reader.onerror = function() {
                showNotification('error', 'Import Failed', 'Failed to read the file.');
            };
            
            reader.readAsText(file);
            
            // Reset the file input
            event.target.value = '';
        }
        
        // Enhanced CSV parsing function
        function parseCSVData(csvString) {
            const data = new Map();
            const lines = csvString.split('\n').map(line => line.trim()).filter(line => line);
            
            if (lines.length < 2) {
                showNotification('error', 'CSV Error', 'CSV file must have at least a header row and one data row.');
                return data;
            }
            
            // Parse header row
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            // Find required columns (flexible matching)
            const dateIndex = findColumnIndex(headers, ['date', 'day', 'trading_date']);
            const pnlIndex = findColumnIndex(headers, ['pnl', 'profit_loss', 'profit', 'loss', 'return', 'gain']);
            const tradesIndex = findColumnIndex(headers, ['trades', 'trade_count', 'number_of_trades', 'count']);
            
            if (dateIndex === -1 || pnlIndex === -1) {
                showNotification('error', 'CSV Error', 
                    'CSV must contain "Date" and "PnL" columns. Found columns: ' + headers.join(', '));
                return data;
            }
            
            let successCount = 0;
            let errorCount = 0;
            
            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
                try {
                    const values = lines[i].split(',').map(v => v.trim());
                    
                    if (values.length < Math.max(dateIndex, pnlIndex) + 1) {
                        errorCount++;
                        continue;
                    }
                    
                    const dateString = values[dateIndex];
                    const pnlValue = parseFloat(values[pnlIndex]);
                    const tradesValue = tradesIndex !== -1 ? parseInt(values[tradesIndex]) || 0 : 1;
                    
                    // Validate date format (accepts YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY)
                    const date = parseDate(dateString);
                    if (!date || isNaN(pnlValue)) {
                        errorCount++;
                        continue;
                    }
                    
                    const formattedDate = date.toISOString().split('T')[0];
                    
                    data.set(formattedDate, {
                        date: formattedDate,
                        pnlPercent: pnlValue,
                        trades: tradesValue,
                        symbol: 'IMPORTED' // Default symbol for imported data
                    });
                    
                    successCount++;
                    
                } catch (error) {
                    errorCount++;
                }
            }
            
            // Show import summary
            if (errorCount > 0) {
                showNotification('warning', 'Import Warning', 
                    `Imported ${successCount} records successfully. ${errorCount} rows were skipped due to formatting issues.`);
            }
            
            return data;
        }
        
        // Helper function to find column index with flexible matching
        function findColumnIndex(headers, possibleNames) {
            for (let i = 0; i < headers.length; i++) {
                const header = headers[i];
                for (const name of possibleNames) {
                    if (header.includes(name) || name.includes(header)) {
                        return i;
                    }
                }
            }
            return -1;
        }
        
        // Helper function to parse various date formats
        function parseDate(dateString) {
            // Try different date formats
            const formats = [
                /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
                /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
                /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY or D/M/YYYY
            ];
            
            for (const format of formats) {
                if (format.test(dateString)) {
                    const date = new Date(dateString);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
            }
            
            return null;
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
            if (!monthlyPnlEl) return;
            
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
            
            // Update monthly total P&L
            if (monthlyTotalPnlEl) {
                const totalDollarAmount = totalPnl * 1000; // Convert to dollars
                monthlyTotalPnlEl.textContent = formatDollarValue(totalDollarAmount);
                monthlyTotalPnlEl.className = `total-value ${totalPnl < 0 ? 'negative' : 'positive'}`;
            }
            
            // Update monthly change
            if (monthlyChangeEl) {
                monthlyChangeEl.textContent = formatValue(totalPnl, true);
            }
            
            // Update best and worst day
            if (monthBestDayEl && stats.bestDay) {
                const bestValue = isPercent ? 
                    formatValue(stats.bestDay.pnlPercent, true) : 
                    formatDollarValue(stats.bestDay.pnlPercent * 1000);
                monthBestDayEl.textContent = bestValue;
                monthBestDayEl.className = `month-value ${stats.bestDay.pnlPercent >= 0 ? 'positive' : 'negative'}`;
            } else if (monthBestDayEl) {
                monthBestDayEl.textContent = '—';
                monthBestDayEl.className = 'month-value';
            }
            
            if (monthWorstDayEl && stats.worstDay) {
                const worstValue = isPercent ? 
                    formatValue(stats.worstDay.pnlPercent, true) : 
                    formatDollarValue(stats.worstDay.pnlPercent * 1000);
                monthWorstDayEl.textContent = worstValue;
                monthWorstDayEl.className = `month-value ${stats.worstDay.pnlPercent >= 0 ? 'positive' : 'negative'}`;
            } else if (monthWorstDayEl) {
                monthWorstDayEl.textContent = '—';
                monthWorstDayEl.className = 'month-value';
            }
        }
        
        // Update weekly totals
        function updateWeeklyTotals(data) {
            if (!weeklyTotalsEl) return;
            
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
            console.log('🔍 renderMiniChart called with:', data?.length || 0, 'entries');
            
            // Re-query elements in case they weren't available during initialization
            const miniChartEl = document.getElementById('miniChart');
            const chartLineEl = document.getElementById('chartLine');
            
            console.log('🔍 miniChart element:', miniChartEl);
            console.log('🔍 chartLine element:', chartLineEl);
            
            if (!miniChartEl || !chartLineEl) {
                console.log('❌ Chart elements not found - retrying in 100ms');
                setTimeout(() => renderMiniChart(data), 100);
                return;
            }
            
            if (!data || data.length === 0) {
                console.log('❌ No data provided');
                chartLineEl.style.display = 'none';
                return;
            }
            
            chartLineEl.style.display = 'block';
            chartLineEl.style.opacity = '1';
            chartLineEl.style.visibility = 'visible';
            
            // Sort data by date
            const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
            console.log('🔍 Sorted data sample:', sortedData.slice(0, 3));
            const pnlValues = sortedData.map(d => d.pnlPercent);
            console.log('🔍 PnL values sample:', pnlValues.slice(0, 5));
            
            if (pnlValues.length === 0) {
                console.log('❌ No PnL values found');
                return;
            }
            
            // Find min and max for scaling
            const minPnl = Math.min(...pnlValues);
            const maxPnl = Math.max(...pnlValues);
            const range = maxPnl - minPnl || 1; // Avoid division by zero
            
            // Create SVG path
            const width = miniChartEl.offsetWidth || 300; // Fallback width
            const height = miniChartEl.offsetHeight || 100; // Fallback height
            const stepX = width / (pnlValues.length - 1);
            
            console.log('🔍 Chart dimensions:', width, 'x', height);
            
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
            let svg = miniChartEl.querySelector('svg');
            if (!svg) {
                console.log('🔍 Creating new SVG element');
                svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.style.position = 'absolute';
                svg.style.top = '0';
                svg.style.left = '0';
                svg.style.zIndex = '10';
                svg.style.opacity = '1';
                svg.style.visibility = 'visible';
                miniChartEl.appendChild(svg);
                console.log('✅ SVG created and added to miniChart');
            } else {
                console.log('🔍 Using existing SVG');
            }
            
            // Create path element
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            
            // Use fallback color if gradient doesn't work
            const isPositive = pnlValues[pnlValues.length - 1] > 0;
            const fallbackColor = isPositive ? '#10b981' : '#ef4444';
            path.setAttribute('stroke', 'url(#gradient)');
            path.setAttribute('stroke-width', '3');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.style.opacity = '1';
            path.style.visibility = 'visible';
            path.style.stroke = fallbackColor; // Fallback color
            
            
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
            isPositive = pnlValues[pnlValues.length - 1] > 0;
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
            console.log('✅ SVG updated with path and gradient');
            console.log('🔍 SVG children count:', svg.children.length);
            console.log('🔍 Path data length:', pathData.length);
        }
      
        // Render calendar shell for the given viewDate
        function renderCalendar(date) {
            if (!daysGrid) return;
            
            // Smooth transition out
            daysGrid.style.opacity = '0.7';
            daysGrid.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                daysGrid.innerHTML = '';
                daysGrid.classList.add('loading');
                
                const year = date.getFullYear();
                const month = date.getMonth();
                if (monthLabel) {
                    monthLabel.style.opacity = '0.7';
                    setTimeout(() => {
                        monthLabel.textContent = monthYearLabel(date);
                        monthLabel.style.opacity = '1';
                    }, 150);
                }
                
                const firstOfMonth = new Date(year, month, 1);
                const startWeekday = firstOfMonth.getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const totalCells = 42;
                const prevMonthDays = startWeekday;
                
                for (let i = 0; i < totalCells; i++) {
                    const cell = document.createElement('div');
                    cell.className = 'day';
                    cell.style.opacity = '0';
                    cell.style.transform = 'translateY(10px)';
                    
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
                        
                        // Add click event for detailed day view
                        cell.addEventListener('click', () => {
                            const data = tradingData.get(isoDate);
                            if (data && data.trades > 0) {
                                showDayDetailsModal(isoDate, data);
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
            
            // Smooth fade-in animation
            daysGrid.style.opacity = '1';
            daysGrid.style.transform = 'translateY(0)';
            daysGrid.classList.remove('loading');
            
            // Also remove loading from chart area
            const chartCard = document.querySelector('.chart-card');
            if (chartCard) {
                chartCard.classList.remove('loading');
            }
            
            // Staggered animation for calendar days
            const cells = daysGrid.querySelectorAll('.day');
            cells.forEach((cell, index) => {
                setTimeout(() => {
                    cell.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    cell.style.opacity = '1';
                    cell.style.transform = 'translateY(0)';
                }, index * 15);
            });
        }, 150);
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
            const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length < 2) return [];
            
            // Parse header row
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            // Find required columns (flexible matching)
            const dateIndex = findColumnIndex(headers, ['date', 'day', 'trading_date']);
            const pnlIndex = findColumnIndex(headers, ['pnl', 'profit_loss', 'profit', 'loss', 'return', 'gain']);
            const tradesIndex = findColumnIndex(headers, ['trades', 'trade_count', 'number_of_trades', 'count']);
            
            if (dateIndex === -1 || pnlIndex === -1) {
                console.error('CSV Error: Missing required columns. Found:', headers);
                return [];
            }
            
            const results = [];
            
            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
                try {
                    const values = lines[i].split(',').map(v => v.trim());
                    
                    if (values.length < Math.max(dateIndex, pnlIndex) + 1) {
                        continue;
                    }
                    
                    const dateString = values[dateIndex];
                    const pnlValue = parseFloat(values[pnlIndex]);
                    const tradesValue = tradesIndex !== -1 ? parseInt(values[tradesIndex]) || 0 : 1;
                    
                    // Validate date format
                    const date = parseDate(dateString);
                    if (!date || isNaN(pnlValue)) {
                        continue;
                    }
                    
                    const formattedDate = date.toISOString().split('T')[0];
                    
                    results.push({
                        date: formattedDate,
                        pnlPercent: pnlValue,
                        trades: tradesValue,
                        volume: 0,
                        symbol: 'IMPORTED'
                    });
                    
                } catch (error) {
                    console.warn('Skipping invalid row:', lines[i]);
                }
            }
            
            return results;
        }
      
        // Main data fetching function with multiple sources
        async function fetchTradingData(year, month) {
            try {
                if (daysGrid) daysGrid.classList.add('loading');
                
                let data = [];
                
                switch (settings.dataSource) {
                    case 'mock':
                        await delay(500);
                        data = generateMockData(year, month);
                        break;
                        
                    case 'csv':
                        if (settings.csvData) {
                            data = processCSVData(settings.csvData);
                            console.log('Processed CSV data:', data.length, 'records');
                            
                            // Filter by month
                            data = data.filter(entry => {
                                const entryDate = new Date(entry.date);
                                return entryDate.getFullYear() === year && entryDate.getMonth() === month;
                            });
                            
                            console.log('Filtered data for', year, month, ':', data.length, 'records');
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
                if (daysGrid) daysGrid.classList.remove('loading');
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
            // Only clear data for the current month being viewed (but preserve sample data)
            const currentMonthData = Array.from(tradingData.keys()).filter(date => {
                const dateObj = new Date(date);
                return dateObj.getFullYear() === year && dateObj.getMonth() === month;
            });
            
            // Only clear if we have new data to replace it with
            if (data.length > 0) {
                currentMonthData.forEach(date => tradingData.delete(date));
                data.forEach(entry => tradingData.set(entry.date, entry));
            }
            
            console.log('📊 Trading data after populateAndCompute:', tradingData.size, 'entries');
            
            // Calculate statistics
            const stats = calculateStatistics(data);
            
            // Update calendar cells
            if (daysGrid) {
                const cells = daysGrid.querySelectorAll('.day[data-date]');
                cells.forEach(cell => {
                    const iso = cell.getAttribute('data-date');
                    const pnlEl = cell.querySelector('.pnl');
                    const tradesEl = cell.querySelector('.trades');
                    
                    const entry = tradingData.get(iso);
                    if (!entry) {
                        cell.classList.remove('positive', 'negative', 'neutral');
                        cell.classList.add('neutral');
                        if (pnlEl) pnlEl.textContent = '—';
                        if (tradesEl) tradesEl.textContent = '';
                    } else {
                        const pnl = Number(entry.pnlPercent);
                        const trades = Number(entry.trades);
                        
                        // Update text based on view mode
                        const isPercent = settings.viewMode === 'percent';
                        if (isPercent) {
                            if (pnlEl) pnlEl.textContent = formatValue(pnl, true);
                        } else {
                            const dollarAmount = pnl * 1000; // Convert to dollars
                            if (pnlEl) pnlEl.textContent = formatDollarValue(dollarAmount);
                        }
                        if (tradesEl) tradesEl.textContent = trades > 0 ? `${trades} trade${trades > 1 ? 's' : ''}` : '0 trades';
                        
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
            }
            
            // Update statistics panel
            updateStatisticsPanel(stats);
        }

        function applyCalendarFilter(filter) {
            if (!daysGrid) return;
            const cells = daysGrid.querySelectorAll('.day[data-date]');
            cells.forEach(cell => {
                const iso = cell.getAttribute('data-date');
                const entry = tradingData.get(iso);
                let show = true;
                switch (filter) {
                    case 'positive': show = !!entry && entry.pnlPercent > 0; break;
                    case 'negative': show = !!entry && entry.pnlPercent < 0; break;
                    case 'neutral': show = !!entry && entry.pnlPercent === 0; break;
                    case 'trading': show = !!entry && (entry.trades || 0) > 0; break;
                    default: show = true;
                }
                cell.style.display = show ? '' : 'none';
            });
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
            // Update main performance metrics
            if (totalPnlEl) totalPnlEl.textContent = formatPercentage(stats.totalPnl);
            if (tradingDaysEl) tradingDaysEl.textContent = stats.tradingDays.toString();
            if (winRateEl) winRateEl.textContent = `${stats.winRate.toFixed(1)}%`;
            
            if (bestDayEl) {
                if (stats.bestDay) {
                    bestDayEl.textContent = formatPercentage(stats.bestDay.pnlPercent);
                } else {
                    bestDayEl.textContent = '—';
                }
            }
            
            if (worstDayEl) {
                if (stats.worstDay) {
                    worstDayEl.textContent = formatPercentage(stats.worstDay.pnlPercent);
                } else {
                    worstDayEl.textContent = '—';
                }
            }
            
            // Update average daily P&L
            if (avgDailyEl) {
                if (stats.tradingDays > 0) {
                    const avgDaily = stats.totalPnl / stats.tradingDays;
                    avgDailyEl.textContent = formatPercentage(avgDaily);
                } else {
                    avgDailyEl.textContent = '—';
                }
            }
            
            // Update today's performance
            updateTodayPerformance();
            
            // Update monthly summary
            updateMonthlySummary(stats);
            
            // Update weekly totals
            const data = Array.from(tradingData.values());
            updateWeeklyTotals(data);
            
            // Render mini chart with all available data
            const allData = Array.from(tradingData.values());
            console.log('📊 Chart data:', allData.length, 'entries');
            renderMiniChart(allData);
            
            // Show performance insights (once per month per session)
            // Performance insights disabled to prevent spam
            // const insights = generateInsights(stats);
            // const monthKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;
            // if (insights.length > 0 && !__shownInsightMonths.has(monthKey)) {
            //     __shownInsightMonths.add(monthKey);
            //     setTimeout(() => {
            //         showNotification('info', 'Performance Insight', insights[0], 6000);
            //     }, 600);
            // }
        }
        
        // Update today's performance in sidebar
        function updateTodayPerformance() {
            const today = new Date().toISOString().split('T')[0];
            const todayData = tradingData.get(today);
            
            if (todayPnlEl) {
                if (todayData) {
                    const isPercent = settings.viewMode === 'percent';
                    const pnlValue = isPercent ? todayData.pnlPercent : todayData.pnlPercent * 1000;
                    
                    todayPnlEl.textContent = isPercent ? 
                        formatValue(todayData.pnlPercent, true) : 
                        formatDollarValue(pnlValue);
                    todayPnlEl.className = `stat-value ${todayData.pnlPercent >= 0 ? 'positive' : 'negative'}`;
                } else {
                    todayPnlEl.textContent = '+$0.00';
                    todayPnlEl.className = 'stat-value';
                }
            }
            
            if (todayTradesEl) {
                todayTradesEl.textContent = todayData ? todayData.trades.toString() : '0';
            }
            
            if (todayWinRateEl) {
                const winRate = todayData && todayData.pnlPercent > 0 ? 100 : 0;
                todayWinRateEl.textContent = `${winRate}%`;
            }
        }
      
        // Main rendering function
        async function render() {
            console.log('🔄 Starting render...');
            renderCalendar(viewDate);
            await populateAndCompute(viewDate);
            console.log('✅ Render completed');
        }
        
        // Toggle controls event handlers
        function setupToggleControls() {
            // Get all toggle options
            const allToggleOptions = document.querySelectorAll('.toggle-option');
            
            allToggleOptions.forEach((toggle) => {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Remove active from all toggles in this group
                    const group = toggle.closest('.toggle-group');
                    if (group) {
                        group.querySelectorAll('.toggle-option').forEach(t => t.classList.remove('active'));
                        // Add active to clicked toggle
                        toggle.classList.add('active');
                        
                        // Determine which setting to update based on the toggle's value
                        const value = toggle.dataset.value;
                        
                        if (value === 'percent' || value === 'dollar') {
                            settings.viewMode = value;
                        } else if (value === 'show' || value === 'hide') {
                            settings.privacyMode = value;
                        } else if (value === 'gross' || value === 'net') {
                            settings.pnlType = value;
                        }
                        
                        saveSettingsToStorage();
                        render();
                    }
                });
            });
        }
        
        // View switching with tier restrictions
        function setupViewSwitching() {
            // Get all toggle buttons
            const allToggleBtns = document.querySelectorAll('.toggle-btn');
            
            allToggleBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const view = btn.dataset.view;
                    const access = getAccess();
                    
                    // Check tier access
                    if (!canAccessView(view, access)) {
                        const tier = getTierLevel(access);
                        const tierNames = { 1: 'Free', 2: 'Pro', 3: 'Premium' };
                        const requiredTier = view === 'portfolio' ? 2 : view === 'analytics' ? 3 : 1;
                        const requiredName = { 1: 'Free', 2: 'Pro', 3: 'Premium' }[requiredTier];
                        
                        showNotification('warning', 'Upgrade Required', 
                            `${view.charAt(0).toUpperCase() + view.slice(1)} requires ${requiredName} tier. Upgrade to unlock!`, 5000);
                        return;
                    }
                    
                    // Remove active from all buttons
                    allToggleBtns.forEach(b => b.classList.remove('active'));
                    // Add active to clicked button
                    btn.classList.add('active');
                    
                    // Hide all views
                    document.querySelectorAll('.view-panel').forEach(panel => {
                        panel.classList.remove('active');
                    });
                    
                    // Show selected view
                    const targetView = document.getElementById(`${view}View`);
                    if (targetView) {
                        targetView.classList.add('active');
                    }
                    
                    // Update content based on view
                    if (view === 'analytics') {
                        updateAnalyticsView();
                    } else if (view === 'portfolio') {
                        updatePortfolioView();
                    }
                });
            });
        }
        
        // Update analytics view
        function updateAnalyticsView() {
            const data = Array.from(tradingData.values());
            if (data.length === 0) return;
            
            // Calculate streaks
            let currentStreak = 0;
            let bestStreak = 0;
            let worstStreak = 0;
            let tempStreak = 0;
            let isPositive = null;
            
            data.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(entry => {
                const isWin = entry.pnlPercent > 0;
                
                if (isPositive === null) {
                    isPositive = isWin;
                    tempStreak = 1;
                } else if (isPositive === isWin) {
                    tempStreak++;
                } else {
                    if (isPositive) {
                        bestStreak = Math.max(bestStreak, tempStreak);
                    } else {
                        worstStreak = Math.max(worstStreak, tempStreak);
                    }
                    isPositive = isWin;
                    tempStreak = 1;
                }
            });
            
            // Handle final streak
            if (isPositive) {
                bestStreak = Math.max(bestStreak, tempStreak);
                currentStreak = tempStreak;
            } else {
                worstStreak = Math.max(worstStreak, tempStreak);
                currentStreak = -tempStreak;
            }
            
            // Update streak displays
            if (currentStreakEl) currentStreakEl.textContent = `${Math.abs(currentStreak)} days`;
            if (bestStreakEl) bestStreakEl.textContent = `${bestStreak} days`;
            if (worstStreakEl) worstStreakEl.textContent = `${worstStreak} days`;
            
            // Calculate risk metrics
            const returns = data.map(d => d.pnlPercent);
            const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - avgReturn, 2), 0) / returns.length;
            const volatility = Math.sqrt(variance);
            
            // Max drawdown calculation (simplified)
            let maxDrawdown = 0;
            let peak = 0;
            let runningTotal = 0;
            
            returns.forEach(ret => {
                runningTotal += ret;
                if (runningTotal > peak) peak = runningTotal;
                const drawdown = peak - runningTotal;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            });
            
            // Sharpe ratio (simplified, assuming risk-free rate of 0)
            const sharpeRatio = avgReturn / volatility || 0;
            
            if (maxDrawdownEl) maxDrawdownEl.textContent = `${maxDrawdown.toFixed(2)}%`;
            if (sharpeRatioEl) sharpeRatioEl.textContent = sharpeRatio.toFixed(2);
            if (volatilityEl) volatilityEl.textContent = `${volatility.toFixed(2)}%`;
            
            // Update new analytics features
            updateAdvancedAnalytics(data, avgReturn, volatility);
        }
        
        // Update advanced analytics
        function updateAdvancedAnalytics(data, avgReturn, volatility) {
            // Average Daily Return
            if (avgDailyReturnEl) {
                const avgDaily = data.length > 0 ? avgReturn : 0;
                avgDailyReturnEl.textContent = formatValue(avgDaily, true);
                avgDailyReturnEl.className = `insight-value ${avgDaily >= 0 ? 'positive' : 'negative'}`;
            }
            
            // Consistency Score (based on win rate and volatility)
            if (consistencyScoreEl) {
                const tradingDays = data.filter(entry => entry.trades > 0);
                const winningDays = tradingDays.filter(entry => entry.pnlPercent > 0);
                const winRate = tradingDays.length > 0 ? (winningDays.length / tradingDays.length) * 100 : 0;
                
                // Consistency score: 70% win rate + 30% low volatility
                const consistencyScore = Math.min(100, Math.max(0, 
                    (winRate * 0.7) + ((100 - Math.min(volatility * 10, 100)) * 0.3)
                ));
                
                consistencyScoreEl.textContent = `${Math.round(consistencyScore)}/100`;
                consistencyScoreEl.className = `insight-value ${consistencyScore >= 70 ? 'positive' : consistencyScore >= 50 ? '' : 'negative'}`;
            }
            
            // Best Trading Day
            if (bestTradingDayEl) {
                const bestDay = data.reduce((best, current) => 
                    current.pnlPercent > best.pnlPercent ? current : best, data[0]);
                
                if (bestDay && bestDay.pnlPercent > 0) {
                    const date = new Date(bestDay.date);
                    bestTradingDayEl.textContent = `${date.toLocaleDateString()} (+${bestDay.pnlPercent.toFixed(2)}%)`;
                } else {
                    bestTradingDayEl.textContent = '—';
                }
            }
            
            // Most Traded Symbol
            if (mostTradedSymbolEl) {
                const symbolCounts = {};
                data.forEach(entry => {
                    const symbol = entry.symbol || 'UNKNOWN';
                    symbolCounts[symbol] = (symbolCounts[symbol] || 0) + (entry.trades || 0);
                });
                
                const mostTraded = Object.entries(symbolCounts).reduce((a, b) => 
                    symbolCounts[a[0]] > symbolCounts[b[0]] ? a : b, ['—', 0]);
                
                mostTradedSymbolEl.textContent = mostTraded[0];
            }
            
            // Total Volume
            if (totalVolumeEl) {
                const totalVol = data.reduce((sum, entry) => sum + (entry.volume || 0), 0);
                totalVolumeEl.textContent = formatCurrency(totalVol);
            }
            
            // Active Trading Days
            if (activeTradingDaysEl) {
                const activeDays = data.filter(entry => entry.trades > 0).length;
                activeTradingDaysEl.textContent = activeDays.toString();
            }
        }
        
        // Update portfolio view
        function updatePortfolioView() {
            const data = Array.from(tradingData.values());
            if (data.length === 0) return;
            
            // Get recent trades (last 5)
            const recentTrades = data
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
            
            if (recentTradesEl) {
                recentTradesEl.innerHTML = recentTrades.map(trade => `
                    <div class="trade-item">
                        <div class="trade-symbol">${trade.symbol || 'UNKNOWN'}</div>
                        <div class="trade-details">
                            <div class="trade-pnl ${trade.pnlPercent >= 0 ? 'positive' : 'negative'}">
                                ${formatValue(trade.pnlPercent, settings.viewMode === 'percent')}
                            </div>
                            <div class="trade-date">${new Date(trade.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                `).join('');
            }
            
            // Get top performers
            const performers = data
                .filter(trade => trade.pnlPercent > 0)
                .sort((a, b) => b.pnlPercent - a.pnlPercent)
                .slice(0, 5);
            
            if (topPerformersEl) {
                topPerformersEl.innerHTML = performers.map(trade => `
                    <div class="performer-item">
                        <span class="performer-symbol">${trade.symbol || 'UNKNOWN'}</span>
                        <span class="performer-pnl positive">
                            ${formatValue(trade.pnlPercent, settings.viewMode === 'percent')}
                        </span>
                    </div>
                `).join('');
            }
        }
        
        // Initialize toggle states
        function initializeToggleStates() {
            // Set view mode toggle
            const viewModeToggle = document.querySelector(`[data-value="${settings.viewMode}"]`);
            if (viewModeToggle) {
                const group = viewModeToggle.closest('.toggle-group');
                if (group) {
                    group.querySelectorAll('.toggle-option').forEach(t => t.classList.remove('active'));
                    viewModeToggle.classList.add('active');
                }
            }
            
            // Set privacy mode toggle
            const privacyToggle = document.querySelector(`[data-value="${settings.privacyMode}"]`);
            if (privacyToggle) {
                const group = privacyToggle.closest('.toggle-group');
                if (group) {
                    group.querySelectorAll('.toggle-option').forEach(t => t.classList.remove('active'));
                    privacyToggle.classList.add('active');
                }
            }
            
            // Set P&L type toggle
            const pnlTypeToggle = document.querySelector(`[data-value="${settings.pnlType}"]`);
            if (pnlTypeToggle) {
                const group = pnlTypeToggle.closest('.toggle-group');
                if (group) {
                    group.querySelectorAll('.toggle-option').forEach(t => t.classList.remove('active'));
                    pnlTypeToggle.classList.add('active');
                }
            }
        }

        // Event handlers
        if (prevBtn) {
            prevBtn.addEventListener('click', async () => {
                viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
                await render();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', async () => {
                viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
                await render();
            });
        }
        
        // Settings modal handlers
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                if (settingsModal) settingsModal.style.display = 'flex';
            });
        }
        
        if (closeSettings) {
            closeSettings.addEventListener('click', () => {
                if (settingsModal) settingsModal.style.display = 'none';
            });
        }
        
        if (saveSettings) {
            saveSettings.addEventListener('click', () => {
                if (dataSourceSelect) settings.dataSource = dataSourceSelect.value;
                if (currencySelect) settings.currency = currencySelect.value;
                if (themeSelect) settings.theme = themeSelect.value;
                saveSettingsToStorage();
                applyTheme(settings.theme);
                if (settingsModal) settingsModal.style.display = 'none';
                
                showNotification('success', 'Settings Saved', 'Your preferences have been updated');
                
                // Refresh data if source changed
                render();
            });
        }
        
        // Import/Export event handlers
        const importCSVBtn = document.getElementById('importCSVBtn');
        const csvFileInput = document.getElementById('csvFileInput');
        
        if (importCSVBtn) {
            importCSVBtn.addEventListener('click', () => {
                if (csvFileInput) csvFileInput.click();
            });
        }
        
        if (csvFileInput) {
            csvFileInput.addEventListener('change', handleCSVImport);
        }
        
        if (exportCSVBtn) exportCSVBtn.addEventListener('click', exportToCSV);
        if (exportPDFBtn) exportPDFBtn.addEventListener('click', exportToPDF);
        
        // Print report functionality
        const printReportBtn = document.getElementById('printReportBtn');
        if (printReportBtn) {
            printReportBtn.addEventListener('click', printReport);
        }
        
        // New button event handlers
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                render();
                showNotification('info', 'Refreshed', 'Data has been refreshed');
            });
        }
        
        if (exportBtn) {
            const exportDropdown = exportBtn.closest('.export-dropdown');
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (exportDropdown) exportDropdown.classList.toggle('open');
            });
            document.addEventListener('click', () => {
                if (exportDropdown) exportDropdown.classList.remove('open');
            });
        }

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', toggleTheme);
        }

        if (calendarFilters) {
            calendarFilters.addEventListener('click', (e) => {
                const btn = e.target.closest('.chip');
                if (!btn) return;
                calendarFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                applyCalendarFilter(btn.dataset.filter);
            });
        }
        
        if (addTradeBtn) {
            addTradeBtn.addEventListener('click', () => {
                showNotification('info', 'Add Trade', 'Trade entry feature coming soon!');
            });
        }
        
        // Theme change handler
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                applyTheme(e.target.value);
            });
        }
        
        // Click outside modal to close
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    settingsModal.style.display = 'none';
                }
            });
            
            // Prevent modal content clicks from closing modal
            const modalContent = settingsModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        }
        
        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Don't interfere with input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (prevBtn) prevBtn.click();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (nextBtn) nextBtn.click();
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (settingsModal) settingsModal.style.display = 'none';
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (settingsBtn) settingsBtn.click();
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
        
        // Initialize the application
        setupToggleControls();
        setupViewSwitching();
        initializeToggleStates();
        initAccessGate();
        handleApplyCoupon();
        handleSignOut();
        handleUpgrade();
        handleManageBilling();
        setupThemeToggle();
        setupKeyboardShortcuts();
        setupDataExport();
        setupNotifications();
        addSampleDataButton();
        
        // Show welcome notification after access
        const maybeWelcome = () => {
            const access = getAccess();
            if (access && access.granted) {
                // Subtle welcome without popup - just a gentle glow on the logo
                setTimeout(() => {
                    const logo = document.querySelector('.logo');
                    if (logo) {
                        logo.style.boxShadow = '0 0 20px rgba(88, 166, 255, 0.3)';
                        setTimeout(() => {
                            logo.style.boxShadow = '';
                        }, 2000);
                    }
                }, 1000);
            }
        };
        maybeWelcome();
        
        // Theme Toggle Functionality
        function setupThemeToggle() {
            const themeToggleBtn = document.getElementById('themeToggleBtn');
            if (!themeToggleBtn) return;
            
            // Load saved theme
            const savedTheme = localStorage.getItem('pnlTheme') || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
            
            themeToggleBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('pnlTheme', newTheme);
                updateThemeIcon(newTheme);
                
                showNotification('success', 'Theme Changed', `Switched to ${newTheme} mode`, 2000);
            });
        }
        
        function updateThemeIcon(theme) {
            const themeToggleBtn = document.getElementById('themeToggleBtn');
            if (!themeToggleBtn) return;
            
            const icon = themeToggleBtn.querySelector('svg path');
            if (icon) {
                if (theme === 'dark') {
                    icon.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
                } else {
                    icon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z');
                }
            }
        }

        // Keyboard Shortcuts
        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Don't trigger shortcuts when typing in inputs
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                const isCtrl = e.ctrlKey || e.metaKey;
                
                switch (e.key.toLowerCase()) {
                    case 'h':
                        if (isCtrl) {
                            e.preventDefault();
                            showKeyboardShortcuts();
                        }
                        break;
                    case 'r':
                        if (isCtrl) {
                            e.preventDefault();
                            refreshData();
                        }
                        break;
                    case 'e':
                        if (isCtrl) {
                            e.preventDefault();
                            exportData();
                        }
                        break;
                    case 'i':
                        if (isCtrl) {
                            e.preventDefault();
                            document.getElementById('importBtn')?.click();
                        }
                        break;
                    case 't':
                        if (isCtrl) {
                            e.preventDefault();
                            document.getElementById('themeToggleBtn')?.click();
                        }
                        break;
                    case 'arrowleft':
                        if (isCtrl) {
                            e.preventDefault();
                            navigateMonth(-1);
                        }
                        break;
                    case 'arrowright':
                        if (isCtrl) {
                            e.preventDefault();
                            navigateMonth(1);
                        }
                        break;
                }
            });
        }
        
        function showKeyboardShortcuts() {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 5000; 
                display: flex; align-items: center; justify-content: center; padding: 20px;
            `;
            
            modal.innerHTML = `
                <div style="background: var(--bg-card); border-radius: 16px; padding: 24px; max-width: 500px; width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: var(--text-primary);">Keyboard Shortcuts</h2>
                        <button id="closeShortcutsModal" style="background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    
                    <div style="display: grid; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Refresh Data</span>
                            <kbd style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">Ctrl+R</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Export Data</span>
                            <kbd style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">Ctrl+E</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Import CSV</span>
                            <kbd style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">Ctrl+I</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Toggle Theme</span>
                            <kbd style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">Ctrl+T</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Previous Month</span>
                            <kbd style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">Ctrl+←</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Next Month</span>
                            <kbd style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">Ctrl+→</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                            <span style="color: var(--text-secondary);">Show Shortcuts</span>
                            <kbd style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">Ctrl+H</kbd>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('#closeShortcutsModal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }

        // Enhanced Data Export
        function setupDataExport() {
            const exportBtn = document.getElementById('exportBtn');
            if (!exportBtn) return;
            
            exportBtn.addEventListener('click', () => {
                showExportOptions();
            });
        }
        
        function showExportOptions() {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 5000; 
                display: flex; align-items: center; justify-content: center; padding: 20px;
            `;
            
            modal.innerHTML = `
                <div style="background: var(--bg-card); border-radius: 16px; padding: 24px; max-width: 400px; width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: var(--text-primary);">Export Data</h2>
                        <button id="closeExportModal" style="background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    
                    <div style="display: grid; gap: 12px;">
                        <button id="exportCSV" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: var(--bg-tertiary); border: none; color: var(--text-primary); cursor: pointer;">
                            <span style="font-size: 20px;">📊</span>
                            <div style="text-align: left;">
                                <div style="font-weight: 600;">CSV Export</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Raw trading data</div>
                            </div>
                        </button>
                        
                        <button id="exportPDF" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: var(--bg-tertiary); border: none; color: var(--text-primary); cursor: pointer;">
                            <span style="font-size: 20px;">📄</span>
                            <div style="text-align: left;">
                                <div style="font-weight: 600;">PDF Report</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Formatted report</div>
                            </div>
                        </button>
                        
                        <button id="exportJSON" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: var(--bg-tertiary); border: none; color: var(--text-primary); cursor: pointer;">
                            <span style="font-size: 20px;">🔧</span>
                            <div style="text-align: left;">
                                <div style="font-weight: 600;">JSON Backup</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Complete data backup</div>
                            </div>
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('#closeExportModal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
            
            // Export handlers
            modal.querySelector('#exportCSV').addEventListener('click', () => {
                exportData();
                document.body.removeChild(modal);
            });
            
            modal.querySelector('#exportPDF').addEventListener('click', () => {
                exportPDFReport();
                document.body.removeChild(modal);
            });
            
            modal.querySelector('#exportJSON').addEventListener('click', () => {
                exportJSONBackup();
                document.body.removeChild(modal);
            });
        }
        
        function exportPDFReport() {
            const data = Array.from(tradingData.values());
            if (data.length === 0) {
                showNotification('warning', 'No Data', 'No trading data to export');
                return;
            }
            
            // Create a simple HTML report
            const reportHTML = `
                <html>
                    <head>
                        <title>PnL Trading Report</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                            .summary-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                            th { background-color: #f5f5f5; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>PnL Trading Report</h1>
                            <p>Generated on ${new Date().toLocaleDateString()}</p>
                        </div>
                        
                        <div class="summary">
                            <div class="summary-card">
                                <h3>Total Trades</h3>
                                <p>${data.length}</p>
                            </div>
                            <div class="summary-card">
                                <h3>Total P&L</h3>
                                <p>$${data.reduce((sum, trade) => sum + (trade.pnl || 0), 0).toFixed(2)}</p>
                            </div>
                            <div class="summary-card">
                                <h3>Win Rate</h3>
                                <p>${((data.filter(trade => (trade.pnl || 0) > 0).length / data.length) * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Symbol</th>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(trade => `
                                    <tr>
                                        <td>${trade.date}</td>
                                        <td>${trade.symbol || 'N/A'}</td>
                                        <td>${trade.type || 'N/A'}</td>
                                        <td>${trade.quantity || 'N/A'}</td>
                                        <td>$${trade.price || 'N/A'}</td>
                                        <td>$${trade.pnl || 0}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                </html>
            `;
            
            // Open in new window for printing
            const newWindow = window.open('', '_blank');
            newWindow.document.write(reportHTML);
            newWindow.document.close();
            newWindow.print();
            
            showNotification('success', 'PDF Report', 'Report opened for printing');
        }
        
        function exportJSONBackup() {
            const backup = {
                tradingData: Array.from(tradingData.entries()),
                settings: settings,
                access: getAccess(),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pnl-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showNotification('success', 'Backup Created', 'Complete data backup exported');
        }

        // Day Details Modal
        function showDayDetailsModal(isoDate, dayData) {
            const date = new Date(isoDate);
            const dayNumber = date.getDate();
            const monthName = date.toLocaleDateString('en-US', { month: 'long' });
            const year = date.getFullYear();
            
            // Get individual trades for this day (we need to reconstruct this from the aggregated data)
            const trades = getTradesForDay(isoDate);
            
            const totalPnL = dayData.pnl || 0;
            const profitableTrades = trades.filter(trade => (trade.pnl || 0) > 0);
            const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);
            const breakEvenTrades = trades.filter(trade => (trade.pnl || 0) === 0);
            
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 5000; 
                display: flex; align-items: center; justify-content: center; padding: 20px;
            `;
            
            modal.innerHTML = `
                <div style="background: var(--bg-card); border-radius: 16px; padding: 24px; max-width: 700px; width: 100%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: var(--text-primary);">${monthName} ${dayNumber}, ${year}</h2>
                        <button id="closeDayModal" style="background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    
                    <!-- Summary Cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 24px;">
                        <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 700; color: ${totalPnL >= 0 ? 'var(--accent-success)' : 'var(--accent-error)'};">$${totalPnL.toFixed(2)}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Total P&L</div>
                        </div>
                        <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 700; color: var(--text-primary);">${trades.length}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Total Trades</div>
                        </div>
                        <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 700; color: var(--accent-success);">${profitableTrades.length}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Winners</div>
                        </div>
                        <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="font-size: 20px; font-weight: 700; color: var(--accent-error);">${losingTrades.length}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Losers</div>
                        </div>
                    </div>
                    
                    <!-- Trade List -->
                    <div style="margin-bottom: 16px;">
                        <h3 style="margin: 0 0 12px 0; color: var(--text-primary); font-size: 16px;">Trade Breakdown</h3>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${trades.length > 0 ? trades.map(trade => {
                                const pnl = trade.pnl || 0;
                                const isProfit = pnl > 0;
                                const isLoss = pnl < 0;
                                const pnlColor = isProfit ? 'var(--accent-success)' : isLoss ? 'var(--accent-error)' : 'var(--text-secondary)';
                                const pnlIcon = isProfit ? '📈' : isLoss ? '📉' : '➖';
                                
                                return `
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; border-left: 4px solid ${pnlColor};">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <span style="font-size: 18px;">${pnlIcon}</span>
                                            <div>
                                                <div style="font-weight: 600; color: var(--text-primary);">${trade.symbol || 'Unknown Symbol'}</div>
                                                <div style="font-size: 12px; color: var(--text-secondary);">
                                                    ${trade.type || 'Trade'} • ${trade.quantity || 'N/A'} shares • $${trade.price || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-weight: 700; color: ${pnlColor}; font-size: 16px;">$${pnl.toFixed(2)}</div>
                                            <div style="font-size: 10px; color: var(--text-muted);">${isProfit ? 'Profit' : isLoss ? 'Loss' : 'Break Even'}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('') : `
                                <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                                    No individual trade data available for this day.
                                    <br><small>Import CSV data to see detailed trade breakdowns.</small>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <!-- Performance Summary -->
                    <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 16px;">
                        <h4 style="margin: 0 0 12px 0; color: var(--text-primary); font-size: 14px;">Performance Summary</h4>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px;">
                            <div>
                                <div style="color: var(--text-secondary);">Win Rate:</div>
                                <div style="color: var(--text-primary); font-weight: 600;">${trades.length > 0 ? ((profitableTrades.length / trades.length) * 100).toFixed(1) : '0.0'}%</div>
                            </div>
                            <div>
                                <div style="color: var(--text-secondary);">Avg Profit:</div>
                                <div style="color: var(--text-primary); font-weight: 600;">$${profitableTrades.length > 0 ? (profitableTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / profitableTrades.length).toFixed(2) : '0.00'}</div>
                            </div>
                            <div>
                                <div style="color: var(--text-secondary);">Avg Loss:</div>
                                <div style="color: var(--text-primary); font-weight: 600;">$${losingTrades.length > 0 ? (losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length).toFixed(2) : '0.00'}</div>
                            </div>
                            <div>
                                <div style="color: var(--text-secondary);">Best Trade:</div>
                                <div style="color: var(--text-primary); font-weight: 600;">$${trades.length > 0 ? Math.max(...trades.map(t => t.pnl || 0)).toFixed(2) : '0.00'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal
            modal.querySelector('#closeDayModal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }
        
        function getTradesForDay(isoDate) {
            // Check if we have individual trade data stored
            const individualTrades = localStorage.getItem('individualTrades');
            if (individualTrades) {
                try {
                    const trades = JSON.parse(individualTrades);
                    return trades.filter(trade => trade.date === isoDate);
                } catch (e) {
                    console.error('Error parsing individual trades:', e);
                }
            }
            
            // If no individual trade data, create realistic mock data based on aggregated data
            const dayData = tradingData.get(isoDate);
            if (!dayData) return [];
            
            const totalPnL = dayData.pnl || 0;
            const tradeCount = dayData.trades || 1;
            
            // Create realistic mock trades with proper P&L distribution
            const mockTrades = [];
            const symbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'NFLX'];
            const tradeTypes = ['Buy', 'Sell', 'Cover', 'Short'];
            
            // Distribute the total P&L across multiple trades more realistically
            let remainingPnL = totalPnL;
            const numTrades = Math.min(tradeCount, 6); // Max 6 trades for demo
            
            // Create a mix of winning and losing trades
            const winningTrades = Math.floor(numTrades * 0.6); // 60% winning trades
            const losingTrades = numTrades - winningTrades;
            
            // Generate winning trades
            for (let i = 0; i < winningTrades; i++) {
                const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                const type = tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
                const quantity = Math.floor(Math.random() * 100) + 10;
                const price = (Math.random() * 200 + 50).toFixed(2);
                
                // Generate positive P&L
                const tradePnL = Math.random() * Math.abs(totalPnL) * 0.3 + 50; // $50 to $300+ profit
                
                mockTrades.push({
                    symbol: symbol,
                    type: type,
                    quantity: quantity,
                    price: price,
                    pnl: tradePnL
                });
            }
            
            // Generate losing trades
            for (let i = 0; i < losingTrades; i++) {
                const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                const type = tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
                const quantity = Math.floor(Math.random() * 100) + 10;
                const price = (Math.random() * 200 + 50).toFixed(2);
                
                // Generate negative P&L
                const tradePnL = -(Math.random() * Math.abs(totalPnL) * 0.4 + 25); // -$25 to -$200+ loss
                
                mockTrades.push({
                    symbol: symbol,
                    type: type,
                    quantity: quantity,
                    price: price,
                    pnl: tradePnL
                });
            }
            
            // Shuffle the trades to mix winners and losers
            return mockTrades.sort(() => Math.random() - 0.5);
        }

        // Notification System
        let notificationQueue = new Set();
        let notificationTimeout = null;
        
        function setupNotifications() {
            // Create notification container
            if (!document.getElementById('notificationContainer')) {
                const container = document.createElement('div');
                container.id = 'notificationContainer';
                container.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 10000;
                    display: flex; flex-direction: column; gap: 8px; pointer-events: none;
                `;
                document.body.appendChild(container);
            }
        }
        
        function showNotification(type, title, message, duration = 2500) {
            const container = document.getElementById('notificationContainer');
            if (!container) return;
            
            // Create unique key for this notification
            const notificationKey = `${type}-${title}-${message}`;
            
            // Prevent duplicate notifications
            if (notificationQueue.has(notificationKey)) {
                return;
            }
            
            // Add to queue
            notificationQueue.add(notificationKey);
            
            const notification = document.createElement('div');
            notification.style.cssText = `
                background: var(--bg-card); border-radius: 8px; padding: 12px; 
                box-shadow: var(--shadow-md); border-left: 3px solid var(--accent-${type});
                max-width: 320px; pointer-events: auto; transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 0.95;
            `;
            
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };
            
            notification.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                    <span style="font-size: 16px; color: var(--accent-${type});">${icons[type] || 'ℹ'}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 2px; font-size: 14px;">${title}</div>
                        <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.3;">${message}</div>
                    </div>
                </div>
            `;
            
            container.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
                notification.style.opacity = '1';
            }, 10);
            
            // Auto remove
            setTimeout(() => {
                removeNotification(notification);
                notificationQueue.delete(notificationKey);
            }, duration);
        }
        
        function removeNotification(notification) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }

        // Add sample data for demonstration
        function addSampleData() {
            const today = new Date();
            const sampleDates = [];
            
            // Generate sample data for the last 30 days
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const isoDate = date.toISOString().split('T')[0];
                sampleDates.push(isoDate);
                
                // Create realistic trading data
                const pnl = (Math.random() - 0.3) * 800; // Slightly biased towards profits
                const trades = Math.floor(Math.random() * 6) + 1;
                
                tradingData.set(isoDate, {
                    pnl: pnl,
                    trades: trades,
                    volume: Math.random() * 8000 + 2000,
                    pnlPercent: (pnl / 10000) * 100
                });
            }
            
            // Generate individual trade data for demonstration
            const individualTrades = [];
            sampleDates.slice(0, 15).forEach(isoDate => {
                const dayData = tradingData.get(isoDate);
                const symbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
                const tradeTypes = ['Buy', 'Sell'];
                
                const numTrades = Math.min(dayData.trades, 3); // Max 3 trades per day
                const winningTrades = Math.floor(numTrades * 0.6); // 60% winning trades
                
                // Generate winning trades
                for (let i = 0; i < winningTrades; i++) {
                    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                    const type = tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
                    const quantity = Math.floor(Math.random() * 50) + 10;
                    const price = (Math.random() * 150 + 50).toFixed(2);
                    const pnl = Math.random() * 200 + 25; // $25 to $225 profit
                    
                    individualTrades.push({
                        date: isoDate,
                        symbol: symbol,
                        type: type,
                        quantity: quantity,
                        price: price,
                        pnl: pnl
                    });
                }
                
                // Generate losing trades
                for (let i = winningTrades; i < numTrades; i++) {
                    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                    const type = tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
                    const quantity = Math.floor(Math.random() * 50) + 10;
                    const price = (Math.random() * 150 + 50).toFixed(2);
                    const pnl = -(Math.random() * 150 + 15); // -$15 to -$165 loss
                    
                    individualTrades.push({
                        date: isoDate,
                        symbol: symbol,
                        type: type,
                        quantity: quantity,
                        price: price,
                        pnl: pnl
                    });
                }
            });
            
            // Store individual trades
            localStorage.setItem('individualTrades', JSON.stringify(individualTrades));
            
            // Force re-render
            render();
            
            // Ensure chart is not in loading state
            const chartCard = document.querySelector('.chart-card');
            if (chartCard) {
                chartCard.classList.remove('loading');
            }
            
            // Show success notification
            showNotification('Sample Data Added', '30 days of sample trading data has been generated', 'success', 3000);
        }
        
        // Add sample data button to quick actions
        function addSampleDataButton() {
            const quickActions = document.querySelector('.quick-actions');
            if (!quickActions || document.getElementById('sampleDataBtn')) return;
            
            const sampleBtn = document.createElement('button');
            sampleBtn.id = 'sampleDataBtn';
            sampleBtn.title = 'Add Sample Data';
            sampleBtn.innerHTML = '📊';
            sampleBtn.className = 'btn btn-secondary';
            sampleBtn.style.cssText = `
                background: var(--gradient-primary);
                color: white;
                border: none;
                border-radius: 8px;
                width: 40px;
                height: 40px;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                margin-left: 8px;
            `;
            
            sampleBtn.addEventListener('click', addSampleData);
            sampleBtn.addEventListener('mouseenter', () => {
                sampleBtn.style.transform = 'translateY(-2px)';
                sampleBtn.style.boxShadow = 'var(--shadow-lg)';
            });
            sampleBtn.addEventListener('mouseleave', () => {
                sampleBtn.style.transform = 'translateY(0)';
                sampleBtn.style.boxShadow = 'var(--shadow-sm)';
            });
            
            quickActions.appendChild(sampleBtn);
        }

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
            },
            showNotification: showNotification,
            exportData: exportData,
            exportPDFReport: exportPDFReport,
            exportJSONBackup: exportJSONBackup,
            addSampleData: addSampleData,
            showDayDetailsModal: showDayDetailsModal,
            // Debug functions
            debug: {
                checkData: () => {
                    console.log('📊 Current trading data:', tradingData);
                    console.log('💾 Individual trades in localStorage:', localStorage.getItem('individualTrades'));
                    console.log('🎲 Sample data button exists:', !!document.getElementById('sampleDataBtn'));
                    console.log('🔧 Quick actions container:', document.querySelector('.quick-actions'));
                },
                forceAddSampleData: () => {
                    console.log('🔧 Manually triggering sample data generation...');
                    addSampleData();
                },
                clearData: () => {
                    console.log('🗑️ Clearing all data...');
                    tradingData.clear();
                    localStorage.removeItem('individualTrades');
                    render();
                },
                getDataCount: () => {
                    console.log(`📊 Total trading data entries: ${tradingData.size}`);
                    console.log('📅 Sample dates:', Array.from(tradingData.keys()).slice(0, 10));
                    return tradingData.size;
                },
                fixChart: () => {
                    console.log('🔧 Fixing chart loading state...');
                    const chartCard = document.querySelector('.chart-card');
                    const daysGrid = document.querySelector('.days-grid');
                    const miniChart = document.getElementById('miniChart');
                    const chartLine = document.getElementById('chartLine');
                    
                    if (chartCard) {
                        chartCard.classList.remove('loading');
                        chartCard.style.opacity = '1';
                        console.log('✅ Removed loading from chart-card');
                    }
                    if (daysGrid) {
                        daysGrid.classList.remove('loading');
                        console.log('✅ Removed loading from days-grid');
                    }
                    if (miniChart) {
                        miniChart.style.opacity = '1';
                        miniChart.style.visibility = 'visible';
                        console.log('✅ Made miniChart visible');
                    }
                    if (chartLine) {
                        chartLine.style.display = 'block';
                        chartLine.style.opacity = '1';
                        chartLine.style.visibility = 'visible';
                        console.log('✅ Made chartLine visible');
                    }
                    
                    // Force re-render with all data
                    const allData = Array.from(tradingData.values());
                    if (allData.length > 0) {
                        renderMiniChart(allData);
                    }
                }
            }
        };
    }
})();