const DB_Welcome = {
    init: function() {
        var welcomeImg = document.getElementById('welcome-img');
        
        if (welcomeImg) {
            welcomeImg.src = '196478.png';
            
            welcomeImg.onerror = function() {
                this.style.display = 'none';
                document.querySelector('.welcome-overlay').style.background = 
                    'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)';
            };
        }
    },

    enterSystem: function() {
        DB_Utils.showScreen('login-screen');
    }
};
