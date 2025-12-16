// OPD Closing Duties Tracker - Firebase Version
// Centralized tracking with manager dashboard

import firebaseConfig from './firebase-config.js';

class OPDFirebaseTracker {
    constructor() {
        this.db = null;
        this.currentView = 'associate';
        this.checkboxes = document.querySelectorAll('input[type="checkbox"]');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.associateName = document.getElementById('associateName');
        this.notes = document.getElementById('notes');
        this.dateDisplay = document.getElementById('dateDisplay');

        this.init();
    }

    async init() {
        await this.initFirebase();
        this.setCurrentDate();
        this.attachEventListeners();
        this.loadTodayProgress();
        this.updateProgress();
    }

    async initFirebase() {
        try {
            // Initialize Firebase
            const app = firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();

            console.log('✅ Firebase connected successfully');
        } catch (error) {
            console.error('❌ Firebase initialization error:', error);
            alert('Error connecting to Firebase. Please check your connection and refresh the page.');
        }
    }

    setCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }

    attachEventListeners() {
        // Checkbox change events
        this.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateProgress();
                this.autoSaveProgress();
            });
        });

        // Associate name input
        this.associateName.addEventListener('input', () => {
            this.autoSaveProgress();
        });

        // Notes input
        this.notes.addEventListener('input', () => {
            this.autoSaveProgress();
        });

        // View mode switcher
        document.getElementById('associateMode').addEventListener('click', () => this.switchView('associate'));
        document.getElementById('managerMode').addEventListener('click', () => this.switchView('manager'));

        // Associate view buttons
        document.getElementById('saveLog').addEventListener('click', () => this.saveLogToFirebase());
        document.getElementById('viewHistory').addEventListener('click', () => this.showMyHistory());
        document.getElementById('resetChecklist').addEventListener('click', () => this.resetChecklist());
        document.getElementById('printChecklist').addEventListener('click', () => window.print());

        // Manager view buttons
        document.getElementById('refreshDashboard').addEventListener('click', () => this.loadDashboard());
        document.getElementById('exportAllData').addEventListener('click', () => this.exportAllData());
        document.getElementById('dateFilter').addEventListener('change', () => this.loadDashboard());

        // Modal events
        const modal = document.getElementById('historyModal');
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        document.getElementById('exportCSV').addEventListener('click', () => this.exportCSV());
        document.getElementById('exportJSON').addEventListener('click', () => this.exportJSON());
    }

    switchView(view) {
        this.currentView = view;

        if (view === 'associate') {
            document.getElementById('associateView').style.display = 'block';
            document.getElementById('managerView').style.display = 'none';
            document.getElementById('associateMode').classList.add('active');
            document.getElementById('managerMode').classList.remove('active');
        } else {
            document.getElementById('associateView').style.display = 'none';
            document.getElementById('managerView').style.display = 'block';
            document.getElementById('associateMode').classList.remove('active');
            document.getElementById('managerMode').classList.add('active');
            this.loadDashboard();
        }
    }

    updateProgress() {
        const total = this.checkboxes.length;
        const checked = Array.from(this.checkboxes).filter(cb => cb.checked).length;
        const percentage = Math.round((checked / total) * 100);

        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${percentage}% Complete (${checked}/${total})`;

        // Change color based on completion
        if (percentage === 100) {
            this.progressFill.style.background = 'linear-gradient(90deg, #46b450 0%, #5cd65c 100%)';
        } else if (percentage >= 50) {
            this.progressFill.style.background = 'linear-gradient(90deg, #ffc220 0%, #ffca3a 100%)';
        } else {
            this.progressFill.style.background = 'linear-gradient(90deg, #dc3545 0%, #e64555 100%)';
        }
    }

    getTodayKey() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    autoSaveProgress() {
        // Save to localStorage for backup
        const state = {
            associate: this.associateName.value,
            notes: this.notes.value,
            checkboxes: Array.from(this.checkboxes).map(cb => cb.checked),
            timestamp: new Date().toISOString()
        };

        localStorage.setItem(`opd_draft_${this.getTodayKey()}`, JSON.stringify(state));
    }

    loadTodayProgress() {
        const saved = localStorage.getItem(`opd_draft_${this.getTodayKey()}`);

        if (saved) {
            const state = JSON.parse(saved);
            this.associateName.value = state.associate || '';
            this.notes.value = state.notes || '';

            state.checkboxes.forEach((checked, index) => {
                if (this.checkboxes[index]) {
                    this.checkboxes[index].checked = checked;
                }
            });
        }
    }

    async saveLogToFirebase() {
        if (!this.associateName.value.trim()) {
            alert('⚠️ Please enter your name before saving the log.');
            this.associateName.focus();
            return;
        }

        const total = this.checkboxes.length;
        const checked = Array.from(this.checkboxes).filter(cb => cb.checked).length;
        const percentage = Math.round((checked / total) * 100);

        const log = {
            date: new Date().toISOString(),
            dateDisplay: this.dateDisplay.textContent,
            dateKey: this.getTodayKey(),
            associate: this.associateName.value.trim(),
            notes: this.notes.value,
            checkboxes: Array.from(this.checkboxes).map(cb => cb.checked),
            completed: checked,
            total: total,
            percentage: percentage,
            sections: this.getSectionProgress(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await this.db.collection('opd_closing_logs').add(log);

            // Clear draft
            localStorage.removeItem(`opd_draft_${this.getTodayKey()}`);

            this.showSuccessMessage();

            if (confirm('✅ Log saved to Firebase successfully!\n\nWould you like to reset the checklist for the next shift?')) {
                this.resetChecklist();
            }
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            alert('❌ Error saving to Firebase. Your data has been saved locally as a backup.');
        }
    }

    getSectionProgress() {
        const sections = {};

        for (let i = 1; i <= 6; i++) {
            const sectionCheckboxes = Array.from(this.checkboxes).filter(
                cb => cb.dataset.section === String(i)
            );
            const checked = sectionCheckboxes.filter(cb => cb.checked).length;
            const total = sectionCheckboxes.length;

            sections[`section${i}`] = {
                checked,
                total,
                percentage: Math.round((checked / total) * 100)
            };
        }

        return sections;
    }

    showSuccessMessage() {
        const container = document.querySelector('.container');
        container.classList.add('success-animation');
        setTimeout(() => container.classList.remove('success-animation'), 500);
    }

    async showMyHistory() {
        if (!this.associateName.value.trim()) {
            alert('⚠️ Please enter your name to view your history.');
            this.associateName.focus();
            return;
        }

        const modal = document.getElementById('historyModal');
        const content = document.getElementById('historyContent');

        try {
            const snapshot = await this.db.collection('opd_closing_logs')
                .where('associate', '==', this.associateName.value.trim())
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            if (snapshot.empty) {
                content.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No history found for this associate.</p>';
            } else {
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                content.innerHTML = logs.map(log => this.renderHistoryEntry(log)).join('');
            }

            modal.style.display = 'block';
        } catch (error) {
            console.error('Error loading history:', error);
            alert('❌ Error loading history from Firebase.');
        }
    }

    async loadDashboard() {
        const statsGrid = document.getElementById('statsGrid');
        const recentLogs = document.getElementById('recentLogs');
        const filter = document.getElementById('dateFilter').value;

        try {
            let query = this.db.collection('opd_closing_logs');

            // Apply date filter
            const now = new Date();
            let startDate;

            switch(filter) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'yesterday':
                    startDate = new Date(now.setDate(now.getDate() - 1));
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                default:
                    startDate = null;
            }

            if (startDate) {
                query = query.where('timestamp', '>=', startDate);
            }

            const snapshot = await query.orderBy('timestamp', 'desc').limit(100).get();
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Calculate stats
            const stats = this.calculateStats(logs);
            statsGrid.innerHTML = this.renderStats(stats);

            // Show recent logs
            recentLogs.innerHTML = `
                <h3>Recent Submissions</h3>
                ${logs.map(log => this.renderDashboardEntry(log)).join('')}
            `;
        } catch (error) {
            console.error('Error loading dashboard:', error);
            statsGrid.innerHTML = '<p style="color: red;">Error loading dashboard data.</p>';
        }
    }

    calculateStats(logs) {
        const totalLogs = logs.length;
        const complete = logs.filter(l => l.percentage === 100).length;
        const avgCompletion = logs.length > 0
            ? Math.round(logs.reduce((sum, l) => sum + l.percentage, 0) / logs.length)
            : 0;

        const uniqueAssociates = new Set(logs.map(l => l.associate)).size;

        return {
            totalLogs,
            complete,
            incomplete: totalLogs - complete,
            avgCompletion,
            uniqueAssociates
        };
    }

    renderStats(stats) {
        return `
            <div class="stat-card">
                <div class="stat-value">${stats.totalLogs}</div>
                <div class="stat-label">Total Submissions</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.complete}</div>
                <div class="stat-label">100% Complete</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.incomplete}</div>
                <div class="stat-label">Incomplete</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.avgCompletion}%</div>
                <div class="stat-label">Avg Completion</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.uniqueAssociates}</div>
                <div class="stat-label">Associates</div>
            </div>
        `;
    }

    renderDashboardEntry(log) {
        const date = log.timestamp ? log.timestamp.toDate() : new Date(log.date);
        const completeClass = log.percentage === 100 ? 'complete' : '';

        return `
            <div class="dashboard-entry ${completeClass}">
                <div class="entry-header">
                    <div>
                        <strong>👤 ${log.associate}</strong>
                        <br>
                        <small>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</small>
                    </div>
                    <div class="entry-completion" style="color: ${log.percentage === 100 ? '#46b450' : '#ff8800'}">
                        ${log.percentage}%
                    </div>
                </div>
                ${log.notes ? `<div class="entry-notes">📝 ${log.notes}</div>` : ''}
            </div>
        `;
    }

    renderHistoryEntry(log) {
        const date = log.timestamp ? log.timestamp.toDate() : new Date(log.date);
        const completeClass = log.percentage === 100 ? 'complete' : '';

        return `
            <div class="history-entry ${completeClass}">
                <div class="history-header">
                    <div>
                        <strong>📅 ${log.dateDisplay || date.toLocaleDateString()}</strong>
                        <br>
                        <small>Saved at: ${date.toLocaleTimeString()}</small>
                    </div>
                    <div style="text-align: right;">
                        <strong style="font-size: 1.2em; color: ${log.percentage === 100 ? '#46b450' : '#ff8800'}">
                            ${log.percentage}%
                        </strong>
                        <br>
                        <small>${log.completed}/${log.total} tasks</small>
                    </div>
                </div>
                ${log.notes ? `<div class="history-notes"><strong>📝 Notes:</strong><br>${log.notes}</div>` : ''}
            </div>
        `;
    }

    closeModal() {
        document.getElementById('historyModal').style.display = 'none';
    }

    resetChecklist() {
        if (confirm('⚠️ Are you sure you want to reset the checklist?\n\nThis will clear all checkboxes but keep your name and notes.')) {
            this.checkboxes.forEach(checkbox => checkbox.checked = false);
            this.updateProgress();
            this.autoSaveProgress();
        }
    }

    async exportCSV() {
        // Export current associate's data
        try {
            const snapshot = await this.db.collection('opd_closing_logs')
                .where('associate', '==', this.associateName.value.trim())
                .orderBy('timestamp', 'desc')
                .get();

            const logs = snapshot.docs.map(doc => doc.data());

            if (logs.length === 0) {
                alert('No data to export.');
                return;
            }

            let csv = 'Date,Time,Associate,Completion %,Tasks Completed,Total Tasks,Notes\n';

            logs.forEach(log => {
                const date = log.timestamp ? log.timestamp.toDate() : new Date(log.date);
                const notes = (log.notes || '').replace(/"/g, '""');
                csv += `"${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${log.associate}",${log.percentage}%,${log.completed},${log.total},"${notes}"\n`;
            });

            this.downloadFile(csv, `opd-history-${this.associateName.value}.csv`, 'text/csv');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Error exporting data.');
        }
    }

    async exportJSON() {
        try {
            const snapshot = await this.db.collection('opd_closing_logs')
                .where('associate', '==', this.associateName.value.trim())
                .orderBy('timestamp', 'desc')
                .get();

            const logs = snapshot.docs.map(doc => doc.data());

            if (logs.length === 0) {
                alert('No data to export.');
                return;
            }

            const json = JSON.stringify(logs, null, 2);
            this.downloadFile(json, `opd-history-${this.associateName.value}.json`, 'application/json');
        } catch (error) {
            console.error('Error exporting JSON:', error);
            alert('Error exporting data.');
        }
    }

    async exportAllData() {
        try {
            const filter = document.getElementById('dateFilter').value;
            let query = this.db.collection('opd_closing_logs');

            // Apply same filter as dashboard
            const now = new Date();
            let startDate;

            switch(filter) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'yesterday':
                    startDate = new Date(now.setDate(now.getDate() - 1));
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
            }

            if (startDate) {
                query = query.where('timestamp', '>=', startDate);
            }

            const snapshot = await query.orderBy('timestamp', 'desc').get();
            const logs = snapshot.docs.map(doc => doc.data());

            if (logs.length === 0) {
                alert('No data to export.');
                return;
            }

            // Export as CSV
            let csv = 'Date,Time,Associate,Completion %,Tasks Completed,Total Tasks,Notes\n';

            logs.forEach(log => {
                const date = log.timestamp ? log.timestamp.toDate() : new Date(log.date);
                const notes = (log.notes || '').replace(/"/g, '""');
                csv += `"${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${log.associate}",${log.percentage}%,${log.completed},${log.total},"${notes}"\n`;
            });

            this.downloadFile(csv, `opd-all-data-${filter}.csv`, 'text/csv');
        } catch (error) {
            console.error('Error exporting all data:', error);
            alert('Error exporting data.');
        }
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize tracker when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new OPDFirebaseTracker();
});
