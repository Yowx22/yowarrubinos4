
/**
 * This file defines TypeScript interfaces for RPC functions we're using
 * when interacting with Supabase
 */

export interface GetUserEmailsResult {
  id: string;
  email: string;
}

export interface GetActiveUserIdsResult {
  id: string;
}
