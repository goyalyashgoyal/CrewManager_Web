import { getFirestore, collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { hasPermission } from './roles.js';

export class SquadManager {
    constructor(clubId, userRole) {
        this.db = getFirestore();
        this.clubId = clubId;
        this.userRole = userRole;
    }

    async createSquad(squadData) {
        if (!hasPermission(this.userRole, 'CREATE_SQUAD')) {
            throw new Error('Unauthorized to create squads');
        }

        const squad = {
            ...squadData,
            clubId: this.clubId,
            createdAt: new Date().toISOString(),
            crews: []
        };

        return await addDoc(collection(this.db, "squads"), squad);
    }

    async createCrew(squadId, crewData) {
        if (!hasPermission(this.userRole, 'CREATE_CREW')) {
            throw new Error('Unauthorized to create crews');
        }

        const crew = {
            ...crewData,
            squadId,
            clubId: this.clubId,
            createdAt: new Date().toISOString(),
            members: []
        };

        return await addDoc(collection(this.db, "crews"), crew);
    }

    async assignCoach(crewId, coachId) {
        if (!hasPermission(this.userRole, 'ASSIGN_COACH')) {
            throw new Error('Unauthorized to assign coaches');
        }

        await updateDoc(doc(this.db, "crews", crewId), {
            coachId: coachId
        });
    }

    async addRowerToCrew(crewId, rowerId) {
        const crewRef = doc(this.db, "crews", crewId);
        const crewDoc = await getDoc(crewRef);
        
        if (!crewDoc.exists()) {
            throw new Error('Crew not found');
        }

        const crew = crewDoc.data();
        if (this.userRole !== 'club_manager' && crew.coachId !== auth.currentUser.uid) {
            throw new Error('Unauthorized to modify this crew');
        }

        await updateDoc(crewRef, {
            members: [...crew.members, rowerId]
        });
    }
} 