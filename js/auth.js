const DB_Auth = {
    isAdmin: function(agentNumber, barCode, nickname) {
        return agentNumber === DB_CONFIG.ADMIN.agentNumber && 
               barCode === DB_CONFIG.ADMIN.barCode && 
               nickname === DB_CONFIG.ADMIN.name;
    },

    validateCredentials: function(agentNumber, barCode, nickname) {
        return DB_Storage.getUserByAgentNumber(agentNumber).then(function(user) {
            if (user && user.barCode === barCode && user.nickname === nickname) {
                return user;
            }
            return null;
        });
    },

    authenticate: function() {
        var self = this;
        var agentNumber = DB_Utils.getValue('agent-number');
        var barCode = DB_Utils.getValue('barcode');
        var nickname = DB_Utils.getValue('nickname');
        var errorMsg = document.getElementById('login-error');

        if (!agentNumber || !barCode || !nickname) {
            errorMsg.textContent = 'ALL FIELDS REQUIRED — ACCESS DENIED';
            return Promise.resolve(null);
        }

        // Check admin first
        if (this.isAdmin(agentNumber, barCode, nickname)) {
            return DB_Storage.getUserByAgentNumber(DB_CONFIG.ADMIN.agentNumber).then(function(admin) {
                if (admin) {
                    admin.lastLogin = new Date().toISOString();
                    return DB_Storage.updateUser(admin).then(function() {
                        DB_Storage.setCurrentUser(admin);
                        return { user: admin, role: 'admin' };
                    });
                }
                return null;
            });
        }

        // Check regular user
        return this.validateCredentials(agentNumber, barCode, nickname).then(function(user) {
            if (user) {
                user.lastLogin = new Date().toISOString();
                return DB_Storage.updateUser(user).then(function() {
                    DB_Storage.setCurrentUser(user);
                    return { user: user, role: 'user' };
                });
            }

            errorMsg.textContent = 'INVALID CREDENTIALS — ACCESS DENIED';
            var form = document.querySelector('.login-form');
            form.style.animation = 'none';
            setTimeout(function() {
                form.style.animation = 'shake 0.5s ease';
            }, 10);
            return null;
        });
    },

    logout: function() {
        DB_Storage.clearCurrentUser();
        DB_Utils.clearValue('agent-number');
        DB_Utils.clearValue('barcode');
        DB_Utils.clearValue('nickname');
        DB_Utils.setText('login-error', '');
        
        var userMenu = document.getElementById('user-menu');
        var adminMenu = document.getElementById('admin-menu');
        if (userMenu) userMenu.classList.add('hidden');
        if (adminMenu) adminMenu.classList.add('hidden');
        
        DB_Utils.showScreen('welcome-screen');
    },

    checkExistingSession: function() {
        var currentUser = DB_Storage.getCurrentUser();
        if (currentUser) {
            return { user: currentUser, role: currentUser.role || 'user' };
        }
        return null;
    },

    init: function() {
        return DB_Storage.initialize();
    }
};
