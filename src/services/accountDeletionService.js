import { supabaseService, isSupabaseConfigured } from './supabase';

const DELETION_REQUESTS_KEY = 'cinemascope_deletion_requests';

export function getDeletionRequests() {
  try {
    const raw = localStorage.getItem(DELETION_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveDeletionRequests(requests) {
  try {
    localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error('Error saving deletion requests to localStorage', e);
  }
}

export async function syncDeletionRequestsFromCloud() {
  if (!isSupabaseConfigured()) return getDeletionRequests();
  try {
    const remoteReqs = await supabaseService.getDeletionRequestsData();
    const localReqs = getDeletionRequests();
    if (Array.isArray(remoteReqs) && remoteReqs.length > 0) {
      const remoteMap = new Map(remoteReqs.map(r => [r.id || r.userId, r]));
      let hasLocalChanges = false;
      const merged = [...remoteReqs];

      localReqs.forEach(loc => {
        const key = loc.id || loc.userId;
        if (!remoteMap.has(key)) {
          merged.push(loc);
          hasLocalChanges = true;
        }
      });

      saveDeletionRequests(merged);
      if (hasLocalChanges) {
        supabaseService.saveDeletionRequestsData(merged).catch(console.warn);
      }
      return merged;
    } else if (localReqs.length > 0) {
      await supabaseService.saveDeletionRequestsData(localReqs).catch(console.warn);
    }
    return localReqs;
  } catch (e) {
    console.warn('syncDeletionRequestsFromCloud error:', e);
    return getDeletionRequests();
  }
}

export function getUserDeletionRequest(userId, requestsList = null) {
  if (!userId) return null;
  const list = requestsList || getDeletionRequests();
  return list.find(r => r.userId === userId) || null;
}
