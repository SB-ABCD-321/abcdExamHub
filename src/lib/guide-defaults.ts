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
        title: 'Teacher Guide',
        description: 'Master your dashboard, create secure exams with AI, and monitor student integrity in real-time.',
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
            },
            {
                title: 'AI Question Intelligence Hub',
                description: 'Harness the power of the Smart Instructor. Use the AI Question Generator to create context-aware MCQs based on specific topics. You can adjust the difficulty level and review or refine the AI-suggested answers to maintain academic rigor.'
            },
            {
                title: 'Broadcast Institutional Notices',
                description: 'Maintain a direct line of communication with your classes. Use the Notice Board to broadcast important announcements, exam dates, or resource links. You can verify who has acknowledged your message using real-time read receipts.'
            },
            {
                title: 'Exam Registry & PDF Mastery',
                description: 'Access a centralized registry of all historical exams. For official feedback, generate professional PDF marksheets that students can download. You can also bulk-export result data for your internal academic spreadsheets.'
            },
            {
                title: 'Global Topic Synchronization',
                description: 'Utilize shared institutional topics to maintain consistency across different subjects. By categorizing questions under global topics, you ensure that high-quality academic content is preserved and accessible for future examination cycles.'
            }
        ]
    },
    [Role.ADMIN]: {
        title: 'Administration Guide',
        description: 'Manage your workspace infrastructure, verify staff, and master the institutional billing ecosystem.',
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
                title: 'Billing & Financial Settlement Logic',
                description: 'Master the institutional billing flow. Choose your tier, select a lock-in duration (Monthly/Yearly), and execute payments via UPI or Bank Transfer. Remember to upload a clear "Artifact Capture" (screenshot) of the transaction receipt for manual node verification.'
            },
            {
                title: 'Advanced Exam Architecture Control',
                description: 'Configure high-stakes exams with granular control. Set entry passwords, enable tab-switch proctoring, and customize result publishing modes. Ensure your "Node Shifting" is active for zero-latency student experiences during high-traffic exam windows.'
            },
            {
                title: 'Infrastructure & Resource Monitoring',
                description: 'Monitor your institutional health via the Billing dashboard. Track "Student Capacity" and "Faculty Utilization" bars in real-time. If resource markers turn red, consider a tier upgrade to expand your workspace capacity.'
            },
            {
                title: 'Institutional Security & Invite Control',
                description: 'Manage access via secure QR Code invitations or direct student enrollment. Use the "Invite Control" dashboard to revoke active invitation tokens and maintain a curated academic environment within your workspace.'
            },
            {
                title: 'Audit Trails & Performance Compliance',
                description: 'Access immutable transaction histories in the Ledger Registry. For academic compliance, download official Institutional Receipts and verify student marksheets via the results portal for end-to-end verification.'
            }
        ]
    },
    [Role.SUPER_ADMIN]: {
        title: 'Super Admin Guide',
        description: 'Global infrastructure control, institutional governance, and financial shard management.',
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
            },
            {
                title: 'Financial Shard & Ledger Settlement',
                description: 'Verify institutional capital transfers and approve pending billing requests. Ensure that all manual UPI/Bank receipts are audited before activating premium service nodes for requesting institutions.'
            },
            {
                title: 'Compliance Data & Audit Logs',
                description: 'Access the global audit trail to monitor administrative actions across the entire platform. Maintain institutional integrity by reviewing high-level security logs and verifying cross-shard transaction compliance.'
            },
            {
                title: 'Institutional Resource Tiering',
                description: 'Configure granular resource tiers (Max Exams, Max Questions, AI Limits) for different subscription plans. Dynamically adjust these parameters to reflect the evolving needs of the global academic ecosystem.'
            },
            {
                title: 'Platform Personalization & Branding',
                description: 'Control the global digital identity including logos, colors, and meta-descriptions. Ensure that all public-facing communication reflects the premium standards of the ABCD Exam Hub brand.'
            }
        ]
    },
    [Role.STUDENT]: {
        title: 'Student Guide',
        description: 'Participate in secure exams, analyze your performance, and master your academic journey.',
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
            },
            {
                title: 'Digital Marksheet Authentication',
                description: 'Your results are more than just numbers. Use the Results portal to export professional, high-fidelity marksheets. These documents are verified by your institutional node, making them official credentials for your academic portfolio.'
            },
            {
                title: 'Notice Interaction Ecosystem',
                description: 'Stay updated via the Notice Board. Teachers broadcast global alerts and exam instructions directly to your dashboard. Check your notice center regularly for real-time announcements and institutional protocol updates.'
            },
            {
                title: 'AI Consultant & Peer Analytics',
                description: 'Gain deeper insights into your learning curve. Analyze how your time-per-question compares with the class average and use the AI-driven performance breakdown to identify subjects where you can improve your academic score.'
            },
            {
                title: 'Exam Protocol & Proctoring Ethics',
                description: 'Maintain academic integrity by following the secure proctoring standards. Understand that tab-switches and system minimizes are logged for teacher review. A clean proctoring log is essential for a high-integrity result certification.'
            }
        ]
    }
};
