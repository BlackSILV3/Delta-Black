const DB_Login = {
    handleLogin: function() {
        DB_Auth.authenticate().then(function(result) {
            if (!result) return;
            
            if (result.role === 'admin') {
                DB_Admin.showDashboard(result.user);
            } else {
                DB_User.showDashboard(result.user);
            }
        });
    }
};
