import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
    try {
        console.log("Wiping existing legacy pricing plans...");
        await db.pricingPlan.deleteMany();

        console.log("Seeding new Individual Plan...");
        await db.pricingPlan.create({
            data: {
                name: "Individual Plan",
                description: "Perfect for independent tutors and solo educators.",
                price1Month: 200,
                price6Month: 1100,
                price12Month: 2000,
                maxStudents1Month: 50,
                maxStudents6Month: 70,
                maxStudents12Month: 100,
                maxTeachers1Month: 1,
                maxTeachers6Month: 4,
                maxTeachers12Month: 10,
                maxExams1Month: 15,
                maxExams6Month: 30,
                maxExams12Month: 60,
                aiLimit1Month: 15,
                aiLimit6Month: 25,
                aiLimit12Month: 35,
                features: ["Basic Analytics", "Email Support", "Standard Assessments"],
                isPopular: false,
                order: 1
            }
        });

        console.log("Seeding new Coaching Plan...");
        await db.pricingPlan.create({
            data: {
                name: "Coaching Plan",
                description: "Ideal for growing coaching centers and small academies.",
                price1Month: 600,
                price6Month: 3000,
                price12Month: 5000,
                maxStudents1Month: 100,
                maxStudents6Month: 150,
                maxStudents12Month: 250,
                maxTeachers1Month: 5,
                maxTeachers6Month: 12,
                maxTeachers12Month: 20,
                maxExams1Month: 50,
                maxExams6Month: 80,
                maxExams12Month: 150,
                aiLimit1Month: 30,
                aiLimit6Month: 50,
                aiLimit12Month: 80,
                features: ["Advanced Analytics", "Priority Support", "Custom Branding", "Bulk Operations"],
                isPopular: true,
                order: 2
            }
        });

        console.log("Seeding new Institutional Plan...");
        await db.pricingPlan.create({
            data: {
                name: "Institutional Plan",
                description: "Comprehensive suite for large schools and universities.",
                price1Month: 5000,
                price6Month: 25000,
                price12Month: 45000,
                maxStudents1Month: 250,
                maxStudents6Month: 400,
                maxStudents12Month: 600,
                maxTeachers1Month: 20,
                maxTeachers6Month: 30,
                maxTeachers12Month: 40,
                maxExams1Month: 100,
                maxExams6Month: 150,
                maxExams12Month: 250,
                aiLimit1Month: 80,
                aiLimit6Month: 120,
                aiLimit12Month: 180,
                features: ["API Access", "Dedicated Success Manager", "White-labeling", "Custom Integrations"],
                isPopular: false,
                order: 3
            }
        });

        console.log("Seeding Custom Plan...");
        await db.pricingPlan.create({
            data: {
                name: "Custom Plan",
                description: "Need limitless scale? We will build a plan just for you.",
                price1Month: 0,
                price6Month: 0,
                price12Month: 0,
                maxStudents1Month: 0,
                maxStudents6Month: 0,
                maxStudents12Month: 0,
                maxTeachers1Month: 0,
                maxTeachers6Month: 0,
                maxTeachers12Month: 0,
                maxExams1Month: 0,
                maxExams6Month: 0,
                maxExams12Month: 0,
                aiLimit1Month: 0,
                aiLimit6Month: 0,
                aiLimit12Month: 0,
                features: ["Unlimited Capacity", "On-Premise Deployment", "24/7 Priority Support", "Custom SLAs"],
                isPopular: false,
                isCustom: true,
                buttonText: "Contact Us",
                order: 4
            }
        });

        return NextResponse.json({ success: true, message: "Seed successful!" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
