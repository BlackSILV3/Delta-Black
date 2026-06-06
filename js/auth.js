const DB_Auth = {
    isAdmin: function(agentNumber, barCode, nickname) {
        return agentNumber === DB_CONFIG.ADMIN.agentNumber && 
               barCode === DB_CONFIG.ADMIN.barCode && 
               nickname === DB_CONFIG.ADMIN.name;
    },

    validateCredentials: function(agentNumber, barCode, nickname) {
        var users = DB_Storage.getUsers();
        return users.find(function(u) {
            return u.agentNumber === agentNumber && 
                   u.barCode === barCode && 
                   u.nickname === nickname;
        });
    },

    authenticate: function() {
        var agentNumber = DB_Utils.getValue('agent-number');
        var barCode = DB_Utils.getValue('barcode');
        var nickname = DB_Utils.getValue('nickname');
        var errorMsg = document.getElementById('login-error');

        if (!agentNumber || !barCode || !nickname) {
            errorMsg.textContent = 'ALL FIELDS REQUIRED — ACCESS DENIED';
            return null;
        }

        if (this.isAdmin(agentNumber, barCode, nickname)) {
            var admin = DB_Storage.getUserByAgentNumber(DB_CONFIG.ADMIN.agentNumber);
            if (admin) {
                DB_Storage.setCurrentUser(admin);
                return { user: admin, role: 'admin' };
            }
        }

        var user = this.validateCredentials(agentNumber, barCode, nickname);
        if (user) {
            user.lastLogin = new Date().toISOString();
            DB_Storage.updateUser(user);
            DB_Storage.setCurrentUser(user);
            return { user: user, role: 'user' };
        }

        errorMsg.textContent = 'INVALID CREDENTIALS — ACCESS DENIED';
        var form = document.querySelector('.login-form');
        form.style.animation = 'none';
        setTimeout(function() {
            form.style.animation = 'shake 0.5s ease';
        }, 10);
        return null;
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
        DB_Storage.initialize();
        
        var users = DB_Storage.getUsers();
        var adminExists = users.find(function(u) { return u.agentNumber === DB_CONFIG.ADMIN.agentNumber; });
        
        if (!adminExists) {
            users.push({
                agentNumber: DB_CONFIG.ADMIN.agentNumber,
                barCode: DB_CONFIG.ADMIN.barCode,
                nickname: DB_CONFIG.ADMIN.name,
                name: DB_CONFIG.ADMIN.name,
                role: DB_CONFIG.ADMIN.role,
                profile: 'System Administrator',
                grades: [],
                levels: [],
                badges: [],
                createdAt: new Date().toISOString()
            });
            localStorage.setItem(DB_CONFIG.STORAGE_KEYS.users, JSON.stringify(users));
        }
    }
};
