import { Member } from "@/types/member.types";
import { MOCK_MEMBERS } from "@/mocks/members.mock";

let membersDatabase: Member[] = [...MOCK_MEMBERS];

export const membersService = {
  getMembers: async (campusId?: string | null): Promise<Member[]> => {
    // Simulates an async API call to Django REST Framework
    await new Promise((res) => setTimeout(res, 80));
    if (!campusId || campusId === "all") {
      return [...membersDatabase];
    }
    return membersDatabase.filter((m) => m.campus_id === campusId);
  },

  getMemberById: async (id: string): Promise<Member | null> => {
    await new Promise((res) => setTimeout(res, 50));
    return membersDatabase.find((m) => m.id === id) || null;
  },

  createMember: async (data: Omit<Member, "id" | "joined_date">): Promise<Member> => {
    await new Promise((res) => setTimeout(res, 120));
    const newMember: Member = {
      ...data,
      id: `mbr-${Date.now().toString().slice(-4)}`,
      joined_date: new Date().toISOString().split("T")[0],
    };
    membersDatabase = [newMember, ...membersDatabase];
    return newMember;
  },

  updateMemberStage: async (id: string, stage: Member["assimilation_stage"]): Promise<Member | null> => {
    await new Promise((res) => setTimeout(res, 80));
    const index = membersDatabase.findIndex((m) => m.id === id);
    if (index === -1) return null;
    membersDatabase[index] = {
      ...membersDatabase[index],
      assimilation_stage: stage,
    };
    return membersDatabase[index];
  },
};
