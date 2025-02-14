export const ROLES = {
    CLUB_MANAGER: 'club_manager',
    COACH: 'coach',
    ROWER: 'rower'
};

export const PERMISSIONS = {
    CREATE_SQUAD: ['club_manager'],
    EDIT_SQUAD: ['club_manager'],
    CREATE_CREW: ['club_manager', 'coach'],
    EDIT_CREW: ['club_manager', 'coach'],
    EDIT_ROWER_STATS: ['club_manager', 'coach'],
    VIEW_ALL_STATS: ['club_manager', 'coach'],
    ASSIGN_COACH: ['club_manager'],
    MANAGE_ACCOUNTS: ['club_manager'],
    VIEW_OWN_STATS: ['rower'],
    EDIT_OWN_STATS_VISIBILITY: ['rower']
};

export function hasPermission(userRole, permission) {
    return PERMISSIONS[permission].includes(userRole);
} 