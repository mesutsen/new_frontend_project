import { api } from '@/lib/axios';

export interface Performance {
    dealerId: string;
    dealerName: string;
    score: number;
    level: string; // Bronze|Silver|Gold|Platinum
    policies: number;
    totalPremium: number;
    conversionRate: number;
}

export interface LeaderboardRow {
    rank: number;
    dealerId: string;
    dealerName: string;
    score: number;
    level: string; // Bronze|Silver|Gold|Platinum
}

export interface Goal {
    id: string;
    name: string;
    metric: string; // e.g., Policies, Premium
    targetValue: number;
    currentValue: number;
    deadline: string;
}

export interface Reward {
    id: string;
    title: string;
    description: string;
    levelRequired: string; // Bronze|Silver|Gold|Platinum
}

export const gamificationService = {
    /**
     * Get dealer performance
     */
    async getPerformance(dealerId?: string): Promise<Performance> {
        const queryParams = new URLSearchParams();
        if (dealerId) queryParams.append('dealerId', dealerId);

        const response = await api.get<Performance>(
            `/gamification/performance?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get leaderboard
     */
    async getLeaderboard(top: number = 10): Promise<LeaderboardRow[]> {
        const response = await api.get<LeaderboardRow[]>(
            `/gamification/leaderboard?top=${top}`
        );
        return response.data;
    },

    /**
     * Get dealer goals
     */
    async getGoals(dealerId?: string): Promise<Goal[]> {
        const queryParams = new URLSearchParams();
        if (dealerId) queryParams.append('dealerId', dealerId);

        const response = await api.get<Goal[]>(
            `/gamification/goals?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get rewards by level
     */
    async getRewards(level: string = 'Bronze'): Promise<Reward[]> {
        const response = await api.get<Reward[]>(
            `/gamification/rewards?level=${level}`
        );
        return response.data;
    },
};

