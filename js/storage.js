const DB_Storage = {
    getUsers: function() {
        return JSON.parse(localStorage.getItem(DB_CONFIG.STORAGE_KEYS.users) || '[]');
    },

    saveUsers: function(users) {
        localStorage.setItem(DB_CONFIG.STORAGE_KEYS.users, JSON.stringify(users));
    },

    getUserByAgentNumber: function(agentNumber) {
        return this.getUsers().find(function(u) { return u.agentNumber === agentNumber; });
    },

    updateUser: function(updatedUser) {
        var users = this.getUsers();
        var index = users.findIndex(function(u) { return u.agentNumber === updatedUser.agentNumber; });
        if (index !== -1) {
            users[index] = updatedUser;
            this.saveUsers(users);
            return true;
        }
        return false;
    },

    addUser: function(user) {
        var users = this.getUsers();
        users.push(user);
        this.saveUsers(users);
    },

    deleteUserByAgentNumber: function(agentNumber) {
        var users = this.getUsers();
        users = users.filter(function(u) { return u.agentNumber !== agentNumber; });
        this.saveUsers(users);
    },

    getQuestions: function() {
        return JSON.parse(localStorage.getItem(DB_CONFIG.STORAGE_KEYS.questions) || '[]');
    },

    saveQuestions: function(questions) {
        localStorage.setItem(DB_CONFIG.STORAGE_KEYS.questions, JSON.stringify(questions));
    },

    addQuestion: function(question) {
        var questions = this.getQuestions();
        questions.push(question);
        this.saveQuestions(questions);
    },

    getQuestionsForAgent: function(agentNumber) {
        return this.getQuestions().filter(function(q) {
            return q.targetAgents.includes(agentNumber) || q.targetAgents.includes('all');
        });
    },

    getResponses: function() {
        return JSON.parse(localStorage.getItem(DB_CONFIG.STORAGE_KEYS.responses) || '[]');
    },

    saveResponses: function(responses) {
        localStorage.setItem(DB_CONFIG.STORAGE_KEYS.responses, JSON.stringify(responses));
    },

    addResponse: function(response) {
        var responses = this.getResponses();
        responses.push(response);
        this.saveResponses(responses);
    },

    getResponsesByAgent: function(agentNumber) {
        return this.getResponses().filter(function(r) { return r.agentNumber === agentNumber; });
    },

    getAnsweredQuestionIds: function(agentNumber) {
        return this.getResponsesByAgent(agentNumber).map(function(r) { return r.questionId; });
    },

    getCurrentUser: function() {
        var data = localStorage.getItem(DB_CONFIG.STORAGE_KEYS.currentUser);
        return data ? JSON.parse(data) : null;
    },

    setCurrentUser: function(user) {
        localStorage.setItem(DB_CONFIG.STORAGE_KEYS.currentUser, JSON.stringify(user));
    },

    clearCurrentUser: function() {
        localStorage.removeItem(DB_CONFIG.STORAGE_KEYS.currentUser);
    },

    getWelcomeMessage: function() {
        return localStorage.getItem(DB_CONFIG.STORAGE_KEYS.welcomeMessage) || DB_CONFIG.DEFAULT_WELCOME;
    },

    setWelcomeMessage: function(message) {
        localStorage.setItem(DB_CONFIG.STORAGE_KEYS.welcomeMessage, message);
    },

    initialize: function() {
        if (!localStorage.getItem(DB_CONFIG.STORAGE_KEYS.welcomeMessage)) {
            this.setWelcomeMessage(DB_CONFIG.DEFAULT_WELCOME);
        }
    },

    // ============================================
    // EXPORT ALL DATA TO JSON FILE
    // ============================================
    exportAll: function() {
        var data = {
            system: 'Delta Black',
            exportedAt: new Date().toISOString(),
            version: '1.0',
            users: this.getUsers(),
            questions: this.getQuestions(),
            responses: this.getResponses(),
            welcomeMessage: this.getWelcomeMessage()
        };
        
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'delta-black-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    },

    // ============================================
    // IMPORT DATA FROM JSON FILE
    // ============================================
    importAll: function(jsonString) {
        try {
            var data = JSON.parse(jsonString);
            
            if (!data.users || !Array.isArray(data.users)) {
                throw new Error('Invalid backup file: missing users array');
            }
            
            if (!confirm('This will REPLACE all current data. Continue?')) {
                return false;
            }
            
            if (data.users) this.saveUsers(data.users);
            if (data.questions) this.saveQuestions(data.questions);
            if (data.responses) this.saveResponses(data.responses);
            if (data.welcomeMessage) this.setWelcomeMessage(data.welcomeMessage);
            
            return true;
        } catch (e) {
            alert('Import failed: ' + e.message);
            return false;
        }
    },

    // ============================================
    // RESET SYSTEM (CLEAR ALL DATA)
    // ============================================
    resetSystem: function() {
        if (!confirm('WARNING: This will DELETE ALL DATA permanently. Are you sure?')) {
            return false;
        }
        if (!confirm('FINAL WARNING: All agents, questions, responses will be lost. Confirm?')) {
            return false;
        }
        
        localStorage.removeItem(DB_CONFIG.STORAGE_KEYS.users);
        localStorage.removeItem(DB_CONFIG.STORAGE_KEYS.questions);
        localStorage.removeItem(DB_CONFIG.STORAGE_KEYS.responses);
        localStorage.removeItem(DB_CONFIG.STORAGE_KEYS.currentUser);
        localStorage.removeItem(DB_CONFIG.STORAGE_KEYS.welcomeMessage);
        
        this.initialize();
        
        return true;
    }
};
