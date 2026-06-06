const DB_Utils = {
    generateId: function() {
        return 'db_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    escapeHtml: function(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatDate: function(isoString) {
        var date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    showScreen: function(screenId) {
        document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
        var screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
    },

    toggleClass: function(elementId, className) {
        var el = document.getElementById(elementId);
        if (el) el.classList.toggle(className);
    },

    addClass: function(elementId, className) {
        var el = document.getElementById(elementId);
        if (el) el.classList.add(className);
    },

    removeClass: function(elementId, className) {
        var el = document.getElementById(elementId);
        if (el) el.classList.remove(className);
    },

    setText: function(elementId, text) {
        var el = document.getElementById(elementId);
        if (el) el.textContent = text;
    },

    setHtml: function(elementId, html) {
        var el = document.getElementById(elementId);
        if (el) el.innerHTML = html;
    },

    getValue: function(elementId) {
        var el = document.getElementById(elementId);
        return el ? el.value.trim() : '';
    },

    setValue: function(elementId, value) {
        var el = document.getElementById(elementId);
        if (el) el.value = value;
    },

    clearValue: function(elementId) {
        this.setValue(elementId, '');
    },

    onClick: function(elementId, handler) {
        var el = document.getElementById(elementId);
        if (el) el.addEventListener('click', handler);
    },

    onChange: function(elementId, handler) {
        var el = document.getElementById(elementId);
        if (el) el.addEventListener('change', handler);
    }
};
