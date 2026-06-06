const DB_Users = {
    showAddForm: function() {
        var form = document.getElementById('add-user-form');
        if (form) form.classList.remove('hidden');
    },

    hideAddForm: function() {
        var form = document.getElementById('add-user-form');
        if (form) form.classList.add('hidden');
        DB_Utils.clearValue('new-agent-number');
        DB_Utils.clearValue('new-barcode');
        DB_Utils.clearValue('new-nickname');
    },

    addNew: function() {
        var agentNumber = DB_Utils.getValue('new-agent-number');
        var barCode = DB_Utils.getValue('new-barcode');
        var nickname = DB_Utils.getValue('new-nickname');
        
        if (!agentNumber || !barCode || !nickname) {
            alert('All fields required.');
            return;
        }
        
        var users = DB_Storage.getUsers();
        if (users.find(function(u) { return u.agentNumber === agentNumber; })) {
            alert('Agent number already exists.');
            return;
        }
        
        DB_Storage.addUser({
            id: DB_Utils.generateId(),
            agentNumber: agentNumber,
            barCode: barCode,
            nickname: nickname,
            role: 'user',
            profile: '',
            grades: [],
            levels: [],
            badges: [],
            createdAt: new Date().toISOString()
        });
        
        this.hideAddForm();
        this.loadTable();
        
        var event = new CustomEvent('usersUpdated');
        document.dispatchEvent(event);
        
        alert('Agent ' + agentNumber + ' registered successfully.');
    },

    loadTable: function() {
        var users = DB_Storage.getUsers().filter(function(u) { return u.role !== 'admin'; });
        var tbody = document.getElementById('users-table-body');
        
        if (!tbody) return;
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-dark);">No agents registered.</td></tr>';
            return;
        }
        
        var questions = DB_Storage.getQuestions();
        var responses = DB_Storage.getResponses();
        var self = this;
        
        tbody.innerHTML = users.map(function(user) {
            var userQuestions = questions.filter(function(q) {
                return q.targetAgents.includes(user.agentNumber) || q.targetAgents.includes('all');
            });
            var answeredCount = responses.filter(function(r) { return r.agentNumber === user.agentNumber; }).length;
            var totalQuestions = userQuestions.length;
            var currentQ = answeredCount < totalQuestions ? answeredCount + 1 : 'Completed';
            
            return '<tr>' +
                '<td>' + user.agentNumber + '</td>' +
                '<td>' + user.nickname + '</td>' +
                '<td>••••••••</td>' +
                '<td class="' + (user.lastLogin ? 'status-online' : 'status-offline') + '">' +
                    (user.lastLogin ? 'ONLINE' : 'OFFLINE') +
                '</td>' +
                '<td>Q' + currentQ + '</td>' +
                '<td>' +
                    '<button class="btn-secondary delete-user-btn" data-agent="' + user.agentNumber + '" style="padding:0.3rem 0.6rem; font-size:0.7rem;">DELETE</button>' +
                '</td>' +
            '</tr>';
        }).join('');
        
        tbody.querySelectorAll('.delete-user-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                self.deleteHandler(e.target.dataset.agent);
            });
        });
    },

    deleteHandler: function(agentNumber) {
        if (!confirm('Delete Agent ' + agentNumber + '? This cannot be undone.')) return;
        
        DB_Storage.deleteUserByAgentNumber(agentNumber);
        
        var responses = DB_Storage.getResponses();
        responses = responses.filter(function(r) { return r.agentNumber !== agentNumber; });
        localStorage.setItem(DB_CONFIG.STORAGE_KEYS.responses, JSON.stringify(responses));
        
        this.loadTable();
        
        var event = new CustomEvent('usersUpdated');
        document.dispatchEvent(event);
    }
};
