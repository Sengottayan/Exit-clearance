import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface UserProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatarUrl: string;
  };
  employment: {
    memberId: string;
    employeeId: string;
    jobTitle: string;
    employeeType: string;
    dateOfHire: string | null;
    employmentStatus: string;
    managerId: string | null;
    dept: string;
    role: string;
  };
  organization: {
    id: string;
    name: string;
    role: string;
  };
  // Only populated for managers
  teamStats?: {
    totalReports: number;
    activeExits: number;
  };
  // Only populated for dept_approver
  departmentAssignments?: {
    department: string;
    deptLabel: string;
    authority: string;
  }[];
}

export interface Manager {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string;
  avatarUrl: string;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async (): Promise<UserProfile> => {
      const response = await fetch('/api/users/profile');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch profile');
      }
      return response.json();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      jobTitle?: string;
      employeeType?: string;
      dateOfHire?: string;
      managerId?: string;
      dept?: string;
      avatarUrl?: string;
    }) => {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}

export function useManagers() {
  return useQuery({
    queryKey: ['managers-list'],
    queryFn: async (): Promise<Manager[]> => {
      const response = await fetch('/api/managers');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch managers');
      }
      const json = await response.json();
      return json.data;
    },
  });
}
