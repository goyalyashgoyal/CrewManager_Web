import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { 
    getFirestore, 
    setDoc, 
    doc,
    getDoc,
    addDoc,
    collection,
    updateDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js"

const firebaseConfig = {
  apiKey: "AIzaSyArOKhK4-12NG6YZKCX-U6_ioCCe2uLt6Y",
  authDomain: "crewmanagerdata.firebaseapp.com",
  projectId: "crewmanagerdata",
  storageBucket: "crewmanagerdata.firebasestorage.app",
  messagingSenderId: "1000289169555",
  appId: "1:1000289169555:web:3490e14c71c4596a2e1d66",
  measurementId: "G-S8W55PNF3T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Check if user is already logged in and redirect if on login page
onAuthStateChanged(auth, async (user) => {
    // Only check and redirect if we're on the login/index page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        if (user) {
            // User is signed in, redirect to dashboard
            window.location.href = 'dashboard.html';
            return; // Stop further execution
        } else {
            // User is not signed in, show login form
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            userInfo.style.display = 'none';
        }
    }
});

// UI Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');

// Show/Hide Form Toggles
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
});

function showMessage(message, divId) {
    const messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(() => {
        messageDiv.style.opacity = 0;
    }, 5000);
}

// Auth state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        userInfo.style.display = 'block';
        userEmail.textContent = user.email;
        
        // Get additional user data from Firestore
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                userEmail.textContent = `${userData.firstName} ${userData.lastName}`;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        userInfo.style.display = 'none';
        userEmail.textContent = '';
    }
});

// Add these helper functions at the top of your file, right after the Firebase initialization
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'flex';
        spinner.classList.add('active');
    }
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
        spinner.classList.remove('active');
    }
}

// Update your sign-in function
async function signIn(email, password) {
    try {
        showLoading();
        await signInWithEmailAndPassword(auth, email, password);
        // Rest of your sign-in code...
    } catch (error) {
        // Error handling...
    } finally {
        hideLoading();
    }
}

// Add role selection functionality
const roleButtons = document.querySelectorAll('.role-btn');
const managerForm = document.getElementById('manager-form');
const memberForm = document.getElementById('member-form');
let selectedRole = null;

roleButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove selected class from all buttons
        roleButtons.forEach(btn => btn.classList.remove('selected'));
        // Add selected class to clicked button
        button.classList.add('selected');
        
        selectedRole = button.dataset.role;
        
        // Show appropriate form
        if (selectedRole === 'club_manager') {
            managerForm.style.display = 'block';
            memberForm.style.display = 'none';
        } else {
            managerForm.style.display = 'none';
            memberForm.style.display = 'block';
        }
    });
});

// Update the registration function
document.getElementById('submitSignUp').addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
        showMessage('Please select an account type', 'signUpMessage');
        return;
    }
    
    showLoading();
    
    // Get form values based on role
    const prefix = selectedRole === 'club_manager' ? 'manager' : 'member';
    const email = document.getElementById(`${prefix}-email`).value;
    const password = document.getElementById(`${prefix}-password`).value;
    const confirmPassword = document.getElementById(`${prefix}-confirmPassword`).value;
    const firstName = document.getElementById(`${prefix}-firstName`).value;
    const lastName = document.getElementById(`${prefix}-lastName`).value;
    const phone = document.getElementById(`${prefix}-phone`).value;
    
    // Additional fields based on role
    const clubName = selectedRole === 'club_manager' ? document.getElementById('manager-clubName').value : null;
    const clubCode = selectedRole !== 'club_manager' ? document.getElementById('member-clubCode').value : null;
    
    if (!email || !password || !firstName || !lastName || !phone) {
        showMessage('Please fill in all required fields', 'signUpMessage');
        hideLoading();
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'signUpMessage');
        hideLoading();
        return;
    }

    try {
        let clubData = null;
        let clubId = null;

        if (selectedRole !== 'club_manager') {
            // Verify club code
            try {
                const clubDoc = await verifyClubCode(clubCode, selectedRole);
                clubData = clubDoc.data();
                clubId = clubDoc.id;
            } catch (error) {
                showMessage('Invalid club code', 'signUpMessage');
                hideLoading();
                return;
            }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create base user document
        const baseUserData = {
            email,
            firstName,
            lastName,
            phoneNumber: phone,
            role: selectedRole,
            createdAt: new Date().toISOString()
        };

        // Create role-specific user data
        let roleSpecificData = { ...baseUserData };

        if (selectedRole === 'club_manager') {
            // Create club document first
            const clubRef = await addDoc(collection(db, "clubs"), {
                name: clubName,
                managerId: user.uid,
                createdAt: new Date().toISOString(),
                coachCode: generateRandomCode(),
                rowerCode: generateRandomCode()
            });
            
            roleSpecificData.clubId = clubRef.id;
            roleSpecificData.clubName = clubName;
            clubId = clubRef.id; // Set clubId for main user document
            
        } else if (selectedRole === 'coach') {
            roleSpecificData.clubId = clubId;
            roleSpecificData.assignedCrews = [];
            roleSpecificData.specialties = [];
            
        } else if (selectedRole === 'rower') {
            roleSpecificData = {
                ...roleSpecificData,
                clubId: clubId,
                crewId: null,
                stats: {
                    weight: null,
                    height: null,
                    ergScores: [],
                    attendance: []
                },
                statsVisibility: {
                    enabled: true  // Initialize to true by default
                }
            };
        }

        console.log("Creating role-specific document...");
        
        // Store in role-specific collection (fix the path construction)
        let rolePath;
        if (selectedRole === 'club_manager') {
            rolePath = 'managers';
        } else if (selectedRole === 'coach') {
            rolePath = 'coaches';
        } else {
            rolePath = 'rowers';
        }

        // Create the role-specific document using the correct alternating pattern
        const roleDocRef = doc(collection(doc(collection(db, "users"), rolePath), "members"), user.uid);
        await setDoc(roleDocRef, roleSpecificData);
        console.log("Role-specific document created in:", `users/${rolePath}/members/${user.uid}`);

        showMessage('Account Created Successfully', 'signUpMessage');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error("Error during registration:", error);
        showMessage(error.message, 'signUpMessage');
    } finally {
        hideLoading();
    }
});

// Helper function to generate random codes
function generateRandomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Update the Google Sign In function
document.getElementById('googleSignIn').addEventListener('click', async () => {
    showLoading();
    const provider = new GoogleAuthProvider();
    
    try {
        // First attempt to sign in with Google
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
            // If no user found in Firestore, delete the auth account and show message
            await user.delete();
            await firebaseSignOut(auth);
            showMessage('No account found. Please register or link your Google account in settings', 'signInMessage');
            return;
        }
        
        // If user exists in Firestore, proceed to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        if (error.code === 'auth/popup-closed-by-user') {
            // User closed the popup, no need for error message
            return;
        }
        showMessage('No account found. Please register or link your Google account in settings', 'signInMessage');
    } finally {
        hideLoading();
    }
});

// Sign In
document.getElementById('submitSignIn').addEventListener('click', async (e) => {
    e.preventDefault();
    showLoading(); // Show spinner at start
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showMessage('Login successful', 'signInMessage');
        window.location.href = 'dashboard.html';
    } catch (error) {
        if (error.code === 'auth/invalid-credential') {
            showMessage('Incorrect Email or Password', 'signInMessage');
        } else {
            showMessage('Login error: ' + error.message, 'signInMessage');
        }
    } finally {
        hideLoading(); // Hide spinner when done
    }
});

// Sign Out
document.getElementById('signOut').addEventListener('click', async () => {
    showLoading(); // Show spinner at start
    try {
        await firebaseSignOut(auth);
        showMessage('Successfully signed out', 'signInMessage');
    } catch (error) {
        showMessage('Error signing out: ' + error.message, 'signInMessage');
    } finally {
        hideLoading(); // Hide spinner when done
    }
});

// Add this to your existing auth.js file
document.getElementById('forgotPassword').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    
    if (!email) {
        alert('Please enter your email address');
        return;
    }

    try {
        showLoading();
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent. Please check your inbox.');
    } catch (error) {
        console.error("Error sending password reset email:", error);
        alert('Error sending password reset email: ' + error.message);
    } finally {
        hideLoading();
    }
});

// Update the registration function to properly check club codes
async function verifyClubCode(code, role) {
    const clubsRef = collection(db, "clubs");
    const q = query(clubsRef, where(`${role}Code`, '==', code));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        throw new Error('Invalid club code');
    }
    
    return querySnapshot.docs[0];
}

// Add this at the top of your auth.js file, right after Firebase initialization
// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    // Only redirect if we're on the login page
    if (user && window.location.pathname.endsWith('index.html')) {
        window.location.href = 'dashboard.html';
    }
});

// When creating a new rower account
async function createRowerAccount(userData) {
    try {
        // ... existing code ...

        await setDoc(userDocRef, {
            ...userData,
            role: 'rower',
            statsVisibility: {
                enabled: true  // Set default to true
            },
            stats: {
                weight: null,
                height: null,
                ergScores: []
            }
        });

        // ... rest of existing code ...
    } catch (error) {
        console.error("Error creating rower account:", error);
        throw error;
    }
} 
