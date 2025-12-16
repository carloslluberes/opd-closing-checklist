// OPD Closing Duties Tracker - JavaScript
// Handles checklist functionality, progress tracking, and history management

class OPDTracker {
    constructor() {
        this.checkboxes = document.querySelectorAll('input[type="checkbox"]');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.associateName = document.getElementById('associateName');
        this.notes = document.getElementById('notes');
        this.dateDisplay = document.getElementById('dateDisplay');

        this.init();
    }

    init() {
        this.setCurrentDate();
        this.loadTodayProgress();
        this.attachEventListeners();
        this.updateProgress();
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
                this.saveProgress();
            });
        });

        // Associate name input
        this.associateName.addEventListener('input', () => {
            this.saveProgress();
        });

        // Notes input
        this.notes.addEventListener('input', () => {
            this.saveProgress();
        });

        // Button events
        document.getElementById('saveLog').addEventListener('click', () => this.saveLog());
        document.getElementById('viewHistory').addEventListener('click', () => this.showHistory());
        document.getElementById('resetChecklist').addEventListener('click', () => this.resetChecklist());
        document.getElementById('printChecklist').addEventListener('click', () => window.print());

        // Modal events
        const modal = document.getElementById('historyModal');
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        document.getElementById('exportCSV').addEventListener('click', () => this.exportCSV());
        document.getElementById('exportJSON').addEventListener('click', () => this.exportJSON());
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());
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
        return `opd_progress_${today.toISOString().split('T')[0]}`;
    }

    saveProgress() {
        const state = {
            associate: this.associateName.value,
            notes: this.notes.value,
            checkboxes: Array.from(this.checkboxes).map(cb => cb.checked),
            timestamp: new Date().toISOString()
        };

        localStorage.setItem(this.getTodayKey(), JSON.stringify(state));
    }

    loadTodayProgress() {
        const saved = localStorage.getItem(this.getTodayKey());

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

    saveLog() {
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
            associate: this.associateName.value,
            notes: this.notes.value,
            checkboxes: Array.from(this.checkboxes).map(cb => cb.checked),
            completed: checked,
            total: total,
            percentage: percentage,
            sections: this.getSectionProgress()
        };

        // Get existing history
        const history = this.getHistory();
        history.push(log);
        localStorage.setItem('opd_history', JSON.stringify(history));

        // Show success message
        this.showSuccessMessage();

        // Optional: Reset for next day
        if (confirm('✅ Log saved successfully!\n\nWould you like to reset the checklist for the next shift?')) {
            this.resetChecklist();
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

    getHistory() {
        const history = localStorage.getItem('opd_history');
        return history ? JSON.parse(history) : [];
    }

    showHistory() {
        const modal = document.getElementById('historyModal');
        const content = document.getElementById('historyContent');
        const history = this.getHistory();

        if (history.length === 0) {
            content.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No history logs found. Complete and save your first checklist to see history here.</p>';
        } else {
            // Sort by date, newest first
            history.sort((a, b) => new Date(b.date) - new Date(a.date));

            content.innerHTML = history.map((log, index) => this.renderHistoryEntry(log, index)).join('');
        }

        modal.style.display = 'block';
    }

    renderHistoryEntry(log, index) {
        const date = new Date(log.date);
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
                <div class="history-details">
                    <strong>👤 Associate:</strong> ${log.associate}
                    <br><br>
                    <strong>📊 Section Progress:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        ${Object.entries(log.sections).map(([key, data]) => {
                            const sectionNum = key.replace('section', '');
                            const sectionNames = {
                                '1': 'Check Undispensed Orders',
                                '2': 'Handle Pickup Orders',
                                '3': 'Handle Delivery Orders',
                                '4': 'Process Returns',
                                '5': 'Clean and Prepare Area',
                                '6': 'Secure Resources'
                            };
                            return `<li>${sectionNames[sectionNum]}: ${data.checked}/${data.total} (${data.percentage}%)</li>`;
                        }).join('')}
                    </ul>
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
            this.saveProgress();
        }
    }

    exportCSV() {
        const history = this.getHistory();

        if (history.length === 0) {
            alert('No history to export.');
            return;
        }

        // CSV headers
        let csv = 'Date,Time,Associate,Completion %,Tasks Completed,Total Tasks,Section 1,Section 2,Section 3,Section 4,Section 5,Section 6,Notes\n';

        // CSV rows
        history.forEach(log => {
            const date = new Date(log.date);
            const sections = Object.values(log.sections).map(s => `${s.percentage}%`).join(',');
            const notes = (log.notes || '').replace(/"/g, '""'); // Escape quotes

            csv += `"${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${log.associate}",${log.percentage}%,${log.completed},${log.total},${sections},"${notes}"\n`;
        });

        this.downloadFile(csv, 'opd-closing-history.csv', 'text/csv');
    }

    exportJSON() {
        const history = this.getHistory();

        if (history.length === 0) {
            alert('No history to export.');
            return;
        }

        const json = JSON.stringify(history, null, 2);
        this.downloadFile(json, 'opd-closing-history.json', 'application/json');
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

    clearHistory() {
        if (confirm('⚠️ Are you sure you want to clear ALL history?\n\nThis action cannot be undone!')) {
            if (confirm('🚨 FINAL WARNING: This will permanently delete all saved logs.\n\nProceed?')) {
                localStorage.removeItem('opd_history');
                this.showHistory(); // Refresh the history view
                alert('✅ History cleared successfully.');
            }
        }
    }
}

// Initialize tracker when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new OPDTracker();
});
