import { Role } from "@prisma/client";

export interface DefaultGuideItem {
    title: string;
    description: string;
}

export interface DefaultGuide {
    title: string;
    description: string;
    icon: string;
    items: DefaultGuideItem[];
}

export const DEFAULT_GUIDES: Record<Role, DefaultGuide> = {
    [Role.TEACHER]: {
        title: 'Mastering the Instructor Dashboard',
        description: 'Comprehensive guide for teachers to manage question banks, create digital exams, and monitor students in real-time.',
        icon: 'BookOpen',
        items: [
            {
                title: 'Building a Robust Question Bank',
                description: 'Organize your academic resources by creating specific Topics. Within each topic, you can add Multiple Choice Questions (MCQs) or Descriptive questions. Use the "Topic Search" to quickly find and reuse questions across different exam papers.'
            },
            {
                title: 'Creating and Configuring Exams',
                description: 'When creating an exam, you can set passing marks, duration, and specific instructions. Selection of questions is dynamic—simply browse your bank and click "Add". You can also set a password for secure entry to ensure only authorized students can start the test.'
            },
            {
                title: 'Advanced Proctoring & Monitoring',
                description: 'Once an exam is live, use the Monitoring Dashboard to see student progress. The system automatically tracks "Tab Switches" to prevent cheating. If a student loses connection, their progress is saved as a "Draft," allowing them to resume exactly where they left off.'
            },
            {
                title: 'Evaluating Results and Analytics',
                description: 'As soon as an exam ends, results are generated based on your pass criteria. You can view detailed logs of every student\'s attempt, including the time spent per question and their proctoring history. Export results to high-quality PDF report cards for institutional record-keeping.'
            }
        ]
    },
    [Role.ADMIN]: {
        title: 'Institutional Administration Guide',
        description: 'Manage your workspace infrastructure, verify staff, and customize your institution\'s digital presence.',
        icon: 'Users',
        items: [
            {
                title: 'Staff Onboarding and Verification',
                description: 'Control who can create exams in your workspace. Use the User Management tab to verify teacher accounts and assign roles. You can also monitor teacher activity and ensure all academic content aligns with your institution\'s standards.'
            },
            {
                title: 'Customizing Your Digital Institution',
                description: 'Go to Workspace Settings to upload your logo and set institutional contact details. These details will appear on student report cards and exam headers, providing a professional and branded experience for your users.'
            },
            {
                title: 'Global Communication via Notice Boards',
                description: 'Keep your staff and students informed by publishing targeted notices. You can send announcements to specific groups (e.g., "All Teachers" or "Specific Students") and track who has read the important updates in real-time.'
            },
            {
                title: 'Monitoring Resource Usage',
                description: 'Track the number of active exams and AI generations in your workspace. If you reach your plan limits, contact the Super Admin to upgrade your institutional capacity for more teachers, students, or exam slots.'
            }
        ]
    },
    [Role.SUPER_ADMIN]: {
        title: 'Platform Governance & Control',
        description: 'Advanced management of global institutions, subscription plans, and core system infrastructure.',
        icon: 'Shield',
        items: [
            {
                title: 'Global Institution & Workspace Control',
                description: 'Manage every workspace on the platform from a single dashboard. You can create new institutions, adjust their usage limits (Max Teachers/Students), and manually override AI credit balances for premium accounts.'
            },
            {
                title: 'Subscription and Pricing Management',
                description: 'Define global pricing plans that institutions can subscribe to. You can customize features for each plan, set monthly/yearly pricing, and manage which plans are marked as "Popular" on the public landing page.'
            },
            {
                title: 'System Health & Compute Monitoring',
                description: 'Monitor the platform\'s real-time heartbeat. Check the Database Uplink status for connectivity and the Compute Cluster load for server performance. If load exceeds 80%, consider performing maintenance during low-traffic hours.'
            },
            {
                title: 'Advanced Security & Maintenance',
                description: 'Use Global Settings to put the platform into Maintenance Mode if needed. You can also broadcast global messages to every single user across all institutions for critical platform-wide updates.'
            }
        ]
    },
    [Role.STUDENT]: {
        title: 'Student Success Portal Guide',
        description: 'How to participate in exams, track your progress, and manage your academic portfolio.',
        icon: 'GraduationCap',
        items: [
            {
                title: 'Locating and Starting Assigned Exams',
                description: 'All exams assigned to you appear on your dashboard. Some exams may be "Public," while others are restricted to your specific classroom. Before starting, ensure you have a stable internet connection and are in a quiet environment.'
            },
            {
                title: 'Navigating the Secure Exam Interface',
                description: 'While taking an exam, your progress is automatically saved every few seconds. You can flag questions to review later and use the timer to manage your speed. Remember that switching browser tabs may trigger a proctoring alert to your teacher.'
            },
            {
                title: 'Understanding Your Performance Portfolio',
                description: 'After completing an exam, visit your results history to see your scores. Depending on teacher settings, you can view correct answers and detailed feedback. You can also download official digital marksheets for your records.'
            },
            {
                title: 'Managing Your Profile and Enrollment',
                description: 'Keep your academic profile updated with your latest information. You can see which workspaces (Institutions) you are currently enrolled in and track your overall performance across different subjects over time.'
            }
        ]
    }
};
