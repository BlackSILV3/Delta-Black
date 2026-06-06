const DB_Login = {
    handleLogin: function() {
        var result = DB_Auth.authenticate();
        
        if (!result) return;
        
        if (result.role === 'admin') {
            DB_Admin.showDashboard(result.user);
        } else {
            DB_User.showDashboard(result.user);
        }
    }
};
