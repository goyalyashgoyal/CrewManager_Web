import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    linkWithPopup,
    GoogleAuthProvider,
    fetchSignInMethodsForEmail,
    sendPasswordResetEmail,
    unlink
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBoaQHMJ--0C1EVyp8AkMgRLyrYs6Z_uho",
    authDomain: "crewmanager-d10b4.firebaseapp.com",
    projectId: "crewmanager-d10b4",
    storageBucket: "crewmanager-d10b4.firebasestorage.app",
    messagingSenderId: "368087649369",
    appId: "1:368087649369:web:9f90e9abba4e46443bf548",
    measurementId: "G-HK3Z098ZLL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

function showLoading() {
    document.getElementById('loadingSpinner').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('active');
}

// Load user data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            showLoading();
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Profile data
                document.getElementById('firstName').value = userData.firstName || '';
                document.getElementById('lastName').value = userData.lastName || '';
                
                // Account data
                document.getElementById('userEmail').textContent = user.email || userData.email || 'No email set';
                document.getElementById('userPhone').textContent = userData.phoneNumber || 'No phone number set';

                // Check if Google account is linked
                const providers = user.providerData.map(provider => provider.providerId);
                const googleProvider = user.providerData.find(provider => provider.providerId === 'google.com');
                const isGoogleLinked = providers.includes('google.com');
                
                // Update status and buttons with Google email if linked
                document.getElementById('googleStatus').textContent = isGoogleLinked 
                    ? `Linked to ${googleProvider.email}`
                    : 'Not linked';
                document.getElementById('linkGoogle').style.display = isGoogleLinked ? 'none' : 'block';
                document.getElementById('unlinkGoogle').style.display = isGoogleLinked ? 'block' : 'none';
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            alert('Error loading user data');
        } finally {
            hideLoading();
        }
    } else {
        window.location.href = 'index.html';
    }
});

// Profile form submission
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const updates = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        phoneNumber: document.getElementById('phone').value
    };

    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), updates);
        alert('Profile updated successfully');
    } catch (error) {
        console.error("Error updating profile:", error);
        alert('Error updating profile');
    } finally {
        hideLoading();
    }
});

// Link Google account
document.getElementById('linkGoogle').addEventListener('click', async () => {
    try {
        showLoading();
        const provider = new GoogleAuthProvider();
        const result = await linkWithPopup(auth.currentUser, provider);
        
        // Get the Google email from the result
        const googleEmail = result.user.providerData
            .find(provider => provider.providerId === 'google.com').email;
        
        // Update UI immediately after successful linking
        document.getElementById('googleStatus').textContent = `Linked to ${googleEmail}`;
        document.getElementById('linkGoogle').style.display = 'none';
        document.getElementById('unlinkGoogle').style.display = 'block';
        
        alert('Google account linked successfully');
    } catch (error) {
        console.error("Error linking Google account:", error);
        if (error.code === 'auth/credential-already-in-use') {
            alert('This Google account is already linked to another account');
        } else {
            alert('Error linking Google account: ' + error.message);
        }
    } finally {
        hideLoading();
    }
});

// Change email
document.getElementById('changeEmail').addEventListener('click', async () => {
    const newEmail = prompt('Enter new email address:');
    if (!newEmail) return;

    try {
        showLoading();
        // First, reauthenticate the user
        const password = prompt('Please enter your current password to confirm:');
        if (!password) {
            hideLoading();
            return;
        }

        const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
        
        // Then update email
        await updateEmail(auth.currentUser, newEmail);
        await updateDoc(doc(db, "users", auth.currentUser.uid), { email: newEmail });
        document.getElementById('userEmail').textContent = newEmail;
        alert('Email updated successfully');
    } catch (error) {
        console.error("Error updating email:", error);
        alert('Error updating email: ' + error.message);
    } finally {
        hideLoading();
    }
});

// Change password - send reset email instead of direct change
document.getElementById('changePassword').addEventListener('click', async () => {
    try {
        showLoading();
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        alert('Password reset email sent. Please check your inbox to reset your password.');
    } catch (error) {
        console.error("Error sending password reset email:", error);
        alert('Error sending password reset email: ' + error.message);
    } finally {
        hideLoading();
    }
});

// Sign out
document.getElementById('signOut').addEventListener('click', async () => {
    try {
        showLoading();
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

// Add phone number update functionality
document.getElementById('changePhone').addEventListener('click', async () => {
    const newPhone = prompt('Enter new phone number:');
    if (!newPhone) return;

    try {
        showLoading();
        await updateDoc(doc(db, "users", auth.currentUser.uid), { phoneNumber: newPhone });
        document.getElementById('userPhone').textContent = newPhone;
        alert('Phone number updated successfully');
    } catch (error) {
        console.error("Error updating phone number:", error);
        alert('Error updating phone number');
    } finally {
        hideLoading();
    }
});

// Add unlink functionality
document.getElementById('unlinkGoogle').addEventListener('click', async () => {
    try {
        showLoading();
        await unlink(auth.currentUser, GoogleAuthProvider.PROVIDER_ID);
        document.getElementById('googleStatus').textContent = 'Not linked';
        document.getElementById('linkGoogle').style.display = 'block';
        document.getElementById('unlinkGoogle').style.display = 'none';
        alert('Google account unlinked successfully');
    } catch (error) {
        console.error("Error unlinking Google account:", error);
        alert('Error unlinking Google account: ' + error.message);
    } finally {
        hideLoading();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const sidebarItems = document.querySelectorAll('.settings-sidebar li');
    const panels = document.querySelectorAll('.settings-panel');

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items and panels
            sidebarItems.forEach(i => i.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked item and corresponding panel
            item.classList.add('active');
            const tabId = item.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Add mobile sidebar toggle
    const sidebar = document.querySelector('.settings-sidebar');
    if (window.innerWidth <= 768) {
        sidebar.addEventListener('click', (e) => {
            if (!sidebar.classList.contains('expanded')) {
                sidebar.classList.add('expanded');
            }
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && sidebar.classList.contains('expanded')) {
                sidebar.classList.remove('expanded');
            }
        });
    }
}); 