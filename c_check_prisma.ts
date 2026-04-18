import { Prisma } from "@prisma/client";
console.log("DynamicPage fields:", Prisma.dmmf.datamodel.models.find(m => m.name === "DynamicPage")?.fields.map(f => f.name));
