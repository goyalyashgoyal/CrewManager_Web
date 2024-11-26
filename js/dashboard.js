import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBoaQHMJ--0C1EVyp8AkMgRLyrYs6Z_uho",
    authDomain: "crewmanager-d10b4.firebaseapp.com",
    projectId: "crewmanager-d10b4",
    storageBucket: "crewmanager-d10b4.firebasestorage.app",
    messagingSenderId: "368087649369",
    appId: "1:368087649369:web:9f90e9abba4e46443bf548",
    measurementId: "G-HK3Z098ZLL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Get user details element
const userDetails = document.getElementById('userDetails');

function showLoading() {
    document.getElementById('loadingSpinner').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('active');
}

// Auth state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            showLoading();
            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                userDetails.innerHTML = `
                    <div class="user-info-card">
                        <p><strong>Email:</strong> ${userData.email}</p>
                        <p><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</p>
                        <p><strong>Phone:</strong> ${userData.phoneNumber}</p>
                        <p><strong>Role:</strong> ${userData.role}</p>
                    </div>
                `;
            } else {
                console.error("No user document found");
                userDetails.innerHTML = '<p class="error">User data not found</p>';
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            userDetails.innerHTML = '<p class="error">Error loading user data</p>';
        } finally {
            hideLoading();
        }
    } else {
        // If not logged in, redirect to login page
        window.location.href = 'index.html';
    }
});

// Handle sign out
document.getElementById('signOut').addEventListener('click', async () => {
    try {
        showLoading();
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error signing out:", error);
    } finally {
        hideLoading();
    }
}); 