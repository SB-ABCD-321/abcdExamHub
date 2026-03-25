import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    console.log("Deleting old pricing plans...");
    await db.pricingPlan.deleteMany();

    console.log("Creating new pricing plans...");

    const plans = [
        {
            name: "Individual Plan",
            description: "Perfect for independent educators and solo teachers.",
            priceMonthly: 20,
            priceYearly: 200,
            features: [
                "1 Workspace Included",
                "Up to 500 Questions",
                "50 Concurrent Examinees",
                "Up to 2 Workspace Members",
                "7 Days Free Trial"
            ],
            buttonText: "Start Free Trial",
            isPopular: false,
            order: 1,
        },
        {
            name: "Coaching Plan",
            description: "Ideal for small coaching centers and institutes.",
            priceMonthly: 50,
            priceYearly: 500,
            features: [
                "2 Workspaces Included",
                "Up to 2,000 Questions",
                "200 Concurrent Examinees",
                "Up to 5 Workspace Members",
                "7 Days Free Trial"
            ],
            buttonText: "Start Free Trial",
            isPopular: true,
            order: 2,
        },
        {
            name: "Institutional Plan",
            description: "Built for large schools and enterprise education.",
            priceMonthly: 200,
            priceYearly: 2000,
            features: [
                "4 Workspaces Included",
                "Unlimited Questions",
                "1000 Concurrent Examinees",
                "Up to 10 Workspace Members",
                "7 Days Free Trial"
            ],
            buttonText: "Start Free Trial",
            isPopular: false,
            order: 3,
        },
        {
            name: "Custom Plan",
            description: "Need more? Get a custom tailored solution.",
            priceMonthly: 0,
            priceYearly: 0,
            features: [
                "Everything Unlimited",
                "Dedicated Account Manager",
                "Custom Integrations",
                "Priority 24/7 Support"
            ],
            buttonText: "Contact Us",
            isPopular: false,
            order: 4,
        }
    ];

    for (const plan of plans) {
        await db.pricingPlan.create({
            data: plan
        });
    }

    console.log("Pricing plans updated successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
