/* ============================================
   DELTA BLACK — FIREBASE CONFIGURATION
   Project: delta-black
   Real-time cross-device sync via Firebase
   ============================================ */

const firebaseConfig = {
    apiKey:            "AIzaSyD9VfTiw9iFWhU--fYX942emBSb4e_qf-Y",
    authDomain:        "delta-black.firebaseapp.com",
    databaseURL:       "https://delta-black-default-rtdb.firebaseio.com",
    projectId:         "delta-black",
    storageBucket:     "delta-black.firebasestorage.app",
    messagingSenderId: "234359575399",
    appId:             "1:234359575399:web:b0a1eab414f39e746155c2",
    measurementId:     "G-EV1WXZK6VS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Realtime Database reference
const DB = firebase.database();

// Storage reference for media files (images, video, audio)
const STORAGE = firebase.storage();

console.log('[Delta Black] Firebase connected — project: delta-black');

/* ============================================
   DB_Ref — shorthand paths into the database
   ============================================ */
const DB_Ref = {
    users:          function()   { return DB.ref('users'); },
    user:           function(id) { return DB.ref('users/' + id); },
    questions:      function()   { return DB.ref('questions'); },
    question:       function(id) { return DB.ref('questions/' + id); },
    responses:      function()   { return DB.ref('responses'); },
    response:       function(id) { return DB.ref('responses/' + id); },
    welcomeMessage: function()   { return DB.ref('config/welcomeMessage'); },
    settings:       function()   { return DB.ref('config'); }
};
