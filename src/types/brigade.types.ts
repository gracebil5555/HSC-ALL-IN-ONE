export type BrigadeType = "ADULT" | "YOUTH";

export interface Brigade {
  id: string;
  name: string;
  brigade_type: BrigadeType;
  campus_id: string;
  leader_name: string;
  leader_phone: string;
  leader_avatar?: string;
  members_count: number;
  meeting_schedule: string;
  meeting_place: string;
  attendance_rate: number; // e.g. 88%
}
