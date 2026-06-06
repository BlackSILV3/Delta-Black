const DB_Admin = {
    currentTab: 'questions',

    showDashboard: function(admin) {
        DB_Utils.showScreen('admin-dashboard');
        DB_Utils.setText('admin-display-name', admin.name);
        
        this.loadAgentsList();
        DB_Content.updateSelects();
        DB_Questions.loadSent();
        DB_Users.loadTable();
        DB_Responses.load();
        
        this.switchTab('questions');
    },

    switchTab: function(tabName) {
        this.currentTab = tabName;
        
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(function(content) {
            content.classList.toggle('active', content.id === 'tab-' + tabName);
        });
        
        if (tabName === 'users') DB_Users.loadTable();
        if (tabName === 'responses') DB_Responses.load();
    },

    toggleMenu: function() {
        var menu = document.getElementById('admin-menu');
        if (menu) menu.classList.toggle('hidden');
    },

    loadAgentsList: function() {
        var users = DB_Storage.getUsers().filter(function(u) { return u.role !== 'admin'; });
        var list = document.getElementById('agents-list');
        
        if (!list) return;
        
        var self = this;
        list.innerHTML = users.map(function(user) {
            return '<div class="agent-item" data-agent="' + user.agentNumber + '">' +
                '<div class="agent-num">AGENT ' + user.agentNumber + '</div>' +
                '<div class="agent-name">' + user.nickname + '</div>' +
                '<div class="agent-status">' + (user.lastLogin ? '● Online' : '○ Offline') + '</div>' +
            '</div>';
        }).join('');
        
        list.querySelectorAll('.agent-item').forEach(function(item) {
            item.addEventListener('click', function() {
                self.selectAgent(item.dataset.agent);
            });
        });
    },

    selectAgent: function(agentNumber) {
        document.querySelectorAll('.agent-item').forEach(function(item) { item.classList.remove('active'); });
        var target = document.querySelector('.agent-item[data-agent="' + agentNumber + '"]');
        if (target) target.classList.add('active');
        
        var targetSelect = document.getElementById('target-agent');
        if (targetSelect) {
            for (var i = 0; i < targetSelect.options.length; i++) {
                targetSelect.options[i].selected = targetSelect.options[i].value === agentNumber;
            }
        }
    },

    exportData: function() {
        if (DB_Storage.exportAll()) {
            alert('Backup downloaded successfully.');
        }
    },

    importData: function() {
        var input = document.getElementById('import-file-input');
        if (!input || !input.files[0]) {
            alert('Select a backup file first.');
            return;
        }
        
        var file = input.files[0];
        var reader = new FileReader();
        var self = this;
        
        reader.onload = function(e) {
            if (DB_Storage.importAll(e.target.result)) {
                alert('Data imported successfully. Refreshing...');
                var currentUser = DB_Storage.getCurrentUser();
                if (currentUser) {
                    self.showDashboard(currentUser);
                }
            }
        };
        
        reader.readAsText(file);
    },

    resetSystem: function() {
        if (DB_Storage.resetSystem()) {
            DB_Auth.logout();
        }
    }
};
