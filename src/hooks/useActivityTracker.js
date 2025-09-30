import { useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuthStore from '@/utility/justAuth';

const useActivityTracker = () => {
    const { isLoggedIn, hasHydrated } = useAuthStore();
    
    const trackActivity = useCallback(async (activityData) => {
        console.log('=== ACTIVITY TRACKER HOOK DEBUG START ===');
        console.log('1. trackActivity called with data:', activityData);
        try {
            // Check if user is logged in and auth state is hydrated
            console.log('2. Checking user authentication...');
            console.log('3. isLoggedIn:', isLoggedIn);
            console.log('4. hasHydrated:', hasHydrated);
            
            const isAuthenticated = hasHydrated && isLoggedIn;

            if (!isAuthenticated) {
                console.log('5. User not authenticated or auth not hydrated, skipping activity tracking');
                return;
            }
            console.log('6. User is authenticated, proceeding with tracking');

            // Track the activity
            console.log('7. Sending activity tracking request...');
            const trackingData = {
                itemType: activityData.itemType,
                itemId: activityData.itemId,
                itemTitle: activityData.itemTitle,
                itemUrl: activityData.itemUrl,
                action: activityData.action || 'view',
                sessionDuration: activityData.sessionDuration || 0
            };
            console.log('8. Tracking data to send:', trackingData);
            
            const response = await axios.post('/api/user/activity', trackingData);
            console.log('9. Activity tracking response:', response.data);
            console.log('10. Activity tracked successfully:', activityData);
        } catch (error) {
            // Silently fail - don't interrupt user experience
            console.error('11. Activity tracking failed:', error);
            console.error('12. Error response:', error.response?.data);
            console.error('13. Error status:', error.response?.status);
        }
        console.log('=== ACTIVITY TRACKER HOOK DEBUG END ===');
    }, [hasHydrated, isLoggedIn]);

    const trackPageView = useCallback((itemType, itemId, itemTitle) => {
        const itemUrl = window.location.href;
        
        trackActivity({
            itemType,
            itemId,
            itemTitle,
            itemUrl,
            action: 'view'
        });
    }, [trackActivity]);

    const trackDownload = useCallback((itemType, itemId, itemTitle, downloadUrl) => {
        trackActivity({
            itemType,
            itemId,
            itemTitle,
            itemUrl: downloadUrl,
            action: 'download'
        });
    }, [trackActivity]);

    const trackBookmark = useCallback((itemType, itemId, itemTitle) => {
        const itemUrl = window.location.href;
        
        trackActivity({
            itemType,
            itemId,
            itemTitle,
            itemUrl,
            action: 'bookmark'
        });
    }, [trackActivity]);

    return {
        trackActivity,
        trackPageView,
        trackDownload,
        trackBookmark
    };
};

export default useActivityTracker;