import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

import firebaseConfig from './firebaseconfig';

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
            
            // First, try each role collection until we find the user
            const roles = ['managers', 'coaches', 'rowers'];
            let userData = null;
            let userRole = null;

            for (const role of roles) {
                const roleDoc = await getDoc(
                    doc(collection(doc(collection(db, "users"), role), "members"), user.uid)
                );
                if (roleDoc.exists()) {
                    userData = roleDoc.data();
                    userRole = role;
                    break;
                }
            }

            if (!userData) {
                console.error("No user document found");
                userDetails.innerHTML = '<p class="error">User data not found</p>';
                return;
            }

            console.log("User data:", userData);
            
            userDetails.innerHTML = `
                <div class="user-info-card">
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</p>
                    <p><strong>Phone:</strong> ${userData.phoneNumber}</p>
                    <p><strong>Role:</strong> ${userData.role}</p>
                    ${userData.clubName ? `<p><strong>Club:</strong> ${userData.clubName}</p>` : ''}
                </div>
            `;
        } catch (error) {
            console.error("Error fetching user data:", error);
            userDetails.innerHTML = '<p class="error">Error loading user data</p>';
        } finally {
            hideLoading();
        }
    } else {
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

// Navigation scroll functionality
document.addEventListener('DOMContentLoaded', function() {
    const navLeft = document.querySelector('.nav-left');
    
    // Check if nav is scrollable
    function checkScrollable() {
        const isScrollable = navLeft.scrollWidth > navLeft.clientWidth;
        navLeft.classList.toggle('scrollable', isScrollable);
    }

    // Check on load and resize
    checkScrollable();
    window.addEventListener('resize', checkScrollable);

    // Add touch scrolling for mobile
    let isScrolling = false;
    let startX;
    let scrollLeft;

    navLeft.addEventListener('touchstart', (e) => {
        isScrolling = true;
        startX = e.touches[0].pageX - navLeft.offsetLeft;
        scrollLeft = navLeft.scrollLeft;
    });

    navLeft.addEventListener('touchmove', (e) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.touches[0].pageX - navLeft.offsetLeft;
        const walk = (x - startX) * 2;
        navLeft.scrollLeft = scrollLeft - walk;
    });

    navLeft.addEventListener('touchend', () => {
        isScrolling = false;
    });
}); 