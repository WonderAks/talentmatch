export type Internship = {
  internship_id: number;
  title: string;
  company: string;
  location: string | null;
  type: string | null;
  stipend: string | null;
  deadline: string | null;
  seats_left?: number;
  description?: string;
  requirements?: string | null;
  similarity?: string | null;
  applied?: boolean;
  saved?: boolean;
};

export type ApplicationRow = {
  application_id: number;
  internship_id: number;
  title: string;
  company: string;
  status: string;
  match_score: string | null;
  applied_at: string;
  updated_at: string;
  history: { old: string | null; new: string; at: string }[];
};

export const STATUSES = ["Applied", "Under Review", "Shortlisted", "Selected", "Rejected"] as const;
