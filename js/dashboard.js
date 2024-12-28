import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { hasPermission } from './roles.js';

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

            await loadSquadMembers(userData);
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

async function loadSquadMembers(userData) {
    const squadMembersList = document.getElementById('squadMembersList');
    
    try {
        // Get all members from the club
        const coachesSnapshot = await getDocs(
            collection(doc(collection(db, "users"), "coaches"), "members")
        );
        const rowersSnapshot = await getDocs(
            collection(doc(collection(db, "users"), "rowers"), "members")
        );

        const members = [];
        
        // Process coaches
        coachesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.clubId === userData.clubId) {
                members.push({
                    id: doc.id,
                    ...data,
                    type: 'coach'
                });
            }
        });

        // Process rowers
        rowersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.clubId === userData.clubId) {
                members.push({
                    id: doc.id,
                    ...data,
                    type: 'rower'
                });
            }
        });

        // Sort members by type (coaches first) and then by name
        members.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'coach' ? -1 : 1;
            }
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        });

        // Create the HTML for members list
        const membersHTML = members.map(member => `
            <div class="member-card" data-id="${member.id}" data-type="${member.type}">
                <div class="member-info">
                    <span class="member-name">${member.firstName} ${member.lastName}</span>
                    <span class="member-role">${member.type === 'coach' ? 'Coach' : 'Rower'}</span>
                </div>
                ${userData.role === 'club_manager' ? `
                    <button class="btn-icon edit-member" title="Edit Member">
                        <i class="fas fa-edit"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');

        squadMembersList.innerHTML = membersHTML;

        // Add click handlers for member cards
        document.querySelectorAll('.member-card').forEach(card => {
            card.addEventListener('click', () => showMemberDetails(card.dataset.id, card.dataset.type));
        });

    } catch (error) {
        console.error("Error loading squad members:", error);
        squadMembersList.innerHTML = '<p class="error">Error loading squad members</p>';
    }
}

async function showMemberDetails(memberId, memberType) {
    try {
        const memberDoc = await getDoc(
            doc(collection(doc(collection(db, "users"), `${memberType}s`), "members"), memberId)
        );
        
        if (!memberDoc.exists()) {
            console.error("Member not found");
            return;
        }

        const member = memberDoc.data();
        
        // Get current user's role for permission check
        const currentUserDoc = await getCurrentUserDoc();
        const currentUserRole = currentUserDoc.data().role;
        
        // Basic info that's always visible
        let modalContent = `
            <div class="member-details-modal">
                <h2>${member.firstName} ${member.lastName}</h2>
                <p><strong>Role:</strong> ${memberType === 'coach' ? 'Coach' : 'Rower'}</p>
                <p><strong>Email:</strong> ${member.email}</p>
        `;

        // Only show stats for rowers
        if (memberType === 'rower') {
            const statsEnabled = member.statsVisibility?.enabled ?? true;
            
            // Show stats if:
            // 1. Current user is a manager or coach, OR
            // 2. Stats are enabled, OR
            // 3. Current user is viewing their own stats
            if (currentUserRole === 'club_manager' || 
                currentUserRole === 'coach' || 
                statsEnabled || 
                auth.currentUser.uid === memberId) {
                modalContent += `
                    <div class="rower-stats">
                        <h3>Rower Statistics</h3>
                        ${member.stats?.weight ? `
                            <p><strong>Weight:</strong> ${member.stats.weight} kg</p>
                        ` : ''}
                        ${member.stats?.height ? `
                            <p><strong>Height:</strong> ${member.stats.height} cm</p>
                        ` : ''}
                        ${member.stats?.ergScores?.length > 0 ? `
                            <div class="erg-scores">
                                <h4>Erg Scores</h4>
                                ${member.stats.ergScores.map(score => `
                                    <p>${new Date(score.date).toLocaleDateString()}: ${score.time} (${score.distance}m)</p>
                                `).join('')}
                            </div>
                        ` : '<p>No erg scores recorded</p>'}
                    </div>
                `;
            } else {
                modalContent += `
                    <div class="rower-stats">
                        <p class="stats-hidden">Statistics are currently private</p>
                    </div>
                `;
            }
        }

        modalContent += '</div>';
        showModal(modalContent);

    } catch (error) {
        console.error("Error showing member details:", error);
    }
}

function showModal(content) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create and add modal to page
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
        <div class="modal">
            <button class="modal-close">&times;</button>
            ${content}
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Add close handler
    modalOverlay.querySelector('.modal-close').addEventListener('click', () => {
        modalOverlay.remove();
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
}

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

// Add this to handle the stats visibility toggle in settings.js
document.getElementById('statsVisibilityToggle')?.addEventListener('change', async (e) => {
    try {
        showLoading();
        const userDoc = await getCurrentUserDoc(); // You'll need to implement this helper
        
        await updateDoc(userDoc.ref, {
            'statsVisibility.enabled': e.target.checked
        });
        
        showMessage('Stats visibility updated successfully', 'success');
    } catch (error) {
        console.error('Error updating stats visibility:', error);
        showMessage('Failed to update stats visibility', 'error');
        // Revert the toggle if the update failed
        e.target.checked = !e.target.checked;
    } finally {
        hideLoading();
    }
});

// Add this helper function to get the current user's document
async function getCurrentUserDoc() {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const roles = ['managers', 'coaches', 'rowers'];
    for (const role of roles) {
        const docRef = doc(collection(doc(collection(db, "users"), role), "members"), user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap;
        }
    }
    throw new Error('User document not found');
} 