import { api } from '@/lib/axios';

export interface RecurringJob {
    id: string;
    cron: string;
    timeZoneId?: string;
    queue: string;
    method: string;
    lastExecution?: string;
    nextExecution?: string;
    lastJobId?: string;
    createdAt?: string;
    removed?: boolean;
    error?: string;
}

export interface BackgroundJob {
    id: string;
    state: string; // Enqueued, Processing, Succeeded, Failed, Deleted
    jobName: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    failedAt?: string;
    exception?: string;
    arguments?: string;
}

export interface JobStatistics {
    recurring: number;
    enqueued: number;
    processing: number;
    succeeded: number;
    failed: number;
    deleted: number;
    servers: number;
}

export interface CreateRecurringJobRequest {
    id: string;
    cron: string;
    timeZoneId?: string;
    queue?: string;
    method: string;
    arguments?: any;
}

export interface UpdateRecurringJobRequest {
    cron?: string;
    timeZoneId?: string;
    queue?: string;
    method?: string;
    arguments?: any;
}

export const scheduledTasksService = {
    /**
     * Get all recurring jobs
     */
    async getRecurringJobs(): Promise<RecurringJob[]> {
        const response = await api.get<RecurringJob[]>('/scheduled-tasks/recurring');
        return response.data;
    },

    /**
     * Get a specific recurring job
     */
    async getRecurringJob(id: string): Promise<RecurringJob> {
        const response = await api.get<RecurringJob>(`/scheduled-tasks/recurring/${id}`);
        return response.data;
    },

    /**
     * Create a new recurring job
     */
    async createRecurringJob(request: CreateRecurringJobRequest): Promise<RecurringJob> {
        const response = await api.post<RecurringJob>('/scheduled-tasks/recurring', request);
        return response.data;
    },

    /**
     * Update a recurring job
     */
    async updateRecurringJob(id: string, request: UpdateRecurringJobRequest): Promise<void> {
        await api.put(`/scheduled-tasks/recurring/${id}`, request);
    },

    /**
     * Delete/Remove a recurring job
     */
    async deleteRecurringJob(id: string): Promise<void> {
        await api.delete(`/scheduled-tasks/recurring/${id}`);
    },

    /**
     * Trigger a recurring job immediately
     */
    async triggerRecurringJob(id: string): Promise<void> {
        await api.post(`/scheduled-tasks/recurring/${id}/trigger`);
    },

    /**
     * Get background jobs with pagination
     */
    async getBackgroundJobs(
        state?: string,
        pageNumber: number = 1,
        pageSize: number = 20
    ): Promise<{ items: BackgroundJob[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }> {
        const params: any = { pageNumber, pageSize };
        if (state) params.state = state;

        const response = await api.get('/scheduled-tasks/background', { params });
        return response.data;
    },

    /**
     * Get job statistics
     */
    async getStatistics(): Promise<JobStatistics> {
        const response = await api.get<JobStatistics>('/scheduled-tasks/statistics');
        return response.data;
    },

    /**
     * Retry a failed job
     */
    async retryJob(jobId: string): Promise<void> {
        await api.post(`/scheduled-tasks/jobs/${jobId}/retry`);
    },

    /**
     * Delete a job
     */
    async deleteJob(jobId: string): Promise<void> {
        await api.delete(`/scheduled-tasks/jobs/${jobId}`);
    },
};

