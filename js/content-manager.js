const DB_Content = {
    updateSelects: function() {
        DB_Storage.getUsers().then(function(users) {
            var filteredUsers = users.filter(function(u) { return u.role !== 'admin'; });
            var selects = [
                document.getElementById('target-agent'),
                document.getElementById('profile-target'),
                document.getElementById('grade-target'),
                document.getElementById('level-target'),
                document.getElementById('badge-target'),
                document.getElementById('response-filter')
            ];
            
            selects.forEach(function(select) {
                if (!select) return;
                
                var currentValue = select.value;
                var isMultiple = select.multiple;
                var hasAllOption = select.id === 'target-agent' || select.id === 'response-filter';
                
                select.innerHTML = '';
                
                if (hasAllOption) {
                    var allOption = document.createElement('option');
                    allOption.value = 'all';
                    allOption.textContent = 'All Agents';
                    select.appendChild(allOption);
                }
                
                filteredUsers.forEach(function(user) {
                    var option = document.createElement('option');
                    option.value = user.agentNumber;
                    option.textContent = 'Agent ' + user.agentNumber + ' — ' + user.nickname;
                    select.appendChild(option);
                });
                
                if (!isMultiple && currentValue) {
                    select.value = currentValue;
                }
            });
        });
    },

    updateProfile: function() {
        var target = document.getElementById('profile-target');
        var content = DB_Utils.getValue('profile-content');
        
        if (!content) {
            alert('Enter profile content.');
            return;
        }
        
        DB_Storage.getUserByAgentNumber(target ? target.value : '').then(function(user) {
            if (!user) {
                alert('Agent not found.');
                return;
            }
            
            user.profile = content;
            DB_Storage.updateUser(user).then(function() {
                DB_Utils.clearValue('profile-content');
                alert('Profile updated for Agent ' + (target ? target.value : '') + '.');
            });
        });
    },

    assignGrade: function() {
        var target = document.getElementById('grade-target');
        var value = DB_Utils.getValue('grade-value');
        var notes = DB_Utils.getValue('grade-notes');
        
        if (!value) {
            alert('Enter grade value.');
            return;
        }
        
        DB_Storage.getUserByAgentNumber(target ? target.value : '').then(function(user) {
            if (!user) return;
            
            user.grades = user.grades || [];
            user.grades.push({
                value: value,
                notes: notes,
                date: new Date().toLocaleDateString(),
                assignedAt: new Date().toISOString()
            });
            
            DB_Storage.updateUser(user).then(function() {
                DB_Utils.clearValue('grade-value');
                DB_Utils.clearValue('grade-notes');
                alert('Grade assigned to Agent ' + (target ? target.value : '') + '.');
            });
        });
    },

    setLevel: function() {
        var target = document.getElementById('level-target');
        var value = DB_Utils.getValue('level-value');
        
        if (!value) {
            alert('Enter level value.');
            return;
        }
        
        DB_Storage.getUserByAgentNumber(target ? target.value : '').then(function(user) {
            if (!user) return;
            
            user.levels = user.levels || [];
            user.levels.push({
                value: value,
                date: new Date().toLocaleDateString(),
                assignedAt: new Date().toISOString()
            });
            
            DB_Storage.updateUser(user).then(function() {
                DB_Utils.clearValue('level-value');
                alert('Level set for Agent ' + (target ? target.value : '') + '.');
            });
        });
    },

    awardBadge: function() {
        var target = document.getElementById('badge-target');
        var name = DB_Utils.getValue('badge-name');
        var icon = DB_Utils.getValue('badge-icon') || '🏅';
        
        if (!name) {
            alert('Enter badge name.');
            return;
        }
        
        DB_Storage.getUserByAgentNumber(target ? target.value : '').then(function(user) {
            if (!user) return;
            
            user.badges = user.badges || [];
            user.badges.push({
                name: name,
                icon: icon,
                date: new Date().toLocaleDateString(),
                awardedAt: new Date().toISOString()
            });
            
            DB_Storage.updateUser(user).then(function() {
                DB_Utils.clearValue('badge-name');
                DB_Utils.clearValue('badge-icon');
                alert('Badge awarded to Agent ' + (target ? target.value : '') + '.');
            });
        });
    },

    init: function() {
        document.addEventListener('usersUpdated', this.updateSelects.bind(this));
    }
};
