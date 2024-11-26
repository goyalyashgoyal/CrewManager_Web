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

// Update your sign-up function
async function signUp(email, password, firstName, lastName, phone) {
    try {
        showLoading();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Rest of your sign-up code...
    } catch (error) {
        // Error handling...
    } finally {
        hideLoading();
    }
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

// Add this after your Firebase initialization
const ROLES = {
    CLUB_MANAGER: 'club_manager',
    COACH: 'coach',
    ROWER: 'rower'
};

// Update the registration function to match ibizzle777's simpler approach
document.getElementById('submitSignUp').addEventListener('click', async (e) => {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phone = document.getElementById('phone').value;
    
    // Check if passwords match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'signUpMessage');
        hideLoading();
        return;
    }

    const auth = getAuth();
    const db = getFirestore();

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Store additional user data in Firestore - simplified userData object
        const userData = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phone,
            role: 'club_manager'  // Set default role
        };

        showMessage('Account Created Successfully', 'signUpMessage');
        
        // Create user document in Firestore
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, userData);
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            showMessage('Email Address Already Exists!', 'signUpMessage');
        } else {
            showMessage('Error creating account: ' + error.message, 'signUpMessage');
            console.error("Error:", error);
        }
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