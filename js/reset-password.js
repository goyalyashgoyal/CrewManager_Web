import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyArOKhK4-12NG6YZKCX-U6_ioCCe2uLt6Y",
  authDomain: "crewmanagerdata.firebaseapp.com",
  projectId: "crewmanagerdata",
  storageBucket: "crewmanagerdata.firebasestorage.app",
  messagingSenderId: "1000289169555",
  appId: "1:1000289169555:web:3490e14c71c4596a2e1d66",
  measurementId: "G-S8W55PNF3T"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();

function showLoading() {
    document.getElementById('loadingSpinner').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('active');
}

document.getElementById('submitReset').addEventListener('click', async () => {
    const email = document.getElementById('resetEmail').value;
    
    if (!email) {
        alert('Please enter your email address');
        return;
    }

    try {
        showLoading();
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent. Please check your inbox.');
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error sending password reset email:", error);
        if (error.code === 'auth/user-not-found') {
            alert('No account found with this email address.');
        } else {
            alert('Error: ' + error.message);
        }
    } finally {
        hideLoading();
    }
});

document.getElementById('backToLogin').addEventListener('click', () => {
    window.location.href = 'index.html';
}); 
