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

        // Auto-advance after 5 seconds
        setTimeout(function() {
            var welcomeScreen = document.getElementById('welcome-screen');
            if (welcomeScreen && welcomeScreen.classList.contains('active')) {
                var textBox = document.getElementById('welcome-text-box');
                if (textBox) {
                    textBox.style.transition = 'opacity 1s ease';
                    textBox.style.opacity = '0';
                }
                setTimeout(function() {
                    DB_Welcome.enterSystem();
                }, 1000);
            }
        }, 5000);
    },

    enterSystem: function() {
        DB_Utils.showScreen('login-screen');
    }
};
